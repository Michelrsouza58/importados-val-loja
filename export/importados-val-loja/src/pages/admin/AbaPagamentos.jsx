// src/pages/admin/AbaPagamentos.jsx
import React, { useState } from "react";
import { db } from "../../lib/firebase";
import { ref, set } from "firebase/database";
import { toast } from "sonner";
import { FiSave, FiInfo } from "react-icons/fi";

export default function AbaPagamentos({ config }) {
  const [form, setForm] = useState({
    infinitepayHandle: config.pagamentos.infinitepayHandle || "",
    infinitepayWebhookN8n: config.pagamentos.infinitepayWebhookN8n || "",
    mercadoPagoAccessToken: config.pagamentos.mercadoPagoAccessToken || "",
    mercadoPagoPublicKey: config.pagamentos.mercadoPagoPublicKey || "",
  });
  const [salvando, setSalvando] = useState(false);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const salvar = async () => {
    setSalvando(true);
    try {
      await set(ref(db, "configuracoes/pagamentos"), form);
      toast.success("Credenciais de pagamento salvas!");
    } catch (erro) {
      toast.error("Falha ao salvar. Verifique as regras de escrita do Firebase.");
    } finally {
      setSalvando(false);
    }
  };

  const campoClasse =
    "w-full px-4 py-2.5 bg-creme/60 border border-pessego/30 rounded-xl focus:outline-none focus:border-rose text-xs text-espresso font-mono";

  return (
    <div data-testid="admin-aba-pagamentos">
      <div className="bg-white rounded-3xl border border-pessego/30 p-6 md:p-8 shadow-lg">
        <h2 className="font-display text-xl font-bold text-espresso">Credenciais de pagamento</h2>
        <p className="text-[11px] text-espresso/50 mt-2">
          Preencha e atualize as credenciais quando quiser — o site passa a usá-las imediatamente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-creme/50 border border-pessego/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/60">InfinitePay — Pix</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">Sua @handle (sem o $)</label>
              <input
                value={form.infinitepayHandle}
                onChange={(e) => set("infinitepayHandle", e.target.value)}
                className={campoClasse}
                placeholder="ex: minhaloja"
                data-testid="admin-pagamentos-infinitepay-handle"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">Webhook n8n (opcional)</label>
              <input
                value={form.infinitepayWebhookN8n}
                onChange={(e) => set("infinitepayWebhookN8n", e.target.value)}
                className={campoClasse}
                placeholder="https://...app.n8n.cloud/webhook/checkout"
                data-testid="admin-pagamentos-infinitepay-webhook"
              />
              <p className="text-[10px] text-espresso/40">
                Se preenchido, o checkout Pix passa pelo seu fluxo do n8n. Se vazio, o site chama a InfinitePay direto.
              </p>
            </div>
          </div>

          <div className="bg-creme/50 border border-pessego/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-espresso/60">Mercado Pago — Cartão</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">Access Token (produção ou teste)</label>
              <input
                type="password"
                value={form.mercadoPagoAccessToken}
                onChange={(e) => set("mercadoPagoAccessToken", e.target.value)}
                className={campoClasse}
                placeholder="APP_USR-..."
                data-testid="admin-pagamentos-mp-token"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">Public Key (opcional)</label>
              <input
                value={form.mercadoPagoPublicKey}
                onChange={(e) => set("mercadoPagoPublicKey", e.target.value)}
                className={campoClasse}
                placeholder="APP_USR-..."
                data-testid="admin-pagamentos-mp-publickey"
              />
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <FiInfo className="text-amber-700 shrink-0 mt-0.5" size={13} />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                Obtenha em developers.mercadopago.com > Sua aplicação > Credenciais. No Cloudflare, configure também
                a variável MP_ACCESS_TOKEN na função serverless (veja o README do deploy).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="mt-8 w-full md:w-auto flex items-center justify-center gap-2 bg-espresso hover:bg-ink text-creme px-8 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-md transition-all"
          data-testid="admin-pagamentos-salvar-botao"
        >
          <FiSave size={13} /> {salvando ? "Salvando..." : "Salvar Credenciais"}
        </button>
      </div>
    </div>
  );
}
