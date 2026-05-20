// src/pages/LoginCliente.jsx
import React, { useState } from 'react';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

// 🎯 Importação da imagem que você vai salvar na pasta src/assets
import imagemBanner from '../assets/Importados.png'; 

export default function LoginCliente() {
  const [ehCadastro, setEhCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const navigate = useNavigate();

  const handleAutenticacao = async (e) => {
    e.preventDefault();
    if (!email || !senha || (ehCadastro && !nome)) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setCarregando(true);
    try {
      if (ehCadastro) {
        // 🛠️ FLUXO DE CADASTRO
        const credencial = await createUserWithEmailAndPassword(auth, email, senha);
        const usuario = credencial.user;

        // Salva os dados extras do cliente no Realtime Database
        await set(ref(db, `clientes/${usuario.uid}`), {
          Id: usuario.uid,
          Nome: nome,
          Email: email,
          DataCadastro: new Date().toLocaleDateString('pt-BR')
        });

        alert("Conta criada com sucesso! Seja bem-vinda(o).");
      } else {
        // 🔓 FLUXO DE LOGIN
        await signInWithEmailAndPassword(auth, email, senha);
      }
      
      // Após logar ou cadastrar com sucesso, manda o cliente de volta para o catálogo
      navigate('/');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') alert('Este e-mail já está cadastrado.');
      else if (error.code === 'auth/wrong-password') alert('Senha incorreta.');
      else if (error.code === 'auth/user-not-found') alert('Usuário não encontrado.');
      else alert('Erro ao autenticar. Verifique os dados e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-['Montserrat']">
      
      {/* 📸 LADO ESQUERDO: Imagem de Banner Premium (Esconde no Mobile para focar no formulário) */}
      <div className="hidden md:block md:w-1/2 relative bg-slate-900">
        <img 
          src={imagemBanner} 
          alt="Val Importados Banner" 
          className="w-full h-full object-cover opacity-85"
        />
        {/* Camada de sofisticação por cima da foto */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#4A3737]/60 via-transparent to-transparent flex flex-col justify-end p-12 text-white">
          <h2 className="font-['Playfair_Display'] text-3xl italic tracking-wide">A autenticidade da beleza</h2>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#FAF9F6]/80 mt-2">Sua curadoria exclusiva de importados</p>
        </div>
      </div>

      {/* ✍️ LADO DIREITO: Formulário de Login/Cadastro */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5B299]/20 p-8 md:p-10 shadow-xl shadow-[#E5B299]/10">
          
          {/* Identidade */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-['Playfair_Display'] italic text-[#4A3737]">
              Val <span className="text-[#B76E79] font-bold">Importados da Val</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2 font-medium">
              {ehCadastro ? 'Crie sua conta de prestígio' : 'Acesse seu espaço exclusivo'}
            </p>
          </div>

          <form onSubmit={handleAutenticacao} className="space-y-5">
            
            {/* Campo Nome (Apenas visível se for tela de Cadastro) */}
            {ehCadastro && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A7A]">Nome Completo</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B76E79]" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como prefere ser chamada(o)?"
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF9F6]/50 border border-[#E5B299]/30 rounded-xl focus:outline-none focus:border-[#B76E79] text-xs tracking-wide transition-all"
                  />
                </div>
              </div>
            )}

            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A7A]">E-mail</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B76E79]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF9F6]/50 border border-[#E5B299]/30 rounded-xl focus:outline-none focus:border-[#B76E79] text-xs tracking-wide transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A7A]">Senha</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B76E79]" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF9F6]/50 border border-[#E5B299]/30 rounded-xl focus:outline-none focus:border-[#B76E79] text-xs tracking-wide transition-all"
                />
              </div>
            </div>

            {/* Botão Principal de Ação */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#B76E79] hover:bg-[#a35c67] disabled:bg-slate-200 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md mt-6 flex items-center justify-center"
            >
              {carregando ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : ehCadastro ? (
                'Criar Conta'
              ) : (
                'Entrar no Espaço'
              )}
            </button>
          </form>

          {/* Alternador de Telas (Login <-> Cadastro) */}
          <div className="text-center mt-6 pt-5 border-t border-slate-100">
            <button
              onClick={() => setEhCadastro(!ehCadastro)}
              className="text-[11px] text-[#8C7A7A] hover:text-[#B76E79] tracking-wide transition-colors focus:outline-none"
            >
              {ehCadastro ? (
                <span>Já possui uma conta? <strong className="font-bold text-[#B76E79]">Faça Login</strong></span>
              ) : (
                <span>Não tem conta? <strong className="font-bold text-[#B76E79]">Cadastre-se aqui</strong></span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}