class SlackFormatter {
  /**
   * Format a single task for display
   */
  static formatTask(task, includeDetails = false) {
    const shortId = task.id.substring(0, 8);
    const statusEmoji = this._getStatusEmoji(task.status);
    const priorityEmoji = this._getPriorityEmoji(task.priority);
    const dueText = task.dueDate ? this._formatDueDate(task.dueDate) : "";

    let formatted = `${statusEmoji} *${shortId}* ${priorityEmoji} ${task.title}`;

    if (task.assignedTo?.username) {
      formatted += ` → @${task.assignedTo.username}`;
    }

    if (task.tags && task.tags.length > 0) {
      formatted += ` ${task.tags.map((tag) => `#${tag}`).join(" ")}`;
    }

    if (dueText) {
      formatted += ` ${dueText}`;
    }

    if (includeDetails) {
      if (task.description) {
        formatted += `\n   _${task.description}_`;
      }

      formatted += `\n   Created by @${task.createdBy.username}`;

      if (task.completedAt) {
        formatted += ` • Completed ${this._formatDate(task.completedAt)}`;
      } else if (task.updatedAt !== task.createdAt) {
        formatted += ` • Updated ${this._formatDate(task.updatedAt)}`;
      }
    }

    return formatted;
  }

  /**
   * Format a list of tasks
   */
  static formatTaskList(tasks, title = "Tasks", includeEmpty = true) {
    if (!tasks || tasks.length === 0) {
      return includeEmpty ? `*${title}*\nNo tasks found.` : "";
    }

    const grouped = this._groupTasksByStatus(tasks);
    let formatted = `*${title}* (${tasks.length})\n\n`;

    // Show pending tasks first
    if (grouped.pending && grouped.pending.length > 0) {
      formatted += "📋 *Pending*\n";
      grouped.pending.forEach((task) => {
        formatted += this.formatTask(task) + "\n";
      });
      formatted += "\n";
    }

    // Show in progress tasks
    if (grouped["in-progress"] && grouped["in-progress"].length > 0) {
      formatted += "🔄 *In Progress*\n";
      grouped["in-progress"].forEach((task) => {
        formatted += this.formatTask(task) + "\n";
      });
      formatted += "\n";
    }

    // Show completed tasks (limit to recent ones)
    if (grouped.completed && grouped.completed.length > 0) {
      const recentCompleted = grouped.completed.slice(0, 5);
      formatted += `✅ *Recently Completed* (showing ${recentCompleted.length} of ${grouped.completed.length})\n`;
      recentCompleted.forEach((task) => {
        formatted += this.formatTask(task) + "\n";
      });
    }

    return formatted.trim();
  }

  /**
   * Format daily reminder message
   */
  static formatDailyReminder(tasks, teamName = "Team") {
    if (!tasks || tasks.length === 0) {
      return `🌅 *Good morning, ${teamName}!*\n\nNo tasks due today. Have a great day! 🎉`;
    }

    const now = Math.floor(Date.now() / 1000);
    const overdue = tasks.filter((task) => task.dueDate < now);
    const dueToday = tasks.filter((task) => task.dueDate >= now);

    let formatted = `🌅 *Good morning, ${teamName}!*\n\n`;

    if (overdue.length > 0) {
      formatted += `⚠️ *Overdue Tasks* (${overdue.length})\n`;
      overdue.forEach((task) => {
        formatted += this.formatTask(task) + "\n";
      });
      formatted += "\n";
    }

    if (dueToday.length > 0) {
      formatted += `📅 *Due Today* (${dueToday.length})\n`;
      dueToday.forEach((task) => {
        formatted += this.formatTask(task) + "\n";
      });
    }

    formatted += "\n💪 Have a productive day!";

    return formatted;
  }

  /**
   * Format task creation confirmation
   */
  static formatTaskCreated(task) {
    const shortId = task.id.substring(0, 8);
    let formatted = `✅ *Task created!*\n\n${this.formatTask(task, true)}`;

    formatted += `\n\n💡 _Use \`done ${shortId}\` to mark as complete_`;

    if (task.assignedTo?.username) {
      formatted += `\n👋 Hey @${task.assignedTo.username}, you've been assigned a new task!`;
    }

    return formatted;
  }

