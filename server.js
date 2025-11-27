const express = require('express');
const path = require('path');
const winston = require('winston');
const { saveRun, getRuns } = require('./db'); // import DB helpers
const { run, runRecipe, handlePrompt } = require('./orchestrator/engines/uiEngine'); // <-- point to uiEngine

const app = express();
const port = process.env.PORT || 3000;

// Winston logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
    ),
    transports: [new winston.transports.Console()]
});

// Middleware
app.use(express.json()); // parse JSON bodies
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url} - body: ${JSON.stringify(req.body)}`);
    next();
});

// POST /runTest - accepts { prompt, mode }
app.post('/runTest', async (req, res) => {
    const { prompt, mode } = req.body || {};
    if (!prompt) {
        logger.info('runTest called without prompt');
        return res.status(400).json({ error: 'Missing "prompt" in request body' });
    }

    logger.info(`runTest received prompt: ${prompt} (mode=${mode || 'default'})`);

    try {
        let runResult;

        // 🔑 Decide which engine to call based on mode
        if (mode === 'recipe') {
            // Example: run a recipe explicitly
            runResult = await runRecipe(null, prompt, []); // supply recipe if needed
        } else if (mode === 'auto') {
            // Unified dispatcher
            runResult = await handlePrompt(prompt);
        } else {
            // Default: just load page
            runResult = await run(prompt);
        }

        // Save the run into DB with the real output
        const saved = saveRun(prompt, runResult.status, runResult.output);

        logger.info(`Run saved: ${saved.id}`);
        res.json(saved);
    } catch (err) {
        logger.error(`Failed to process run: ${err.message || err}`);
        res.status(500).json({ error: 'Failed to process run' });
    }
});

// GET /getResults - return saved runs
app.get('/getResults', (req, res) => {
    logger.info('getResults called');
    try {
        const results = getRuns();
        res.json({ results });
    } catch (err) {
        logger.error(`Failed to get results: ${err.message || err}`);
        res.status(500).json({ error: 'Failed to retrieve results' });
    }
});

// Export app for testing without starting the server automatically
module.exports = app;

// Only start the server when this file is run directly
if (require.main === module) {
    app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
    });
}