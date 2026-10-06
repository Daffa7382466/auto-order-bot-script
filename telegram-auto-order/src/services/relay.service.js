const sessions = new Map();

function startChat(userId) {
  sessions.set(String(userId), { active: true });
}

function stopChat(userId) {
  sessions.delete(String(userId));
}

function isActive(userId) {
  return sessions.has(String(userId));
}

module.exports = { startChat, stopChat, isActive };
