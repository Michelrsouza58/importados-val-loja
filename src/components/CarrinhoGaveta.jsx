// src/components/CarrinhoGaveta.jsx
import React from 'react';
import { useCarrinho } from '../context/CarrinhoContext';
import { db, auth } from '../config/firebase';
import { ref, runTransaction, set, push } from 'firebase/database';
import { FiX, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function CarrinhoGaveta() {
  const navigate = useNavigate();
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

  const enviarPedidoWhatsApp = async () => {
    if (carrinho.length === 0) return;

    // 🔒 Trava de Segurança: Exige login antes de disparar o processo
    const usuarioLogado = auth.currentUser;
    if (!usuarioLogado) {
      alert("Para concluir seu pedido com segurança, faça login ou cadastre-se primeiro! Seus itens continuarão salvos na sacola. 😊");
      setCarrinhoAberto(false);
      navigate('/login');
      return;
    }

    // 🎯 FILTRAGEM BLINDADA: Converte e isola os dois fluxos de estoque com segurança
    const itensProntaEntrega = carrinho.filter(item => {
      const estoque = item.QuantidadeEstoque !== undefined ? Number(item.QuantidadeEstoque) : 0;
      return estoque > 0;
    });

    const itensEncomenda = carrinho.filter(item => {
      const estoque = item.QuantidadeEstoque !== undefined ? Number(item.QuantidadeEstoque) : 0;
      return estoque <= 0;
    });

    try {
      let idsMensagemWpp = [];

      // 🛍️ FLUXO A: Itens que possuem Estoque Disponível
      if (itensProntaEntrega.length > 0) {
        const contadorRef = ref(db, 'configuracoes/ultimoPedidoId');
        const resultadoContador = await runTransaction(contadorRef, (valorAtual) => {
          if (valorAtual === null) return 1;
          return valorAtual + 1;
        });

        const proximoId = resultadoContador.snapshot.val();
        const numeroPedidoFormatado = `#${String(proximoId).padStart(7, '0')}`;
        idsMensagemWpp.push(`🆔 *PEDIDO PRONTA ENTREGA:* ${numeroPedidoFormatado}`);

        const novoPedidoRef = push(ref(db, 'pedidos'));
        await set(novoPedidoRef, {
          NumeroPedido: numeroPedidoFormatado,
          UsuarioId: usuarioLogado.uid,
          UsuarioEmail: usuarioLogado.email,
          Itens: itensProntaEntrega.map(item => ({
            Id: item.Id,
            Nome: item.Nome,
            PrecoReal: item.PrecoReal,
            Quantidade: item.quantidadeCarrinho
          })),
          ValorTotal: itensProntaEntrega.reduce((soma, i) => soma + (i.PrecoReal * i.quantidadeCarrinho), 0),
          DataPedido: new Date().toLocaleDateString('pt-BR'),
          HoraPedido: new Date().toLocaleTimeString('pt-BR'),
          Status: 'Pendente'
        });
      }

      // 📦 FLUXO B: Itens Esgotados salvos como Encomenda Independente
      if (itensEncomenda.length > 0) {
        const loteEncomendaRef = push(ref(db, `encomendas/${usuarioLogado.uid}`));
        const loteId = loteEncomendaRef.key;
        const codVisual = `#ENC-${loteId.substring(1, 7).toUpperCase()}`;
        idsMensagemWpp.push(`📦 *CÓDIGO DA ENCOMENDA:* ${codVisual}`);

        await set(loteEncomendaRef, {
          LoteId: loteId,
          UsuarioEmail: usuarioLogado.email,
          DataEncomenda: new Date().toLocaleDateString('pt-BR'),
          HoraEncomenda: new Date().toLocaleTimeString('pt-BR'),
          Status: 'Aguardando Compra',
          Itens: itensEncomenda.map(item => ({
            Id: item.Id,
            Nome: item.Nome,
            PrecoReal: item.PrecoReal,
            Quantidade: item.quantidadeCarrinho
          }))
        });
      }

      // 📝 MENSAGEM ENXUTA E FORMATADA PRO WHATSAPP
      let mensagem = `✨ *VAL IMPORTADOS - ATUALIZAÇÃO* ✨\n\n`;
      mensagem += `Olá, Val! Acabei de registrar uma ação no site.\n\n`;
      
      idsMensagemWpp.forEach(linha => {
        mensagem += `${linha}\n`;
      });

      mensagem += `\nAguardando as instruções para acompanhamento! 😊🥂`;

      // Número da Val
      const numeroWhatsApp = "5517982268790"; 
      const url = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensagem)}`;
      
      window.open(url, '_blank');

      // Reseta a aplicação local
      limparCarrinho();
      setCarrinhoAberto(false);

    } catch (error) {
      console.error("Erro ao processar fluxo:", error);
      alert("Houve um problema ao processar seu pedido. Tente novamente!");
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
            <button onClick={enviarPedidoWhatsApp} disabled={carrinho.length === 0} className="w-full bg-[#B76E79] hover:bg-[#a35c67] disabled:bg-slate-200 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-md flex items-center justify-center gap-2">
              Confirmar e Enviar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}