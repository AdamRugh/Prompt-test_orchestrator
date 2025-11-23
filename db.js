const path = require('path');
const Database = require('better-sqlite3');

// Allow configurable DB path (so tests can use :memory:)
const dbPath = process.env.DB_PATH || path.join(__dirname, 'orchestrator.db');
const db = new Database(dbPath);

// Initialize table
db.exec(`
    CREATE TABLE IF NOT EXISTS test_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        status TEXT,
        result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Prepared statements
const insertStmt = db.prepare(`
    INSERT INTO test_runs (prompt, status, result)
    VALUES (@prompt, @status, @result)
`);
const selectAllStmt = db.prepare(`
    SELECT id, prompt, status, result, created_at
    FROM test_runs
    ORDER BY created_at DESC, id DESC
`);
const selectByIdStmt = db.prepare(`
    SELECT id, prompt, status, result, created_at
    FROM test_runs
    WHERE id = ?
`);

// Helpers
function _stringifyResult(result) {
    if (result === undefined || result === null) return null;
    if (typeof result === 'string') return result;
    try {
        return JSON.stringify(result);
    } catch {
        return String(result);
    }
}

function _parseResult(row) {
    if (!row) return row;
    try {
        row.result = row.result == null ? null : JSON.parse(row.result);
    } catch {
        // keep as raw string if not JSON
    }
    return row;
}

// API
function saveRun(prompt, status = null, result = null) {
    const payload = {
        prompt: String(prompt),
        status: status == null ? null : String(status),
        result: _stringifyResult(result)
    };

    const info = insertStmt.run(payload);
    const row = selectByIdStmt.get(info.lastInsertRowid);
    return _parseResult(row);
}

function getRuns() {
    const rows = selectAllStmt.all();
    return rows.map(_parseResult);
}

module.exports = { saveRun, getRuns };