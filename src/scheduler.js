const cron = require("node-cron");
const TaskService = require("./services/TaskService");
const SlackFormatter = require("./utils/SlackFormatter");
const { getDatabase } = require("./database");

let app = null;

/**
 * Setup scheduler for daily reminders and notifications
 */
function setupScheduler(slackApp) {
  app = slackApp;

  // Daily reminder at 9 AM (configurable via environment)
  const dailyReminderTime = process.env.DAILY_REMINDER_TIME || "09:00";
  const [hour, minute] = dailyReminderTime.split(":");

  // Schedule daily reminders - runs at 9 AM every day
  cron.schedule(
    `${minute} ${hour} * * *`,
    async () => {
      console.log("🔔 Running daily task reminders...");
      await sendDailyReminders();
    },
    {
      timezone: "America/New_York", // Adjust timezone as needed
    }
  );

  // Check for snoozed tasks every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Checking for snoozed tasks...");
    await checkSnoozedTasks();
  });

  // Cleanup old completed tasks weekly (Sunday at 2 AM)
  cron.schedule("0 2 * * 0", async () => {
    console.log("🧹 Running weekly cleanup...");
    await cleanupOldTasks();
  });

  console.log(
    `✅ Scheduler initialized (daily reminders at ${dailyReminderTime})`
  );
}

/**
 * Send daily reminders to all teams
 */
async function sendDailyReminders() {
  try {
    const db = getDatabase();

    // Get all active teams
    const teams = await new Promise((resolve, reject) => {
      db.all(
        'SELECT DISTINCT team_id FROM tasks WHERE status != "completed"',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map((row) => row.team_id));
        }
      );
    });

    console.log(`📊 Found ${teams.length} teams with active tasks`);

    for (const teamId of teams) {
      await sendTeamDailyReminder(teamId);
    }
  } catch (error) {
    console.error("Error sending daily reminders:", error);
  }
}

/**
 * Send daily reminder for a specific team
 */
async function sendTeamDailyReminder(teamId) {
  try {
    // Get tasks due today or overdue
    const tasks = await TaskService.getTasksForReminder(teamId);

    if (tasks.length === 0) {
      return; // No reminders needed for this team
    }

    // Group tasks by user
    const tasksByUser = tasks.reduce((groups, task) => {
      const userId = task.assignedTo?.userId || task.createdBy.userId;
      if (!groups[userId]) {
        groups[userId] = [];
      }
      groups[userId].push(task);
      return groups;
    }, {});

    // Send individual reminders
    for (const [userId, userTasks] of Object.entries(tasksByUser)) {
      await sendUserDailyReminder(userId, userTasks, teamId);
    }

    // If there are many overdue tasks, send a general channel reminder
    const overdueTasks = tasks.filter(
      (task) => task.dueDate < Math.floor(Date.now() / 1000)
    );

    if (overdueTasks.length >= 5) {
      await sendChannelReminder(teamId, overdueTasks);
    }
  } catch (error) {
    console.error(`Error sending team reminder for ${teamId}:`, error);
  }
}

/**
 * Send daily reminder to individual user
 */
async function sendUserDailyReminder(userId, tasks, teamId) {
  try {
    const message = SlackFormatter.formatDailyReminder(tasks, "there");

    await app.client.chat.postMessage({
      channel: userId,
      text: message,
      unfurl_links: false,
    });

    console.log(
      `📨 Sent daily reminder to user ${userId} (${tasks.length} tasks)`
    );
  } catch (error) {
    console.warn(`Could not send DM to user ${userId}:`, error.message);
  }
}

/**
 * Send general channel reminder for teams with many overdue tasks
 */
