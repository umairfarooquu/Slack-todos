const { getDatabase } = require("../database");
const { v4: uuidv4 } = require("uuid");

class Task {
  /**
   * Create a new task
   */
  static async create(taskData) {
    const db = getDatabase();
    const taskId = uuidv4();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO tasks (
          task_id, title, description, assigned_to_user_id, assigned_to_username,
          created_by_user_id, created_by_username, team_id, channel_id, 
          tags, due_date, priority, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        taskId,
        taskData.title,
        taskData.description || null,
        taskData.assignedToUserId || null,
        taskData.assignedToUsername || null,
        taskData.createdByUserId,
        taskData.createdByUsername,
        taskData.teamId,
        taskData.channelId,
        taskData.tags ? taskData.tags.join(",") : null,
        taskData.dueDate || null,
        taskData.priority || "medium",
        "pending",
      ];

      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
          return;
        }

        // Return the created task
        Task.findById(taskId).then(resolve).catch(reject);
      });
    });
  }

  /**
   * Find task by ID
   */
  static async findById(taskId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM tasks WHERE task_id = ?";

      db.get(sql, [taskId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          resolve(Task._formatTask(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Find tasks by user ID (assigned or created by)
   */
  static async findByUser(userId, options = {}) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      let sql = `
        SELECT * FROM tasks 
        WHERE (assigned_to_user_id = ? OR created_by_user_id = ?)
      `;
      let params = [userId, userId];

      // Add status filter
      if (options.status) {
        sql += " AND status = ?";
        params.push(options.status);
      }

      // Add team filter
      if (options.teamId) {
        sql += " AND team_id = ?";
        params.push(options.teamId);
      }

      // Add due date filter
      if (options.dueBefore) {
        sql += " AND due_date <= ?";
        params.push(options.dueBefore);
      }

      sql += " ORDER BY created_at DESC";

      // Add limit
      if (options.limit) {
        sql += " LIMIT ?";
        params.push(options.limit);
      }

      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const tasks = rows.map((row) => Task._formatTask(row));
        resolve(tasks);
      });
    });
  }

  /**
   * Find tasks by team/workspace
   */
  static async findByTeam(teamId, options = {}) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM tasks WHERE team_id = ?";
      let params = [teamId];

      if (options.status) {
        sql += " AND status = ?";
        params.push(options.status);
      }

      if (options.assignedTo) {
        sql += " AND assigned_to_user_id = ?";
        params.push(options.assignedTo);
      }

      sql += " ORDER BY created_at DESC";

      if (options.limit) {
        sql += " LIMIT ?";
        params.push(options.limit);
      }

      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const tasks = rows.map((row) => Task._formatTask(row));
        resolve(tasks);
      });
    });
  }

  /**
   * Update task status
   */
  static async updateStatus(taskId, status, userId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const completedAt =
        status === "completed" ? Math.floor(Date.now() / 1000) : null;

      const sql = `
        UPDATE tasks 
        SET status = ?, updated_at = strftime('%s', 'now'), completed_at = ?
        WHERE task_id = ?
      `;

      db.run(sql, [status, completedAt, taskId], function (err) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error("Task not found"));
          return;
        }

        Task.findById(taskId).then(resolve).catch(reject);
      });
    });
  }

  /**
   * Snooze task (set reminder for later)
   */
  static async snooze(taskId, snoozeUntil) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE tasks 
        SET snooze_until = ?, updated_at = strftime('%s', 'now')
        WHERE task_id = ?
      `;

      db.run(sql, [snoozeUntil, taskId], function (err) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error("Task not found"));
          return;
        }

        Task.findById(taskId).then(resolve).catch(reject);
      });
    });
  }

  /**
   * Update task assignment
   */
  static async updateAssignment(taskId, assignedToUserId, assignedToUsername) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE tasks 
        SET assigned_to_user_id = ?, assigned_to_username = ?, updated_at = strftime('%s', 'now')
        WHERE task_id = ?
      `;

      db.run(
        sql,
        [assignedToUserId, assignedToUsername, taskId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          if (this.changes === 0) {
            reject(new Error("Task not found"));
            return;
          }

          Task.findById(taskId).then(resolve).catch(reject);
        }
      );
    });
  }

  /**
   * Get tasks due today or overdue
   */
  static async getTasksDueOrOverdue(teamId) {
    const now = Math.floor(Date.now() / 1000);
    const endOfToday = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000);

    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM tasks 
        WHERE team_id = ? 
        AND status != 'completed' 
        AND due_date IS NOT NULL 
        AND due_date <= ?
        AND (snooze_until IS NULL OR snooze_until <= ?)
        ORDER BY due_date ASC
      `;

      db.all(sql, [teamId, endOfToday, now], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const tasks = rows.map((row) => Task._formatTask(row));
        resolve(tasks);
      });
    });
  }

  /**
   * Delete a task
   */
  static async delete(taskId, userId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql =
        "DELETE FROM tasks WHERE task_id = ? AND created_by_user_id = ?";

      db.run(sql, [taskId, userId], function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Format task object from database row
   */
  static _formatTask(row) {
    return {
      id: row.task_id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignedTo: {
        userId: row.assigned_to_user_id,
        username: row.assigned_to_username,
      },
      createdBy: {
        userId: row.created_by_user_id,
        username: row.created_by_username,
      },
      teamId: row.team_id,
      channelId: row.channel_id,
      tags: row.tags ? row.tags.split(",") : [],
      dueDate: row.due_date,
      reminderDate: row.reminder_date,
      snoozeUntil: row.snooze_until,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    };
  }
}

module.exports = Task;
