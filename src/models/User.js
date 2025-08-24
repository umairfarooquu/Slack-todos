const { getDatabase } = require("../database");

class User {
  /**
   * Create or update user information
   */
  static async upsert(userData) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO users (
          user_id, username, display_name, real_name, team_id, is_active, last_seen
        ) VALUES (?, ?, ?, ?, ?, 1, strftime('%s', 'now'))
      `;

      const params = [
        userData.userId,
        userData.username,
        userData.displayName || null,
        userData.realName || null,
        userData.teamId,
      ];

      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
          return;
        }

        User.findById(userData.userId).then(resolve).catch(reject);
      });
    });
  }

  /**
   * Find user by ID
   */
  static async findById(userId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM users WHERE user_id = ?";

      db.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          resolve(User._formatUser(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Find user by username in a team
   */
  static async findByUsername(username, teamId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM users WHERE username = ? AND team_id = ? AND is_active = 1";

      db.get(sql, [username, teamId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          resolve(User._formatUser(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Search users by username pattern
   */
  static async searchByUsername(pattern, teamId, limit = 10) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM users 
        WHERE team_id = ? AND is_active = 1 
        AND (username LIKE ? OR display_name LIKE ? OR real_name LIKE ?)
        ORDER BY username ASC
        LIMIT ?
      `;

      const searchPattern = `%${pattern}%`;
      const params = [
        teamId,
        searchPattern,
        searchPattern,
        searchPattern,
        limit,
      ];

      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const users = rows.map((row) => User._formatUser(row));
        resolve(users);
      });
    });
  }

  /**
   * Get all active users in a team
   */
  static async findByTeam(teamId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM users WHERE team_id = ? AND is_active = 1 ORDER BY username ASC";

      db.all(sql, [teamId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const users = rows.map((row) => User._formatUser(row));
        resolve(users);
      });
    });
  }

  /**
   * Update last seen timestamp
   */
  static async updateLastSeen(userId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql =
        "UPDATE users SET last_seen = strftime('%s', 'now') WHERE user_id = ?";

      db.run(sql, [userId], function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Deactivate user
   */
  static async deactivate(userId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const sql = "UPDATE users SET is_active = 0 WHERE user_id = ?";

      db.run(sql, [userId], function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Format user object from database row
   */
  static _formatUser(row) {
    return {
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      realName: row.real_name,
      teamId: row.team_id,
      isActive: row.is_active === 1,
      lastSeen: row.last_seen,
    };
  }
}

module.exports = User;
