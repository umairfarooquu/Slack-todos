const chrono = require("chrono-node");

class NaturalLanguageParser {
  /**
   * Parse a natural language task command
   * Example: "Pay electricity bill @Ali #finance tomorrow 5pm"
   */
  static parseTaskCommand(message) {
    const result = {
      title: "",
      assignedTo: null,
      tags: [],
      dueDate: null,
      priority: "medium",
      description: null,
    };

    // Clean the message
    let cleanMessage = message.trim();

    // Extract mentions (@username)
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const mentions = [];
    let mentionMatch;

    while ((mentionMatch = mentionRegex.exec(cleanMessage)) !== null) {
      mentions.push(mentionMatch[1]);
    }

    if (mentions.length > 0) {
      result.assignedTo = mentions[0]; // Take the first mention as assignee
    }

    // Extract hashtags (#tag)
    const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
    const tags = [];
    let hashtagMatch;

    while ((hashtagMatch = hashtagRegex.exec(cleanMessage)) !== null) {
      tags.push(hashtagMatch[1]);
    }

    result.tags = tags;

    // Extract priority indicators
    const priorityPatterns = {
      urgent: /\b(urgent|asap|emergency|critical|high priority|!!+|\u203c)\b/i,
      high: /\b(important|high|priority|soon|\u2757)\b/i,
      low: /\b(low priority|low|whenever|optional|maybe)\b/i,
    };

    for (const [priority, pattern] of Object.entries(priorityPatterns)) {
      if (pattern.test(cleanMessage)) {
        result.priority = priority;
        break;
      }
    }

    // Parse dates and times using chrono-node
    const parsedDates = chrono.parse(cleanMessage);
    if (parsedDates.length > 0) {
      const parsedDate = parsedDates[0];
      result.dueDate = Math.floor(parsedDate.start.date().getTime() / 1000);

      // Remove the date text from the message for cleaner title extraction
      const dateText = parsedDate.text;
      cleanMessage = cleanMessage.replace(dateText, "").trim();
    }

    // Remove mentions, hashtags, and priority indicators from title
    let title = cleanMessage
      .replace(mentionRegex, "") // Remove @mentions
      .replace(hashtagRegex, "") // Remove #hashtags
      .replace(
        /\b(urgent|asap|emergency|critical|high priority|important|high|priority|soon|low priority|low|whenever|optional|maybe|!!+|\u203c|\u2757)\b/gi,
        ""
      ) // Remove priority words
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // If title is empty after cleaning, use original message
    if (!title) {
      title = message
        .replace(mentionRegex, "")
        .replace(hashtagRegex, "")
        .trim();
    }

    result.title = title || "Untitled Task";

    return result;
  }

  /**
   * Parse task management commands
   * Examples: "list", "done 123", "snooze 123 +2h", "complete abc-def"
   */
  static parseManagementCommand(message) {
    const cleaned = message.trim().toLowerCase();

    // List command
    if (
      /^(list|show|tasks?)(\s+(all|pending|completed|overdue))?$/i.test(cleaned)
    ) {
      const statusMatch = cleaned.match(/\b(all|pending|completed|overdue)\b/);
      return {
        action: "list",
        status: statusMatch ? statusMatch[1] : "pending",
      };
    }

    // Done/Complete command
    const doneMatch = cleaned.match(
      /^(done|complete|finish|finished)\s+([a-zA-Z0-9-]+)$/i
    );
    if (doneMatch) {
      return {
        action: "complete",
        taskId: doneMatch[2],
      };
    }

    // Snooze command
    const snoozeMatch = cleaned.match(/^snooze\s+([a-zA-Z0-9-]+)\s+(.+)$/i);
    if (snoozeMatch) {
      const taskId = snoozeMatch[1];
      const timeExpression = snoozeMatch[2];

      // Parse snooze duration
      const snoozeUntil = this._parseSnoozeTime(timeExpression);

      return {
        action: "snooze",
        taskId: taskId,
        snoozeUntil: snoozeUntil,
      };
    }

    // Delete command
    const deleteMatch = cleaned.match(
      /^(delete|remove|cancel)\s+([a-zA-Z0-9-]+)$/i
    );
    if (deleteMatch) {
      return {
        action: "delete",
        taskId: deleteMatch[2],
      };
    }

    // Help command
    if (/^(help|\?|commands?)$/i.test(cleaned)) {
      return {
        action: "help",
      };
    }

    // Show specific task
    const showMatch = cleaned.match(/^(show|task)\s+([a-zA-Z0-9-]+)$/i);
    if (showMatch) {
      return {
        action: "show",
        taskId: showMatch[2],
      };
    }

    return null; // No command recognized
  }

  /**
   * Parse snooze time expressions
   */
  static _parseSnoozeTime(expression) {
    const now = new Date();

    // Handle relative time expressions like "+2h", "+30m", "+1d"
    const relativeMatch = expression.match(
      /^\+?(\d+)\s*(m|min|minute|h|hr|hour|d|day|w|week)s?$/i
    );
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2].toLowerCase();

      let milliseconds = 0;
      switch (unit.charAt(0)) {
        case "m": // minutes
          milliseconds = amount * 60 * 1000;
          break;
        case "h": // hours
          milliseconds = amount * 60 * 60 * 1000;
          break;
        case "d": // days
          milliseconds = amount * 24 * 60 * 60 * 1000;
          break;
        case "w": // weeks
          milliseconds = amount * 7 * 24 * 60 * 60 * 1000;
          break;
      }

      return Math.floor((now.getTime() + milliseconds) / 1000);
    }

    // Handle absolute time expressions using chrono
    const parsedDates = chrono.parse(expression);
    if (parsedDates.length > 0) {
      return Math.floor(parsedDates[0].start.date().getTime() / 1000);
    }

    // Default to 1 hour if cannot parse
    return Math.floor((now.getTime() + 60 * 60 * 1000) / 1000);
  }

  /**
   * Extract task ID from various formats
   */
  static extractTaskId(message) {
    // Look for task ID patterns (UUID or short ID)
    const patterns = [
      /\b([a-f0-9-]{36})\b/i, // Full UUID
      /\b([a-zA-Z0-9-]{6,12})\b/, // Short ID
      /#(\d+)\b/, // Numbered tasks
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Determine if a message is likely a task creation command
   */
  static isTaskCreation(message) {
    // Skip if it looks like a management command
    if (this.parseManagementCommand(message)) {
      return false;
    }

    // Skip very short messages
    if (message.trim().length < 3) {
      return false;
    }

    // Skip if it's just a greeting or question
    const greetingPatterns = [
      /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure)$/i,
      /^\?+$/,
      /^(what|how|when|where|why|who)/i,
    ];

    for (const pattern of greetingPatterns) {
      if (pattern.test(message.trim())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate a short task ID for display
   */
  static generateShortId(fullId) {
    // Take first 8 characters of UUID for display
    return fullId.substring(0, 8);
  }

  /**
   * Find full task ID from short ID
   */
  static expandShortId(shortId, taskList) {
    return (
      taskList.find(
        (task) => task.id.startsWith(shortId) || task.id.includes(shortId)
      )?.id || null
    );
  }
}

module.exports = NaturalLanguageParser;
