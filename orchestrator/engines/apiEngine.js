async function run(prompt) {
  return {
    engine: 'api',
    status: 'success',
    prompt,
    output: '✅ API engine stub executed'
  };
}

module.exports = { run };