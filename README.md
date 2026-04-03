# Naviseerr Client

React-based music search and download client with Spotify-inspired UI.

## Features

- Search for songs, albums, and artists
- Filter results by category (All, Songs, Albums, Artists)
- Download songs with 30-second cooldown
- Responsive design for mobile and desktop
- Docker deployment

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Docker

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Start dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173

### Environment Variables

- `VITE_API_URL` - Backend API base URL (default: `http://localhost:8080`)

## Production

### Build

```bash
npm run build
```

Output: `dist/`

### Docker

Build and run:

```bash
docker-compose up --build
```

Access: http://localhost:3000

### Environment Configuration

Override API URL:

```bash
API_URL=http://your-backend:8080 docker-compose up
```

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # React components
│   ├── ui/           # shadcn components
│   └── *.tsx         # Custom components
├── lib/              # Utilities
├── App.tsx           # Main app
└── main.tsx          # Entry point
```

## Backend API

Expected endpoints:

- `GET /search/{query}` - Search all
- `GET /search/{query}/songs` - Search songs only (future)
- `GET /search/{query}/albums` - Search albums only (future)
- `GET /search/{query}/artists` - Search artists only (future)
- `GET /download/{songId}` - Trigger download

## License

MIT
