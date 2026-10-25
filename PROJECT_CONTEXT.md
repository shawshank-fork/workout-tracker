# Workout Tracker — Project Context for LLMs

> **Purpose of this file:** This document is a comprehensive reference for AI/LLM models working on this codebase. It explains the architecture, every file's role, the data model, API surface, frontend state management, and how the pieces connect. Read this first before making any changes.

---

## 1. High-Level Overview

This is a **full-stack workout tracking application** with a clear client/server split:

| Layer    | Tech Stack                                        | Port  |
|----------|---------------------------------------------------|-------|
| Frontend | React 19 + Vite 8 (JSX, no TypeScript)            | 5173  |
| Backend  | Express 5 (ES Modules) + Prisma 7 ORM             | 5000  |
| Database | PostgreSQL (hosted on Prisma Postgres / cloud)     | —     |

**What the app does:** Users create named workouts (e.g., "Chest Day"), add exercises to each workout (e.g., "Bench Press"), and log sets with weight (kg) and reps for each exercise. Full CRUD is supported at every level.

---

## 2. Project Directory Structure

```
workout_tracker/
├── client/                        # React frontend (Vite)
│   ├── index.html                 # HTML entry point — mounts React at #root
│   ├── vite.config.js             # Vite config — React plugin only
│   ├── package.json               # Dependencies: react, react-dom, vite, eslint
│   ├── public/                    # Static assets (favicon, etc.)
│   └── src/
│       ├── main.jsx               # React entry — renders <App /> inside StrictMode
│       ├── App.jsx                # ** MAIN COMPONENT ** — all app logic lives here
│       ├── App.css                # Styles (mostly leftover Vite scaffold CSS)
│       ├── index.css              # Global base styles
│       ├── api/
│       │   └── workoutApi.js      # All HTTP fetch functions (API client layer)
│       ├── components/
│       │   └── WorkoutCard.jsx    # Reusable card component for displaying a workout
│       └── assets/                # Static assets (images, SVGs)
│
├── server/                        # Express backend
│   ├── server.js                  # ** MAIN SERVER FILE ** — all routes defined here
│   ├── package.json               # Dependencies: express, cors, prisma, pg
│   ├── .env                       # DATABASE_URL for PostgreSQL connection
│   ├── prisma7.config.ts          # Prisma 7 config — points to schema & migrations
│   ├── lib/
│   │   └── prisma.js              # Prisma client singleton (uses PrismaPg adapter)
│   ├── prisma/
│   │   ├── schema.prisma          # ** DATABASE SCHEMA ** — 3 models
│   │   └── migrations/            # Migration history
│   │       ├── 20260827071453_init/
│   │       └── 20260901055947_add_exercises_and_sets/
│   └── generated/
│       └── prisma/                # Auto-generated Prisma client (do NOT edit)
│
└── .git/                          # Git repository
```

---

## 3. Database Schema (Prisma)

**File:** `server/prisma/schema.prisma`

Three models with a hierarchical one-to-many relationship chain:

```
Workout (1) ──→ (many) Exercise (1) ──→ (many) Set
```

### Model Details

```prisma
model Workout {
  id        Int        @id @default(autoincrement())
  name      String                                    // e.g., "Leg Day"
  date      DateTime                                  // workout date
  createdAt DateTime   @default(now())                // auto-set on creation
  exercises Exercise[]                                // has many exercises
}

model Exercise {
  id        Int      @id @default(autoincrement())
  name      String                                    // e.g., "Squat"
  workoutId Int                                       // FK → Workout.id
  workout   Workout  @relation(fields: [workoutId], references: [id])
  sets      Set[]                                     // has many sets
}

model Set {
  id         Int      @id @default(autoincrement())
  weight     Float                                    // weight in kg
  reps       Int                                      // number of reps
  exerciseId Int                                      // FK → Exercise.id
  exercise   Exercise @relation(fields: [exerciseId], references: [id])
}
```

### Key Notes
- **No cascade deletes are configured.** Deleting a Workout that has Exercises will fail due to FK constraints. The frontend currently only deletes workouts that presumably have no children, but this is not enforced in the UI.
- **IDs are auto-incrementing integers**, not UUIDs.
- The database is **PostgreSQL** connected via the `@prisma/adapter-pg` driver adapter (Prisma 7 style).

---

## 4. Backend API (Express)

**File:** `server/server.js`  
**Base URL:** `http://localhost:5000`  
**All routes return JSON.**

### Workout Routes

| Method | Endpoint              | Request Body          | Description                                      |
|--------|-----------------------|-----------------------|--------------------------------------------------|
| GET    | `/api/workouts`       | —                     | List all workouts (includes nested exercises)    |
| POST   | `/api/workouts`       | `{ name, date }`      | Create a new workout                             |
| PUT    | `/api/workouts/:id`   | `{ name, date }`      | Update workout name and/or date                  |
| DELETE | `/api/workouts/:id`   | —                     | Delete a workout by ID                           |

