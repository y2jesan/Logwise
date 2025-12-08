# Environment Variables Setup

Create a `.env` file in the `api` directory with the following variables:

```env
PORT=4000
MONGO_URI=
JWT_SECRET=
GROQ_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_GROUP_ID=
CLIENT_URL=http://localhost:5173
```

## Variable Descriptions

- **PORT**: Backend server port (default: 4000)
- **MONGO_URI**: MongoDB connection string
- **JWT_SECRET**: Secret key for JWT token signing
- **GROQ_API_KEY**: Your Groq API key for AI log analysis
- **TELEGRAM_BOT_TOKEN**: Telegram bot token (optional, get from @BotFather)
- **TELEGRAM_GROUP_ID**: Telegram chat/group ID (optional)
- **CLIENT_URL**: Frontend URL for CORS configuration

## Getting Telegram Credentials

1. **Bot Token**:

   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the bot token

2. **Chat/Group ID**:
   - Add your bot to a group or start a chat
   - Send a message to the bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find the `chat.id` in the response
