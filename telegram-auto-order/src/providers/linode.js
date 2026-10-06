class LinodeProvider {
  constructor({ apiKey, legal, mode }) {
    this.name = "Linode";
    this.apiKey = apiKey;
    this.legal = legal;
    this.mode = mode;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async getPlans() {
    if (this.mode === "exhibition") return demoPlans();
    if (!this.apiKey) return [];
    // TODO: connect to Linode API.
    return [];
  }

  async getRegions() {
    if (this.mode === "exhibition") return demoRegions();
    if (!this.apiKey) return [];
    return [];
  }

  async getImages() {
    if (this.mode === "exhibition") return demoImages();
    if (!this.apiKey) return [];
    return [];
  }

  async checkAvailability() {
    return this.mode === "exhibition" || this.isConfigured();
  }

  async createServer(payload) {
    if (this.mode === "exhibition") {
      return {
        simulated: true,
        id: `EXHIBITION-LINODE-${Date.now()}`,
        ip: "203.0.113.20",
        username: "root",
        password: "EXHIBITION-PASSWORD"
      };
    }
    if (!this.apiKey) throw new Error("Linode API belum dikonfigurasi.");
    throw new Error("Linode production provisioning belum diaktifkan pada prototype.");
  }
}

function demoPlans() {
  return [
    { id: "r8c4", name: "R8C4", ram: 8192, cpu: 4, disk: 80 },
    { id: "s4c8", name: "S4C8", ram: 16384, cpu: 8, disk: 160 },
    { id: "h8c16", name: "H8C16", ram: 32768, cpu: 16, disk: 320 }
  ];
}

function demoRegions() {
  return [{ id: "singapore", name: "Singapore" }, { id: "newark", name: "Newark" }];
}

function demoImages() {
  return [{ id: "ubuntu", name: "Ubuntu" }, { id: "debian", name: "Debian" }];
}

module.exports = LinodeProvider;
