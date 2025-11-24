// Stub routing logic
async function handlePrompt(prompt) {
  if (prompt.includes('UI')) {
    return { engine: 'selenium', status: 'stubbed', output: 'UI test executed' };
  } else if (prompt.includes('API')) {
    return { engine: 'node-api', status: 'stubbed', output: 'API test executed' };
  } else if (prompt.includes('DB')) {
    return { engine: 'python-db', status: 'stubbed', output: 'DB test executed' };
  }
  return { engine: 'unknown', status: 'skipped', output: 'No matching engine' };
}

module.exports = { handlePrompt };