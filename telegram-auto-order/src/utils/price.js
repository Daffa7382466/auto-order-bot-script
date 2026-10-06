const { getPrice } = require("../config/harga");
const { rupiah } = require("./format");

function fee(key) {
  return getPrice(key);
}

function total(items) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function breakdown(items) {
  return items.map((item) => ({
    label: item.label,
    amount: Number(item.amount || 0)
  }));
}

module.exports = { fee, total, breakdown, rupiah };
