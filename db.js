const path = require('path');
const Database = require('better-sqlite3');

// Allow configurable DB path (so tests can use :memory:)
const dbPath = process.env.DB_PATH || path.join(__dirname, 'orchestrator.db');
const db = new Database(dbPath);

// Initialize baselines table with consistent column name
db.exec(`
    CREATE TABLE IF NOT EXISTS baselines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL UNIQUE,
        expected_output TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

const insertBaselineStmt = db.prepare(`
  INSERT OR REPLACE INTO baselines (prompt, expected_output)
  VALUES (@prompt, @expected_output)
`);

const selectBaselineStmt = db.prepare(`
    SELECT prompt, expected_output
    FROM baselines
`);

// Prepared statements for test_runs table
db.exec(`
    CREATE TABLE IF NOT EXISTS test_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        status TEXT,
        result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

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
//Adam
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

function saveBaseline(prompt, expectedOutput) {
    const payload = { prompt: String(prompt), expected_output: JSON.stringify(expectedOutput) };
    insertBaselineStmt.run(payload);
}

function getBaselines() {
    return selectBaselineStmt.all().map(row => ({
        prompt: row.prompt,
        expected_output: JSON.parse(row.expected_output)
    }));
}

module.exports = { saveRun, getRuns, saveBaseline, getBaselines };