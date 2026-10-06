const fs = require("fs");
const path = require("path");

const PRICE_PATTERN = /^\d{1,3}(\.\d{3})*$/;

function parseHargaEnv() {
  const file = path.resolve(process.cwd(), "harga.env");
  if (!fs.existsSync(file)) throw new Error("harga.env tidak ditemukan.");

  const result = {};
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx < 1) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();

    if (value === "0") {
      result[key] = 0;
      continue;
    }

    if (!PRICE_PATTERN.test(value)) {
      throw new Error(
        `Format harga tidak valid untuk ${key}: "${value}". Gunakan format seperti 1.000 atau 10.000.`
      );
    }

    result[key] = Number(value.replace(/\./g, ""));
  }

  return result;
}

const prices = parseHargaEnv();

function getPrice(key) {
  if (!(key in prices)) {
    throw new Error(`Harga belum dikonfigurasi: ${key}`);
  }
  return prices[key];
}

module.exports = { prices, getPrice, PRICE_PATTERN };
