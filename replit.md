# Forge Vantis Mission Control

## Overview

Forge Vantis Mission Control is a project management and mission control dashboard built as a full-stack web application. It provides comprehensive project tracking, use case management, workflow analysis, task tracking, risk assessment, stakeholder management, and event logging capabilities. The application follows a modern monorepo structure with a clear separation between client, server, and shared code.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built using **React** with **TypeScript** and follows a component-based architecture:

- **UI Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management with aggressive caching strategies (staleTime: Infinity, no refetch on window focus)
- **Styling**: Tailwind CSS with custom theme configuration using CSS variables, implementing a design system with shadcn/ui components
- **Component Library**: Radix UI primitives wrapped with custom styling for accessibility and consistency
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

**Design Decisions**:
- Component reusability through shadcn/ui pattern (components are copied into the project for full control)
- Centralized API client with typed responses for all backend communication
- Toast notifications for user feedback
- Responsive design with mobile-first approach using Tailwind breakpoints

### Backend Architecture

The backend is built using **Express.js** with **TypeScript**:

- **Framework**: Express.js for HTTP server with middleware-based architecture
- **Database ORM**: Drizzle ORM for type-safe database queries
- **Database**: PostgreSQL via Neon serverless driver with WebSocket support
- **Validation**: Zod schemas shared between frontend and backend for consistent validation
- **API Design**: RESTful API with CRUD operations for all entities
- **Logging**: Custom request/response logging middleware for debugging

**AI Integration**:
- VANTIS Companion: AI assistant for project guidance using OpenAI gpt-4o
- Event Analysis: AI-powered extraction of insights from meeting/email transcripts
- Opportunity Suggestions: AI identifies potential new engagements from transcripts, creates PENDING suggestions that require user approval before becoming proposals
- Centralized system prompts in `server/ai/` directory

**Design Decisions**:
- Shared schema definitions between client and server to ensure type consistency
- Middleware pattern for request processing and logging
- Separation of concerns with dedicated storage layer abstracting database operations
- Development vs. production environment handling with conditional Vite middleware

### Data Storage Solutions

**Database**: PostgreSQL (via Neon serverless)
- **Schema Design**: 
  - Projects as the top-level entity
  - Use Cases linked to projects
  - Workflow Segments can belong to projects and optionally to use cases
  - Tasks, Risks, Stakeholders, and Events all linked to projects
  - Readiness Scores for tracking project progress
  - Deliverables with Milestones and Activities for orchestration
  - Engagement Insights and Opportunity Seeds for AI-generated intelligence
  - Opportunity Suggestions (PENDING/APPROVED/REJECTED) for AI-identified new engagements requiring user approval
  - Extensive use of enums for status fields to ensure data consistency
  
**Schema Management**:
- Drizzle Kit for schema migrations
- Schema defined in TypeScript for type safety
- Automatic UUID generation for primary keys
- Cascade deletions to maintain referential integrity
- Timestamps for created/updated tracking

**Design Decisions**:
- Drizzle ORM chosen for its TypeScript-first approach and minimal runtime overhead
- Neon serverless driver for serverless-friendly database connections with WebSocket support
- Foreign key constraints with cascade deletes to prevent orphaned records
- Enums for standardized status values across the application

### Build and Deployment

**Build Process**:
- Client: Vite builds React application to `dist/public`
- Server: esbuild bundles server code to `dist/index.cjs` with selective bundling
- Allowlist of dependencies bundled to reduce cold start times (reduces openat syscalls)
- Custom build script coordinates both builds

**Development Environment**:
- Vite dev server with HMR for client
- tsx for running TypeScript server directly
- Conditional Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)
- Custom meta images plugin for dynamic OpenGraph image URL handling

**Design Decisions**:
- Monorepo structure with shared types and schemas
- Single npm script orchestrates both builds
- Path aliases for clean imports (@/, @shared/, @assets/)
- Separate development and production server configurations

## External Dependencies

### Third-Party Services

**Database**: 
- Neon PostgreSQL serverless database
- Requires `DATABASE_URL` environment variable
- WebSocket connection support for serverless environments

### Key Libraries

**Frontend**:
- React and React DOM for UI rendering
- TanStack Query for data fetching and caching
- Radix UI for accessible component primitives
- Wouter for routing
- React Hook Form + Zod for form validation
- date-fns for date formatting

**Backend**:
- Express.js for HTTP server
- Drizzle ORM for database operations
- Zod for runtime validation
- ws (WebSocket) for Neon database connections
- OpenAI SDK with Replit AI Integrations for VANTIS Companion

**Development Tools**:
- Vite for frontend development and building
- esbuild for server bundling
- TypeScript for type checking
- Tailwind CSS for styling
- Replit-specific plugins for development experience

**Design Decisions**:
- Minimal external dependencies to reduce bundle size and complexity
- Type-safe libraries preferred (TypeScript-first approach)
- Serverless-compatible dependencies for cloud deployment
- Shared validation logic between frontend and backend using Zod schemas