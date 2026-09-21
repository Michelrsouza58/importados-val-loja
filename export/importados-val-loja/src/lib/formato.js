// src/lib/formato.js
export function brl(valor) {
  const n = Number(valor || 0);
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function taxaDe(taxas, parcelas) {
  if (!taxas) return 0;
  return Number(taxas[parcelas] ?? 0);
}

// valor: R$ ; taxas: {1: 4.2, ...} em %
export function valorParcela(valor, parcelas, taxas) {
  const taxa = taxaDe(taxas, parcelas) / 100;
  return (Number(valor || 0) * (1 + taxa)) / parcelas;
}

export function estoqueDe(item) {
  return Number(item && item.QuantidadeEstoque !== undefined ? item.QuantidadeEstoque : 0);
}

export function precoUnitarioDe(item) {
  return Number(item && item.precoUnit ? item.precoUnit : 0);
}
