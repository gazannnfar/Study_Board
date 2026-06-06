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
- `ScheduleLesson`: реальные учебные пары, аудитория, преподаватель, тип занятия и тема

Задачи дополнительно поддерживают PERT-поля: `pertOptimisticHours`, `pertMostLikelyHours`, `pertPessimisticHours`, `pertExpectedHours`, а также локальное планирование через `scheduledStart`, `scheduledEnd` и связь с `ScheduleLesson`.

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
- `POST /ai/pert`
- `POST /ai/schedule-review`
- `GET /schedule`
- `POST /schedule`
- `POST /schedule/import`
- `DELETE /schedule/:id`
- `GET /planning/free-slots`
- `GET /planning/task-recommendations`
- `POST /planning/assign-slot`

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

Сейчас используется `RuleBasedAiAssistant`: он генерирует название, улучшает описание, предлагает приоритет, теги, текст напоминания о дедлайне и PERT-оценку. Интерфейс `AiAssistantService` можно заменить реальным OpenAI/другим API без изменения frontend-контракта.

Доступны две логические конфигурации:

- `AI_STRICT`: формальный режим для защиты, планирования и преподавателя. Возвращает PERT-формулу, риски, зависимости, подзадачи и осторожную оценку по свободным слотам.
- `AI_LIGHT`: быстрый режим для повседневной работы студента. Возвращает короткий практичный ответ, ожидаемое время и ближайшее действие.

PERT рассчитывается по формуле:

```text
expected = (optimistic + 4 * mostLikely + pessimistic) / 6
```

## Расписание и локальное планирование

Расписание загружается через `POST /api/schedule/import` в JSON или CSV.

CSV-шаблон:

```csv
startsAt,endsAt,teacherName,room,lessonType,subject,topic
2026-06-10T09:00:00.000Z,2026-06-10T10:30:00.000Z,Ирина Сергеевна,304,LECTURE,Проектирование ИС,PERT и планирование
```

Если расписание есть только на изображении: распознайте его OCR-инструментом или вручную перенесите в CSV/JSON по этому шаблону, затем загрузите через UI-панель "Импорт расписания" или API.

Планировщик использует:

- пары из `ScheduleLesson`;
- уже запланированные задачи;
- PERT expected или `estimatedHours`;
- дедлайны и приоритеты.

Он возвращает свободные окна и рекомендации задач через `/api/planning/free-slots` и `/api/planning/task-recommendations`.

## Тесты

```bash
npm test
```

Покрыты ключевые RBAC-права, fallback-логика AI-помощника, PERT-формула и различие strict/light режимов.

Статический анализ (ESLint) и проверка типов (tsc):

```bash
npm run lint       # ESLint по всему монорепо
npm run typecheck  # tsc --noEmit для apps/api и apps/web
```

## Артефакты для чек-листа

Сверка с чек-листом преподавателя находится в `docs/CHECKLIST-MAPPING.md`. В папке `docs` также лежат ТЗ, устав, RACI, риски, user stories, backlog, диаграммы, test report, deployment guide, release notes и план презентации.

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
