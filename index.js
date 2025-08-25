const { App, ExpressReceiver } = require("@slack/bolt");
const { initializeDatabase } = require("./src/database");
const { setupTaskHandlers } = require("./src/handlers/taskHandlers");
const { setupScheduler } = require("./src/scheduler");
require("dotenv").config();

// Create a custom receiver to add health check
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Add health check endpoint
receiver.app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Add root endpoint for basic info
receiver.app.get("/", (req, res) => {
  res.status(200).json({
    name: "Slack Todo Bot",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      slack_events: "/slack/events",
    },
  });
});

// Initialize the Slack app with custom receiver
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver,
});

async function startBot() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log("✅ Database initialized");

    // Start the Express server first (this enables health checks)
    await app.start(process.env.PORT || 3000);
    console.log("⚡️ Slack Todo Bot server started!");
    console.log(`🚀 Server listening on port ${process.env.PORT || 3000}`);
    console.log(`🏥 Health check available at: /health`);
    console.log(`📡 Slack events endpoint: /slack/events`);

    // Railway deployment info
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log(`🚂 Deployed on Railway: ${process.env.RAILWAY_ENVIRONMENT}`);
      console.log(
        `🌐 Railway Domain: ${
          process.env.RAILWAY_STATIC_URL || "Not available"
        }`
      );
    }

    // Setup handlers after server is running (this is where Slack issues might occur)
    try {
      setupTaskHandlers(app);
      console.log("✅ Task handlers registered");

      setupScheduler(app);
      console.log("✅ Scheduler initialized");

      console.log("✅ Slack bot ready to receive events!");
    } catch (slackError) {
      console.warn(
        "⚠️  Slack setup issue (bot will still respond to health checks):",
        slackError.message
      );
    }

    // Log setup instructions if needed
    if (
      !process.env.SLACK_BOT_TOKEN ||
      process.env.SLACK_BOT_TOKEN.includes("placeholder") ||
      process.env.SLACK_BOT_TOKEN.includes("test")
    ) {
      console.log("\n📋 Setup Instructions:");
      console.log("1. Create a Slack app at https://api.slack.com/apps");
      console.log(
        "2. Add Bot Token Scopes: app_mentions:read, channels:history, chat:write, users:read"
      );
      console.log("3. Install the app to your workspace");
      console.log("4. Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET in Railway");
      console.log("5. Invite the bot to channels where you want to use it");
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down Slack Todo Bot...");
  process.exit(0);
});

startBot();
