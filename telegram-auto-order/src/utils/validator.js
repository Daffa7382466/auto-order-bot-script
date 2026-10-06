function validateConfig(config) {
  const errors = [];

  if (!config.botToken) errors.push("BOT_TOKEN belum diisi.");
  if (!config.owner.id) errors.push("OWNER_TELEGRAM_ID belum diisi.");

  if (!["production", "exhibition"].includes(config.mode)) {
    errors.push("MODE harus production atau exhibition.");
  }

  return errors;
}

module.exports = { validateConfig };
