# Video Processing API
## (still need some work soo on it )
A high-performance video processing service built with Hono.js and BullMQ for handling video transformations. This API allows users to upload videos and process them with various options like quality adjustment, format conversion, and resolution changes.

## 🚀 Features

- Video upload with automatic file handling
- Asynchronous video processing using queue system
- Support for multiple video processing options:
  - Quality adjustment
  - Format conversion
  - Resolution modification
- Job status tracking
- Error handling
- File upload security with unique filename generation

## 🛠️ Tech Stack

- **[Hono.js](https://hono.dev/)** - Lightweight web framework
- **[BullMQ](https://docs.bullmq.io/)** - Queue system for handling video processing jobs
- **[FFmpeg](https://ffmpeg.org/)** - Video processing engine
- **[Redis](https://redis.io/)** - Queue storage and job management
- **[Bun](https://bun.sh/)** - JavaScript runtime & package manager
- **TypeScript** - Type safety and better developer experience

## 📋 Prerequisites

- Node.js 16+
- Redis server
- FFmpeg installed on your system
- Bun runtime

## 🚀 Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```
3. Create a `.env` file:

```bash
env
PORT=3001
REDIS_HOST=localhost
REDIS_PORT=6379
```
4. Start the server:

```bash
bun run dev
```


## 📍 API Endpoints

### Upload Video
```bash
http://localhost:3001/api/video/upload
```

**Query Parameters:**
- `quality` (optional) - Video bitrate quality
- `format` (optional) - Output format (e.g., mp4, webm)
- `resolution` (optional) - Video resolution (e.g., 1280x720)

**Request Body:**
- Form data with video file (key: `video`)

**Response:**

```json
{
"jobId": "string",
"status": "processing"
}
```

### Check Processing Status
```http
GET /api/video/status/:jobId
```

**Response:**
```json
{
  "jobId": "string",
  "status": "completed|failed|processing|waiting"
}
```

**Query Parameters:**
- `quality` (optional) - Video bitrate quality
- `format` (optional) - Output format (e.g., mp4, webm)
- `resolution` (optional) - Video resolution (e.g., 1280x720)

**Request Body:**
- Form data with video file (key: `video`)

```bash
curl -X POST \
  'http://localhost:3001/api/video/upload?quality=1000k&format=mp4&resolution=1280x720' \
  -F 'video=@/path/to/video.mp4'
```

**Response:**

```json
{
  "jobId": "string",
  "status": "completed|failed|processing|waiting"
}
```


## 📁 Project Structure

```
├── src/
│   ├── config/         # Configuration files (Redis, etc.)
│   ├── middlewares/    # Custom middlewares
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   └── index.ts        # Application entry point
```

## ⚙️ Configuration

The application can be configured using environment variables:

- `PORT` - Server port (default: 3001)
- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port

## 🔒 Security

- Unique filename generation for uploaded files
- File type validation
- Error handling middleware
- Secure file storage management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📝 License

This project is licensed under the MIT License.
