# 🎵 RecordStore

A modern music request management app similar to Jellyseer/Overseerr, but for music! Search for artists and albums using MusicBrainz, submit requests, and automatically add them to your Lidarr library.

## Features

- **🔍 Music Search**: Search for artists and albums using the MusicBrainz database
- **📀 Album Art**: Automatic cover art fetching from Cover Art Archive
- **📝 Request System**: Users can request artists or specific albums
- **👤 User Authentication**: Local account registration with role-based access
- **🛡️ Admin Dashboard**: Approve/reject requests, manage users
- **🎧 Lidarr Integration**: Automatically add approved requests to Lidarr
- **🌙 Dark Theme**: Beautiful dark UI inspired by Jellyseer

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- (Optional) Lidarr instance for automation

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/recordstore.git
cd recordstore
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `NEXTAUTH_SECRET`: A random secret for session encryption
- `NEXTAUTH_URL`: Your app URL (default: http://localhost:3000)

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker Deployment

The easiest way to deploy RecordStore is using Docker.

**Quick Start:**
```bash
# Clone the repository
git clone https://github.com/yourusername/recordstore.git
cd recordstore

# Set your secret (important for production!)
export NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Build and run
docker compose up -d
```

The app will be available at http://localhost:3000

**Environment Variables:**

Create a `.env` file or pass environment variables to Docker:

```bash
# Required
NEXTAUTH_SECRET=your-super-secret-key  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000      # Your app URL

# Optional - configure in the app's Settings page instead
# LIDARR_URL=http://your-lidarr:8686
# LIDARR_API_KEY=your-api-key
```

**Docker Compose with custom settings:**
```yaml
version: "3.8"
services:
  recordstore:
    image: recordstore:latest
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_SECRET=your-secure-secret-here
      - NEXTAUTH_URL=http://localhost:3000
    volumes:
      - recordstore_data:/app/data
    restart: unless-stopped

volumes:
  recordstore_data:
```

**Useful commands:**
```bash
# Build the image
docker compose build

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop the container
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

### First User Setup

The first user to register will automatically become an administrator. This admin can:
- Approve/reject music requests
- Configure Lidarr integration
- Manage all requests

## Configuration

### Lidarr Integration

1. Log in as an admin
2. Go to **Settings** → **Lidarr**
3. Enter your Lidarr URL (e.g., `http://localhost:8686`)
4. Enter your Lidarr API key (found in Lidarr → Settings → General)
5. Click "Test Connection"
6. Select your preferred root folder, quality profile, and metadata profile
7. Save settings

When you approve a request, RecordStore will automatically:
- Search for the artist in Lidarr
- Add them with your configured settings
- Start monitoring and searching for music

## Usage

### For Users

1. **Register/Login**: Create an account or sign in
2. **Search**: Use the search page to find artists or albums
3. **Browse**: Click on an artist to see their discography
4. **Request**: Click the + button to request an artist or album
5. **Track**: View your request status on the "My Requests" page

### For Admins

1. **Review**: Check pending requests in the Admin Dashboard
2. **Approve/Reject**: Use the action buttons to process requests
3. **Configure**: Set up Lidarr in Settings for automatic processing

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| GET | `/api/search/artist?q=` | Search artists |
| GET | `/api/search/album?q=` | Search albums |
| GET | `/api/artist/[id]` | Get artist details |
| POST | `/api/requests` | Create request |
| GET | `/api/requests` | Get user's requests |
| GET | `/api/admin/requests` | Get all requests (admin) |
| PATCH | `/api/admin/requests/[id]` | Update request status |
| GET/POST | `/api/settings/lidarr` | Lidarr configuration |

## Project Structure

```
recordstore/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Login/Register pages
│   │   ├── (dashboard)/       # Protected pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── layout/            # Layout components
│   │   ├── providers/         # Context providers
│   │   └── ui/                # UI components
│   ├── lib/                   # Utilities
│   │   ├── auth.ts            # Auth configuration
│   │   ├── lidarr.ts          # Lidarr API client
│   │   ├── musicbrainz.ts     # MusicBrainz API client
│   │   ├── prisma.ts          # Database client
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript types
└── .env                       # Environment variables
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [MusicBrainz](https://musicbrainz.org/) for their excellent music database
- [Cover Art Archive](https://coverartarchive.org/) for album artwork
- [Lidarr](https://lidarr.audio/) for music automation
- [Jellyseer](https://github.com/Fallenbagel/jellyseerr) for inspiration
