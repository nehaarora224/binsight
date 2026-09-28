# Binsight — AI-assisted smart waste collection

A field-service app for municipal sanitation workers. Workers see today's collection route, capture an image of a waste point, get an automatic assessment (waste level, category, priority), and submit a report that updates the collection status.

- **frontend/**: React + Vite mobile web app (Leaflet + OpenStreetMap for the route map)
- **backend/**: Node.js + Express REST API with a MySQL database

## Quick start

Requirements: Node.js 22+, and MySQL 8 (or Docker).

```sh
# 1. Start MySQL (or use your own server and edit backend/.env)
docker compose up -d mysql

# 2. Install everything
npm run install:all
cp backend/.env.example backend/.env

# 3. Run the API (port 4000) and the web app (port 5173) together
npm run dev
```

Open http://localhost:5173. On first start the backend creates the `binsight` database and loads the sample data for Ward 12 · West Delhi.

To test on a phone, open the dev server's network URL on a device on the same Wi-Fi. The camera and GPS need HTTPS on phones, except on `localhost`.

### Production build

```sh
npm run build   # builds frontend/dist
npm start       # the API serves the built app at http://localhost:4000
```

### Other commands

| Command | What it does |
|---|---|
| `npm test` | Backend API tests. Uses a separate `binsight_test` database. |
| `npm run db:reset` | Drops and recreates the database with fresh sample data. |

## How it works

1. **Home** shows today's counts, the route summary and the next collection point (high-priority points first).
2. **Report**: *Take photo* opens the camera. The image is uploaded to `POST /api/assessments` together with the GPS position. The backend picks the nearest collection point (within 150 m, otherwise the next point on the route) and runs the assessment.
3. **Submit** calls `POST /api/reports`. This creates report `WS-0xxxx` and marks the point as completed, so Home and Route update.
4. **Route** shows the points on a map. *Start route* and *End route* are saved on the server.

### AI assessment

`backend/src/assess.js` is where the model plugs in. If `AI_SERVICE_URL` is set, the image is posted to `<AI_SERVICE_URL>/assess` as multipart field `image`, and the service must reply:

```json
{ "level": "LOW | MEDIUM | HIGH | OVERFLOW", "category": "MIXED | ORGANIC | PLASTIC | DRY" }
```

Priority and the recommended action are derived from the level. Without a model service, a rule-based stand-in uses the point's last recorded fill level and category, and marks the result `"source": "rules"`.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Worker, route summary, counts, next point |
| GET | `/api/route` | Route with all collection points |
| POST | `/api/route/start` · `/api/route/end` | Start or end today's route |
| GET | `/api/reports` | The worker's reports, newest first |
| POST | `/api/assessments` | Multipart: `image`, optional `pointId`, `lat`, `lng`, `accuracy` |
| POST | `/api/reports` | JSON `{ "assessmentId": "…" }` |

## Database

Tables: `workers`, `routes`, `collection_points`, `assessments`, `reports` (see `backend/src/schema.js`). Uploaded images are stored in `backend/uploads/`.

## Prototype limits

- There is no login: the app acts as worker `SW-1142` (`WORKER_ID` in `.env`). *Log out*, *Helpline* and *How to report* are placeholders.
- The assessment is the rule-based stand-in until a trained model service is connected.
- The map tiles come from OpenStreetMap and need an internet connection.
