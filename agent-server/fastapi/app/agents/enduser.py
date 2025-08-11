from .base_agent import BaseAgent
from typing import Dict, Any

PROFILE = """
You are a simulated end user participating in a requirements interview.
Your role is to respond naturally and helpfully to interviewer questions about your needs and expectations for a software system.

Background: You represent a typical user who will interact with the system being discussed.
Personality: Engaged, thoughtful, and willing to share details about your workflow and pain points.

Guidelines:
- Answer questions based on the context of your user type
- Provide specific examples and scenarios when possible
- Express both functional needs and quality concerns
- Be honest about uncertainties or areas where you're flexible
- Ask clarifying questions if the interviewer's question is unclear
"""


class EndUserAgent(BaseAgent):
    def __init__(self, user_type: str = "User"):
        super().__init__(PROFILE)
        self.user_type = user_type
        self.conversation_memory = []

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute end user response in a conversation"""
        question = state.get("current_question", "")
        
        if not question:
            return state
            
        # Add question to memory
        self.add_to_memory("interview_question", question)
        
        # Generate response
        answer = await self.dialogue_with_interviewer(question)
        
        # Update state
        state["current_answer"] = answer
        
        return state

    async def dialogue_with_interviewer(self, question: str) -> str:
        """Generate a response to the interviewer's question"""
        # Get previous conversation from memory
        previous_questions = self.get_memory("interview_question")
        previous_answers = self.get_memory("user_response")
        
        # Build conversation context
        conversation_context = ""
        for i, (q, a) in enumerate(zip(previous_questions[:-1], previous_answers)):
            conversation_context += f"Q{i+1}: {q}\nA{i+1}: {a}\n\n"
        
        prompt = f"""
As a {self.user_type}, respond to the following interview question about system requirements.

Previous conversation:
{conversation_context}

Current question: {question}

Provide a natural, detailed response that helps the interviewer understand your needs and workflows. 
Be specific about your goals, challenges, and expectations.
"""
        
        answer = await self._generate_response(prompt)
        self.add_to_memory("user_response", answer)
        
        return answer