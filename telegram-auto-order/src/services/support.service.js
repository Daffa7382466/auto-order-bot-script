const requests = new Map();

function createRequest(data) {
  const id = `SUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const request = {
    id,
    status: "pending",
    createdAt: new Date().toISOString(),
    ...data
  };
  requests.set(id, request);
  return request;
}

function getRequest(id) {
  return requests.get(id);
}

function updateRequest(id, patch) {
  const request = requests.get(id);
  if (!request) return null;
  Object.assign(request, patch);
  return request;
}

module.exports = { createRequest, getRequest, updateRequest };
