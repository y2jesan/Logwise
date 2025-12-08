# LogWise AI – Error Detection & Resolver Tool

A complete MVP monorepo application for AI-powered log analysis, error detection, and intelligent monitoring with Telegram notifications.

## 🏗️ Project Structure

```
LogWise/
├── client/          # React frontend (Vite + Tailwind + Shadcn UI)
├── api/             # Node.js + Express backend
├── shared/          # Shared utilities and types
└── package.json     # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (MongoDB Atlas or local instance)
- Groq API key (for AI analysis)
- Telegram Bot Token and Chat ID (optional, for notifications)

### Installation

1. **Clone and install dependencies:**

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
cd client && npm install && cd ..
cd api && npm install && cd ..
cd shared && npm install && cd ..
```

Or use the convenience script:
```bash
npm run install:all
```

2. **Set up environment variables:**

Copy the example env file in the `api` directory:
```bash
cp api/.env.example api/.env
```

Edit `api/.env` and configure:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token (optional)
TELEGRAM_GROUP_ID=your_telegram_chat_id (optional)
CLIENT_URL=http://localhost:5173
```

3. **Seed the database with admin user:**

```bash
cd api
npm run seed
```

This creates an admin user:
- **Email:** `admin@example.com`
- **Password:** `admin123`

### Running the Application

**Option 1: Run both client and API together**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (API):
```bash
npm run dev:api
```

Terminal 2 (Client):
```bash
npm run dev:client
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000

## 📋 Features

### Frontend (`/client`)
- ✅ Landing page with feature overview
- ✅ Login/Register authentication
- ✅ Protected Dashboard with:
  - System uptime metrics
  - Recent error logs with AI analysis
  - Service status monitoring
- ✅ Settings page (Admin only) for:
  - Telegram bot configuration
  - Threshold configuration
  - Test notification functionality

### Backend (`/api`)
- ✅ JWT-based authentication with httpOnly cookies
- ✅ MongoDB models (User, Log, Service, Setting)
- ✅ Groq AI integration for log analysis
- ✅ Telegram bot notifications
- ✅ RESTful API endpoints:
  - `/api/auth/*` - Authentication
  - `/api/settings/*` - Settings management (Admin)
  - `/api/logs/*` - Log analysis and management
  - `/api/services/*` - Service monitoring
  - `/api/performance/*` - API performance tracking

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user

### Settings (Admin Only)
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Save settings
- `POST /api/settings/test-notification` - Send test Telegram notification

### Logs
- `POST /api/logs/analyze` - Analyze log text with AI (protected)
- `POST /api/logs/push` - Push log from external source (auto-analyze, send alert if critical)
- `GET /api/logs` - Get recent logs (protected)
- `GET /api/logs/:id` - Get log by ID (protected)

### Services
- `GET /api/services` - Get all services (protected)
- `POST /api/services` - Create service (protected)
- `GET /api/services/status` - Check all services status (protected)
- `PUT /api/services/:id` - Update service (protected)
- `DELETE /api/services/:id` - Delete service (protected)

### Performance
- `GET /api/performance/check?endpoint=URL` - Check API performance (protected)

## 📦 Postman Collection

Import `LogWise_API.postman_collection.json` into Postman for complete API documentation and testing.

**Collection Variables:**
- `base_url`: http://localhost:4000
- `token`: JWT token (set after login)

## 🤖 AI Integration (Groq)

The application uses Groq AI (Llama 3.1 70B) for:
- Log summarization
- Root cause analysis
- Severity classification (info/warning/critical)
- Fix recommendations
- Code patch suggestions (when applicable)

## 📩 Telegram Integration

Configure Telegram notifications in the Settings page (Admin only):
1. Create a Telegram bot via [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Get your chat/group ID
4. Save settings in the dashboard

Notifications are sent for:
- Critical errors detected in logs
- Services going down
- API performance issues (threshold exceeded)

## 🗄️ Database Schema

### Users
- `email` (unique)
- `password` (hashed)
- `role` (admin/user)

### Logs
- `text` - Raw log text
- `summary` - AI-generated summary
- `cause` - Root cause analysis
- `severity` - info/warning/critical
- `fix` - Fix recommendation
- `aiRaw` - Full AI response

### Services
- `name` - Service name
- `url` - Service URL
- `status` - up/down/unknown
- `lastChecked` - Last check timestamp

### Settings
- `telegramBotToken`
- `telegramGroupId`
- `thresholds` - Performance thresholds

## 🛠️ Technology Stack

### Frontend
- React 18
- Vite
- React Router
- Zustand (state management)
- TailwindCSS
- Shadcn UI components
- Axios

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Groq SDK (AI)
- node-fetch (Telegram)

## 📝 Development

### Adding New Features

1. **Backend routes:** Add to `api/routes/`
2. **Frontend pages:** Add to `client/src/pages/`
3. **Shared types:** Add to `shared/types.js`

### Environment Variables

All environment variables are in `api/.env`. Never commit this file.

## 🧪 Testing

### Test Admin Login
- Email: `admin@example.com`
- Password: `admin123`

### Test Log Analysis
Use the `/api/logs/analyze` endpoint with sample log text:
```json
{
  "text": "2024-01-15 10:30:45 ERROR [MainThread] Connection timeout after 30 seconds"
}
```

### Test Telegram Notifications
1. Configure Telegram settings in the dashboard
2. Use the "Test Notification" feature in Settings
3. Or trigger a critical error log

## 📄 License

This project is an MVP for demonstration purposes.

## 🆘 Troubleshooting

**MongoDB connection error:**
- Verify `MONGO_URI` in `api/.env`
- Check network connectivity to MongoDB

**Groq API errors:**
- Verify `GROQ_API_KEY` is correct
- Check API quota/limits

**Telegram not sending:**
- Verify bot token and chat ID
- Ensure bot is added to the group/channel
- Check bot permissions

**Frontend not connecting to API:**
- Ensure API is running on port 4000
- Check CORS settings in `api/server.js`
- Verify `CLIENT_URL` in `.env`

---

**Built with ❤️ for intelligent error detection and resolution**

