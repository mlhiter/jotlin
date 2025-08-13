from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import chats, requirements, chat_title

app = FastAPI(
    title="Jotlin AI Agent Server",
    description="FastAPI backend for Jotlin with LangGraph multi-agent system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(requirements.router, prefix="/api/requirements", tags=["requirements"])
app.include_router(chat_title.router, prefix="/api", tags=["chat-title"])


@app.get("/")
async def root():
    return {"message": "Jotlin AI Agent Server is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}