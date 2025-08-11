from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from app.core.config import settings
from typing import List, Dict, Optional, AsyncGenerator
import json


class StreamingChatAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            streaming=True,
        )

    async def stream_response(
        self,
        user_message: str,
        conversation_history: List[Dict],
        document_context: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream AI response chunks"""
        try:
            system_prompt = self.build_system_prompt(document_context)
            
            # Build message history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add last 8 messages from conversation history
            for msg in conversation_history[-8:]:
                role = "user" if msg["role"] == "user" else "assistant"
                messages.append({"role": role, "content": msg["content"]})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})

            # Stream response
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    yield chunk.content

        except Exception as error:
            print(f"Streaming error: {error}")
            yield "Sorry, I encountered an error while processing your request."

    def build_system_prompt(self, document_context: Optional[str] = None) -> str:
        """Build system prompt for streaming chat"""
        prompt = """You are an AI assistant integrated into Jotlin, a Notion-like document editor.
Help users with their documents and provide intelligent assistance.

Key capabilities:
- Answer questions about documents
- Help with writing and editing
- Provide summaries and insights
- Assist with document organization

Be helpful, accurate, and conversational."""

        if document_context:
            prompt += f"\n\nLinked Documents:\n{document_context}"

        return prompt


class StreamingService:
    def __init__(self):
        self.streaming_agent = StreamingChatAgent()

    async def stream_chat_response(
        self,
        user_message: str,
        conversation_history: List[Dict],
        document_context: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat response through the streaming agent"""
        async for chunk in self.streaming_agent.stream_response(
            user_message, conversation_history, document_context
        ):
            yield chunk