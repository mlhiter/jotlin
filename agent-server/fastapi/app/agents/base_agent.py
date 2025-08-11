from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from langchain_openai import ChatOpenAI
from app.core.config import settings
import time


class BaseAgent(ABC):
    def __init__(self, profile: str):
        self.profile = profile
        self.client = self._initialize_llm()
        self.memory: List[Dict[str, Any]] = []

    def _initialize_llm(self):
        """Initialize the language model client"""
        client = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            temperature=0,
            max_tokens=1000,
        )
        return client

    def add_to_memory(self, artifact_type: str, artifact_content: str) -> None:
        """Add an artifact to the agent's memory"""
        self.memory.append({
            "artifact_type": artifact_type,
            "artifact_content": artifact_content
        })

    def get_memory(self, artifact_type: str) -> List[Any]:
        """Get artifacts of a specific type from memory"""
        return [
            artifact["artifact_content"] 
            for artifact in self.memory 
            if artifact["artifact_type"] == artifact_type
        ]

    async def _generate_response(self, prompt: str) -> str:
        """Generate a response using the language model"""
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                response = await self.client.ainvoke([
                    {"role": "system", "content": self.profile},
                    {"role": "user", "content": prompt}
                ])
                return response.content
            except Exception as e:
                print(f"Error generating response: {e}")
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(0.5 * retry_count)  # Exponential backoff
                else:
                    raise e

    @abstractmethod
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's main task"""
        pass