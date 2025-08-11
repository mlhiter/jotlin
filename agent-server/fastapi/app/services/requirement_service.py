from sqlalchemy.orm import Session
from typing import Dict, Optional
import uuid
import asyncio
from app.services.langgraph_service import LangGraphRequirementService

# Global task storage to persist across API requests
GLOBAL_TASKS = {}


class RequirementService:
    def __init__(self, db: Session):
        self.db = db
        # Use global task storage instead of instance-level
        self.tasks = GLOBAL_TASKS
        self.langgraph_service = LangGraphRequirementService()

    async def start_requirement_generation(self, initial_requirements: str) -> str:
        """Start the requirement generation process using LangGraph"""
        task_id = str(uuid.uuid4())
        
        # Store initial task status
        self.tasks[task_id] = {
            "id": task_id,
            "status": "started",
            "initial_requirements": initial_requirements,
            "progress": 0,
            "message": "Multi-agent requirement generation process has been initiated",
            "results": {}
        }
        
        # Start the background LangGraph workflow
        asyncio.create_task(self._run_langgraph_workflow(task_id, initial_requirements))
        
        return task_id

    async def _run_langgraph_workflow(self, task_id: str, initial_requirements: str):
        """Run the LangGraph requirement generation workflow"""
        try:
            # Update status to running
            self.tasks[task_id]["status"] = "running"
            self.tasks[task_id]["message"] = "Running multi-agent requirement analysis with LangGraph"
            self.tasks[task_id]["progress"] = 5
            
            # Create a progress callback to update task status in real-time
            async def progress_callback(current_step: str, progress: int, message: str):
                if task_id in self.tasks:
                    self.tasks[task_id]["progress"] = progress
                    self.tasks[task_id]["message"] = message
                    self.tasks[task_id]["current_step"] = current_step
                    print(f"[{task_id}] Progress: {progress}% - {message}")
            
            # Run the LangGraph workflow
            result = await self.langgraph_service.run_requirement_generation(
                initial_requirements, 
                progress_callback=progress_callback
            )
            
            if result["status"] == "completed":
                self.tasks[task_id]["status"] = "completed"
                self.tasks[task_id]["progress"] = 100
                self.tasks[task_id]["message"] = "Requirement generation completed successfully"
                self.tasks[task_id]["results"] = result["results"]
                print(f"[{task_id}] Workflow completed successfully")
            else:
                self.tasks[task_id]["status"] = "failed"
                self.tasks[task_id]["message"] = f"LangGraph workflow failed: {result.get('error', 'Unknown error')}"
                print(f"[{task_id}] Workflow failed: {result.get('error', 'Unknown error')}")
            
        except Exception as e:
            self.tasks[task_id]["status"] = "failed"
            self.tasks[task_id]["message"] = f"Error during requirement generation: {str(e)}"
            print(f"[{task_id}] Exception: {str(e)}")
            import traceback
            traceback.print_exc()

    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Get the status of a requirement generation task"""
        return self.tasks.get(task_id)

    def get_task_results(self, task_id: str) -> Optional[Dict]:
        """Get the results of a completed requirement generation task"""
        task = self.tasks.get(task_id)
        if task and task["status"] == "completed":
            return task["results"]
        return None

    def format_results_for_frontend(self, results: Dict) -> Dict:
        """Format AI-generated results for frontend consumption"""
        # Format the results to be compatible with frontend document structure
        formatted_documents = []
        
        # Each generated document becomes a separate "document" that can be saved
        documents_mapping = [
            ("interview_record", "Interview Record", "interview-record"),
            ("user_requirements", "User Requirements", "user-requirements"),
            ("operation_environment", "Operation Environment", "operation-environment"),
            ("system_requirements", "System Requirements", "system-requirements"),
            ("requirement_model", "Use Case Model (PlantUML)", "use-case-model"),
            ("srs_document", "Software Requirements Specification", "srs-document"),
            ("review_report", "SRS Review Report", "review-report")
        ]
        
        for key, title, doc_type in documents_mapping:
            if key in results and results[key]:
                formatted_documents.append({
                    "title": title,
                    "content": results[key],
                    "type": doc_type,
                    "generated_at": "now",  # Frontend can set proper timestamp
                    "ready_for_save": True  # Indicates this can be saved as a document
                })
        
        return {
            "documents": formatted_documents,
            "conversations": results.get("conversations", []),
            "summary": f"Generated {len(formatted_documents)} requirement documents using complete COT workflow"
        }