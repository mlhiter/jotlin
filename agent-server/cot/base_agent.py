from abc import ABC
from typing import Any, Dict, List
from openai import OpenAI
import time

class BaseAgent(ABC):
    def __init__(self, profile):
        self.profile = profile
        self.client = self._initialize_llm()
        self.memory: List[Dict[str,Any]] = []

    def _initialize_llm(self):
        client = OpenAI(
            api_key="sk-8xoAjEKQhiYBy61r427b7eCa4731456c9fC62906E6C912Fe",  # replace with your key
            base_url="https://aiproxy.usw.sealos.io/v1",
        )
        return client

    def add_to_memory(self,artifact_type, artifact_content) -> None:
        self.memory.append({"artifact_type":artifact_type,"artifact_content":artifact_content})

    def get_memory(self,artifact_type) -> List[Any]:
        return [artifact["artifact_content"] for artifact in self.memory if artifact["artifact_type"] == artifact_type]

    def _generate_response(self,prompt) -> str:
        flag = False
        while not flag:
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4.1",
                    messages=[
                        {"role":"system","content":self.profile},
                        {"role":"user","content":prompt}
                    ],
                    temperature=0,
                    max_tokens=1000,
                )
                flag = True
            except Exception as e:
                print(f"Error generating response: {e}")
                time.sleep(0.5)
        return response.choices[0].message.content
