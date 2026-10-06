const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const files = {
  orders: 'orders.json',
  users: 'users.json',
  products: 'products.json',
  ratings: 'ratings.json',
  requests: 'requests.json',
  replacements: 'replacements.json',
  inventory: 'inventory.json'
};

function read(name, fallback = []) {
  const file = path.join(DATA_DIR, files[name]);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function write(name, value) {
  const file = path.join(DATA_DIR, files[name]);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}
function collection(name) { return read(name, []); }
function save(name, value) { write(name, value); }

module.exports = { collection, save, DATA_DIR };
