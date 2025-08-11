from .base_agent import BaseAgent
from typing import Dict, Any, List
import ast

PROFILE = """
You are an experienced requirements interviewer.
Mission:
Elicit, clarify, and document stakeholder requirements with maximum completeness and accuracy.
Personality:
Neutral, empathetic, and inquisitive; fluent in both business and technical terminology.
Workflow:
1. Conduct multi-round dialogue with end users.
2. Produce interview records immediately after dialogues.
3. Write a consolidated user requirements list.
4. Conduct multi-round dialogue with system deployers.
5. Write an operation environment list.
Experience & Preferred Practices:
1. Follow ISO/IEC/IEEE 29418 and BABOK v3 guidance.
2. Use open-ended questions, active listening, and iterative paraphrasing.
3. Apply Socratic Questioning to resolve any ambiguous statements.
4. Limit each question turn to no more than two questions to maintain a natural conversational flow.
Internal Chain of Thought (visible to the agent only):
1. Identify stakeholder type and context.
2. Use 5W1H and targeted probes to surface goals, pain points, and constraints.
3. Map each utterance to 〈Role|Goal|Behaviour|Constraint〉 tuples.
4. Paraphrase key findings and request confirmation before proceeding.
"""

DECISION_END_USER_LIST_PROMPT = """
Your task is to analyze an initial system requirement description and identify the **types of end users** who will interact with the system.

Follow these steps:

1. Read and understand the system's core functions, goals, and usage scenarios.
2. Based on these, infer the distinct categories of **end users** who will interact with the system directly.
3. For each user type:
   - Give the **role name** (e.g., "Customer", "Administrator", "Content Reviewer")
   - Briefly describe their **responsibilities** or typical interactions with the system
   - If helpful, include **examples of actions** they would perform

If the description is vague, use reasonable assumptions based on common software systems.

Below is the initial system requirement description:
--------------------
{initial_requirement_description}
--------------------

Now, based on this description, identify and describe the relevant end user roles.
Only return a structured list of end user types name with ['',''] format. 
"""


class InterviewerAgent(BaseAgent):
    def __init__(self):
        super().__init__(PROFILE)
        self.initial_requirements = ""

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the interviewer agent workflow"""
        # Get initial requirements from state
        self.initial_requirements = state.get("initial_requirements", "")
        self.add_to_memory("initial_requirements", self.initial_requirements)
        
        # Decide end user list
        end_user_list = await self.decide_end_user_list()
        state["end_user_list"] = end_user_list
        
        # Initialize conversation tracking
        state["end_user_conversations"] = []
        state["deployer_conversations"] = []
        
        return state

    async def decide_end_user_list(self) -> List[str]:
        """Decide the list of end users to interview"""
        response = await self._generate_response(
            DECISION_END_USER_LIST_PROMPT.format(
                initial_requirement_description=self.initial_requirements
            )
        )
        
        try:
            # Parse the response as a Python list
            end_user_list = ast.literal_eval(response)
            self.add_to_memory("end_user_list", response)
            return end_user_list
        except:
            # Fallback to a default list if parsing fails
            return ["User", "Administrator"]

    async def dialogue_with_end_user(self, conversation_history: List[Dict]) -> str:
        """Generate a question for the end user interview"""
        DIALOGUE_END_USER_PROMPT = """
You are a professional **requirements elicitor** conducting an interview with an end user to understand system requirements.  
Your goal is to extract clear, useful, and detailed requirements (both functional and non-functional) by asking appropriate, open-ended, and context-aware questions.

You have two inputs:
1. The high-level **Initial Development Brief** provided by stakeholders (may be incomplete or imprecise).  
2. The running **Dialogue History** with the end user.

================  INITIAL DEVELOPMENT BRIEF  ================
{initial_requirements}
=============================================================

--------------------  DIALOGUE HISTORY  ---------------------
{conversation_history}
-------------------------------------------------------------

