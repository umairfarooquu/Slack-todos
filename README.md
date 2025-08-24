# 🤖 Slack Todo Bot

A smart task management bot that works directly inside Slack with natural language processing. No need to download a new app or learn complex commands!

## ✨ Features

- **Natural Language Task Creation**: Just type "Pay electricity bill @john #finance tomorrow 5pm" and it works!
- **Smart Assignment**: Use @mentions to assign tasks to team members
- **Tag Organization**: Use #hashtags to categorize your tasks
- **Date/Time Parsing**: Works with "tomorrow", "next week", "friday 5pm", "+2h", etc.
- **Daily Reminders**: Get notified every morning at 9am about due/overdue tasks
- **Snooze Functionality**: "snooze 123 +2h" to get reminded later
- **Priority Detection**: Automatically detects "urgent", "important", "low priority"
- **Team Collaboration**: Everyone can see and manage their own tasks

## 🚀 Quick Start

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Enter app name: "Todo Bot" and select your workspace
4. Click "Create App"

### 2. Configure Bot Permissions

In your app settings:

1. Go to **OAuth & Permissions**
2. Scroll to **Scopes** → **Bot Token Scopes**
3. Add these scopes:
   - `app_mentions:read` - Listen for @mentions
   - `channels:history` - Read channel messages
   - `chat:write` - Send messages
   - `users:read` - Get user information
   - `im:write` - Send direct messages

### 3. Install the App

1. In **OAuth & Permissions**, click "Install to Workspace"
2. Authorize the permissions
3. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 4. Get App Credentials

1. Go to **Basic Information**
2. Copy the "Signing Secret"
3. Go to **App Home** and note your Bot User ID

### 5. Setup the Bot

1. Clone this repository:

   ```bash
   git clone <repository-url>
   cd slack-todo-bot
   npm install
   ```

2. Create environment file:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your credentials:

   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_SIGNING_SECRET=your-signing-secret-here
   BOT_USER_ID=your-bot-user-id-here
   ```

4. Start the bot:

   ```bash
   npm start
   ```

   For development:

   ```bash
   npm run dev
   ```

### 6. Invite Bot to Channels

In Slack, invite the bot to channels where you want to use it:

```
/invite @todo
```

## 📋 How to Use

### Creating Tasks

Just type naturally! Examples:

```
Pay electricity bill @john #finance tomorrow 5pm
Review quarterly report #work urgent next week
Buy groceries #personal low priority
Call mom tomorrow at 2pm
```

The bot automatically detects:

- **Task title**: "Pay electricity bill"
- **Assignee**: @john (use any @username)
- **Tags**: #finance (use any #hashtag)
- **Due date**: "tomorrow 5pm" (very flexible!)
- **Priority**: "urgent", "important", "low priority"

### Managing Tasks

| Command                        | Description                | Example                        |
| ------------------------------ | -------------------------- | ------------------------------ |
| `list`                         | Show your pending tasks    | `list`                         |
| `list all`                     | Show all your tasks        | `list all`                     |
| `list completed`               | Show completed tasks       | `list completed`               |
| `list overdue`                 | Show overdue tasks         | `list overdue`                 |
| `done 12345678`                | Mark task as complete      | `done 12345678`                |
| `snooze 12345678 +2h`          | Snooze for 2 hours         | `snooze 12345678 +2h`          |
| `snooze 12345678 tomorrow 9am` | Snooze until specific time | `snooze 12345678 tomorrow 9am` |
| `show 12345678`                | Show task details          | `show 12345678`                |
| `delete 12345678`              | Delete a task              | `delete 12345678`              |
| `help`                         | Show help                  | `help`                         |

### Time Formats Supported

- **Relative**: `+2h`, `+30m`, `+1d`, `+1w`
- **Natural**: `tomorrow`, `next week`, `friday`, `monday 5pm`
- **Specific**: `2024-12-25`, `Dec 25`, `5pm`, `9:30am`
- **Smart**: `end of week`, `next month`, `in 2 hours`

### Using in Channels vs DMs

**In channels**: Mention the bot

```
@todo Pay electricity bill #finance tomorrow
@todo list overdue
```

**In DMs**: No need to mention

```
Pay electricity bill #finance tomorrow
list overdue
```

## 🔔 Daily Reminders

Every morning at 9am, the bot automatically:

1. **Sends you a DM** with tasks due today or overdue
2. **Reminds assignees** about their tasks
3. **Notifies creators** about unassigned overdue tasks
4. **Sends channel alerts** if many tasks are overdue

You can customize the reminder time in `.env`:

```
DAILY_REMINDER_TIME=09:00
```

## ⚙️ Configuration

All configuration is done via environment variables in `.env`:

```bash
# Required - Slack credentials
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here

