# Chat AI

A full-stack AI chat application with a Vue 3 and TypeScript frontend and an Express/TypeScript API. The API generates replies with Google Gemini, stores users and conversations in PostgreSQL on Neon through Drizzle ORM, and mirrors AI messages to Stream Chat.

## Live application

- **Frontend:** [https://chat-bot-beta-seven.vercel.app](https://chat-bot-beta-seven.vercel.app)
- **Backend API:** [https://chat-ai-api-fr0y.onrender.com](https://chat-ai-api-fr0y.onrender.com)

## Features

- Register with a name and email, then start chatting.
- Generate AI responses using Google Gemini.
- Persist user records and chat history in Neon PostgreSQL.
- Use up to the ten most recent stored exchanges as context for a new AI response.
- Keep the user session in browser storage with Pinia persisted state.
- Create a per-user Stream Chat channel and publish AI responses there.

## Project structure

```text
.
├── README.md
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts       # Neon connection and Drizzle client
│   │   ├── db/
│   │   │   └── schema.ts         # PostgreSQL users and chats tables
│   │   └── server.ts             # Express app and API endpoints
│   ├── migrations/               # Generated SQL migrations and snapshots
│   ├── drizzle.config.ts         # Drizzle Kit configuration
│   ├── package.json
│   └── tsconfig.json
└── chat-ai-ui/
    ├── public/                   # Static assets and favicon
    ├── router/
    │   └── index.ts              # Home and chat routes
    ├── src/
    │   ├── assets/               # UI images
    │   ├── components/
    │   │   ├── ChatInput.vue      # Message input
    │   │   └── Header.vue         # Chat header and logout
    │   ├── stores/
    │   │   ├── chat.ts            # Send messages and load history
    │   │   └── user.ts            # Persisted user state
    │   ├── views/
    │   │   ├── HomeView.vue       # Name/email registration screen
    │   │   └── ChatView.vue       # Conversation screen
    │   ├── App.vue
    │   ├── main.ts                # Vue app initialization
    │   └── style.css
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

## Technology stack

### Frontend

- Vue 3, TypeScript, Vite
- Vue Router
- Pinia with persisted state
- Axios
- Tailwind CSS 4

### Backend and data

- Node.js, Express 5, TypeScript
- **PostgreSQL** hosted by **Neon** using `@neondatabase/serverless`
- **Drizzle ORM** for database queries and schema definitions; Drizzle Kit manages migrations
- Google Gemini via `@google/genai`
- Stream Chat via `stream-chat`

## How it works

1. The home screen submits the user's name and email to `POST /register-user`.
2. The API normalizes the email into a user ID, upserts the user in Stream Chat, and inserts the user into PostgreSQL if they are new.
3. The chat screen loads previous messages from `POST /get-messages`.
4. When the user sends a message to `POST /chat`, the API checks the registered user, loads up to ten prior exchanges, asks Gemini for a response, saves the exchange in PostgreSQL, and sends the AI reply to that user's Stream Chat channel.
5. The frontend displays the reply and keeps the user ID and name in persisted Pinia state.

## API endpoints

All endpoints accept and return JSON.

| Method | Path | Request body | Success response |
| --- | --- | --- | --- |
| `POST` | `/register-user` | `{ "name": "…", "email": "…" }` | `{ "userId": "…", "name": "…", "email": "…" }` |
| `POST` | `/chat` | `{ "message": "…", "userId": "…" }` | `{ "reply": "…" }` |
| `POST` | `/get-messages` | `{ "userId": "…" }` | `{ "message": [{ "message": "…", "reply": "…", "createdAt": "…" }] }` |

The API listens on `PORT` when set, or port `5000` by default. CORS is enabled for browser requests.

## Local development

Use Node.js and npm. Install and run the frontend and backend in separate terminals.

### 1. Configure the backend

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require
GEMINI_API_KEY=<your-gemini-api-key>
STREAM_API_KEY=<your-stream-api-key>
STREAM_API_SECRET=<your-stream-api-secret>
```

`DATABASE_URL` should be the connection string for your Neon PostgreSQL database. The Gemini and Stream credentials are used by the API and must not be exposed in frontend environment variables.

Install dependencies, apply the checked-in Drizzle migrations, and start the API:

```bash
cd backend
npm install
npx drizzle-kit migrate
npm run dev
```

For a production build and start:

```bash
npm run build
npm start
```

### 2. Configure the frontend

Create `chat-ai-ui/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Install dependencies and start Vite:

```bash
cd chat-ai-ui
npm install
npm run dev
```

Open the local URL printed by Vite. For a production frontend build, set `VITE_API_URL` to the deployed API base URL and run:

```bash
npm run build
npm run preview
```

## Database schema

The Drizzle schema defines two PostgreSQL tables:

- `users`: `user_id` (primary key), `name`, `email`, and `created_at`.
- `chats`: identity `id`, `user_id`, user `message`, AI `reply`, and `created_at`.

Migration files and Drizzle Kit snapshots are stored under `backend/migrations/`. The application uses the schema in `backend/src/db/schema.ts`.

## Deployment configuration

- Set the Vercel frontend environment variable `VITE_API_URL` to `https://chat-ai-api-fr0y.onrender.com` before building.
- Set `DATABASE_URL`, `GEMINI_API_KEY`, `STREAM_API_KEY`, and `STREAM_API_SECRET` in the backend hosting environment. `PORT` is supplied by many hosting platforms; the server also defaults to `5000`.
- Apply database migrations to the Neon database before serving traffic.

## npm scripts

| Package | Command | Description |
| --- | --- | --- |
| `backend` | `npm run dev` | Type-check and run the API with `tsx` watch mode |
| `backend` | `npm run build` | Compile TypeScript to `backend/dist` |
| `backend` | `npm start` | Run the compiled API |
| `chat-ai-ui` | `npm run dev` | Start the Vite development server |
| `chat-ai-ui` | `npm run build` | Type-check and build frontend assets |
| `chat-ai-ui` | `npm run preview` | Preview the production frontend build |

## License

This project is licensed under the MIT License (see the backend package metadata).
