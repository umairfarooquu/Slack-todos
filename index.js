const express = require("express");
const { App, ExpressReceiver } = require("@slack/bolt");
require("dotenv").config();

// Always start with a base Express app for guaranteed health checks
let app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
let slackApp = null;
let receiver = null;

// Basic health check endpoints that always work
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

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
      slack_initialized: slackApp !== null,
    },
  });
});

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

// Initialize Slack integration if credentials are available
if (process.env.SLACK_SIGNING_SECRET && process.env.SLACK_BOT_TOKEN) {
  try {
    console.log("🔄 Attempting to initialize Slack integration...");

    receiver = new ExpressReceiver({
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      processBeforeResponse: true,
      app: app, // Use our existing Express app
    });

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
    console.log("🏥 Continuing with health-check-only mode");

    // Add fallback /slack/events endpoint
    app.post("/slack/events", (req, res) => {
      res.status(503).json({
        error: "Slack integration failed to initialize",
        message: error.message,
      });
    });
  }
} else {
  console.log("📋 Slack credentials not configured");

  // Add placeholder /slack/events endpoint
  app.post("/slack/events", (req, res) => {
    res.status(400).json({
      error: "Slack credentials not configured",
      message:
        "Please add SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET environment variables",
    });
  });
}

async function startServer() {
  try {
    // Explicitly bind to 0.0.0.0 for Railway
    const server = app.listen(port, "0.0.0.0", () => {
      console.log("✅ Health check server started!");
      console.log(`🚀 Server listening on 0.0.0.0:${port}`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
      console.log(`🏥 Railway health: http://localhost:${port}/healthz`);
      console.log(`🏥 Ping: http://localhost:${port}/ping`);
    });

    // Set server timeout for Railway
    server.timeout = 30000; // 30 seconds

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
        "💡 Add correct SLACK_BOT_TOKEN (xoxb-...) and SLACK_SIGNING_SECRET to enable bot"
      );
    }

    console.log("✅ Server fully operational!");

    return server;
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
