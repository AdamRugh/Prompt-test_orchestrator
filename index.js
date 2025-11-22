const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Endpoint to receive test plans
app.post('/run-test', async (req, res) => {
  const testPlan = req.body;

  try {
    let result;
    switch (testPlan.type) {
      case 'UI':
        result = { message: 'UI runner stub executed', testPlan };
        break;
      case 'API':
        result = { message: 'API runner stub executed', testPlan };
        break;
      case 'DB':
        result = { message: 'DB runner stub executed', testPlan };
        break;
      default:
        throw new Error('Unknown test type');
    }

    res.json({ status: 'success', result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(3000, () => console.log('Orchestrator running on port 3000'));