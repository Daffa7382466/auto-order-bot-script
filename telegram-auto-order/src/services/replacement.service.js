const { createRequest } = require("./support.service");

function createReplacementRequest({ userId, orderId, screenshotFileId, chronology, currentSituation }) {
  return createRequest({
    type: "vps_replace",
    userId,
    orderId,
    screenshotFileId,
    chronology,
    currentSituation
  });
}

module.exports = { createReplacementRequest };
