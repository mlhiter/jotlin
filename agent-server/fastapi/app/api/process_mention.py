from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Union, Dict, List
import json
import logging

from ..services.ai_service import AIService

router = APIRouter()
logger = logging.getLogger(__name__)

class MentionRequest(BaseModel):
    prompt: str
    document_content: Optional[str] = ""
    document_title: Optional[str] = ""
    block_id: Optional[str] = ""

class AIResponse(BaseModel):
    type: str  # "modify_content", "add_content", "suggest_edit", "no_action"
    content: Optional[Union[str, List[Dict[str, Any]], Dict[str, Any]]] = None
    suggestion: Optional[str] = None
    reasoning: str

@router.post("/process-mention", response_model=AIResponse)
async def process_mention(request: MentionRequest):
    """
    处理评论中的AI提及请求
    """
    try:
        logger.info(f"Processing AI mention: {request.prompt[:100]}...")

        # 解析指令类型
        action = parse_ai_instruction(request.prompt)

        # 调用AI服务处理
        ai_service = AIService()
        result = await ai_service.process_mention_request(
            instruction=request.prompt,
            action_type=action,
            document_content=request.document_content,
            document_title=request.document_title,
            block_id=request.block_id
        )

        return result

    except Exception as e:
        logger.error(f"Error processing AI mention: {str(e)}")
        return AIResponse(
            type="no_action",
            reasoning=f"处理AI指令时出错: {str(e)}"
        )

def parse_ai_instruction(prompt: str) -> str:
    """
    解析AI指令类型
    """
    content = prompt.lower()

    if any(keyword in content for keyword in ['修改', '更改', '替换', 'modify', 'change', 'replace']):
        return 'modify'
    elif any(keyword in content for keyword in ['添加', '增加', '插入', 'add', 'insert']):
        return 'add'
    elif any(keyword in content for keyword in ['删除', '移除', 'delete', 'remove']):
        return 'delete'
    elif any(keyword in content for keyword in ['优化', '改进', '完善', 'optimize', 'improve']):
        return 'optimize'
    elif any(keyword in content for keyword in ['翻译', '转换', 'translate', 'convert']):
        return 'translate'
    else:
        return 'general'