async function sendChannelReminder(teamId, overdueTasks) {
  try {
    // Get a general channel for the team (first channel with active tasks)
    const db = getDatabase();

    const channel = await new Promise((resolve, reject) => {
      db.get(
        'SELECT channel_id FROM tasks WHERE team_id = ? AND status != "completed" LIMIT 1',
        [teamId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.channel_id);
        }
      );
    });

    if (!channel) return;

    const message = `⚠️ *Team Reminder*\n\nThere are ${overdueTasks.length} overdue tasks that need attention. Team members, please check your individual reminders and update your task statuses.\n\nType \`@todo list overdue\` to see overdue tasks.`;

    await app.client.chat.postMessage({
      channel: channel,
      text: message,
      unfurl_links: false,
    });

    console.log(
      `📢 Sent channel reminder to ${channel} for ${overdueTasks.length} overdue tasks`
    );
  } catch (error) {
    console.warn("Could not send channel reminder:", error.message);
  }
}

/**
 * Check for tasks that were snoozed and are now ready to be reminded
 */
async function checkSnoozedTasks() {
  try {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    // Get tasks that were snoozed but snooze time has passed
    const snoozedTasks = await new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM tasks 
        WHERE snooze_until IS NOT NULL 
        AND snooze_until <= ? 
        AND status != 'completed'
      `;

      db.all(sql, [now], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(
      `⏰ Found ${snoozedTasks.length} tasks ready to be re-reminded`
    );

    for (const taskRow of snoozedTasks) {
      await sendSnoozeReminder(taskRow);

      // Clear the snooze
      await new Promise((resolve, reject) => {
        db.run(
          "UPDATE tasks SET snooze_until = NULL WHERE task_id = ?",
          [taskRow.task_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
  } catch (error) {
    console.error("Error checking snoozed tasks:", error);
  }
}

/**
 * Send reminder for a snoozed task
 */
async function sendSnoozeReminder(taskRow) {
  try {
    const userId = taskRow.assigned_to_user_id || taskRow.created_by_user_id;
    const shortId = taskRow.task_id.substring(0, 8);

    const message = `⏰ *Snooze Reminder*\n\n${taskRow.title}\n\nThis task was snoozed and is ready for your attention!\n\nUse \`done ${shortId}\` to mark as complete or \`snooze ${shortId} +1h\` to snooze again.`;

    await app.client.chat.postMessage({
      channel: userId,
      text: message,
      unfurl_links: false,
    });

    console.log(
      `⏰ Sent snooze reminder for task ${taskRow.task_id} to user ${userId}`
    );
  } catch (error) {
    console.warn(
      `Could not send snooze reminder for task ${taskRow.task_id}:`,
      error.message
    );
  }
}

/**
 * Clean up old completed tasks (older than 30 days)
 */
async function cleanupOldTasks() {
  try {
    const db = getDatabase();
    const thirtyDaysAgo = Math.floor(
      (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
    );

    const result = await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM tasks WHERE status = "completed" AND completed_at < ?',
        [thirtyDaysAgo],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    console.log(`🧹 Cleaned up ${result} old completed tasks`);
  } catch (error) {
    console.error("Error cleaning up old tasks:", error);
  }
}

/**
 * Manual trigger for daily reminders (useful for testing)
 */
async function triggerDailyReminders() {
  console.log("🔔 Manually triggering daily reminders...");
  await sendDailyReminders();
}

/**
 * Manual trigger for checking snoozed tasks (useful for testing)
 */
async function triggerSnoozedCheck() {
  console.log("⏰ Manually checking snoozed tasks...");
  await checkSnoozedTasks();
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    dailyReminderTime: process.env.DAILY_REMINDER_TIME || "09:00",
    isRunning: true,
    nextDailyReminder: getNextDailyReminderTime(),
  };
}

/**
 * Get next daily reminder time
 */
function getNextDailyReminderTime() {
  const now = new Date();
  const [hour, minute] = (process.env.DAILY_REMINDER_TIME || "09:00").split(
    ":"
  );

  const next = new Date();
  next.setHours(parseInt(hour), parseInt(minute), 0, 0);

  // If time has passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}

module.exports = {
  setupScheduler,
  triggerDailyReminders,
  triggerSnoozedCheck,
  getSchedulerStatus,
};
