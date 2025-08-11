from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.requirement_service import RequirementService
from pydantic import BaseModel

router = APIRouter()


class RequirementRequest(BaseModel):
    initial_requirements: str


class RequirementResponse(BaseModel):
    task_id: str
    status: str
    message: str


@router.post("/generate")
async def generate_requirements(
    request: RequirementRequest,
    db: Session = Depends(get_db)
):
    """Trigger requirement generation process"""
    try:
        requirement_service = RequirementService(db)
        task_id = await requirement_service.start_requirement_generation(
            request.initial_requirements
        )

        return RequirementResponse(
            task_id=task_id,
            status="started",
            message="Requirement generation process has been initiated"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}")
async def get_requirement_status(
    task_id: str,
    db: Session = Depends(get_db)
):
    """Get status of requirement generation task"""
    try:
        requirement_service = RequirementService(db)
        status = requirement_service.get_task_status(task_id)

        if not status:
            raise HTTPException(status_code=404, detail="Task not found")

        return status

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/result/{task_id}")
async def get_requirement_result(
    task_id: str,
    formatted: bool = True,
    db: Session = Depends(get_db)
):
    """Get results of completed requirement generation task"""
    try:
        requirement_service = RequirementService(db)
        results = requirement_service.get_task_results(task_id)

        if not results:
            task_status = requirement_service.get_task_status(task_id)
            if not task_status:
                raise HTTPException(status_code=404, detail="Task not found")
            elif task_status["status"] != "completed":
                raise HTTPException(
                    status_code=400,
                    detail=f"Task is not completed. Current status: {task_status['status']}"
                )
            else:
                raise HTTPException(status_code=404, detail="Results not found")

        # Format results for frontend if requested
        if formatted:
            return requirement_service.format_results_for_frontend(results)
        else:
            return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-from-chat")
async def generate_requirements_from_chat(
    request: RequirementRequest,
    db: Session = Depends(get_db)
):
    """Generate requirements from a chat-like conversation"""
    try:
        requirement_service = RequirementService(db)

        # This endpoint is designed to work with chat interfaces
        # The initial_requirements can be a conversational input
        task_id = await requirement_service.start_requirement_generation(
            request.initial_requirements
        )

        return RequirementResponse(
            task_id=task_id,
            status="started",
            message="AI agents are analyzing your requirements and generating documents. This may take a few minutes."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))