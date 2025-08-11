from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.chat import Chat
from app.services.chat_service import ChatService
from app.services.ai_service import AIService
from app.services.streaming_service import StreamingService
from pydantic import BaseModel
from typing import Optional
import json
import asyncio

router = APIRouter()


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    id: str
    content: str
    role: str
    created_at: str


@router.post("/{chat_id}/ai-response")
async def get_ai_response(
    chat_id: str,
    message_data: ChatMessage,
    db: Session = Depends(get_db)
):
    """Get AI response for a chat message"""
    try:
        chat_service = ChatService(db)
        ai_service = AIService()
        
        # Get chat and validate ownership
        chat = chat_service.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Get conversation history and document context
        conversation_history = chat_service.get_conversation_history(chat_id)
        document_context = chat_service.get_document_context(chat_id)
        
        # Generate AI response
        ai_response = await ai_service.process_message(
            message_data.message,
            conversation_history,
            document_context
        )
        
        # Save AI message to database
        saved_message = chat_service.create_message(
            chat_id=chat_id,
            content=ai_response,
            role="assistant",
            user_id=chat.user_id
        )
        
        return ChatResponse(
            id=saved_message.id,
            content=saved_message.content,
            role=saved_message.role,
            created_at=saved_message.created_at.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{chat_id}/stream")
async def stream_ai_response(
    chat_id: str,
    message_data: ChatMessage,
    db: Session = Depends(get_db)
):
    """Stream AI response for a chat message"""
    try:
        chat_service = ChatService(db)
        streaming_service = StreamingService()
        
        # Get chat and validate ownership
        chat = chat_service.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Get conversation history and document context
        conversation_history = chat_service.get_conversation_history(chat_id)
        document_context = chat_service.get_document_context(chat_id)
        
        async def generate_stream():
            full_response = ""
            
            try:
                async for chunk in streaming_service.stream_chat_response(
                    message_data.message,
                    conversation_history,
                    document_context
                ):
                    full_response += chunk
                    data = json.dumps({"content": chunk})
                    yield f"data: {data}\n\n"
                
                # Save complete response to database
                chat_service.create_message(
                    chat_id=chat_id,
                    content=full_response,
                    role="assistant",
                    user_id=chat.user_id
                )
                
                # Update chat timestamp
                from datetime import datetime
                chat.updated_at = datetime.utcnow()
                db.commit()
                
                yield "data: [DONE]\n\n"
                
            except Exception as error:
                print(f"Stream error: {error}")
                error_data = json.dumps({"error": "Stream failed"})
                yield f"data: {error_data}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CreateChatRequest(BaseModel):
    title: str


@router.post("/create")
async def create_chat(
    request: CreateChatRequest,
    db: Session = Depends(get_db)
):
    """Create a new chat"""
    try:
        chat_service = ChatService(db)
        # TODO: Get user_id from authentication
        user_id = "default_user"  # Placeholder
        
        chat = chat_service.create_chat(
            title=request.title,
            user_id=user_id
        )
        
        return {
            "id": chat.id,
            "title": chat.title,
            "user_id": chat.user_id,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "is_archived": chat.is_archived
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_chats(
    include_archived: bool = False,
    db: Session = Depends(get_db)
):
    """List user chats"""
    try:
        chat_service = ChatService(db)
        # TODO: Get user_id from authentication
        user_id = "default_user"  # Placeholder
        
        chats = chat_service.get_user_chats(user_id, include_archived)
        
        return [
            {
                "id": chat.id,
                "title": chat.title,
                "user_id": chat.user_id,
                "created_at": chat.created_at.isoformat(),
                "updated_at": chat.updated_at.isoformat(),
                "is_archived": chat.is_archived
            }
            for chat in chats
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{chat_id}")
async def get_chat(
    chat_id: str,
    db: Session = Depends(get_db)
):
    """Get chat details with messages"""
    try:
        chat_service = ChatService(db)
        
        chat = chat_service.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Get conversation history
        conversation_history = chat_service.get_conversation_history(chat_id, limit=50)
        
        return {
            "id": chat.id,
            "title": chat.title,
            "user_id": chat.user_id,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "is_archived": chat.is_archived,
            "messages": conversation_history
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{chat_id}")
async def update_chat(
    chat_id: str,
    request: CreateChatRequest,
    db: Session = Depends(get_db)
):
    """Update chat title"""
    try:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        chat.title = request.title
        from datetime import datetime
        chat.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "id": chat.id,
            "title": chat.title,
            "updated_at": chat.updated_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))