const express = require('express');
const router = express.Router();
const dispatcher = require('./dispatcher');
const persistence = require('./persistence');

router.post('/prompt', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  // Save prompt
  const runId = persistence.savePrompt(prompt);

  // Dispatch to correct engine
  const result = await dispatcher.handlePrompt(prompt);

  // Save result
  persistence.saveResult(runId, result);

  res.json({ runId, result });
});

module.exports = router;