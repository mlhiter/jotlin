from langgraph.graph import StateGraph, END
from typing import Dict, Any, List
from app.agents.interviewer import InterviewerAgent
from app.agents.enduser import EndUserAgent
from app.agents.deployer import DeployerAgent
from app.agents.analyst import AnalystAgent
from app.agents.archivist import ArchivistAgent
from app.agents.reviewer import ReviewerAgent
import asyncio


class RequirementGenerationState:
    """State management for requirement generation workflow"""
    def __init__(self):
        self.initial_requirements: str = ""
        self.end_user_list: List[str] = []
        self.conversations: List[Dict] = []
        self.interview_record: str = ""
        self.user_requirements: str = ""
        self.operation_environment: str = ""
        self.system_requirements: str = ""
        self.requirement_model: str = ""
        self.srs_document: str = ""
        self.current_step: str = "start"
        self.progress: int = 0


class LangGraphRequirementService:
    """LangGraph-based requirement generation service focused on AI operations"""
    
    def __init__(self):
        self.interviewer = InterviewerAgent()
        self.deployer = DeployerAgent()
        self.analyst = AnalystAgent()
        self.archivist = ArchivistAgent()
        self.reviewer = ReviewerAgent()
        self.workflow_graph = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        # Create the state graph
        workflow = StateGraph(dict)

        # Add nodes - complete COT workflow
        workflow.add_node("initialize", self._initialize_process)
        workflow.add_node("conduct_interviews", self._conduct_interviews)
        workflow.add_node("deployer_interview", self._deployer_interview)
        workflow.add_node("analyze_requirements", self._analyze_requirements)
        workflow.add_node("generate_srs", self._generate_srs)
        workflow.add_node("review_srs", self._review_srs)
        workflow.add_node("finalize", self._finalize_process)

        # Add edges - complete workflow
        workflow.add_edge("initialize", "conduct_interviews")
        workflow.add_edge("conduct_interviews", "deployer_interview")
        workflow.add_edge("deployer_interview", "analyze_requirements")
        workflow.add_edge("analyze_requirements", "generate_srs")
        workflow.add_edge("generate_srs", "review_srs")
        workflow.add_edge("review_srs", "finalize")
        workflow.add_edge("finalize", END)

        # Set entry point
        workflow.set_entry_point("initialize")

        return workflow.compile()

    async def _initialize_process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize the requirement generation process"""
        print("Initializing requirement generation process...")
        
        callback = state.get("_progress_callback")
        if callback:
            await callback("initialize", 10, "Initializing and identifying end users...")
        
        # Execute interviewer to get end user list
        state = await self.interviewer.execute(state)
        state["current_step"] = "initialized"
        state["progress"] = 10
        
        return state

    async def _conduct_interviews(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Conduct simulated interviews with end users"""
        print("Conducting interviews with end users...")
        
        callback = state.get("_progress_callback")
        if callback:
            await callback("interviews", 30, "Conducting user interviews and gathering requirements...")
        
        end_user_list = state.get("end_user_list", ["User"])
        all_conversations = []
        
        # Simulate conversations with each user type
        for user_type in end_user_list:
            end_user = EndUserAgent(user_type)
            user_conversations = []
            
            # Conduct 2 rounds of dialogue per user type
            for round_num in range(2):
                # Generate question from interviewer
                question = await self.interviewer.dialogue_with_end_user(user_conversations)
                
                # Get response from end user
                user_state = {"current_question": question}
                user_state = await end_user.execute(user_state)
                answer = user_state.get("current_answer", "")
                
                # Store conversation
                conversation = {
                    "user_type": user_type,
                    "round": round_num + 1,
                    "question": question,
                    "answer": answer
                }
                user_conversations.append(conversation)
                all_conversations.append(conversation)
        
        state["conversations"] = all_conversations
        state["current_step"] = "interviews_completed"
        state["progress"] = 30
        
        # Generate interview record
        interview_record = await self.interviewer.write_interview_record(all_conversations)
        state["interview_record"] = interview_record
        
        # Generate user requirements
        user_requirements = await self.interviewer.write_user_requirements(interview_record)
        state["user_requirements"] = user_requirements
        
        return state

    async def _deployer_interview(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Conduct interview with system deployer"""
        print("Conducting deployment environment interview...")
        
        callback = state.get("_progress_callback")
        if callback:
            await callback("deployment", 50, "Analyzing deployment environment and constraints...")
        
        # Execute deployer workflow to get operation environment
        state = await self.deployer.execute(state)
        state["current_step"] = "deployer_interview_completed"
        state["progress"] = 50
        
        return state

    async def _analyze_requirements(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze requirements using analyst agent"""
        print("Analyzing requirements...")
        
        callback = state.get("_progress_callback")
        if callback:
            await callback("analysis", 70, "Analyzing requirements and generating use case models...")
        
        # Execute analyst workflow
        state = await self.analyst.execute(state)
        state["current_step"] = "analysis_completed"
        state["progress"] = 70
        
        return state

    async def _generate_srs(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SRS document using archivist agent"""
        print("Generating SRS document...")
        
        callback = state.get("_progress_callback")
        if callback:
            await callback("srs_generation", 80, "Generating IEEE 29148 compliant SRS document...")
        
        # Execute archivist workflow
        state = await self.archivist.execute(state)
        state["current_step"] = "srs_generated"
        state["progress"] = 80
        
        return state

    async def _review_srs(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Review SRS document using reviewer agent"""
        print("Reviewing SRS document...")
        
        callback = state.get("_progress_callback")
        if callback:
            await callback("review", 90, "Conducting quality review of SRS document...")
        
        # Execute reviewer workflow
        state = await self.reviewer.execute(state)
        state["current_step"] = "srs_reviewed"
        state["progress"] = 90
        
        return state

    async def _finalize_process(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Finalize the process"""
        print("Finalizing requirement generation...")
        
        state["current_step"] = "completed"
        state["progress"] = 100
        
        return state

    async def run_requirement_generation(
        self, 
        initial_requirements: str, 
        progress_callback=None
    ) -> Dict[str, Any]:
        """Run the complete requirement generation workflow"""
        try:
            # Initialize state
            initial_state = {
                "initial_requirements": initial_requirements,
                "current_step": "start",
                "progress": 0,
                "_progress_callback": progress_callback  # Pass callback through state
            }
            
            if progress_callback:
                await progress_callback("start", 0, "Starting requirement generation workflow")
            
            # Run the workflow
            final_state = await self.workflow_graph.ainvoke(initial_state)
            
            if progress_callback:
                await progress_callback("completed", 100, "Workflow completed successfully")
            
            # Return structured results
            return {
                "status": "completed",
                "progress": 100,
                "results": {
                    "interview_record": final_state.get("interview_record", ""),
                    "user_requirements": final_state.get("user_requirements", ""),
                    "operation_environment": final_state.get("operation_environment", ""),
                    "system_requirements": final_state.get("system_requirements", ""),
                    "requirement_model": final_state.get("requirement_model", ""),
                    "srs_document": final_state.get("srs_document", ""),
                    "review_report": final_state.get("review_report", ""),
                    "conversations": final_state.get("conversations", [])
                }
            }
            
        except Exception as e:
            if progress_callback:
                await progress_callback("failed", 0, f"Workflow failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "progress": 0
            }