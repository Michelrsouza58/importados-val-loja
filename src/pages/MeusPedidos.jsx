// src/pages/MeusPedidos.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiBox } from 'react-icons/fi';

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [encomendas, setEncomendas] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('pronta-entrega'); // 'pronta-entrega' ou 'encomendas'
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  // 1. Monitora o estado de login do usuário
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuario(user);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // 2. Busca Pedidos Globais e filtra pelo UID, e busca Encomendas direto no nó do Usuário
  useEffect(() => {
    if (!usuario) return;

    setCarregando(true);

    // 🛍️ Referência dos Pedidos Pronta Entrega (Nó Global)
    const pedidosRef = ref(db, 'pedidos');
    const unsubscribePedidos = onValue(pedidosRef, (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.val();
        const listaFormatada = Object.entries(dados).map(([key, valores]) => ({
          FirebaseKey: key,
          ...valores
        }));

        // Filtra para exibir apenas os pedidos deste usuário
        const meusPedidosFiltrados = listaFormatada.filter(
          (pedido) => pedido.UsuarioId === usuario.uid
        );

        // Ordena por número do pedido (mais recente primeiro)
        meusPedidosFiltrados.sort((a, b) => b.NumeroPedido.localeCompare(a.NumeroPedido));
        setPedidos(meusPedidosFiltrados);
      } else {
        setPedidos([]);
      }
    });

    // 📦 Referência das Encomendas (Nó específico do usuário)
    const encomendasRef = ref(db, `encomendas/${usuario.uid}`);
    const unsubscribeEncomendas = onValue(encomendasRef, (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.val();
        // Como o nó já é exclusivo do usuário, trazemos tudo e apenas formatamos o array
        const listaFormatada = Object.entries(dados).map(([key, valores]) => {
          // Cria um ID visual amigável baseado na chave do Firebase caso não tenha
          const codEncomenda = valores.LoteId 
            ? `#ENC-${valores.LoteId.substring(1, 7).toUpperCase()}`
            : `#ENC-${key.substring(1, 7).toUpperCase()}`;

          return {
            FirebaseKey: key,
            CodigoVisual: codEncomenda,
            ...valores
          };
        });

        // Ordena por data/hora mais recente
        listaFormatada.sort((a, b) => b.DataEncomenda.localeCompare(a.DataEncomenda));
        setEncomendas(listaFormatada);
      } else {
        setEncomendas([]);
      }
      
      // Desliga o esqueleto de carregamento após puxar ambos os nós
      setCarregando(false);
    });

    return () => {
      unsubscribePedidos();
      unsubscribeEncomendas();
    };
  }, [usuario]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 font-['Montserrat']">
      
      {/* Título Elegante */}
      <div className="pt-16 pb-6 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-['Playfair_Display'] italic text-[#4A3737] tracking-tight">
          Acompanhar <span className="text-[#B76E79]">Compras</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8C7A7A] font-light mt-3">
          Histórico de requisições e envios
        </p>
      </div>

      {/* 🎯 SELETOR DE ABAS (ESTILO BOUTIQUE) */}
      <div className="max-w-2xl mx-auto px-6 mb-8">
        <div className="flex bg-white border border-[#E5B299]/20 p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setAbaAtiva('pronta-entrega')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 focus:outline-none ${
              abaAtiva === 'pronta-entrega'
                ? 'bg-[#B76E79] text-white shadow-md'
                : 'text-[#4A3737] hover:bg-[#FAF9F6]'
            }`}
          >
            <FiPackage size={13} /> Pronta Entrega ({pedidos.length})
          </button>
          
          <button
            onClick={() => setAbaAtiva('encomendas')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 focus:outline-none ${
              abaAtiva === 'encomendas'
                ? 'bg-[#B76E79] text-white shadow-md'
                : 'text-[#4A3737] hover:bg-[#FAF9F6]'
            }`}
          >
            <FiBox size={13} /> Encomendas ({encomendas.length})
          </button>
        </div>
      </div>

      {/* Exibição do Conteúdo das Abas */}
      <div className="max-w-2xl mx-auto px-6">
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-6 h-6 border-2 border-[#B76E79] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">Sincronizando histórico...</span>
          </div>
        ) : (
          <>
            {/* 🛍️ RENDERIZA ABA: PRONTA ENTREGA */}
            {abaAtiva === 'pronta-entrega' && (
              pedidos.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E5B299]/20 rounded-3xl p-8 shadow-md">
                  <span className="text-3xl block mb-3">🛍️</span>
                  <p className="text-xs uppercase tracking-wider text-[#4A3737] font-bold">Nenhum pedido de pronta entrega.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {pedidos.map((pedido) => (
                    <div key={pedido.FirebaseKey} className="bg-white rounded-3xl border border-[#E5B299]/20 p-6 shadow-md shadow-[#E5B299]/10">
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                        <div>
                          <span className="text-xs font-bold text-[#4A3737] tracking-wider block font-mono">
                            ID: {pedido.NumeroPedido}
                          </span>
                          <span className="text-[10px] text-slate-400 font-light mt-0.5 block">
                            Feito em {pedido.DataPedido} às {pedido.HoraPedido}
                          </span>
                        </div>
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase">
                          {pedido.Status || 'Pendente'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {pedido.Itens && pedido.Itens.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <div className="text-slate-600 truncate max-w-[75%]">
                              <span className="font-bold text-[#4A3737] font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded mr-2">
                                {item.Quantidade}x
                              </span>
                              <span className="uppercase tracking-wide text-[11px]">{item.Nome}</span>
                            </div>
                            <span className="text-slate-400 font-mono">
                              R$ {(item.PrecoReal * item.Quantidade).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C7A7A]">Total:</span>
                        <span className="text-base font-['Playfair_Display'] font-black text-[#B76E79]">
                          R$ {Number(pedido.ValorTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* 📦 RENDERIZA ABA: ENCOMENDAS */}
            {abaAtiva === 'encomendas' && (
              encomendas.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E5B299]/20 rounded-3xl p-8 shadow-md">
                  <span className="text-3xl block mb-3">📦</span>
                  <p className="text-xs uppercase tracking-wider text-[#4A3737] font-bold">Você não possui solicitações de encomendas.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {encomendas.map((encomenda) => (
                    <div key={encomenda.FirebaseKey} className="bg-white rounded-3xl border border-amber-200/60 p-6 shadow-md shadow-amber-600/5">
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-amber-100 pb-4 mb-4">
                        <div>
                          <span className="text-xs font-bold text-amber-900 tracking-wider block font-mono">
                            CÓD: {encomenda.CodigoVisual}
                          </span>
                          <span className="text-[10px] text-slate-400 font-light mt-0.5 block">
                            Solicitado em {encomenda.DataEncomenda} às {encomenda.HoraEncomenda}
                          </span>
                        </div>
                        {/* Status Diferenciado de Encomenda */}
                        <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase">
                          {encomenda.Status || 'Aguardando Compra'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {encomenda.Itens && encomenda.Itens.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <div className="text-slate-600 truncate max-w-[75%]">
                              <span className="font-bold text-amber-800 font-mono bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded mr-2">
                                {item.Quantidade}x
                              </span>
                              <span className="uppercase tracking-wide text-[11px] text-slate-700">{item.Nome}</span>
                            </div>
                            <span className="text-slate-400 font-mono">
                              Preço Estimado: R$ {Number(item.PrecoReal).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 bg-amber-50/50 rounded-xl p-3 border border-amber-100/50 text-center">
                        <p className="text-[10px] text-amber-800 italic">
                          A Val foi notificada sobre este item e o trará na próxima remessa importada! ✈️
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}