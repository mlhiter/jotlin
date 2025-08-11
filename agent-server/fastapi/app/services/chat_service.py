from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.chat import Chat, Message
from typing import List, Dict, Optional
import uuid


class ChatService:
    def __init__(self, db: Session):
        self.db = db

    def get_chat(self, chat_id: str) -> Optional[Chat]:
        """Get chat by ID"""
        return self.db.query(Chat).filter(Chat.id == chat_id).first()

    def get_conversation_history(self, chat_id: str, limit: int = 10) -> List[Dict]:
        """Get conversation history for a chat"""
        messages = (
            self.db.query(Message)
            .filter(Message.chat_id == chat_id)
            .order_by(desc(Message.created_at))
            .limit(limit)
            .all()
        )
        
        # Convert to list format expected by AI service
        history = []
        for msg in reversed(messages):  # Reverse to get chronological order
            history.append({
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            })
        
        return history

    def get_document_context(self, chat_id: str) -> Optional[str]:
        """Get linked document context for a chat"""
        # This would need to be implemented based on how documents are linked to chats
        # For now, returning None as we haven't implemented the document linking yet
        # TODO: Implement document context retrieval based on chat-document relationships
        return None

    def create_message(
        self,
        chat_id: str,
        content: str,
        role: str,
        user_id: str
    ) -> Message:
        """Create a new message in the chat"""
        message = Message(
            id=str(uuid.uuid4()),
            content=content,
            role=role,
            chat_id=chat_id,
            user_id=user_id
        )
        
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        # Update chat's updated_at timestamp
        chat = self.get_chat(chat_id)
        if chat:
            from datetime import datetime
            chat.updated_at = datetime.utcnow()
            self.db.commit()
        
        return message

    def create_chat(self, title: str, user_id: str) -> Chat:
        """Create a new chat"""
        chat = Chat(
            id=str(uuid.uuid4()),
            title=title,
            user_id=user_id
        )
        
        self.db.add(chat)
        self.db.commit()
        self.db.refresh(chat)
        
        return chat

    def get_user_chats(self, user_id: str, include_archived: bool = False) -> List[Chat]:
        """Get all chats for a user"""
        query = self.db.query(Chat).filter(Chat.user_id == user_id)
        
        if not include_archived:
            query = query.filter(Chat.is_archived == "false")
            
        return query.order_by(desc(Chat.updated_at)).all()

    def archive_chat(self, chat_id: str) -> bool:
        """Archive a chat"""
        chat = self.get_chat(chat_id)
        if chat:
            chat.is_archived = "true"
            self.db.commit()
            return True
        return False

    def restore_chat(self, chat_id: str) -> bool:
        """Restore an archived chat"""
        chat = self.get_chat(chat_id)
        if chat:
            chat.is_archived = "false"
            self.db.commit()
            return True
        return False