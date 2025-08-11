from .base_agent import BaseAgent
from typing import Dict, Any, List

PROFILE = """
You are the primary **System Deployer** for the target solution.
Mission:
Provide clear, complete, implementation-neutral information about the deployment and operating environment so the requirements team can capture accurate *Operation-Environment Requirements* in the SRS.

Personality:
Pragmatic, risk-aware, and detail-oriented; fluent in technical jargon yet able to translate into business terms when needed; proactive in surfacing operational risks and compliance obligations.

Workflow:
1. Read each interviewer question carefully; if anything is unclear, request clarification before answering.
2. Answer with facts covering the 5W1H (Who, What, Where, When, Why, How) while avoiding design decisions.
3. Organise information under standard headings: Hardware • OS & Middleware • Network & Connectivity • Security & Compliance • Performance & Capacity • Monitoring & Logging • Backup & DR • Deployment/Release Process.
4. Flag unknowns, assumptions, and dependencies explicitly.
5. Keep internal consistency across all answers.

Experience & Preferred Practices:
• 10+ years in DevOps and infrastructure management (on-prem, cloud, hybrid).  
• Follows ITIL for operations and ISO/IEC 27001 for security.  
• Proficient with IaC (Terraform/Ansible), CI/CD pipelines, containerisation (Docker/K8s), and observability stacks (Prometheus, Grafana).  
• Advocates blue-green/rolling releases and zero-downtime deployment strategies.

Internal Chain of Thought — invisible to the interviewer:
1. Map each answer to 〈Category | Constraint | Rationale〉 tuples for traceability.
2. Check for contradictions with previous replies; if detected, reconcile before responding.
3. Keep answers concise yet complete; never invent data when unsure.
"""


class DeployerAgent(BaseAgent):
    def __init__(self):
        super().__init__(PROFILE)

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute deployer conversation simulation"""
        # Simulate deployer dialogue to generate operation environment
        operation_environment = await self.generate_operation_environment(
            state.get("initial_requirements", "")
        )
        state["operation_environment"] = operation_environment
        
        return state

    async def dialogue_with_interviewer(self, question: str, conversation_history: List[Dict]) -> str:
        """Generate deployer response to interviewer question"""
        DIALOGUE_INTERVIEWER_PROMPT = """
You are acting as the **System Deployer** defined in your profile.

Below is the conversation so far. The final line is the interviewer's latest question; craft your reply to that question now.

=====================  CONVERSATION HISTORY  =====================
{dialogue_history}
==================================================================

Guidelines for your reply
1. Respond **only as the Deployer** (no "Interviewer:" or "Deployer:" prefixes).  
2. Write in **clear English** unless the question is explicitly in another language.  
3. When the question relates to deployment, provide concrete details: hardware specs, network topology, OS/middleware versions, security controls, monitoring and backup strategies, compliance requirements, etc.  
4. If any information is uncertain, state your assumption or ask for clarification; never fabricate details.  
5. Begin with a one-sentence overview, then expand in short bullet points or numbered lists (no more than 2–3 key points per block) to keep the answer focused.  
6. Remain consistent with the conversation history and avoid contradictions.

Now generate your answer.
"""
        
        # Format conversation history
        history_text = "\n".join([
            f"Interviewer: {conv['question']}\nDeployer: {conv['answer']}"
            for conv in conversation_history
        ])
        history_text += f"\nInterviewer: {question}\nDeployer: "
        
        answer = await self._generate_response(
            DIALOGUE_INTERVIEWER_PROMPT.format(dialogue_history=history_text)
        )
        
        self.add_to_memory("deployer_message", answer)
        return answer

    async def generate_operation_environment(self, initial_requirements: str) -> str:
        """Generate operation environment details based on requirements"""
        OPERATION_ENVIRONMENT_PROMPT = """
As a System Deployer, analyze the following requirements and provide a comprehensive operational environment specification.

Initial Requirements: {initial_requirements}

Provide detailed information covering:

1. **Operating System and Platform**
   - Recommended OS and versions
   - Platform requirements (web, mobile, desktop)

2. **Hardware Requirements**
   - Minimum and recommended specs
   - Scalability considerations

3. **Software Dependencies and Runtime**
   - Programming languages and versions
   - Frameworks and libraries
   - Database requirements

4. **Network Configuration**
   - Bandwidth requirements
   - Security protocols
   - API integrations

5. **Security and Access Control**
   - Authentication mechanisms
   - Data protection requirements
   - Compliance considerations

6. **Deployment Tools and Methods**
   - Containerization requirements
   - CI/CD pipeline needs
   - Cloud vs on-premise considerations

7. **Monitoring, Logging, and Maintenance**
   - Performance monitoring requirements
   - Log management needs
   - Backup and recovery strategies

Format as a structured checklist with bullet points under each category.
"""
        
        operation_environment = await self._generate_response(
            OPERATION_ENVIRONMENT_PROMPT.format(initial_requirements=initial_requirements)
        )
        
        self.add_to_memory("operation_environment", operation_environment)
        return operation_environment