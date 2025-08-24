# 🚀 Slack Todo Bot Setup Guide

This guide will walk you through setting up the Slack Todo Bot step-by-step.

## Prerequisites

- Node.js 16+ installed
- A Slack workspace where you can create apps
- Admin or appropriate permissions in your Slack workspace

## Step 1: Create Slack App

### 1.1 Navigate to Slack API

- Go to [https://api.slack.com/apps](https://api.slack.com/apps)
- Sign in with your Slack account

### 1.2 Create New App

- Click **"Create New App"**
- Select **"From scratch"**
- Enter App Name: `Todo Bot` (or your preferred name)
- Choose your workspace
- Click **"Create App"**

## Step 2: Configure App Permissions

### 2.1 Bot Token Scopes

In your app dashboard:

1. Navigate to **OAuth & Permissions** (left sidebar)
2. Scroll down to **Scopes** → **Bot Token Scopes**
3. Click **"Add an OAuth Scope"** and add these permissions:

   | Scope               | Description                      |
   | ------------------- | -------------------------------- |
   | `app_mentions:read` | Detect when bot is mentioned     |
   | `channels:history`  | Read messages in channels        |
   | `chat:write`        | Send messages                    |
   | `users:read`        | Get user information             |
   | `im:write`          | Send direct messages             |
   | `commands`          | (Optional) Handle slash commands |

### 2.2 Event Subscriptions (Important!)

1. Navigate to **Event Subscriptions** (left sidebar)
2. Toggle **Enable Events** to **On**
3. In **Request URL**, enter: `https://your-bot-domain.com/slack/events`
   - For local development: Use ngrok or similar tunneling service
   - For production: Your actual domain
4. Under **Subscribe to bot events**, add:
   - `app_mention` - When bot is mentioned
   - `message.im` - Direct messages to bot

## Step 3: Install App to Workspace

### 3.1 Install App

1. In **OAuth & Permissions**, click **"Install to Workspace"**
2. Review permissions and click **"Allow"**
3. **IMPORTANT**: Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 3.2 Get Additional Credentials

1. Go to **Basic Information** (left sidebar)
2. Under **App Credentials**, copy the **Signing Secret**
3. Go to **App Home** and note your **App ID** or Bot User ID

## Step 4: Setup Local Environment

### 4.1 Clone/Download Code

If you have the code repository:

```bash
git clone <repository-url>
cd slack-todo-bot
npm install
```

### 4.2 Environment Configuration

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:

   ```bash
   # Required Slack Configuration
   SLACK_BOT_TOKEN=xoxb-your-copied-bot-token-here
   SLACK_SIGNING_SECRET=your-signing-secret-here

   # Optional Configuration
   BOT_USER_ID=your-bot-user-id
   DAILY_REMINDER_TIME=09:00
   PORT=3000
   DATABASE_PATH=./data/tasks.db
   NODE_ENV=development
   ```

### 4.3 Test Local Setup

```bash
npm run dev
```

You should see:

```
✅ Database initialized
✅ Task handlers registered
✅ Scheduler initialized
⚡️ Slack Todo Bot is running!
🚀 Server listening on port 3000
```

## Step 5: Configure Slack Event URL (Production)

For production deployment, you need a public URL:

### Option A: Using ngrok (Development)

```bash
# Install ngrok
npm install -g ngrok

# In another terminal, expose your local server
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
```

### Option B: Deploy to Cloud (Production)

Deploy to Heroku, Railway, or any cloud provider that gives you a public URL.

### Update Slack Configuration

1. Go back to your Slack app **Event Subscriptions**
2. Update **Request URL** to: `https://your-domain.com/slack/events`
3. Slack will verify the URL (make sure your bot is running!)
4. Save changes

## Step 6: Test the Bot

### 6.1 Invite Bot to Channel

In Slack:

```
/invite @todo
```

### 6.2 Test Basic Commands

Try these in the channel:

```
@todo help
@todo Create test task #test tomorrow
@todo list
```

### 6.3 Test Direct Messages

Send a DM to the bot:

```
help
Create another task tomorrow
list
```

## Step 7: Optional Enhancements

### 7.1 Slash Commands

1. In Slack app settings, go to **Slash Commands**
2. Click **"Create New Command"**
3. Configure:
   - Command: `/todo`
   - Request URL: `https://your-domain.com/slack/commands`
   - Short Description: `Manage tasks with Todo Bot`
   - Usage Hint: `list | done 123 | Create new task`

### 7.2 Custom Bot Icon

1. Go to **Basic Information** → **Display Information**
2. Upload a bot icon (512x512 pixels recommended)
3. Set app name and description

## Step 8: Production Deployment

### 8.1 Environment Variables

Set these in your production environment:

```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
BOT_USER_ID=...
PORT=3000
DATABASE_PATH=/app/data/tasks.db
NODE_ENV=production
DAILY_REMINDER_TIME=09:00
```

### 8.2 Database Considerations

- **Development**: SQLite (default) is fine
- **Production**: Consider PostgreSQL for better performance
- **Backup**: Regularly backup your database

### 8.3 Monitoring

Consider adding:

- Application monitoring (PM2, forever)
- Error tracking (Sentry)
- Log aggregation (CloudWatch, Papertrail)

## Troubleshooting

### Common Issues

#### 1. "Bot not responding"

- ✅ Check bot is invited to channel: `/invite @todo`
- ✅ Verify `SLACK_BOT_TOKEN` is correct
- ✅ Check console for errors
- ✅ Ensure Event Subscriptions URL is verified

#### 2. "Event subscriptions failing"

- ✅ Bot must be running when configuring URL
- ✅ URL must be publicly accessible
- ✅ Check `/slack/events` endpoint responds
- ✅ Verify signing secret is correct

#### 3. "Users not found"

- ✅ Bot needs `users:read` permission
- ✅ Use correct @username format
- ✅ Users must be in same workspace

#### 4. "Database errors"

- ✅ Check file permissions on `./data/` directory
- ✅ Ensure SQLite3 installed: `npm install sqlite3`
- ✅ Try deleting and recreating database

#### 5. "Time parsing issues"

- ✅ Use simple formats: "tomorrow 5pm"
- ✅ Try relative time: "+2h"
- ✅ Check timezone settings

### Getting Help

1. **Check logs**: Console shows detailed errors
2. **Test incrementally**: Start with `help` command
3. **Verify permissions**: Review all Slack app permissions
4. **Network access**: Ensure bot can reach Slack API

## Security Checklist

- ✅ Keep `.env` file secure and out of version control
- ✅ Use HTTPS in production
- ✅ Regularly rotate Slack tokens if needed
- ✅ Monitor app permissions and access logs
- ✅ Backup database regularly

## Performance Tips

- **Database**: Use indexes for large datasets
- **Memory**: Monitor memory usage with many users
- **Rate limits**: Slack has API rate limits (respect them)
- **Cleanup**: Old completed tasks auto-delete after 30 days

## Next Steps

Once your bot is running:

1. **Train your team** on available commands
2. **Set up team conventions** for tags and priorities
3. **Monitor usage** and optimize as needed
4. **Consider integrations** with other tools
5. **Backup data** regularly

---

🎉 **Congratulations!** Your Slack Todo Bot is now ready to help your team stay organized!

Need help? Check the main [README.md](README.md) for usage examples and troubleshooting tips.
