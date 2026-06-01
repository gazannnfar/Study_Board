# EduKanban

EduKanban — MVP SPA-приложения для учебных групп: канбан-доска, роли, дедлайны, комментарии, уведомления, KPI-аналитика и AI-помощник с заменяемым сервисным интерфейсом.

## Стек

- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand, `@dnd-kit/core`
- Backend: Node.js, Express, TypeScript, REST API, JWT, RBAC, Zod
- Database: PostgreSQL, Prisma ORM
- Infra: Docker Compose для локальной PostgreSQL

## Архитектура

```text
EduKanban
├─ apps
│  ├─ api
│  │  ├─ prisma
│  │  │  ├─ schema.prisma
│  │  │  └─ seed.ts
│  │  └─ src
│  │     ├─ config
│  │     ├─ lib
│  │     ├─ middleware
│  │     ├─ modules
│  │     │  ├─ ai
│  │     │  ├─ analytics
│  │     │  ├─ auth
│  │     │  ├─ groups
│  │     │  ├─ notifications
│  │     │  ├─ rbac
│  │     │  ├─ tasks
│  │     │  └─ users
│  │     ├─ app.ts
│  │     ├─ routes.ts
│  │     └─ server.ts
│  └─ web
│     └─ src
│        ├─ components
│        ├─ lib
│        ├─ store
│        ├─ App.tsx
│        └─ main.tsx
├─ docker-compose.yml
├─ package.json
└─ README.md
```

Backend построен модульно: маршруты принимают HTTP-запросы, middleware отвечает за JWT/RBAC/валидацию, сервисы работают с бизнес-логикой и Prisma. Frontend хранит auth и рабочие данные в Zustand, а REST client изолирован в `apps/web/src/lib/api.ts`.

## Сущности БД

- `User`: пользователь, роль, активность, группа, lastLogin
- `Group`: учебная группа, преподаватель, участники
- `Project`: учебный проект внутри группы
- `Task`: задача, статус, приоритет, дедлайн, теги, оценка, исполнитель
- `Comment`: обсуждение задачи, опциональная оценка преподавателя
- `Notification`: уведомления о назначениях, комментариях и дедлайнах
- `SatisfactionVote`: простая оценка удовлетворенности

## Роли

- `STUDENT`: создает задачи, выполняет назначенные, меняет статус своих задач
- `STAROSTA`: распределяет задачи внутри группы, следит за сроками
- `TEACHER`: видит прогресс групп, комментирует и выставляет оценку
- `PROJECT_MANAGER`: видит группы и управляет задачами проектов
- `TEAM_LEAD`: управляет задачами команды внутри проекта
- `ADMIN`: управляет пользователями, ролями и активностью

## API

Базовый URL: `http://localhost:4000/api`

- `POST /auth/login`
- `GET /auth/me`
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `GET /groups`
- `POST /groups`
- `PATCH /groups/:id`
- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `POST /tasks/:id/comments`
- `GET /analytics/overview`
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `POST /ai/task-suggestions`
- `POST /ai/deadline-reminder`

## Локальный запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать env-файлы:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

PowerShell-вариант:

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

3. Запустить PostgreSQL:

```bash
docker compose up -d postgres
```

4. Подготовить БД и демо-данные:

```bash
npm run db:migrate
npm run db:seed
```

5. Запустить приложение:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000/api/health`

## Тестовые аккаунты

Пароль у всех: `password123`

| Роль | Email |
| --- | --- |
| Admin | `admin@edukanban.local` |
| Teacher | `teacher@edukanban.local` |
| Project Manager | `pm@edukanban.local` |
| Team Lead | `lead@edukanban.local` |
| Starosta | `starosta@edukanban.local` |
| Student | `student@edukanban.local` |
| Student 2 | `student2@edukanban.local` |
| Data Starosta | `data-starosta@edukanban.local` |
| Data Student | `data-student@edukanban.local` |

## Демо-данные

Seed создает две учебные группы:

- `WEB-22`: проект `EduKanban MVP`, задачи по backend, frontend, README, QA и демонстрации.
- `DATA-21`: проект `Learning Analytics Dashboard`, задачи по датасету, KPI и исследовательским выводам.

Также создаются комментарии, уведомления, оценки и satisfaction votes для аналитики.

## KPI

`GET /analytics/overview` возвращает:

- процент задач, выполненных в срок
- количество активных пользователей
- среднее время закрытия задачи
- количество просроченных задач
- долю задач по статусам
- среднюю оценку удовлетворенности пользователей

## AI-помощник

AI слой находится в `apps/api/src/modules/ai/ai.service.ts`.

Сейчас используется `RuleBasedAiAssistant`: он генерирует название, улучшает описание, предлагает приоритет, теги и текст напоминания о дедлайне. Интерфейс `AiAssistantService` можно заменить реальным OpenAI/другим API без изменения frontend-контракта.

## Тесты

```bash
npm test
```

Покрыты ключевые RBAC-права и fallback-логика AI-помощника.

## Деплой

- Frontend: Vercel, переменная `VITE_API_URL=https://your-api.example.com/api`
- Backend: Railway/Render, переменные из `apps/api/.env.example`
- Database: managed PostgreSQL, `DATABASE_URL` в backend environment

Для production рекомендуется использовать `npm --workspace apps/api run db:deploy` после генерации Prisma migrations.

## Git Flow

Рекомендуемый процесс:

- `main`: стабильная версия для защиты
- `develop`: интеграционная ветка
- `feature/*`: отдельные функции
- `fix/*`: исправления
- Pull Request с проверкой `npm run build` и `npm test`
