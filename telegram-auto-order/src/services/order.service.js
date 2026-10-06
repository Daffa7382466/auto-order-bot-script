const { getPrice } = require('../config/harga');
const config = require('../config/config');
const { collection, save } = require('./store.service');

function makeId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `ORD-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}
function createOrder(data) {
  const orders = collection('orders');
  const order = { id: makeId(), status: 'awaiting_payment', createdAt: new Date().toISOString(), ...data };
  orders.push(order); save('orders', orders); return order;
}
function getOrder(id) { return collection('orders').find(o => o.id === id) || null; }
function updateOrder(id, patch) {
  const orders = collection('orders');
  const idx = orders.findIndex(o => o.id === id); if (idx < 0) return null;
  orders[idx] = { ...orders[idx], ...patch, updatedAt: new Date().toISOString() };
  save('orders', orders); return orders[idx];
}
function listOrdersByUser(userId) { return collection('orders').filter(o => String(o.userId) === String(userId)); }
function calculateRegularFee({ provider, warranty, spec, region, os }) {
  return [
    { label: 'VPS specification fee', amount: getPrice(`${provider}_vps_${spec}`) },
    { label: 'Warranty package fee', amount: getPrice(`${provider}_${warranty}`) },
    { label: 'Region fee', amount: getPrice(`${provider}_region_${region}`) },
    { label: 'OS fee', amount: getPrice(`${provider}_os_${os}`) }
  ];
}
function calculateLegalFee({ provider, spec, region, os }) {
  return [
    { label: 'Legal VPS specification fee', amount: getPrice(`${provider}_legal_vps_${spec}`) },
    { label: 'Legal region fee', amount: getPrice(`${provider}_legal_region_${region}`) },
    { label: 'Legal OS fee', amount: getPrice(`${provider}_legal_os_${os}`) }
  ];
}
function calculateTotal(items) { return items.reduce((s, x) => s + Number(x.amount || 0), 0); }
function warrantyInfo(key) { return config.warranty[key]; }
module.exports = { createOrder, getOrder, updateOrder, listOrdersByUser, calculateRegularFee, calculateLegalFee, calculateTotal, warrantyInfo };