# Optional - Bot configuration
BOT_USER_ID=your-bot-user-id-here
DAILY_REMINDER_TIME=09:00
PORT=3000
NODE_ENV=development

# Database (SQLite by default)
DATABASE_PATH=./data/tasks.db
```

## 🗄️ Database

The bot uses SQLite by default, stored in `./data/tasks.db`. No setup required!

For production, you can easily modify `src/database.js` to use PostgreSQL or MySQL.

## 🚀 Deployment

### Local Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Docker (Optional)

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Heroku (Optional)

1. Create Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy via Git or GitHub integration

## 🛠️ Troubleshooting

### Bot not responding?

1. Check that bot is invited to the channel: `/invite @todo`
2. Verify environment variables are set correctly
3. Check console for error messages
4. Ensure bot has proper permissions

### Can't mention users?

1. Bot needs `users:read` permission
2. Users must be in the same workspace
3. Use exact usernames (no spaces, special characters)

### Time parsing issues?

The bot is very flexible with time formats, but if it doesn't understand:

- Try simpler formats: "tomorrow 5pm" instead of complex expressions
- Use relative time: "+2h" for 2 hours from now
- Be specific: "friday 5pm" instead of just "friday"

### Database issues?

1. Check file permissions on `./data/` directory
2. Ensure SQLite3 is installed properly: `npm install sqlite3`
3. Delete database file to reset: `rm ./data/tasks.db`

## 🎯 Pro Tips

### Efficient Task Management

- **Use short, clear titles**: "Review report" vs "Review the quarterly financial report document"
- **Always assign deadlines**: Even "low priority" tasks benefit from due dates
- **Use consistent tags**: Pick a tagging system and stick to it (#work, #personal, #urgent)
- **Assign tasks immediately**: Don't let tasks sit unassigned

### Team Collaboration

- **Mention the right person**: Make sure @username is correct
- **Set realistic deadlines**: Consider assignee's workload
- **Use priority indicators**: Add "urgent" or "low priority" to set expectations
- **Follow up**: Check `list overdue` regularly

### Advanced Usage

- **Batch operations**: Create multiple tasks quickly by sending several messages
- **Status tracking**: Use `list all` to see team progress
- **Time zones**: Bot uses server time zone, coordinate with your team
- **Cleanup**: Completed tasks auto-delete after 30 days

## 📱 Slash Commands (Optional)

You can also enable slash commands for quicker access:

1. In Slack App settings, go to **Slash Commands**
2. Create a new command: `/todo`
3. Set Request URL to your bot's endpoint + `/slack/commands`
4. Usage: `/todo list` or `/todo Pay bills tomorrow`

## 🔒 Security & Privacy

- **Data storage**: All task data is stored locally in your database
- **Privacy**: Bot only accesses messages where it's mentioned or in DMs
- **Permissions**: Users can only see/modify their own tasks
- **Credentials**: Keep your `.env` file secure and never commit it

## 🐛 Support

Having issues?

1. **Check the logs**: Console output shows detailed error messages
2. **Verify permissions**: Ensure bot has all required Slack permissions
3. **Test with simple commands**: Start with `help` and `list`
4. **Check network**: Bot needs internet access to connect to Slack

## 📄 License

MIT License - feel free to modify and use for your team!

---

**Made with ❤️ for productive teams everywhere!** 🚀
# Slack-todos
