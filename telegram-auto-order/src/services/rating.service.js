const { collection, save } = require('./store.service');
const labels = { 1:'Worst Order', 2:'Bad News', 3:'Need improve', 4:'Good Score', 5:'Great Score!' };
function createRating(data) {
  const ratings = collection('ratings');
  const rating = { id:`RATE-${Date.now()}-${Math.floor(Math.random()*1000)}`, createdAt:new Date().toISOString(), ...data, level:labels[data.score] || 'Unknown' };
  ratings.push(rating); save('ratings', ratings); return rating;
}
function getRating(id){ return collection('ratings').find(x=>x.id===id) || null; }
module.exports = { createRating, getRating, labels };
