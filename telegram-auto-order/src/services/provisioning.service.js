const { getProvider } = require("../providers/providerManager");

async function provision(order) {
  const provider = getProvider(order.provider, {
    legal: Boolean(order.legal),
    warranty: order.warranty || "low"
  });

  return provider.createServer({
    plan: order.spec,
    region: order.region,
    os: order.os
  });
}

module.exports = { provision };
