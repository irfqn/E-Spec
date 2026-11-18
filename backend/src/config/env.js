const path = require("path");
const dotenv = require("dotenv");

// Memuat file .env dari folder backend
const envPath = path.resolve(__dirname, "../../.env");

const result = dotenv.config({
  path: envPath,
  override: true,
});

if (result.error) {
  throw new Error(`Gagal membaca file .env: ${result.error.message}`);
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,

  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  DB_SSL: process.env.DB_SSL === "true",
};