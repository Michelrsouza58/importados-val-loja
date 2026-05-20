// src/components/CarrinhoGaveta.jsx
import React, { useState } from 'react';
import { useCarrinho } from '../context/CarrinhoContext';
import { db, auth } from '../config/firebase';
import { ref, runTransaction, set, push } from 'firebase/database';
import { FiX, FiPlus, FiMinus, FiTrash2, FiCreditCard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function CarrinhoGaveta() {
  const navigate = useNavigate();
  const [processandoCheckout, setProcessandoCheckout] = useState(false);

  const { 
    carrinho, 
    carrinhoAberto, 
    setCarrinhoAberto, 
    atualizarQuantidade, 
    removerDoCarrinho, 
    valorTotal,
    limparCarrinho
  } = useCarrinho();

  if (!carrinhoAberto) return null;

  const executarCheckoutAutomatizado = async () => {
    if (carrinho.length === 0) return;

    const usuarioLogado = auth.currentUser;
    if (!usuarioLogado) {
      alert("Para concluir seu pagamento com segurança, faça login ou cadastre-se primeiro! 😊");
      setCarrinhoAberto(false);
      navigate('/login');
      return;
    }

    setProcessandoCheckout(true);

    const itensProntaEntrega = carrinho.filter(item => {
      const estoque = item.QuantidadeEstoque !== undefined ? Number(item.QuantidadeEstoque) : 0;
      return estoque > 0;
    });

    const itensEncomenda = carrinho.filter(item => {
      const estoque = item.QuantidadeEstoque !== undefined ? Number(item.QuantidadeEstoque) : 0;
      return estoque <= 0;
    });

    try {
      // 🎯 IDs de controle interno limpos (Sem o caractere # para não quebrar a API)
      let idPedidoLimpo = `ENC${Date.now().toString().substring(8)}`;
      let idLoteEncomenda = 'Nenhum';

      // Se houver pronta entrega, gera o ID sequencial com os zeros
      if (itensProntaEntrega.length > 0) {
        const contadorRef = ref(db, 'configuracoes/ultimoPedidoId');
        const resultadoContador = await runTransaction(contadorRef, (valorAtual) => {
          if (valorAtual === null) return 1;
          return valorAtual + 1;
        });
        const proximoId = resultadoContador.snapshot.val();
        
        // Formata apenas com os zeros (Ex: 0000005) para a InfinitePay aceitar liso
        idPedidoLimpo = String(proximoId).padStart(7, '0');
      }

      if (itensEncomenda.length > 0) {
        const loteRef = push(ref(db, `encomendas/${usuarioLogado.uid}`));
        idLoteEncomenda = loteRef.key;
      }

      // 💾 1. SALVA NO FIREBASE (Aqui no banco nós guardamos com o # para manter seu padrão visual)
      if (itensProntaEntrega.length > 0) {
        const novoPedidoRef = push(ref(db, 'pedidos'));
        await set(novoPedidoRef, {
          NumeroPedido: `#${idPedidoLimpo}`, // No banco fica #0000005
          NumeroPedidoLimpo: idPedidoLimpo, // Guardamos a versão limpa para o n8n achar fácil depois
          UsuarioId: usuarioLogado.uid,
          UsuarioEmail: usuarioLogado.email,
          Itens: itensProntaEntrega.map(i => ({ Id: i.Id, Nome: i.Nome, PrecoReal: i.PrecoReal, Quantidade: i.quantidadeCarrinho })),
          ValorTotal: itensProntaEntrega.reduce((soma, i) => soma + (i.PrecoReal * i.quantidadeCarrinho), 0),
          DataPedido: new Date().toLocaleDateString('pt-BR'),
          HoraPedido: new Date().toLocaleTimeString('pt-BR'),
          Status: 'Aguardando Pagamento'
        });
      }

      if (itensEncomenda.length > 0) {
        await set(ref(db, `encomendas/${usuarioLogado.uid}/${idLoteEncomenda}`), {
          LoteId: idLoteEncomenda,
          UsuarioEmail: usuarioLogado.email,
          DataEncomenda: new Date().toLocaleDateString('pt-BR'),
          HoraEncomenda: new Date().toLocaleTimeString('pt-BR'),
          Status: 'Aguardando Pagamento',
          Itens: itensEncomenda.map(i => ({ Id: i.Id, Nome: i.Nome, PrecoReal: i.PrecoReal, Quantidade: i.quantidadeCarrinho }))
        });
      }

      // DETERMINA QUAL ID ENVIAR NA COBRANÇA (Se tiver pronta entrega vai o número, se não vai o código da encomenda)
      const nsuCheckout = itensProntaEntrega.length > 0 ? idPedidoLimpo : idLoteEncomenda.replace(/[^a-zA-Z0-9]/g, '');

      // 🎯 2. PAYLOAD ATUALIZADO CONFORME REQUISITOS DA DOCUMENTAÇÃO
      const payloadInfinitePay = {
        handle: "michelrsouza", // 👈 Seu handle oficial configurado
        redirect_url: window.location.origin + "/meus-pedidos",
        order_nsu: nsuCheckout, // 👈 ID sem caracteres especiais (#)
        items: carrinho.map(item => ({
          name: item.Nome.toUpperCase(),
          price: Math.round(Number(item.PrecoReal) * 100), // Centavos inteiros
          quantity: item.quantidadeCarrinho
        }))
      };

      // 🌐 3. POST DIRETO PARA A INFINITEPAY
      const resposta = await fetch("https://api.checkout.infinitepay.io/links", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadInfinitePay)
      });

      if (!resposta.ok) throw new Error("Erro na resposta da API da InfinitePay.");

      const dadosRetorno = await resposta.json();

      // 🎯 4. REDIRECIONA PARA O CHECKOUT DELES
      if (dadosRetorno.url) {
        window.location.href = dadosRetorno.url;
        
        limparCarrinho();
        setCarrinhoAberto(false);
      } else {
        alert("Não foi possível processar o link de pagamento junto à InfinitePay.");
      }

    } catch (error) {
      console.error("Erro no Checkout Integrado:", error);
      alert("Houve uma falha ao gerar o ambiente de pagamento. Tente novamente!");
    } finally {
      setProcessandoCheckout(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-['Montserrat']">
      <div className="absolute inset-0 bg-[#4A3737]/30 backdrop-blur-sm transition-opacity" onClick={() => setCarrinhoAberto(false)} />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F6] shadow-2xl border-l border-[#E5B299]/30 flex flex-col justify-between">
          
          <div className="p-5 border-b border-[#E5B299]/20 bg-white flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#4A3737]">Sua Sacola ({carrinho.length})</h2>
            <button onClick={() => setCarrinhoAberto(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-[#4A3737] transition-colors">
              <FiX size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {carrinho.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <span className="text-2xl mb-2">🛍️</span>
                <p className="text-xs uppercase tracking-wider">Sua sacola está vazia.</p>
              </div>
            ) : (
              carrinho.map((item) => {
                const ehEncomenda = (item.QuantidadeEstoque !== undefined ? Number(item.QuantidadeEstoque) : 0) <= 0;
                return (
                  <div key={item.Id} className={`flex items-center gap-4 bg-white p-3 rounded-2xl border shadow-sm ${ehEncomenda ? 'border-amber-200/60' : 'border-[#E5B299]/20'}`}>
                    <div className="w-16 h-20 bg-[#FAF9F6] rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                      {item.FotoUrl ? <img src={item.FotoUrl} alt={item.Nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300">IMAGE</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#4A3737] uppercase tracking-wide truncate">{item.Nome}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-['Playfair_Display'] font-bold text-[#B76E79]">R$ {Number(item.PrecoReal).toFixed(2)}</p>
                        {ehEncomenda && <span className="text-[8px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">Encomenda</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center border border-[#E5B299]/30 rounded-full bg-[#FAF9F6]">
                          <button onClick={() => atualizarQuantidade(item.Id, item.quantidadeCarrinho - 1)} className="px-2 py-1 text-slate-500 hover:text-[#B76E79]"><FiMinus size={10} /></button>
                          <span className="text-xs font-bold px-1 text-[#4A3737] font-mono">{item.quantidadeCarrinho}</span>
                          <button onClick={() => atualizarQuantidade(item.Id, item.quantidadeCarrinho + 1)} className="px-2 py-1 text-slate-500 hover:text-[#B76E79]"><FiPlus size={10} /></button>
                        </div>
                        <button onClick={() => removerDoCarrinho(item.Id)} className="text-slate-300 hover:text-rose-600 transition-colors"><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-5 bg-white border-t border-[#E5B299]/20 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#8C7A7A]">Subtotal:</span>
              <span className="text-lg font-['Playfair_Display'] font-black text-[#B76E79]">R$ {valorTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={executarCheckoutAutomatizado} 
              disabled={carrinho.length === 0 || processandoCheckout} 
              className="w-full bg-[#B76E79] hover:bg-[#a35c67] disabled:bg-slate-200 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md flex items-center justify-center gap-2"
            >
              {processandoCheckout ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCreditCard size={13} /> Ir para o Pagamento Seguro
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}