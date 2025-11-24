process.env.DB_PATH = ':memory:';

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'orchestrator.db');
const db = new Database(dbPath);

// Table initialization
db.exec(`CREATE TABLE IF NOT EXISTS test_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    status TEXT,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Existing helper functions
function _stringifyResult(result) {
    return JSON.stringify(result);
}

function _parseResult(result) {
    return JSON.parse(result);
}

// Save run function
function saveRun(prompt, status, result) {
    const stmt = db.prepare('INSERT INTO test_runs (prompt, status, result) VALUES (?, ?, ?)');
    const info = stmt.run(prompt, status, _stringifyResult(result));
    return { id: info.lastInsertRowid, prompt, status, result, created_at: new Date() };
}

// Get runs function
function getRuns() {
    const stmt = db.prepare('SELECT * FROM test_runs ORDER BY created_at DESC, id DESC');
    const rows = stmt.all();
    return rows.map(row => ({
        id: row.id,
        prompt: row.prompt,
        status: row.status,
        result: _parseResult(row.result),
        created_at: row.created_at
    }));
}

module.exports = { saveRun, getRuns };

// Jest tests
describe('db tests (in-memory)', () => {
    beforeEach(() => {
        db.exec('DELETE FROM test_runs');
    });

    test('saveRun inserts a run and returns id, prompt, status, result, created_at', () => {
        const payload = { a: 1 };
        const res = saveRun('test prompt', 'pending', payload);
        expect(typeof res.id).toBe('number');
        expect(res.prompt).toBe('test prompt');
        expect(res.status).toBe('pending');
        expect(res.result).toEqual(payload);
        expect(res.created_at).toBeInstanceOf(Date);
    });

    test('getRuns returns runs in descending order by created_at (newest first)', () => {
        // Insert two rows with explicit created_at to guarantee order
        const older = new Date(Date.now() - 1000).toISOString();
        const newer = new Date().toISOString();
        const insert = db.prepare('INSERT INTO test_runs (prompt, status, result, created_at) VALUES (?, ?, ?, ?)');
        insert.run('first', 'ok', JSON.stringify('r1'), older);
        insert.run('second', 'ok', JSON.stringify('r2'), newer);

        const runs = getRuns();
        expect(runs.length).toBe(2);
        expect(runs[0].prompt).toBe('second');
        expect(runs[1].prompt).toBe('first');
    });

    test('serialization works for strings and JSON objects', () => {
        const s = saveRun('strPrompt', 'done', 'a simple string');
        expect(s.result).toBe('a simple string');

        const o = saveRun('objPrompt', 'done', { x: 42, nested: { y: 'z' } });
        expect(o.result).toEqual({ x: 42, nested: { y: 'z' } });

        const runs = getRuns();
        // find saved runs by prompt
        const foundStr = runs.find(r => r.prompt === 'strPrompt');
        const foundObj = runs.find(r => r.prompt === 'objPrompt');
        expect(foundStr).toBeDefined();
        expect(foundStr.result).toBe('a simple string');
        expect(foundObj).toBeDefined();
        expect(foundObj.result).toEqual({ x: 42, nested: { y: 'z' } });
    });
});
