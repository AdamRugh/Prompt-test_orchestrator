const express = require('express');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use('/orchestrator', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Orchestrator running on port ${PORT}`);
});