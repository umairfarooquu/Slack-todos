const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

let db = null;

/**
 * Initialize the SQLite database with required tables
 */
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Ensure data directory exists
    const dataDir = path.dirname(
      process.env.DATABASE_PATH || "./data/tasks.db"
    );
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = process.env.DATABASE_PATH || "./data/tasks.db";
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err);
        reject(err);
        return;
      }

      console.log("Connected to SQLite database");
      createTables().then(resolve).catch(reject);
    });
  });
}

/**
 * Create all required database tables
 */
async function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        assigned_to_user_id TEXT,
        assigned_to_username TEXT,
        created_by_user_id TEXT NOT NULL,
        created_by_username TEXT NOT NULL,
        team_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        tags TEXT,
        due_date INTEGER,
        reminder_date INTEGER,
        snooze_until INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        completed_at INTEGER
      )`,

      // Users table for caching user information
      `CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        display_name TEXT,
        real_name TEXT,
        team_id TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        last_seen INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // Teams/Workspaces table
      `CREATE TABLE IF NOT EXISTS teams (
        team_id TEXT PRIMARY KEY,
        team_name TEXT NOT NULL,
        domain TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // Task comments/notes
      `CREATE TABLE IF NOT EXISTS task_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (task_id) REFERENCES tasks (task_id)
      )`,
    ];

    // Create indexes for better performance
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by_user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_reminder_date ON tasks(reminder_date)`,
      `CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id)`,
    ];

    // First create all tables sequentially
    let tableIndex = 0;

    function createNextTable() {
      if (tableIndex >= tables.length) {
        // All tables created, now create indexes
        createIndexes();
        return;
      }

      const sql = tables[tableIndex];
      db.run(sql, (err) => {
        if (err) {
          console.error("Error creating table:", err);
          reject(err);
          return;
        }
        tableIndex++;
        createNextTable();
      });
    }

    function createIndexes() {
      let indexIndex = 0;

      function createNextIndex() {
        if (indexIndex >= indexes.length) {
          // All done
          resolve();
          return;
        }

        const sql = indexes[indexIndex];
        db.run(sql, (err) => {
          if (err) {
            console.error("Error creating index:", err);
            reject(err);
            return;
          }
          indexIndex++;
          createNextIndex();
        });
      }

      createNextIndex();
    }

    // Start table creation
    createNextTable();
  });
}

/**
 * Get the database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      } else {
        console.log("Database connection closed");
      }
    });
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
};