Guidelines for your next question  
• Focus on uncovering the user's **goals**, **pain points**, **desired features**, **usage scenarios**, and **constraints**.  
• Ask **open-ended** questions (avoid yes/no).  
• Dig deeper into any aspect already mentioned before moving on.  
• Cover both **functional** (what the system should do) and **non-functional** requirements (performance, security, usability, etc.).  
• Maintain a **natural, professional tone**—be a collaborative partner, not a robot.  
• Validate or clarify any assumptions implied by the Initial Development Brief.

Task  
If the dialogue history is empty, greet the user politely and open with a broad question that anchors on the Initial Development Brief.  
Otherwise, propose the **single most relevant follow-up question** that will elicit concrete software requirements next.

Return *only* that next question.
"""
        
        # Format conversation history
        history_text = "\n".join([
            f"Interviewer: {conv['question']}\nEnd User: {conv['answer']}"
            for conv in conversation_history
        ])
        
        question = await self._generate_response(
            DIALOGUE_END_USER_PROMPT.format(
                initial_requirements=self.initial_requirements,
                conversation_history=history_text
            )
        )
        
        return question

    async def write_interview_record(self, conversations: List[Dict]) -> str:
        """Write a structured interview record"""
        WRITE_INTERVIEW_RECORD_PROMPT = """
You are acting as a professional assistant for a requirements engineer. Your task is to **summarize the dialogue between the requirements interviewer and the end user into a clear and structured interview record**.

The record should help the development team understand the user's needs, goals, and expectations. Follow these principles:

1. **Use a professional tone**.
2. Extract key points related to:
   - Background of the user or system
   - User's goals
   - Functional requirements (what the system should do)
   - Non-functional requirements (performance, security, usability, etc.)
   - Pain points or current challenges
   - Usage scenarios or workflows
   - Any implicit or stated constraints
3. Group related information into logical sections using appropriate headers.
4. If the user is uncertain, note it with phrases like "The user is not sure yet, but considers..."
5. Avoid verbatim copying of the dialogue; instead, summarize meaningfully.

Below is the dialogue history between the interviewer and the end user:
--------------------
{conversation_history}
--------------------

Now, generate a structured interview record that summarizes the above conversation. Use bullet points or short paragraphs under each section when appropriate.

Return only the interview record.
"""
        
        # Format all conversations
        history_text = "\n".join([
            f"Interviewer: {conv['question']}\nEnd User: {conv['answer']}"
            for conv in conversations
        ])
        
        interview_record = await self._generate_response(
            WRITE_INTERVIEW_RECORD_PROMPT.format(conversation_history=history_text)
        )
        
        self.add_to_memory("interview_record", interview_record)
        return interview_record

    async def write_user_requirements(self, interview_record: str) -> str:
        """Extract user requirements from interview record"""
        WRITE_USER_REQUIREMENTS_PROMPT = """
You are an assistant to a professional requirements engineer. Your task is to extract a **clear and structured list of user requirements** based on a formal interview record.

Follow these principles:

1. **Classify requirements** into the following categories:
   - Functional Requirements
   - Non-functional Requirements
   - Constraints
   - Usage Scenarios (if present)

2. **Ensure clarity**: Each requirement should be written as a complete and unambiguous sentence, describing what the user expects the system to do or how it should behave.

3. **Avoid redundancy**: Merge similar items and generalize when needed.

4. **Respect uncertainty**: If the user's intention is unclear or tentative, include phrases like "The user may need…" or "The user is considering…"

5. **Use bullet points**, and group requirements under proper section headings.

6. If possible, **assign a rough priority**: High / Medium / Low — based on how essential or urgent the requirement seems from the interview.

Below is the formal interview record:
--------------------
{interview_record}
--------------------

Now, based on the above record, write a structured **User Requirements List** with categories and priorities. Keep it concise but informative.
"""
        
        user_requirements = await self._generate_response(
            WRITE_USER_REQUIREMENTS_PROMPT.format(interview_record=interview_record)
        )
        
        self.add_to_memory("user_requirements", user_requirements)
        return user_requirements