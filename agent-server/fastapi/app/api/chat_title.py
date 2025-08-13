from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import AIService
from app.core.config import settings
from langchain_openai import ChatOpenAI

router = APIRouter()

class ChatTitleRequest(BaseModel):
    user_requirement: str

class ChatTitleResponse(BaseModel):
    title: str

class ChatTitleGenerator:
    """Service for generating chat titles based on user requirements"""

    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.3,  # Lower temperature for more consistent titles
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    async def generate_title(self, user_requirement: str) -> str:
        """Generate a concise, descriptive title for a chat based on user requirement"""
        if not settings.openai_api_key:
            # Fallback: create a simple title from the requirement
            return self._create_fallback_title(user_requirement)

        try:
            system_prompt = """You are a helpful assistant that generates concise, descriptive titles for chat conversations.

Given a user requirement or request, generate a short, clear title (3-8 words) that captures the essence of what the user wants to accomplish.

Guidelines:
- Keep it concise and descriptive
- Use clear, professional language
- Focus on the main task or topic
- Avoid redundant words like "chat about" or "help with"
- Make it specific enough to be useful for identification later

Examples:
- User requirement: "I need help creating a marketing plan for my new app"
  Title: "Marketing Plan for New App"

- User requirement: "Can you help me write a resignation letter?"
  Title: "Resignation Letter Writing"

- User requirement: "I want to learn about machine learning algorithms"
  Title: "Machine Learning Algorithms"

Generate only the title, nothing else."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User requirement: {user_requirement}"}
            ]

            response = await self.llm.ainvoke(messages)
            title = response.content.strip()

            # Clean up the title (remove quotes if present)
            title = title.strip('"\'')

            # Ensure title isn't too long
            if len(title) > 60:
                title = title[:57] + "..."

            return title

        except Exception as e:
            print(f"Error generating title: {e}")
            return self._create_fallback_title(user_requirement)

    def _create_fallback_title(self, user_requirement: str) -> str:
        """Create a fallback title when AI generation fails"""
        # Clean and truncate the requirement
        title = user_requirement.strip()

        # Remove common prefixes
        prefixes_to_remove = [
            "I need help with",
            "Can you help me",
            "I want to",
            "Help me",
            "I need",
            "Please help",
            "Could you",
        ]

        for prefix in prefixes_to_remove:
            if title.lower().startswith(prefix.lower()):
                title = title[len(prefix):].strip()
                break

        # Capitalize first letter
        if title:
            title = title[0].upper() + title[1:]

        # Truncate if too long
        if len(title) > 50:
            title = title[:47] + "..."

        return title if title else "New Chat"

# Initialize the title generator
title_generator = ChatTitleGenerator()

@router.post("/generate-chat-title", response_model=ChatTitleResponse)
async def generate_chat_title(request: ChatTitleRequest):
    """Generate a chat title based on user requirement"""
    try:
        if not request.user_requirement.strip():
            raise HTTPException(status_code=400, detail="User requirement cannot be empty")

        title = await title_generator.generate_title(request.user_requirement)
        return ChatTitleResponse(title=title)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_chat_title endpoint: {e}")
        # Return a fallback title
        fallback_title = title_generator._create_fallback_title(request.user_requirement)
        return ChatTitleResponse(title=fallback_title)