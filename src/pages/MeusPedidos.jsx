// src/pages/MeusPedidos.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { ref, onValue, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiBox, FiCreditCard, FiTrash2 } from 'react-icons/fi';

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [encomendas, setEncomendas] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('pronta-entrega'); // 'pronta-entrega' ou 'encomendas'
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [processandoAcao, setProcessandoAcao] = useState(null); // Rastreia qual card está em ação
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
        const listaFormatada = Object.entries(dados).map(([key, valores]) => {
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
      
      setCarregando(false);
    });

    return () => {
      unsubscribePedidos();
      unsubscribeEncomendas();
    };
  }, [usuario]);

  // 🎯 AÇÃO: Cancelar Pedido Dinamicamente
  const handleCancelarPedido = async (firebaseKey, tipo) => {
    if (!window.confirm("Deseja realmente cancelar esta solicitação?")) return;
    
    setProcessandoAcao(firebaseKey);
    try {
      const rota = tipo === 'pedido' ? `pedidos/${firebaseKey}` : `encomendas/${usuario.uid}/${firebaseKey}`;
      await update(ref(db, rota), { Status: 'Cancelado' });
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      alert("Não foi possível cancelar o pedido. Tente novamente.");
    } finally {
      setProcessandoAcao(null);
    }
  };

  // 🎯 AÇÃO: Pagar Novamente (Dispara nova requisição para a InfinitePay)
  const handlePagarNovamente = async (pedido) => {
    setProcessandoAcao(pedido.FirebaseKey);
    try {
      const payloadInfinitePay = {
        handle: "michelrsouza",
        redirect_url: window.location.origin + "/meus-pedidos",
        order_nsu: pedido.NumeroPedidoLimpo || pedido.FirebaseKey.replace(/[^a-zA-Z0-9]/g, ''),
        items: pedido.Itens.map(item => ({
          name: item.Nome.toUpperCase(),
          price: Math.round(Number(item.PrecoReal) * 100),
          quantity: item.Quantidade
        }))
      };

      const resposta = await fetch("https://api.checkout.infinitepay.io/links", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadInfinitePay)
      });

      if (!resposta.ok) throw new Error("Erro na InfinitePay");

      const dadosRetorno = await resposta.json();
      if (dadosRetorno.url) {
        window.location.href = dadosRetorno.url;
      } else {
        alert("Não foi possível recuperar o link de pagamento.");
      }
    } catch (error) {
      console.error("Erro ao processar pagamento de segunda via:", error);
      alert("Falha ao conectar com a InfinitePay. Tente mais tarde.");
    } finally {
      setProcessandoAcao(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 font-['Montserrat']">
      
      <div className="pt-16 pb-6 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-['Playfair_Display'] italic text-[#4A3737] tracking-tight">
          Acompanhar <span className="text-[#B76E79]">Compras</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8C7A7A] font-light mt-3">
          Histórico de requisições e envios
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 mb-8">
        <div className="flex bg-white border border-[#E5B299]/20 p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setAbaAtiva('pronta-entrega')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 focus:outline-none ${
              abaAtiva === 'pronta-entrega' ? 'bg-[#B76E79] text-white shadow-md' : 'text-[#4A3737] hover:bg-[#FAF9F6]'
            }`}
          >
            <FiPackage size={13} /> Pronta Entrega ({pedidos.length})
          </button>
          
          <button
            onClick={() => setAbaAtiva('encomendas')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 focus:outline-none ${
              abaAtiva === 'encomendas' ? 'bg-[#B76E79] text-white shadow-md' : 'text-[#4A3737] hover:bg-[#FAF9F6]'
            }`}
          >
            <FiBox size={13} /> Encomendas ({encomendas.length})
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6">
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-6 h-6 border-2 border-[#B76E79] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">Sincronizando histórico...</span>
          </div>
        ) : (
          <>
            {/* 🛍️ ABA: PRONTA ENTREGA */}
            {abaAtiva === 'pronta-entrega' && (
              pedidos.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E5B299]/20 rounded-3xl p-8 shadow-md">
                  <span className="text-3xl block mb-3">🛍️</span>
                  <p className="text-xs uppercase tracking-wider text-[#4A3737] font-bold">Nenhum pedido de pronta entrega.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {pedidos.map((pedido) => {
                    const aguardandoPagamento = pedido.Status === 'Aguardando Pagamento';
                    const ehCancelado = pedido.Status === 'Cancelado';
                    
                    return (
                      <div key={pedido.FirebaseKey} className={`bg-white rounded-3xl border p-6 shadow-md shadow-[#E5B299]/10 ${ehCancelado ? 'border-slate-200 bg-slate-50/50' : 'border-[#E5B299]/20'}`}>
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                          <div>
                            <span className="text-xs font-bold text-[#4A3737] tracking-wider block font-mono">
                              ID: {pedido.NumeroPedido}
                            </span>
                            <span className="text-[10px] text-slate-400 font-light mt-0.5 block">
                              Feito em {pedido.DataPedido} às {pedido.HoraPedido}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase border ${
                            ehCancelado ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            aguardandoPagamento ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse' :
                            'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
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
                                <span className={`uppercase tracking-wide text-[11px] ${ehCancelado ? 'line-through text-slate-400' : ''}`}>{item.Nome}</span>
                              </div>
                              <span className="text-slate-400 font-mono">
                                R$ {(item.PrecoReal * item.Quantidade).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C7A7A]">Total:</span>
                          <span className={`text-base font-['Playfair_Display'] font-black ${ehCancelado ? 'text-slate-400 line-through' : 'text-[#B76E79]'}`}>
                            R$ {Number(pedido.ValorTotal).toFixed(2)}
                          </span>
                        </div>

                        {aguardandoPagamento && (
                          <div className="mt-4 pt-4 border-t border-dashed border-slate-100 flex gap-3">
                            <button
                              disabled={processandoAcao !== null}
                              onClick={() => handlePagarNovamente(pedido)}
                              className="flex-1 bg-[#4A3737] hover:bg-[#5c4545] text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                            >
                              <FiCreditCard size={12} /> Pagar Agora
                            </button>
                            <button
                              disabled={processandoAcao !== null}
                              onClick={() => handleCancelarPedido(pedido.FirebaseKey, 'pedido')}
                              className="px-4 border border-rose-200 hover:bg-rose-50 text-rose-600 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                              title="Cancelar Pedido"
                            >
                              <FiTrash2 size={12} /> Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* 📦 ABA: ENCOMENDAS */}
            {abaAtiva === 'encomendas' && (
              encomendas.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E5B299]/20 rounded-3xl p-8 shadow-md">
                  <span className="text-3xl block mb-3">📦</span>
                  <p className="text-xs uppercase tracking-wider text-[#4A3737] font-bold">Você não possui solicitações de encomendas.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {encomendas.map((encomenda) => {
                    const aguardandoPagamento = encomenda.Status === 'Aguardando Pagamento';
                    const ehCancelado = encomenda.Status === 'Cancelado';

                    return (
                      <div key={encomenda.FirebaseKey} className={`bg-white rounded-3xl border p-6 shadow-md shadow-amber-600/5 ${ehCancelado ? 'border-slate-200 bg-slate-50/50' : 'border-amber-200/60'}`}>
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-amber-100 pb-4 mb-4">
                          <div>
                            <span className="text-xs font-bold text-amber-900 tracking-wider block font-mono">
                              CÓD: {encomenda.CodigoVisual}
                            </span>
                            <span className="text-[10px] text-slate-400 font-light mt-0.5 block">
                              Solicitado em {encomenda.DataEncomenda} às {encomenda.HoraEncomenda}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase border ${
                            ehCancelado ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            aguardandoPagamento ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse' :
                            'bg-amber-50 border-amber-200 text-amber-800'
                          }`}>
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
                                <span className={`uppercase tracking-wide text-[11px] text-slate-700 ${ehCancelado ? 'line-through text-slate-400' : ''}`}>{item.Nome}</span>
                              </div>
                              <span className="text-slate-400 font-mono">
                                R$ {Number(item.PrecoReal).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {aguardandoPagamento && (
                          <div className="mt-4 pt-3 border-t border-dashed border-amber-100 flex justify-end">
                            <button
                              disabled={processandoAcao !== null}
                              onClick={() => handleCancelarPedido(encomenda.FirebaseKey, 'encomenda')}
                              className="w-full border border-rose-200 hover:bg-rose-50 text-rose-600 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                            >
                              <FiTrash2 size={12} /> Cancelar Solicitação
                            </button>
                          </div>
                        )}

                        {!ehCancelado && !aguardandoPagamento && (
                          <div className="mt-4 bg-amber-50/50 rounded-xl p-3 border border-amber-100/50 text-center">
                            <p className="text-[10px] text-amber-800 italic">
                              A Val foi notificada sobre este item e o trará na próxima remessa importada! ✈️
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}