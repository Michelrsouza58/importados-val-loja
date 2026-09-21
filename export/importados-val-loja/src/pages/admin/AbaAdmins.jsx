// src/pages/admin/AbaAdmins.jsx
import React, { useState } from "react";
import { db, OWNER_EMAIL } from "../../lib/firebase";
import { ref, set } from "firebase/database";
import { toast } from "sonner";
import { listaAdmins } from "../../lib/configuracoes";
import { FiPlus, FiTrash2, FiShield } from "react-icons/fi";

export default function AbaAdmins({ config, usuario }) {
  const [novoEmail, setNovoEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const admins = listaAdmins(config);

  const adicionar = async () => {
    const email = novoEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (admins.includes(email)) {
      toast.error("Este e-mail já é administrador.");
      return;
    }
    setSalvando(true);
    try {
      const lista = admins.filter((e) => e !== OWNER_EMAIL.toLowerCase());
      lista.push(email);
      await set(ref(db, "configuracoes/admins"), lista);
      setNovoEmail("");
      toast.success("Administrador adicionado! A pessoa já pode acessar o painel após entrar com e-mail e senha.");
    } catch (erro) {
      toast.error("Falha ao salvar. Verifique as regras de escrita do Firebase.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (email) => {
    if (!window.confirm(`Remover o acesso de ${email}?`)) return;
    setSalvando(true);
    try {
      const lista = admins.filter((e) => e !== OWNER_EMAIL.toLowerCase() && e !== email);
      await set(ref(db, "configuracoes/admins"), lista);
      toast.success("Administrador removido.");
    } catch (erro) {
      toast.error("Falha ao remover.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div data-testid="admin-aba-admins">
      <div className="bg-white rounded-3xl border border-pessego/30 p-6 md:p-8 shadow-lg max-w-2xl">
        <h2 className="font-display text-xl font-bold text-espresso">Administradores</h2>
        <p className="text-[11px] text-espresso/50 mt-2 mb-8">
          E-mails com acesso ao painel. Cada pessoa precisa entrar no Firebase Authentication com e-mail e senha
          (pode usar a própria tela de login do site).
        </p>

        <div className="flex gap-2 mb-8">
          <input
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            placeholder="email@pessoa.com"
            className="flex-1 px-4 py-2.5 bg-creme/60 border border-pessego/30 rounded-xl focus:outline-none focus:border-rose text-xs text-espresso"
            data-testid="admin-admins-novo-email"
          />
          <button
            onClick={adicionar}
            disabled={salvando}
            className="flex items-center gap-2 bg-rose hover:bg-rosedark text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md transition-all"
            data-testid="admin-admins-adicionar-botao"
          >
            <FiPlus size={13} /> Adicionar
          </button>
        </div>

        <div className="space-y-3">
          {admins.map((email) => {
            const dona = email === OWNER_EMAIL.toLowerCase();
            return (
              <div
                key={email}
                className="flex items-center justify-between bg-creme/60 border border-pessego/20 rounded-2xl px-5 py-4"
                data-testid={`admin-admins-linha-${email.replace(/[^a-z0-9]/g, "")}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FiShield className={`shrink-0 ${dona ? "text-gold" : "text-rose"}`} size={16} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-espresso truncate">{email}</p>
                    <p className="text-[10px] text-espresso/40">{dona ? "Dona da loja (não pode ser removida)" : "Administradora"}</p>
                  </div>
                </div>
                {!dona && (
                  <button
                    onClick={() => remover(email)}
                    className="p-2 rounded-xl border border-rose/20 text-rose hover:bg-rose/5 transition-all"
                    aria-label={`Remover ${email}`}
                    data-testid={`admin-admins-remover-${email.replace(/[^a-z0-9]/g, "")}`}
                  >
                    <FiTrash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