  /**
   * Format task completion message
   */
  static formatTaskCompleted(task) {
    return `🎉 *Task completed!*\n\n~~${task.title}~~\n\nGreat job! 👏`;
  }

  /**
   * Format task snoozed message
   */
  static formatTaskSnoozed(task, snoozeUntil) {
    const snoozeText = this._formatDate(snoozeUntil);
    return `😴 *Task snoozed*\n\n${task.title}\n\n⏰ I'll remind you again ${snoozeText}`;
  }

  /**
   * Format help message
   */
  static formatHelp() {
    return `🤖 *Slack Todo Bot - Commands*

*Creating Tasks:*
\`Pay electricity bill @john #finance tomorrow 5pm\`
• Task title: "Pay electricity bill"
• Assign to: @john
• Tag: #finance  
• Due: tomorrow at 5pm

*Managing Tasks:*
• \`list\` - Show your pending tasks
• \`list all\` - Show all your tasks
• \`list overdue\` - Show overdue tasks
• \`done abc123\` - Mark task as complete
• \`snooze abc123 +2h\` - Snooze for 2 hours
• \`snooze abc123 tomorrow 9am\` - Snooze until tomorrow 9am
• \`show abc123\` - Show task details
• \`delete abc123\` - Delete a task

*Time Formats:*
• \`tomorrow\`, \`next week\`, \`friday\`
• \`+2h\`, \`+30m\`, \`+1d\` (relative)
• \`5pm\`, \`9:30am\`, \`2024-12-25\`

*Priority & Tags:*
• Add \`urgent\`, \`important\`, or \`low priority\`
• Use #tags for organization
• @mention to assign tasks

*Daily Reminders:*
Every morning at 9am, I'll remind you about tasks due today and overdue items.

Need help? Just type \`help\` anytime! 😊`;
  }

  /**
   * Format error message
   */
  static formatError(error, context = "") {
    let message = "❌ *Oops! Something went wrong*\n\n";

    if (context) {
      message += `While ${context}:\n`;
    }

    message += error.message || "Unknown error occurred";
    message += "\n\nTry typing `help` for usage instructions.";

    return message;
  }

  /**
   * Group tasks by status
   */
  static _groupTasksByStatus(tasks) {
    return tasks.reduce((groups, task) => {
      const status = task.status || "pending";
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(task);
      return groups;
    }, {});
  }

  /**
   * Get emoji for task status
   */
  static _getStatusEmoji(status) {
    const statusEmojis = {
      pending: "⏳",
      "in-progress": "🔄",
      completed: "✅",
      cancelled: "❌",
    };
    return statusEmojis[status] || "⏳";
  }

  /**
   * Get emoji for task priority
   */
  static _getPriorityEmoji(priority) {
    const priorityEmojis = {
      urgent: "🚨",
      high: "⚡",
      medium: "📌",
      low: "💤",
    };
    return priorityEmojis[priority] || "📌";
  }

  /**
   * Format due date relative to now
   */
  static _formatDueDate(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;

    // Overdue
    if (diff < 0) {
      const daysPast = Math.abs(Math.floor(diff / (24 * 60 * 60)));
      if (daysPast === 0) {
        return "🔴 _overdue today_";
      } else if (daysPast === 1) {
        return "🔴 _overdue 1 day_";
      } else {
        return `🔴 _overdue ${daysPast} days_`;
      }
    }

    // Due soon
    const days = Math.floor(diff / (24 * 60 * 60));
    const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));

    if (days === 0) {
      if (hours <= 1) {
        return "🟡 _due soon_";
      } else {
        return `🟡 _due in ${hours}h_`;
      }
    } else if (days === 1) {
      return "🟠 _due tomorrow_";
    } else if (days <= 7) {
      return `⚪ _due in ${days} days_`;
    } else {
      return `⚪ _due ${this._formatDate(timestamp)}_`;
    }
  }

  /**
   * Format timestamp as readable date
   */
  static _formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const now = new Date();

    // Same day
    if (date.toDateString() === now.toDateString()) {
      return `today at ${date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    // Tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `tomorrow at ${date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    // This week
    const daysDiff = Math.floor((date - now) / (24 * 60 * 60 * 1000));
    if (daysDiff >= 0 && daysDiff <= 7) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return `${dayNames[date.getDay()]} at ${date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    // Longer term
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
}

module.exports = SlackFormatter;
