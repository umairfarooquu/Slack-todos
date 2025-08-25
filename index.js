const { App } = require("@slack/bolt");
const { initializeDatabase } = require("./src/database");
const { setupTaskHandlers } = require("./src/handlers/taskHandlers");
const { setupScheduler } = require("./src/scheduler");
require("dotenv").config();

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  port: process.env.PORT || 3000,
  customRoutes: [
    {
      path: "/health",
      method: ["GET"],
      handler: (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          })
        );
      },
    },
  ],
});

async function startBot() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log("✅ Database initialized");

    // Setup task handlers
    setupTaskHandlers(app);
    console.log("✅ Task handlers registered");

    // Setup scheduler for daily reminders
    setupScheduler(app);
    console.log("✅ Scheduler initialized");

    // Start the app
    await app.start();
    console.log("⚡️ Slack Todo Bot is running!");
    console.log(`🚀 Server listening on port ${process.env.PORT || 3000}`);

    // Railway deployment info
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log(`🚂 Deployed on Railway: ${process.env.RAILWAY_ENVIRONMENT}`);
      console.log(
        `🌐 Railway Domain: ${
          process.env.RAILWAY_STATIC_URL || "Not available"
        }`
      );
    }

    // Log setup instructions
    console.log("\n📋 Setup Instructions:");
    console.log("1. Create a Slack app at https://api.slack.com/apps");
    console.log(
      "2. Add Bot Token Scopes: app_mentions:read, channels:history, chat:write, users:read"
    );
    console.log("3. Install the app to your workspace");
    console.log("4. Copy your tokens to .env file");
    console.log("5. Invite the bot to channels where you want to use it");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down Slack Todo Bot...");
  process.exit(0);
});

startBot();
