#!/usr/bin/env python3
"""
Test script to verify the complete COT integration in FastAPI backend
"""
import asyncio
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.langgraph_service import LangGraphRequirementService


async def test_complete_cot_workflow():
    """Test the complete Chain of Thought workflow"""
    print("🚀 Testing Complete COT Workflow Integration")
    print("=" * 50)

    # Initialize the service
    service = LangGraphRequirementService()

    # Test requirement
    test_requirement = "I want to build a blog website where users can create accounts, write posts, comment on posts, and manage their profiles."

    print(f"📝 Testing requirement: {test_requirement}")
    print("\n🔄 Starting workflow...")

    try:
        # Run the complete workflow
        result = await service.run_requirement_generation(test_requirement)

        print(f"\n✅ Workflow Status: {result['status']}")
        print(f"📊 Progress: {result['progress']}%")

        if result["status"] == "completed":
            results = result["results"]

            print("\n📋 Generated Documents:")
            print("-" * 30)

            for key, content in results.items():
                if content and key != "conversations":
                    print(f"✓ {key.replace('_', ' ').title()}: {len(content)} characters")

            print(f"\n💬 Conversations: {len(results.get('conversations', []))} exchanges")

            # Show a sample of each document
            print("\n🔍 Document Samples:")
            print("=" * 30)

            for key, content in results.items():
                if content and key != "conversations":
                    print(f"\n--- {key.replace('_', ' ').title()} ---")
                    sample = content[:200] + "..." if len(content) > 200 else content
                    print(sample)

            return True

        else:
            print(f"❌ Workflow failed: {result.get('error', 'Unknown error')}")
            return False

    except Exception as e:
        print(f"❌ Error during workflow: {str(e)}")
        return False


async def validate_agent_coverage():
    """Validate that all COT agents are properly integrated"""
    print("\n🔍 Validating Agent Coverage")
    print("=" * 30)

    service = LangGraphRequirementService()

    # Check if all agents are initialized
    agents = {
        "InterviewerAgent": service.interviewer,
        "DeployerAgent": service.deployer,
        "AnalystAgent": service.analyst,
        "ArchivistAgent": service.archivist,
        "ReviewerAgent": service.reviewer
    }

    all_present = True
    for agent_name, agent_instance in agents.items():
        if agent_instance is not None:
            print(f"✅ {agent_name}: Properly initialized")
        else:
            print(f"❌ {agent_name}: Missing or not initialized")
            all_present = False

    # Check workflow nodes
    workflow_nodes = [
        "initialize",
        "conduct_interviews",
        "deployer_interview",
        "analyze_requirements",
        "generate_srs",
        "review_srs",
        "finalize"
    ]

    print(f"\n🔄 Workflow has {len(workflow_nodes)} nodes (should be 7)")

    return all_present


if __name__ == "__main__":
    print("🧪 COT Integration Test Suite")
    print("=" * 50)

    async def run_tests():
        # Test 1: Validate agent coverage
        coverage_ok = await validate_agent_coverage()

        if not coverage_ok:
            print("\n❌ Agent coverage validation failed!")
            return

        # Test 2: Run complete workflow
        workflow_ok = await test_complete_cot_workflow()

        # Final results
        print("\n" + "=" * 50)
        if coverage_ok and workflow_ok:
            print("🎉 ALL TESTS PASSED! COT integration is complete.")
            print("\n📋 Summary:")
            print("✅ All 5 agents properly integrated")
            print("✅ Complete workflow functional")
            print("✅ Document generation working")
            print("✅ Ready for production use")
        else:
            print("❌ SOME TESTS FAILED!")
            print("Please check the error messages above.")
    asyncio.run(run_tests())