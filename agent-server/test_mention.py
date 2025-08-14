#!/usr/bin/env python3
"""
简单的测试脚本，用于验证mention处理功能
"""

import asyncio
import json
import sys
import os

# 添加fastapi目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'fastapi'))

from app.services.ai_service import AIService

async def test_mention_processing():
    """测试AI mention处理功能"""
    ai_service = AIService()

    test_cases = [
        {
            "instruction": "@AI 请优化这段文字，让它更简洁明了",
            "document_content": "这是一个非常长的段落，包含了很多冗余的信息和重复的内容，需要进行优化和简化处理。",
            "document_title": "测试文档",
            "action_type": "optimize"
        },
        {
            "instruction": "@AI 在文档末尾添加一个总结部分",
            "document_content": "# 项目介绍\n\n这是我们的新项目。\n\n## 功能特性\n\n- 功能1\n- 功能2",
            "document_title": "项目文档",
            "action_type": "add"
        },
        {
            "instruction": "@AI 修改标题，让它更吸引人",
            "document_content": "# 普通标题\n\n内容...",
            "document_title": "测试",
            "action_type": "modify"
        }
    ]

    print("🧪 开始测试AI mention处理功能...\n")

    for i, test_case in enumerate(test_cases, 1):
        print(f"📝 测试用例 {i}: {test_case['instruction']}")
        print(f"📄 文档标题: {test_case['document_title']}")
        print(f"📖 文档内容: {test_case['document_content'][:50]}...")
        print(f"🎯 动作类型: {test_case['action_type']}")

        try:
            result = await ai_service.process_mention_request(
                instruction=test_case['instruction'],
                action_type=test_case['action_type'],
                document_content=test_case['document_content'],
                document_title=test_case['document_title'],
                block_id="test-block-id"
            )

            print(f"✅ 处理成功!")
            print(f"   类型: {result.type}")
            print(f"   原因: {result.reasoning}")

            if result.content:
                print(f"   修改后内容: {result.content[:100]}...")
            if result.suggestion:
                print(f"   建议: {result.suggestion}")

        except Exception as e:
            print(f"❌ 处理失败: {str(e)}")

        print("-" * 50)

if __name__ == "__main__":
    # 检查是否配置了OpenAI API
    from app.core.config import settings

    if not settings.openai_api_key:
        print("⚠️  警告: 未配置OpenAI API Key，将返回模拟响应")
        print("   请在.env文件中设置OPENAI_API_KEY")
        print()

    asyncio.run(test_mention_processing())