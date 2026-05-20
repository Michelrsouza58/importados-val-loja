// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCarrinho } from '../context/CarrinhoContext';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { FiUser, FiShoppingBag, FiLogOut, FiSettings, FiPackage, FiHome } from 'react-icons/fi';

export default function Navbar() {
  const navigate = useNavigate();
  const { totalItens, valorTotal, setCarrinhoAberto } = useCarrinho();
  
  const [usuario, setUsuario] = useState(null);
  const [nomeUsuario, setNomeUsuario] = useState('Cliente');
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  
  const menuRef = useRef();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) {
        const clienteRef = ref(db, `clientes/${user.uid}`);
        onValue(clienteRef, (snapshot) => {
          if (snapshot.exists()) {
            const dados = snapshot.val();
            if (dados.Nome) {
              const primeiroNome = dados.Nome.split(' ')[0];
              setNomeUsuario(primeiroNome);
            }
          } else {
            setNomeUsuario('Cliente');
          }
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener('mousedown', fecharAoClicarFora);
    return () => document.removeEventListener('mousedown', fecharAoClicarFora);
  }, []);

  // 🎯 CORREÇÃO LOGOUT: Agora desloga e joga o usuário direto para o Catálogo público
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuPerfilAberto(false);
      navigate('/'); // 👈 Redireciona para o catálogo inicial
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-[#E5B299]/20 z-50 flex items-center justify-between px-6 font-['Montserrat']">
      
      {/* 🎯 NOVO BOTÃO HOME: Substituiu o texto "VAL I." pelo ícone de casinha Rose Gold premium */}
      <Link 
        to="/" 
        className="text-[#4A3737] hover:text-[#B76E79] transition-colors p-1.5 rounded-full hover:bg-[#FAF9F6] flex items-center justify-center focus:outline-none"
        title="Voltar ao Catálogo"
      >
        <FiHome size={22} className="stroke-[1.8]" />
      </Link>

      <div className="flex items-center gap-5">
        
        {/* Menu de Perfil */}
        {usuario ? (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
              className="text-[#4A3737] hover:text-[#B76E79] transition-colors p-1 flex items-center justify-center focus:outline-none"
            >
              <FiUser size={19} />
            </button>

            {menuPerfilAberto && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-[#E5B299]/30 rounded-2xl shadow-xl shadow-[#4A3737]/5 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-50">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Conta de Acesso</p>
                  <h4 className="text-xs font-bold text-[#4A3737] mt-0.5 truncate">Olá, {nomeUsuario}! ✨</h4>
                  <p className="text-[9px] text-slate-400 truncate font-mono mt-0.5">{usuario.email}</p>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button 
                    onClick={() => { navigate('/meus-pedidos'); setMenuPerfilAberto(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs text-[#4A3737] hover:bg-[#FAF9F6] hover:text-[#B76E79] rounded-xl transition-all font-medium"
                  >
                    <FiPackage size={14} /> Meus Pedidos
                  </button>
                  <button 
                    onClick={() => { alert("Configurações abrirão em breve!"); setMenuPerfilAberto(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs text-[#4A3737] hover:bg-[#FAF9F6] hover:text-[#B76E79] rounded-xl transition-all font-medium"
                  >
                    <FiSettings size={14} /> Configurações
                  </button>
                </div>

                <div className="border-t border-slate-50 p-1.5 mt-1">
                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold"
                  >
                    <FiLogOut size={14} /> Sair da Conta
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="text-[10px] font-bold text-[#4A3737] tracking-widest uppercase hover:text-[#B76E79] border border-[#E5B299]/30 px-3 py-1.5 rounded-full transition-all bg-white hover:bg-[#FAF9F6]"
          >
            Entrar
          </button>
        )}

        {/* Botão da Sacola */}
        <button onClick={() => setCarrinhoAberto(true)} className="flex items-center gap-2.5 group focus:outline-none">
          <div className="relative p-0.5">
            <FiShoppingBag size={20} className="text-[#4A3737] group-hover:text-[#B76E79] transition-colors" />
            {totalItens > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#B76E79] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {totalItens}
              </span>
            )}
          </div>
          {totalItens > 0 && (
            <span className="hidden md:inline text-[11px] font-bold text-[#B76E79] font-mono pt-0.5">
              R$ {valorTotal.toFixed(2)}
            </span>
          )}
        </button>

      </div>
    </nav>
  );
}