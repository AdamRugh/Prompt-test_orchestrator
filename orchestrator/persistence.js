const Database = require('better-sqlite3');

// Open or create database file
const db = new Database('orchestrator.db');

// Initialize schema if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    engine TEXT,
    status TEXT,
    output TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS baselines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT UNIQUE NOT NULL,
    expected_output TEXT NOT NULL
  )
`).run();

// Save a new prompt, return runId
function savePrompt(prompt) {
  const stmt = db.prepare('INSERT INTO runs (prompt) VALUES (?)');
  const info = stmt.run(prompt);
  return info.lastInsertRowid;
}

// Save result for a runId
function saveResult(runId, result) {
  const stmt = db.prepare(`
    UPDATE runs
    SET engine = ?, status = ?, output = ?
    WHERE id = ?
  `);
  stmt.run(result.engine, result.status, result.output, runId);
}

// Get all runs
function getRuns() {
  const stmt = db.prepare('SELECT * FROM runs ORDER BY id');
  return stmt.all();
}

// Get runs by engine
function getRunsByEngine(engine) {
  const stmt = db.prepare('SELECT * FROM runs WHERE engine = ? ORDER BY id');
  return stmt.all(engine);
}

// Get runs since a given date
function getRunsSince(date) {
  const stmt = db.prepare('SELECT * FROM runs WHERE timestamp >= ? ORDER BY id');
  return stmt.all(date);
}

// Get latest N runs
function getLatestRuns(limit = 10) {
  const stmt = db.prepare('SELECT * FROM runs ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

// --- Baseline helpers ---

// Save or update a baseline for a prompt
function saveBaseline(prompt, expected_output) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO baselines (prompt, expected_output)
    VALUES (?, ?)
  `);
  stmt.run(prompt, expected_output);
}

// Get baseline for a specific prompt
function getBaseline(prompt) {
  const stmt = db.prepare('SELECT expected_output FROM baselines WHERE prompt = ?');
  const row = stmt.get(prompt);
  return row ? row.expected_output : null;
}

// Get all baselines
function getAllBaselines() {
  const stmt = db.prepare('SELECT * FROM baselines ORDER BY id');
  return stmt.all();
}

module.exports = {
  savePrompt,
  saveResult,
  getRuns,
  getRunsByEngine,
  getRunsSince,
  getLatestRuns,
  saveBaseline,
  getBaseline,
  getAllBaselines
};