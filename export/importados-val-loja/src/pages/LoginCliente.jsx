// src/pages/LoginCliente.jsx
import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiMail, FiLock, FiUser } from "react-icons/fi";
import imagemBanner from "../assets/Importados.png";

export default function LoginCliente() {
  const [ehCadastro, setEhCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleAutenticacao = async (e) => {
    e.preventDefault();
    if (!email || !senha || (ehCadastro && !nome)) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setCarregando(true);
    try {
      if (ehCadastro) {
        const credencial = await createUserWithEmailAndPassword(auth, email, senha);
        const usuario = credencial.user;
        await set(ref(db, `clientes/${usuario.uid}`), {
          Id: usuario.uid,
          Nome: nome,
          Email: email,
          DataCadastro: new Date().toLocaleDateString("pt-BR"),
        });
        toast.success("Conta criada com sucesso! Seja bem-vinda(o).");
      } else {
        await signInWithEmailAndPassword(auth, email, senha);
      }
      navigate("/");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") toast.error("Este e-mail já está cadastrado.");
      else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") toast.error("E-mail ou senha incorretos.");
      else if (error.code === "auth/user-not-found") toast.error("Usuário não encontrado.");
      else if (error.code === "auth/unauthorized-domain")
        toast.error("Domínio não autorizado no Firebase: adicione este endereço em Authentication > Settings > Authorized domains.");
      else toast.error("Erro ao autenticar. Verifique os dados e tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-creme flex pt-16" data-testid="pagina-login">
      <div className="hidden md:block md:w-1/2 relative bg-ink">
        <img src={imagemBanner} alt="Importados da Val" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent flex flex-col justify-end p-12 text-creme">
          <h2 className="font-display text-3xl italic tracking-wide">A autenticidade da beleza</h2>
          <p className="text-[11px] uppercase tracking-[0.25em] text-creme/70 mt-2">
            Sua curadoria exclusiva de importados
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl border border-pessego/20 p-8 md:p-10 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display italic text-espresso">
              Val <span className="text-rose font-bold">Importados da Val</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-espresso/40 mt-2 font-medium">
              {ehCadastro ? "Crie sua conta de prestígio" : "Acesse seu espaço exclusivo"}
            </p>
          </div>

          <form onSubmit={handleAutenticacao} className="space-y-5">
            {ehCadastro && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">Nome Completo</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-rose" size={14} />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como prefere ser chamada(o)?"
                    className="w-full pl-11 pr-4 py-3 bg-creme/60 border border-pessego/30 rounded-xl focus:outline-none focus:border-rose text-xs tracking-wide transition-all"
                    data-testid="login-campo-nome"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">E-mail</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-rose" size={14} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-11 pr-4 py-3 bg-creme/60 border border-pessego/30 rounded-xl focus:outline-none focus:border-rose text-xs tracking-wide transition-all"
                  data-testid="login-campo-email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">Senha</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-rose" size={14} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-creme/60 border border-pessego/30 rounded-xl focus:outline-none focus:border-rose text-xs tracking-wide transition-all"
                  data-testid="login-campo-senha"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-rose hover:bg-rosedark disabled:bg-rose/40 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md mt-6 flex items-center justify-center"
              data-testid="login-botao-enviar"
            >
              {carregando ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : ehCadastro ? (
                "Criar Conta"
              ) : (
                "Entrar no Espaço"
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-espresso/5">
            <button
              onClick={() => setEhCadastro(!ehCadastro)}
              className="text-[11px] text-espresso/50 hover:text-rose tracking-wide transition-colors"
              data-testid="login-alternar-cadastro"
            >
              {ehCadastro ? (
                <span>
                  Já possui uma conta? <strong className="font-bold text-rose">Faça Login</strong>
                </span>
              ) : (
                <span>
                  Não tem conta? <strong className="font-bold text-rose">Cadastre-se aqui</strong>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
