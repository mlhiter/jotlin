# Jotlin AI Agent Server (FastAPI + LangGraph)

This is a Python FastAPI backend that provides AI-powered multi-agent requirement generation capabilities for the Jotlin application.

## Features

- **AI Chat Integration**: Compatible with existing Jotlin chat interface
- **Multi-Agent Requirement Generation**: Uses LangGraph to orchestrate multiple AI agents for comprehensive requirement analysis
- **Document Generation**: Generates structured requirement documents that can be saved in Jotlin
- **Streaming Responses**: Real-time AI response streaming
- **Modular Architecture**: Focused on AI operations, minimal database dependencies

## Architecture

### AI Agents

- **InterviewerAgent**: Conducts requirement interviews with simulated users
- **EndUserAgent**: Simulates different types of end users
- **AnalystAgent**: Analyzes requirements and creates system specifications

### LangGraph Workflow

1. Initialize process and identify user types
2. Conduct simulated interviews with multiple user personas
3. Analyze requirements and generate system specifications
4. Create comprehensive documentation
5. Format results for frontend consumption

### Generated Documents

- Interview Record
- User Requirements
- System Requirements
- Use Case Model (PlantUML)
- Software Requirements Specification (SRS)

## Setup

1. **Install Dependencies**

   ```bash
   cd agent-server/fastapi
   pip install -r requirements.txt
   ```

2. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required Environment Variables**

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/jotlin
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_BASE_URL=https://api.openai.com/v1
   CORS_ORIGINS=http://localhost:3000
   SECRET_KEY=your_secret_key_here
   ```

4. **Run the Server**
   ```bash
   python run.py
   ```
   The server will start on `http://localhost:8000`

## API Endpoints

### Chat Endpoints

- `POST /api/chats/{chat_id}/ai-response` - Get AI response
- `POST /api/chats/{chat_id}/stream` - Stream AI response
- `POST /api/chats/create` - Create new chat
- `GET /api/chats/list` - List user chats
- `GET /api/chats/{chat_id}` - Get chat details

### Requirement Generation Endpoints

- `POST /api/requirements/generate` - Start requirement generation
- `POST /api/requirements/generate-from-chat` - Generate from chat interface
- `GET /api/requirements/status/{task_id}` - Get generation status
- `GET /api/requirements/result/{task_id}` - Get generated documents

## Integration with Frontend

The Python backend is designed to work seamlessly with the existing Next.js frontend:

1. **Chat Integration**: Use the same chat interface to trigger requirement generation
2. **Document Creation**: Generated documents are formatted to be compatible with Jotlin's document structure
3. **Progress Tracking**: Real-time status updates during the generation process

### Frontend Integration Example

```typescript
// Trigger requirement generation from chat
const response = await fetch('/api/requirements/generate-from-chat', {
  method: 'POST',
  body: JSON.stringify({
    initial_requirements: 'I want to build a blog website',
  }),
})

const { task_id } = await response.json()

// Poll for status
const statusResponse = await fetch(`/api/requirements/status/${task_id}`)
const status = await statusResponse.json()

// Get formatted results when complete
if (status.status === 'completed') {
  const resultsResponse = await fetch(`/api/requirements/result/${task_id}?formatted=true`)
  const { documents } = await resultsResponse.json()

  // Each document can be saved to Jotlin
  documents.forEach((doc) => {
    // Save as new document in Jotlin
    createDocument(doc.title, doc.content)
  })
}
```

## Development

The backend is designed to be:

- **AI-focused**: Minimal database operations, maximum AI processing
- **Stateless**: Uses in-memory task storage for simplicity
- **Modular**: Easy to extend with additional agents or workflows
- **Compatible**: Works with existing Jotlin architecture

## API Documentation

When running, visit `http://localhost:8000/docs` for interactive API documentation.
