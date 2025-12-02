# FORGE VANTIS – Mission Control

A project management and mission control dashboard for managing the VANTIS Activation Graph. Built with a modern full-stack TypeScript architecture.

## Overview

FORGE VANTIS Mission Control is a comprehensive project tracking platform designed for complex multi-phase initiatives. It provides:

- **Project Dashboard**: Overview of all projects with phase tracking and readiness scores
- **Use Case Management**: Track business use cases linked to projects
- **Task Tracking**: Full task lifecycle management with priority, status, and assignee tracking
- **Risk Assessment**: Identify and monitor project risks with severity levels
- **Stakeholder Management**: Track project stakeholders and their roles
- **Activity Feed**: Real-time event logging for project activities
- **Weekly Status Reports**: Generate status reports with timesheet drafts for time tracking
- **Roadmap View**: Timeline visualization of tasks with start and end dates
- **AI Companion** (Placeholder): Chat interface ready for AI integration

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** with shadcn/ui components
- **Radix UI** for accessible primitives
- **React Hook Form + Zod** for form validation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for type-safe database queries
- **PostgreSQL** (Neon serverless) for data persistence
- **Zod** for runtime validation

### Build Tools
- **Vite** for development and frontend builds
- **esbuild** for server bundling
- **TypeScript** throughout

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Neon serverless account)

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your database URL in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

### Installation

```bash
# Install dependencies
npm install
```

### Database Setup

Run database migrations using Drizzle:

```bash
# Push schema to database
npm run db:push
```

This applies the schema defined in `shared/schema.ts` to your PostgreSQL database.

### Running the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev
```

The application will be available at `http://localhost:5000`.

### Build for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and API client
│   │   └── pages/       # Page components
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   └── vite.ts          # Vite middleware for dev
├── shared/              # Shared code
│   └── schema.ts        # Database schema & types
└── drizzle.config.ts    # Drizzle ORM configuration
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Use Cases
- `GET /api/projects/:id/usecases` - List use cases for a project
- `POST /api/usecases` - Create a use case

### Tasks
- `GET /api/projects/:id/tasks` - List tasks for a project
- `POST /api/tasks` - Create a task
- `GET /api/projects/:id/roadmap` - Get tasks grouped by weeks for roadmap view

### Events
- `GET /api/projects/:id/events` - List events for a project
- `POST /api/events/file` - Log a file event
- `POST /api/events/email` - Log an email event
- `POST /api/events/meeting` - Log a meeting event

### AI Companion (Placeholder)
- `POST /api/ai/companion` - Send message to AI companion

### Status Reports
- `GET /api/projects/:id/status-report` - Generate weekly status report
- `GET /api/projects/:id/timesheet` - Get timesheet draft

## AI Integration Point

The AI Companion feature is designed as a placeholder for future AI integration. To add real AI capabilities:

### Location
`server/routes.ts` - Look for the `/api/ai/companion` endpoint (around line 420)

### Current Implementation
```typescript
app.post("/api/ai/companion", async (req, res) => {
  const { message, projectId } = req.body;
  // Currently returns a placeholder response
  res.json({
    response: "AI Companion feature coming soon...",
    suggestions: []
  });
});
```

### To Integrate Google AI Studio

1. Add your API key to `.env`:
   ```
   GOOGLE_AI_API_KEY=your_api_key
   ```

2. Install the Google AI SDK:
   ```bash
   npm install @google/generative-ai
   ```

3. Replace the placeholder with real AI calls:
   ```typescript
   import { GoogleGenerativeAI } from "@google/generative-ai";
   
   const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
   const model = genAI.getGenerativeModel({ model: "gemini-pro" });
   
   app.post("/api/ai/companion", async (req, res) => {
     const { message, projectId } = req.body;
     const project = await storage.getProject(projectId);
     
     const prompt = `You are an AI assistant for project "${project?.name}". 
       Help with project management tasks. User message: ${message}`;
     
     const result = await model.generateContent(prompt);
     res.json({ response: result.response.text() });
   });
   ```

### To Integrate OpenAI

1. Add your API key to `.env`:
   ```
   OPENAI_API_KEY=your_api_key
   ```

2. Install the OpenAI SDK:
   ```bash
   npm install openai
   ```

3. Replace the placeholder accordingly.

## Next Steps

### 1. macOS File Events Integration

To automatically log file changes in a watched directory:

- Use `chokidar` or `fs.watch` to monitor a directory
- Call `POST /api/events/file` when files are created, modified, or deleted
- Configure `FILE_WATCH_PATH` in your environment

Example implementation:
```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch(process.env.FILE_WATCH_PATH);
watcher.on('all', (event, path) => {
  fetch('/api/events/file', {
    method: 'POST',
    body: JSON.stringify({ eventType: event, filePath: path, projectId: '...' })
  });
});
```

### 2. Microsoft Graph / Outlook Integration

To sync with Outlook calendar and email:

1. Register an application in Azure Portal
2. Configure OAuth 2.0 credentials in `.env`
3. Use Microsoft Graph API to:
   - Fetch calendar events → `POST /api/events/meeting`
   - Fetch relevant emails → `POST /api/events/email`
   - Sync tasks with Outlook Tasks/To-Do

Resources:
- [Microsoft Graph Quick Start](https://docs.microsoft.com/en-us/graph/quick-start)
- [Calendar API Reference](https://docs.microsoft.com/en-us/graph/api/resources/calendar)

### 3. Real AI Companion

Replace the placeholder AI endpoint with:
- **Google AI Studio (Gemini)** for conversational AI
- **OpenAI GPT-4** for advanced reasoning
- Add context about the current project, tasks, and risks
- Implement suggested actions based on project state

### 4. Enhanced Roadmap

Potential improvements:
- Drag-and-drop task scheduling
- Dependency visualization between tasks
- Resource allocation view
- Critical path highlighting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
