// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCarrinho } from '../context/CarrinhoContext';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { 
  FiUser, 
  FiShoppingBag, 
  FiLogOut, 
  FiSettings, 
  FiPackage, 
  FiMenu, 
  FiX, 
  FiChevronRight, 
  FiHome
} from 'react-icons/fi';

export default function Navbar() {
  const navigate = useNavigate();
  const { totalItens, valorTotal, setCarrinhoAberto } = useCarrinho();
  
  const [usuario, setUsuario] = useState(null);
  const [nomeUsuario, setNomeUsuario] = useState('Cliente');
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false); 
  
  const menuRef = useRef();
  const sidebarRef = useRef();

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

  // Fecha os menus ao clicar fora
  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && !event.target.closest('.btn-sanduiche')) {
        setSidebarAberta(false);
      }
    }
    document.addEventListener('mousedown', fecharAoClicarFora);
    return () => document.removeEventListener('mousedown', fecharAoClicarFora);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuPerfilAberto(false);
      setSidebarAberta(false);
      navigate('/');
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <>
      {/* ─── NAVBAR PRINCIPAL ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-[#E5B299]/20 z-40 flex items-center justify-between px-6 font-['Montserrat']">
        
        {/* 🍔 BOTÃO MENU SANDUÍCHE */}
        <button 
          onClick={() => setSidebarAberta(!sidebarAberta)}
          className="btn-sanduiche text-[#4A3737] hover:text-[#B76E79] transition-colors p-1.5 rounded-full hover:bg-[#FAF9F6] flex items-center justify-center focus:outline-none"
          title="Abrir Menu"
        >
          <FiMenu size={24} className="stroke-[1.8]" />
        </button>

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

      {/* ─── SIDEBAR LATERAL (MENU COMPLETO) ─────────────────────────────────── */}
      {sidebarAberta && (
        <div className="fixed inset-0 bg-[#4A3737]/20 backdrop-blur-sm z-50 transition-opacity" />
      )}

      <aside 
        ref={sidebarRef}
        className={`fixed top-0 bottom-0 w-80 bg-[#FAF9F6] shadow-2xl z-50 border-r border-[#E5B299]/20 font-['Montserrat'] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          sidebarAberta ? 'left-0' : '-left-full'
        }`}
      >
        <div>
          {/* Topo com Link no Nome da Loja */}
          <div className="p-5 bg-white border-b border-[#E5B299]/10 flex items-center justify-between">
            <Link to="/" onClick={() => setSidebarAberta(false)} className="focus:outline-none group">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#B76E79] group-hover:text-[#a35c67] transition-colors">Importados da Val</span>
              <h3 className="text-sm font-bold text-[#4A3737] tracking-wide mt-0.5 group-hover:text-[#B76E79] transition-colors">Navegação</h3>
            </Link>
            <button 
              onClick={() => setSidebarAberta(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-[#4A3737] transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Links e Opções Internas */}
          <div className="p-5 space-y-6">
            
            {/* Bloco 1: Atalhos Principais com Ícone de Home */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Descobrir</p>
              
              {/* 🎯 NOVO LINK HOME COMPLETO */}
              <Link 
                to="/" 
                onClick={() => setSidebarAberta(false)} 
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-[#4A3737] hover:bg-white rounded-xl hover:text-[#B76E79] transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <FiHome size={15} className="text-[#B76E79]" /> Início / Catálogo
                </span>
                <FiChevronRight size={14} />
              </Link>

              <button 
                onClick={() => { navigate('/meus-pedidos'); setSidebarAberta(false); }} 
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-[#4A3737] hover:bg-white rounded-xl hover:text-[#B76E79] transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <FiPackage size={15} className="text-[#B76E79]" /> Acompanhar Meus Pedidos
                </span>
                <FiChevronRight size={14} />
              </button>
            </div>

            {/* Bloco 2: Filtros por tipo de Entrega */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Modalidade</p>
              <button onClick={() => { alert("Filtro Pronta Entrega em breve!"); setSidebarAberta(false); }} className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-[#4A3737] hover:bg-white rounded-xl hover:text-emerald-700 transition-all">
                ⚡ Produtos à Pronta Entrega <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Estoque</span>
              </button>
              <button onClick={() => { alert("Filtro Sob Encomenda em breve!"); setSidebarAberta(false); }} className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-[#4A3737] hover:bg-white rounded-xl hover:text-amber-700 transition-all">
                ✈️ Fazer Sob Encomenda <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">Importados</span>
              </button>
            </div>

            {/* Bloco 3: Suporte */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Ajuda</p>
              <a href="https://wa.me/seu-numero" target="_blank" rel="noreferrer" className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-[#4A3737] hover:bg-white rounded-xl hover:text-[#B76E79] transition-all">
                💬 Chamar no WhatsApp <FiChevronRight size={14} />
              </a>
            </div>

          </div>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 bg-white border-t border-[#E5B299]/10">
          {usuario ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Logado como</p>
                <h4 className="text-xs font-bold text-[#4A3737] truncate">{nomeUsuario}</h4>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                title="Sair da Conta"
              >
                <FiLogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { navigate('/login'); setSidebarAberta(false); }}
              className="w-full bg-[#B76E79] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center block hover:bg-[#a35c67] transition-all"
            >
              Fazer Login / Cadastrar
            </button>
          )}
        </div>
      </aside>
    </>
  );
}