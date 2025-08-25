const express = require("express");
const { App, ExpressReceiver } = require("@slack/bolt");
require("dotenv").config();

// Create Express receiver for Slack Bolt with fallback
let receiver;
let app;

if (process.env.SLACK_SIGNING_SECRET) {
  receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    processBeforeResponse: true,
  });
  app = receiver.app;
} else {
  // Fallback to regular Express if no Slack credentials
  app = express();
  app.use(express.json());

  // Add placeholder for /slack/events when no credentials
  app.post("/slack/events", (req, res) => {
    res.status(400).json({
      error: "Slack credentials not configured",
      message:
        "Please add SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET environment variables",
    });
  });
}

const port = process.env.PORT || 3000;

// Initialize Slack app if credentials are available
let slackApp = null;
if (
  process.env.SLACK_BOT_TOKEN &&
  process.env.SLACK_SIGNING_SECRET &&
  receiver
) {
  try {
    slackApp = new App({
      token: process.env.SLACK_BOT_TOKEN,
      receiver,
    });

    // Setup task handlers
    const { setupTaskHandlers } = require("./src/handlers/taskHandlers");
    setupTaskHandlers(slackApp);

    console.log("✅ Slack Bot initialized successfully");
  } catch (error) {
    console.warn("⚠️ Failed to initialize Slack Bot:", error.message);
    console.log("🏥 Continuing in health-check mode only");
  }
}

// Health check endpoints that work independently of Slack
app.get("/health", (req, res) => {
  const hasValidSlackToken =
    process.env.SLACK_BOT_TOKEN &&
    process.env.SLACK_BOT_TOKEN.startsWith("xoxb-") &&
    !process.env.SLACK_BOT_TOKEN.includes("dummy") &&
    !process.env.SLACK_BOT_TOKEN.includes("placeholder") &&
    !process.env.SLACK_BOT_TOKEN.includes("test");

  const hasValidSigningSecret =
    process.env.SLACK_SIGNING_SECRET &&
    process.env.SLACK_SIGNING_SECRET.length > 10 &&
    !process.env.SLACK_SIGNING_SECRET.includes("dummy") &&
    !process.env.SLACK_SIGNING_SECRET.includes("placeholder") &&
    !process.env.SLACK_SIGNING_SECRET.includes("test");

  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: {
      node_env: process.env.NODE_ENV || "development",
      railway_env: process.env.RAILWAY_ENVIRONMENT || null,
      port: port,
    },
    slack_config: {
      has_bot_token: hasValidSlackToken,
      has_signing_secret: hasValidSigningSecret,
      ready_for_slack: hasValidSlackToken && hasValidSigningSecret,
    },
  });
});

// Railway-specific endpoints
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Slack Todo Bot",
    status: "running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      healthz: "/healthz",
      ping: "/ping",
      slack_events: "/slack/events",
    },
  });
});

// Note: /slack/events endpoint is automatically handled by Slack Bolt ExpressReceiver

async function startServer() {
  try {
    // Start Express server
    const server = app.listen(port, () => {
      console.log("✅ Health check server started!");
      console.log(`🚀 Server listening on port ${port}`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
      console.log(`🏥 Railway health: http://localhost:${port}/healthz`);
    });

    // Railway deployment info
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log(`🚂 Deployed on Railway: ${process.env.RAILWAY_ENVIRONMENT}`);
      console.log(
        `🌐 Railway Domain: ${
          process.env.RAILWAY_STATIC_URL || "Not available"
        }`
      );
    }

    // Check if we have valid credentials
    const hasValidSlackToken =
      process.env.SLACK_BOT_TOKEN &&
      process.env.SLACK_BOT_TOKEN.startsWith("xoxb-");
    const hasValidSigningSecret =
      process.env.SLACK_SIGNING_SECRET &&
      process.env.SLACK_SIGNING_SECRET.length > 10;

    if (hasValidSlackToken && hasValidSigningSecret) {
      if (slackApp) {
        console.log("🔄 Slack Bot ready to receive events");
        console.log("📨 Event endpoint: /slack/events");
      } else {
        console.log("⚠️ Slack credentials valid but bot failed to initialize");
      }
    } else {
      console.log("📋 Slack credentials missing or invalid");
      console.log("🏥 Running in health-check-only mode");
      console.log(
        "💡 Add SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET to enable bot"
      );
    }

    console.log("✅ Server fully operational!");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

startServer();
