from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from app.core.config import settings
import json
from typing import List, Dict, Optional


class DocumentChatAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    async def analyze_query(self, user_query: str) -> Dict[str, any]:
        """Analyze user query to determine task type and document analysis needs"""
        if not settings.openai_api_key:
            return {"taskType": "chat", "needsDocumentAnalysis": False}

        try:
            analysis_prompt = f"""Analyze this user query and determine the task type:
Query: "{user_query}"

Possible types:
- chat: General conversation
- document_analysis: Questions about specific documents
- writing_assistance: Help with writing or editing
- qa: Question answering about content

Also determine if document analysis is needed (true/false).

Respond in JSON format: {{"taskType": "...", "needsDocumentAnalysis": true/false}}"""

            response = await self.llm.ainvoke([
                {"role": "system", "content": analysis_prompt}
            ])

            analysis = json.loads(response.content)
            return {
                "taskType": analysis.get("taskType", "chat"),
                "needsDocumentAnalysis": analysis.get("needsDocumentAnalysis", False)
            }
        except Exception as e:
            print(f"Failed to analyze query: {e}")
            return {"taskType": "chat", "needsDocumentAnalysis": False}

    async def analyze_documents(self, document_context: str) -> str:
        """Analyze documents and create a concise summary"""
        if not settings.openai_api_key or not document_context:
            return ""

        try:
            analysis_prompt = f"""Analyze the following documents and create a concise summary:

{document_context}

Provide a structured summary that includes:
1. Key topics and themes
2. Important facts or data
3. Main conclusions or insights
4. Relevant context for answering questions

Keep the summary concise but comprehensive."""

            response = await self.llm.ainvoke([
                {"role": "system", "content": analysis_prompt}
            ])

            return response.content
        except Exception as e:
            print(f"Failed to analyze documents: {e}")
            return ""

    def build_system_prompt(
        self,
        task_type: Optional[str] = None,
        document_context: Optional[str] = None,
        document_summary: Optional[str] = None
    ) -> str:
        """Build system prompt for the AI assistant"""
        prompt = f"""You are an AI assistant integrated into Jotlin, a Notion-like document editor.
You help users with their documents and provide intelligent assistance.

Current task type: {task_type or 'chat'}

Key capabilities:
- Answer questions about documents using provided context
- Help with writing and editing tasks
- Provide summaries and insights from document content
- Assist with document organization and structure
- General conversation and assistance

Guidelines:
- Be helpful, accurate, and concise
- When referencing documents, cite specific content when relevant
- For writing assistance, provide constructive suggestions
- Always consider the document context when available"""

        if document_summary:
            prompt += f"\n\nDocument Analysis Summary:\n{document_summary}"
        elif document_context:
            prompt += f"\n\nLinked Documents:\n{document_context}"

        return prompt

    async def process_message(
        self,
        user_message: str,
        conversation_history: List[Dict],
        document_context: Optional[str] = None
    ) -> str:
        """Process user message and generate AI response"""
        try:
            if not settings.openai_api_key:
                return "AI functionality is not configured. Please add your OpenAI API key to the environment variables."

            # Analyze query
            query_analysis = await self.analyze_query(user_message)

            # Analyze documents if needed
            document_summary = ""
            if query_analysis["needsDocumentAnalysis"] and document_context:
                document_summary = await self.analyze_documents(document_context)

            # Build system prompt
            system_prompt = self.build_system_prompt(
                query_analysis["taskType"],
                document_context,
                document_summary
            )

            # Build message history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add last 8 messages from conversation history
            for msg in conversation_history[-8:]:
                role = "user" if msg["role"] == "user" else "assistant"
                messages.append({"role": role, "content": msg["content"]})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})

            # Generate response
            response = await self.llm.ainvoke(messages)
            return response.content

        except Exception as error:
            print(f"AI processing error: {error}")
            return "Sorry, I encountered an error while processing your request. Please try again."


class AIService:
    def __init__(self):
        self.chat_agent = DocumentChatAgent()

    async def process_message(
        self,
        user_message: str,
        conversation_history: List[Dict],
        document_context: Optional[str] = None
    ) -> str:
        """Process a chat message through the document chat agent"""
        return await self.chat_agent.process_message(
            user_message, conversation_history, document_context
        )