### Exercise Routes

| Method | Endpoint                                  | Request Body   | Description                              |
|--------|-------------------------------------------|----------------|------------------------------------------|
| GET    | `/api/workouts/:workoutId/exercises`      | —              | List exercises for a given workout       |
| POST   | `/api/workouts/:workoutId/exercises`      | `{ name }`     | Add an exercise to a workout             |
| DELETE | `/api/exercises/:id`                      | —              | Delete an exercise and its sets          |

### Set Routes

| Method | Endpoint                              | Request Body          | Description                       |
|--------|---------------------------------------|-----------------------|-----------------------------------|
| GET    | `/api/exercises/:exerciseId/sets`     | —                     | List sets for a given exercise    |
| POST   | `/api/exercises/:exerciseId/sets`     | `{ weight, reps }`    | Add a set to an exercise          |
| PUT    | `/api/sets/:id`                       | `{ weight, reps }`    | Update a set's weight and reps    |
| DELETE | `/api/sets/:id`                       | —                     | Delete a set                      |

### Utility Routes

| Method | Endpoint        | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | `/`             | Health check — returns status message    |
| GET    | `/api/test-db`  | Tests DB connection by fetching workouts |

### Validation Rules (server-side)
- **Sets:** `weight` and `reps` are required and must be > 0 (checked on POST and PUT).
- **Workouts/Exercises:** No validation beyond what Prisma enforces (non-null fields).

### Error Handling Pattern
All routes follow the same try/catch pattern: success returns the resource as JSON; failure logs the error and returns `{ message: "..." }` with a 500 status.

---

## 5. Prisma Client Setup

**File:** `server/lib/prisma.js`

```javascript
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
```

- Uses the **Prisma 7 driver adapter** pattern (`PrismaPg`) instead of the older built-in connection.
- The generated client lives at `server/generated/prisma/` (configured via `output` in schema.prisma).
- `DATABASE_URL` is read from `server/.env`.

---

## 6. Frontend Architecture

### Entry Point Flow
```
index.html → main.jsx → <App /> (inside StrictMode)
```

### App.jsx — The Main Component

**File:** `client/src/App.jsx`

This is a **single-component app** — all logic, state, and UI live in `App.jsx`. There is no routing (no React Router).

#### State Variables

| State Variable    | Type           | Purpose                                                     |
|-------------------|----------------|-------------------------------------------------------------|
| `workouts`        | `Array`        | All workouts fetched from the API                           |
| `workoutName`     | `String`       | Controlled input for the "new workout" form                 |
| `selectedWorkout` | `Object\|null` | The currently selected workout (shows exercise panel)       |
| `exercises`       | `Array`        | Exercises belonging to the selected workout                 |
| `exerciseName`    | `String`       | Controlled input for the "new exercise" form                |
| `weights`         | `Object`       | Map of `{ [exerciseId]: inputValue }` for weight inputs     |
| `reps`            | `Object`       | Map of `{ [exerciseId]: inputValue }` for reps inputs       |
| `sets`            | `Array`        | All sets for all exercises in the selected workout (flat)   |
| `editingSetId`    | `Number\|null` | ID of the set currently being inline-edited                 |
| `setError`        | `Object`       | Map of `{ [exerciseId]: errorMessage }` for set validation  |
| `workoutError`    | `String`       | Error message for workout name validation                   |
| `exerciseError`   | `String`       | Error message for exercise name validation                  |

#### Key Handler Functions

| Function               | What It Does                                                              |
|------------------------|---------------------------------------------------------------------------|
| `addWorkout()`         | Creates a workout with today's date, appends to state                    |
| `handleDelete(id)`     | Deletes a workout, removes from state                                    |
| `handleSelectWorkout(workout)` | Sets selected workout, fetches its exercises + all their sets     |
| `handleAddExercise()`  | Creates exercise under selected workout, appends to state                |
| `handleAddSet(exerciseId, weight, reps)` | Validates, creates set, appends to state, clears inputs |
| `handleDeleteSet(id)`  | Deletes a set, removes from state                                        |
| `handleUpdateSet(id, weight, reps)` | Updates set on server, replaces in state, exits edit mode     |

#### UI Flow
1. **Main view:** Shows a list of `WorkoutCard` components + input to add a new workout.
2. **On clicking "View Exercises"** on a card: The exercise panel appears below showing exercises for that workout, with inputs to add new exercises and sets.
3. **Sets** are displayed as `"Set N: X kg x Y reps"` with Edit and Delete buttons.
4. **Inline editing:** Clicking "Edit" on a set swaps the text for input fields; clicking "Save" persists.

