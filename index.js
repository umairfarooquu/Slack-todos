const express = require("express");
require("dotenv").config();

// Create Express app for health checks and basic endpoints
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

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

// Slack events placeholder (will be set up later when credentials are valid)
app.post("/slack/events", (req, res) => {
  res.status(200).json({ status: "Slack not configured yet" });
});

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
      console.log("🔄 Valid Slack credentials detected - initializing bot...");
      // TODO: Initialize Slack bot in next phase
      console.log("⚠️  Slack bot initialization deferred for stability");
    } else {
      console.log("📋 Slack credentials missing or invalid");
      console.log("🏥 Running in health-check-only mode");
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
