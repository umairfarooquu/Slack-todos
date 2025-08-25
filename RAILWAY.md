# 🚂 Railway Deployment Guide

This guide covers deploying your Slack Todo Bot to Railway.app.

## 🚀 Quick Deploy

### Option 1: One-Click Deploy (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Option 2: Manual Deploy

1. **Fork/Clone Repository**
2. **Sign up at [Railway.app](https://railway.app)**
3. **Connect GitHub account**
4. **New Project → Deploy from GitHub**
5. **Select your `slack-todo-bot` repository**

## ⚙️ Configuration

### Environment Variables

Set these in Railway Dashboard → Variables:

```bash
# Required Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
BOT_USER_ID=your-bot-user-id

# Optional Configuration
DAILY_REMINDER_TIME=09:00
NODE_ENV=production
```

**Note**: `PORT` and `DATABASE_PATH` are auto-configured by Railway.

### Slack App Configuration

1. **Create Slack App** at [api.slack.com/apps](https://api.slack.com/apps)
2. **Set Event Subscriptions URL** to:
   ```
   https://your-railway-domain.railway.app/slack/events
   ```
3. **Required OAuth Scopes**:

   - `app_mentions:read`
   - `channels:history`
   - `chat:write`
   - `users:read`
   - `im:write`

4. **Subscribe to Events**:
   - `app_mention`
   - `message.im`

## 🔧 Railway-Specific Features

### Auto-Deployment

- **Automatic deploys** on every git push to main branch
- **Build logs** available in Railway dashboard
- **Zero-downtime deployments**

### Monitoring

- **Health checks** at `/health` endpoint
- **Application logs** in Railway dashboard
- **Metrics** and performance monitoring

### Database

- **SQLite database** persists in Railway's ephemeral storage
- **Automatic backups** (consider upgrading to Railway Postgres for production)

### Custom Domain

- **Railway provides** a subdomain: `your-app.up.railway.app`
- **Custom domains** available with Railway Pro

## 📊 Post-Deployment Checklist

### ✅ Verify Deployment

1. Check deployment logs in Railway dashboard
2. Visit health endpoint: `https://your-domain.railway.app/health`
3. Test Slack integration

### ✅ Test Bot Functionality

```bash
# In Slack channel
/invite @todo
@todo help
@todo Create test task #demo tomorrow
@todo list
```

### ✅ Monitor Performance

- Check Railway dashboard for metrics
- Monitor application logs
- Verify daily reminders work (9 AM)

## 🔄 Updates and Maintenance

### Updating the Bot

```bash
git add .
git commit -m "Update bot features"
git push origin main
# Railway auto-deploys changes
```

### Environment Variables

- Update in Railway dashboard → Variables
- Changes trigger automatic redeployment

### Scaling

- Railway auto-scales based on usage
- Upgrade to Railway Pro for more resources

## 💰 Pricing

### Railway Starter (Free)

- **$5 free credits** per month
- **512MB RAM**, **1 vCPU**
- **1GB storage**
- Perfect for small teams

### Railway Pro ($20/month)

- **8GB RAM**, **8 vCPU**
- **100GB storage**
- **Custom domains**
- **Priority support**

## 🆘 Troubleshooting

### Common Issues

#### Deployment Fails

- Check build logs in Railway dashboard
- Verify `package.json` and dependencies
- Ensure `npm ci` works locally

#### Slack Events Not Working

- Verify Event Subscriptions URL
- Check Railway domain is accessible
- Confirm bot tokens are correct

#### Database Issues

- SQLite recreates on each deploy
- Consider Railway Postgres for persistence
- Check file permissions for data directory

#### Performance Issues

- Monitor Railway metrics
- Check application logs for errors
- Consider upgrading Railway plan

### Getting Help

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: Community support
- **Bot Logs**: Railway dashboard → Deployments → Logs

## 🎯 Production Tips

### Security

- Use Railway's secret management
- Enable webhook signatures
- Regularly rotate Slack tokens

### Performance

- Monitor memory usage
- Use Railway's built-in metrics
- Consider caching for large teams

### Reliability

- Set up Slack app monitoring
- Use Railway's uptime monitoring
- Test disaster recovery procedures

---

🚂 **Happy deploying with Railway!** Your Slack Todo Bot will be running smoothly in minutes.
