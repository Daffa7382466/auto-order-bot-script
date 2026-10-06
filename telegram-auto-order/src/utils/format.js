function rupiah(value) {
  return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
}

function cleanUsername(username) {
  if (!username) return "-";
  return username.startsWith("@") ? username : `@${username}`;
}

module.exports = { rupiah, cleanUsername };
