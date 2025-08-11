#!/usr/bin/env python3
"""
Test script to verify environment variable loading
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

def test_env_loading():
    """Test environment variable loading"""
    print("🧪 Testing Environment Variable Loading")
    print("=" * 50)

    # Test 1: Check if .env file exists
    env_file = Path(__file__).parent / ".env"
    print(f"📁 .env file exists: {'✅' if env_file.exists() else '❌'}")
    print(f"📁 .env file path: {env_file}")

    if env_file.exists():
        print(f"📄 .env file content preview:")
        with open(env_file) as f:
            lines = f.readlines()[:10]  # Show first 10 lines
            for i, line in enumerate(lines, 1):
                if not line.strip().startswith('#') and '=' in line:
                    key = line.split('=')[0]
                    print(f"   {i}. {key}=***")
                elif line.strip():
                    print(f"   {i}. {line.strip()}")

    # Test 2: Load environment variables manually
    print(f"\n🔄 Loading .env file manually...")
    load_dotenv(dotenv_path=env_file)

    print("\n🔍 Environment Variables (after load_dotenv):")
    print("-" * 40)

    env_vars = [
        "OPENAI_API_KEY",
        "OPENAI_BASE_URL",
        "DATABASE_URL",
        "CORS_ORIGINS",
        "SECRET_KEY"
    ]

    for var in env_vars:
        value = os.getenv(var)
        if value:
            if 'key' in var.lower() or 'secret' in var.lower():
                display_value = f"{value[:8]}***{value[-4:]}" if len(value) > 12 else "***"
            else:
                display_value = value
            print(f"✅ {var}: {display_value}")
        else:
            print(f"❌ {var}: Not set")

    print("\n🔧 Testing Settings Class:")
    print("-" * 30)

    try:
        from app.core.config import settings

        print(f"✅ Settings loaded successfully")
        print(f"   - OpenAI API Key: {'✅ Set' if settings.openai_api_key else '❌ Missing'}")
        print(f"   - OpenAI Base URL: {settings.openai_base_url}")
        print(f"   - Database URL: {'✅ PostgreSQL' if settings.database_url and 'postgresql' in settings.database_url else '⚠ SQLite'}")
        print(f"   - CORS Origins: {settings.cors_origins_list}")

        # Test configuration logging
        print(f"\n📋 Full Configuration Report:")
        settings.log_config()

        return True

    except Exception as e:
        print(f"❌ Error loading settings: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_env_loading()

    print(f"\n{'='*50}")
    if success:
        print("🎉 Environment variable loading test PASSED!")
        print("✅ Your Python backend should now be able to read environment variables.")
    else:
        print("❌ Environment variable loading test FAILED!")
        print("Please check the error messages above.")
    print(f"{'='*50}")