### WorkoutCard Component

**File:** `client/src/components/WorkoutCard.jsx`

A presentational component that receives props and renders:
- Workout name (`<h2>`)
- Formatted date (en-IN locale: "21 Sept 2026")
- "View Exercises" button → calls `onSelect({ id, name, date })`
- "Delete" button → calls `onDelete(id)`

```jsx
// Props: { id, name, date, onDelete, onSelect }
```

### API Client Layer

**File:** `client/src/api/workoutApi.js`

All HTTP communication is centralized here. Each function wraps a `fetch()` call:

| Function                         | HTTP Call                                         |
|----------------------------------|---------------------------------------------------|
| `getWorkouts()`                  | `GET /api/workouts`                               |
| `createWorkout(workout)`         | `POST /api/workouts`                              |
| `updateWorkout(id, workout)`     | `PUT /api/workouts/:id`                           |
| `deleteWorkout(id)`              | `DELETE /api/workouts/:id`                        |
| `getExercises(workoutId)`        | `GET /api/workouts/:workoutId/exercises`           |
| `createExercise(workoutId, ex)`  | `POST /api/workouts/:workoutId/exercises`          |
| `deleteExercise(id)`             | `DELETE /api/exercises/:id`                       |
| `createSet(exerciseId, set)`     | `POST /api/exercises/:exerciseId/sets`             |
| `getSets(exerciseId)`            | `GET /api/exercises/:exerciseId/sets`              |
| `deleteSet(id)`                  | `DELETE /api/sets/:id`                             |
| `updateSet(id, set)`             | `PUT /api/sets/:id`                                |

> **Note:** The base URL is hardcoded to `http://localhost:5000`. Workout-related functions use the `API_URL` constant; set-related functions use inline URLs. This inconsistency exists in the current codebase.

---

## 7. How to Run the Project

### Prerequisites
- Node.js (v18+)
- npm
- PostgreSQL database (a cloud-hosted Prisma Postgres URL is already in `.env`)

### Start the Backend
```bash
cd server
npm install
npx prisma generate        # Generate the Prisma client
node server.js              # Starts on http://localhost:5000
```

### Start the Frontend
```bash
cd client
npm install
npm run dev                 # Starts Vite dev server on http://localhost:5173
```

---

## 8. Known Issues & Quirks

1. **No cascade deletes:** Deleting a workout that has exercises (or an exercise that has sets) will throw a Prisma foreign key constraint error. The server returns a 500.
2. **No `updateWorkout` in the UI:** The `updateWorkout` API function exists in `workoutApi.js` and the PUT route exists on the server, but the frontend never calls it — there's no edit UI for workouts.
3. **Exercise deletion supported:** The `DELETE /api/exercises/:id` route safely deletes associated sets before removing the exercise.
4. **Hardcoded URLs:** The API base URL (`http://localhost:5000`) is hardcoded in the client. Some functions use the `API_URL` constant, others use inline strings.
5. **Styling:** The frontend uses custom Vanilla CSS variables and tokens matching the Stitch 'Kinetic Minimalist' design system with Google Fonts and Material Symbols.
6. **No loading/error states in UI:** API calls don't show spinners or error toasts to the user.
7. **All logic in App.jsx:** There's no state management library, no context, no custom hooks — everything is in one component.
8. **Date handling:** Workout date is auto-set to today via `new Date().toISOString().split("T")[0]` in the frontend; there's no date picker.
9. **No authentication/authorization:** The app is completely open — no user accounts.
10. **`updateWorkout` endpoint typo:** The error message in the PUT `/api/workouts/:id` route says "Failed to upate workout" (missing 'd').

---

## 9. Technology Versions

| Package              | Version  |
|----------------------|----------|
| React                | 19.2.8   |
| React DOM            | 19.2.8   |
| Vite                 | 8.2.2    |
| Express              | 5.2.1    |
| Prisma               | 7.10.0   |
| @prisma/client       | 7.10.0   |
| @prisma/adapter-pg   | 7.10.0   |
| pg                   | 8.23.0   |
| cors                 | 2.8.6    |

Both client and server use **ES Modules** (`"type": "module"` in package.json).

---

## 10. Quick Reference for Common Tasks

| Task                          | Where to Look                                    |
|-------------------------------|--------------------------------------------------|
| Add a new API route           | `server/server.js`                               |
| Add a new database model      | `server/prisma/schema.prisma` → then run `npx prisma migrate dev` |
| Add a new frontend API call   | `client/src/api/workoutApi.js`                   |
| Modify the main UI            | `client/src/App.jsx`                             |
| Add a new React component     | `client/src/components/`                         |
| Change DB connection          | `server/.env` → `DATABASE_URL`                   |
| Regenerate Prisma client      | `cd server && npx prisma generate`               |
