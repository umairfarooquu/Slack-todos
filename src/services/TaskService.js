const Task = require("../models/Task");
const User = require("../models/User");
const NaturalLanguageParser = require("../utils/NaturalLanguageParser");
const SlackFormatter = require("../utils/SlackFormatter");

class TaskService {
  /**
   * Create a new task from natural language input
   */
  static async createTask(message, createdBy, teamId, channelId, slackClient) {
    try {
      // Parse the message
      const parsed = NaturalLanguageParser.parseTaskCommand(message);

      if (!parsed.title || parsed.title === "Untitled Task") {
        throw new Error(
          "Could not understand the task. Please provide a clear task description."
        );
      }

      // Resolve assigned user if mentioned
      let assignedToUserId = null;
      let assignedToUsername = null;

      if (parsed.assignedTo) {
        const assignedUser = await this._resolveUser(
          parsed.assignedTo,
          teamId,
          slackClient
        );
        if (assignedUser) {
          assignedToUserId = assignedUser.userId;
          assignedToUsername = assignedUser.username;
        } else {
          // User not found, but we'll still create the task with the username
          assignedToUsername = parsed.assignedTo;
        }
      }

      // Create task data
      const taskData = {
        title: parsed.title,
        description: parsed.description,
        assignedToUserId,
        assignedToUsername,
        createdByUserId: createdBy.userId,
        createdByUsername: createdBy.username,
        teamId,
        channelId,
        tags: parsed.tags,
        dueDate: parsed.dueDate,
        priority: parsed.priority,
      };

      // Create the task
      const task = await Task.create(taskData);

      // Update user cache
      await User.upsert(createdBy);
      if (assignedToUserId) {
        await User.upsert({
          userId: assignedToUserId,
          username: assignedToUsername,
          teamId,
        });
      }

      return task;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  /**
   * List tasks for a user
   */
  static async listTasks(userId, teamId, options = {}) {
    try {
      const tasks = await Task.findByUser(userId, {
        status: options.status,
        teamId: teamId,
        limit: options.limit || 20,
      });

      return tasks;
    } catch (error) {
      console.error("Error listing tasks:", error);
      throw error;
    }
  }

  /**
   * Complete a task
   */
  static async completeTask(taskIdentifier, userId, teamId) {
    try {
      // Find the task
      const task = await this._findTask(taskIdentifier, userId, teamId);

      if (!task) {
        throw new Error(
          `Task "${taskIdentifier}" not found. Use \`list\` to see your tasks.`
        );
      }

      // Check permissions
      if (
        task.createdBy.userId !== userId &&
        task.assignedTo?.userId !== userId
      ) {
        throw new Error(
          "You can only complete tasks that are assigned to you or created by you."
        );
      }

      if (task.status === "completed") {
        throw new Error("This task is already completed! 🎉");
      }

      // Update task status
      const updatedTask = await Task.updateStatus(task.id, "completed", userId);

      return updatedTask;
    } catch (error) {
      console.error("Error completing task:", error);
      throw error;
    }
  }

  /**
   * Snooze a task
   */
  static async snoozeTask(taskIdentifier, snoozeExpression, userId, teamId) {
    try {
      // Find the task
      const task = await this._findTask(taskIdentifier, userId, teamId);

      if (!task) {
        throw new Error(
          `Task "${taskIdentifier}" not found. Use \`list\` to see your tasks.`
        );
      }

      // Check permissions
      if (
        task.createdBy.userId !== userId &&
        task.assignedTo?.userId !== userId
      ) {
        throw new Error(
          "You can only snooze tasks that are assigned to you or created by you."
        );
      }

      if (task.status === "completed") {
        throw new Error("Cannot snooze a completed task.");
      }

      // Parse snooze time
      const snoozeUntil =
        NaturalLanguageParser._parseSnoozeTime(snoozeExpression);

      // Update task
      const updatedTask = await Task.snooze(task.id, snoozeUntil);

      return { task: updatedTask, snoozeUntil };
    } catch (error) {
      console.error("Error snoozing task:", error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskIdentifier, userId, teamId) {
    try {
      // Find the task
      const task = await this._findTask(taskIdentifier, userId, teamId);

      if (!task) {
        throw new Error(
          `Task "${taskIdentifier}" not found. Use \`list\` to see your tasks.`
        );
      }

      // Check permissions (only creator can delete)
      if (task.createdBy.userId !== userId) {
        throw new Error("You can only delete tasks that you created.");
      }

      // Delete the task
      const deleted = await Task.delete(task.id, userId);

      if (!deleted) {
        throw new Error("Failed to delete task.");
      }

      return task;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }

  /**
   * Show task details
   */
  static async showTask(taskIdentifier, userId, teamId) {
    try {
      // Find the task
      const task = await this._findTask(taskIdentifier, userId, teamId);

      if (!task) {
        throw new Error(
          `Task "${taskIdentifier}" not found. Use \`list\` to see your tasks.`
        );
      }

      return task;
    } catch (error) {
      console.error("Error showing task:", error);
      throw error;
    }
  }

  /**
   * Get tasks due today or overdue for daily reminders
   */
  static async getTasksForReminder(teamId) {
    try {
      const tasks = await Task.getTasksDueOrOverdue(teamId);
      return tasks;
    } catch (error) {
      console.error("Error getting tasks for reminder:", error);
      throw error;
    }
  }

  /**
   * Update task assignment
   */
  static async reassignTask(
    taskIdentifier,
    newAssigneeUsername,
    userId,
    teamId,
    slackClient
  ) {
    try {
      // Find the task
      const task = await this._findTask(taskIdentifier, userId, teamId);

      if (!task) {
        throw new Error(`Task "${taskIdentifier}" not found.`);
      }

      // Check permissions
      if (task.createdBy.userId !== userId) {
        throw new Error("Only the task creator can reassign tasks.");
      }

      // Resolve new assignee
      const assignedUser = await this._resolveUser(
        newAssigneeUsername,
        teamId,
        slackClient
      );

      let assignedToUserId = null;
      let assignedToUsername = newAssigneeUsername;

      if (assignedUser) {
        assignedToUserId = assignedUser.userId;
        assignedToUsername = assignedUser.username;
      }

      // Update assignment
      const updatedTask = await Task.updateAssignment(
        task.id,
        assignedToUserId,
        assignedToUsername
      );

      return updatedTask;
    } catch (error) {
      console.error("Error reassigning task:", error);
      throw error;
    }
  }

  /**
   * Find a task by various identifiers
   */
  static async _findTask(identifier, userId, teamId) {
    // First try to find by exact ID
    let task = await Task.findById(identifier);

    if (task && task.teamId === teamId) {
      return task;
    }

    // If not found, try to find by short ID
    const userTasks = await Task.findByUser(userId, { teamId });

    // Look for short ID match
    const matchingTask = userTasks.find(
      (t) => t.id.startsWith(identifier) || t.id.substring(0, 8) === identifier
    );

    return matchingTask || null;
  }

  /**
   * Resolve a username to user information
   */
  static async _resolveUser(username, teamId, slackClient) {
    try {
      // Remove @ if present
      const cleanUsername = username.replace(/^@/, "");

      // First check our local cache
      const cachedUser = await User.findByUsername(cleanUsername, teamId);
      if (cachedUser) {
        return cachedUser;
      }

      // Try to get user info from Slack
      if (slackClient) {
        try {
          const result = await slackClient.users.list();
          const slackUser = result.members.find(
            (member) =>
              member.name === cleanUsername ||
              member.profile?.display_name === cleanUsername ||
              member.real_name === cleanUsername
          );

          if (slackUser && !slackUser.deleted) {
            const userData = {
              userId: slackUser.id,
              username: slackUser.name,
              displayName: slackUser.profile?.display_name,
              realName: slackUser.real_name,
              teamId: teamId,
            };

            // Cache the user
            await User.upsert(userData);

            return userData;
          }
        } catch (slackError) {
          console.warn("Could not fetch user from Slack:", slackError.message);
        }
      }

      return null;
    } catch (error) {
      console.error("Error resolving user:", error);
      return null;
    }
  }

  /**
   * Search tasks by text
   */
  static async searchTasks(query, userId, teamId) {
    try {
      const tasks = await Task.findByUser(userId, { teamId });

      const filtered = tasks.filter((task) => {
        const searchText = `${task.title} ${
          task.description || ""
        } ${task.tags.join(" ")}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

      return filtered;
    } catch (error) {
      console.error("Error searching tasks:", error);
      throw error;
    }
  }
}

module.exports = TaskService;
