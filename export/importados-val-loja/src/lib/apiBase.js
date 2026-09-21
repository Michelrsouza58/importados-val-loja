// src/lib/apiBase.js
// Base da API serverless (Cloudflare Pages Functions em produção; backend de teste no preview).
let base = "";
try {
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) {
    base = process.env.REACT_APP_BACKEND_URL;
  }
} catch (e) {
  base = "";
}
export default base;