const DigitalOceanProvider = require("./digitalocean");
const LinodeProvider = require("./linode");
const config = require("../config/config");

function getProvider(name, { legal = false, warranty = "low" } = {}) {
  const key = String(name).toLowerCase();

  if (key === "digitalocean") {
    return new DigitalOceanProvider({
      apiKey: legal ? config.providers.digitalocean.legalApi : config.providers.digitalocean.keys[warranty],
      legal,
      mode: config.mode
    });
  }

  if (key === "linode") {
    return new LinodeProvider({
      apiKey: legal ? config.providers.linode.legalApi : config.providers.linode.keys[warranty],
      legal,
      mode: config.mode
    });
  }

  throw new Error(`Provider tidak dikenal: ${name}`);
}

module.exports = { getProvider };
