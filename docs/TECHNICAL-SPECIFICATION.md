# Technical Specification

## Functional Requirements

- JWT login and role-based access.
- Kanban board with CRUD tasks and drag-and-drop status changes.
- Task fields: status, priority, assignee, deadline, tags, comments, grade, PERT estimates and planned work slot.
- Schedule module: lessons, weekday, start/end time, teacher, group, room, lesson type, topic.
- Import schedule from JSON or CSV.
- Planning module: busy time analysis, free slot calculation, task recommendations and slot assignment.
- AI assistant modes: `AI_STRICT` and `AI_LIGHT`.
- Analytics: task KPI, schedule load and PERT summary.

## Non-Functional Requirements

- React + TypeScript SPA.
- Node.js + Express REST API.
- PostgreSQL with Prisma.
- Zod validation.
- Clear module structure.
- Local launch through npm scripts and Docker Compose.

## API Style

REST JSON API under `/api`. Errors return `{ error, message }`.
