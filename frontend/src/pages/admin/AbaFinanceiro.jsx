// src/pages/admin/AbaFinanceiro.jsx
import React, { useState } from "react";
import { db } from "../../lib/firebase";
import { ref, set } from "firebase/database";
import { toast } from "sonner";
import { TAXAS_PADRAO } from "../../lib/configuracoes";
import { brl, valorParcela } from "../../lib/formato";
import { FiSave } from "react-icons/fi";

export default function AbaFinanceiro({ config }) {
  const [taxas, setTaxas] = useState(() => {
    const t = {};
    for (let i = 1; i <= 12; i++) t[i] = String(config.financeiro.taxas[i] ?? "");
    return t;
  });
  const [descontoPix, setDescontoPix] = useState(String(config.financeiro.descontoPix ?? 0));
  const [maxParcelas, setMaxParcelas] = useState(String(config.financeiro.maxParcelas || 12));
  const [salvando, setSalvando] = useState(false);

  const setTaxa = (parcela, valor) => setTaxas((t) => ({ ...t, [parcela]: valor }));

  const salvar = async () => {
    setSalvando(true);
    try {
      const taxasNum = {};
      for (let i = 1; i <= 12; i++) {
        taxasNum[i] = Number(String(taxas[i]).replace(",", ".")) || 0;
      }
      await set(ref(db, "configuracoes/financeiro"), {
        taxas: taxasNum,
        descontoPix: Number(String(descontoPix).replace(",", ".")) || 0,
        maxParcelas: Math.min(12, Math.max(1, Number(maxParcelas) || 12)),
      });
      toast.success("Parâmetros financeiros salvos!");
    } catch (erro) {
      toast.error("Falha ao salvar. Verifique as regras de escrita do Firebase.");
    } finally {
      setSalvando(false);
    }
  };

  const campoClasse =
    "w-full px-3 py-2 bg-creme/60 border border-pessego/30 rounded-xl focus:outline-none focus:border-rose text-xs text-espresso font-mono";

  return (
    <div data-testid="admin-aba-financeiro">
      <div className="bg-white rounded-3xl border border-pessego/30 p-6 md:p-8 shadow-lg">
        <h2 className="font-display text-xl font-bold text-espresso">Parâmetros financeiros</h2>
        <p className="text-[11px] text-espresso/50 mt-2 mb-8">
          Taxas de parcelamento (percentual acrescido ao preço) e desconto do Pix. Estes valores alimentam
          automaticamente as simulações exibidas para o cliente.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/50 mb-4">
              Taxas por parcela (InfinitePay)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <div key={n} className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-espresso/40">{n}x</label>
                  <input
                    value={taxas[n]}
                    onChange={(e) => setTaxa(n, e.target.value)}
                    className={campoClasse}
                    inputMode="decimal"
                    placeholder="0.00"
                    data-testid={`admin-financeiro-taxa-${n}x`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">Desconto no Pix (%)</label>
                <input
                  value={descontoPix}
                  onChange={(e) => setDescontoPix(e.target.value)}
                  className={campoClasse}
                  inputMode="decimal"
                  placeholder="0"
                  data-testid="admin-financeiro-desconto-pix"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">Máx. parcelas (cartão)</label>
                <input
                  value={maxParcelas}
                  onChange={(e) => setMaxParcelas(e.target.value)}
                  className={campoClasse}
                  inputMode="numeric"
                  placeholder="12"
                  data-testid="admin-financeiro-max-parcelas"
                />
              </div>
            </div>

            <div className="bg-creme/70 border border-pessego/20 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-espresso/50 mb-3">Pré-visualização</p>
              <p className="text-xs text-espresso/60">
                Um produto de <strong className="font-mono">{brl(100)}</strong> fica:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-espresso/60">
                <li>
                  No Pix: <strong className="font-mono text-emerald-700">{brl(100 * (1 - (Number(String(descontoPix).replace(",", ".")) || 0) / 100))}</strong>{" "}
                  (com desconto)
                </li>
                <li>
                  Em 3x: <strong className="font-mono">{brl(valorParcela(100, 3, { 3: Number(String(taxas[3]).replace(",", ".")) || 0 }))}</strong> por mês
                </li>
                <li>
                  Em 12x: <strong className="font-mono">{brl(valorParcela(100, 12, { 12: Number(String(taxas[12]).replace(",", ".")) || 0 }))}</strong> por mês
                </li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="mt-8 w-full md:w-auto flex items-center justify-center gap-2 bg-espresso hover:bg-ink text-creme px-8 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-md transition-all"
          data-testid="admin-financeiro-salvar-botao"
        >
          <FiSave size={13} /> {salvando ? "Salvando..." : "Salvar Parâmetros"}
        </button>
      </div>
    </div>
  );
}
