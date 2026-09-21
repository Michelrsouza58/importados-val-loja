// src/components/CarrinhoGaveta.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCarrinho } from "../context/CarrinhoContext";
import { db, auth } from "../lib/firebase";
import { ref, runTransaction, set, push } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useConfiguracoes } from "../lib/configuracoes";
import { brl } from "../lib/formato";
import apiBase from "../lib/apiBase";
import { FiX, FiPlus, FiMinus, FiTrash2, FiCreditCard, FiChevronRight } from "react-icons/fi";

const API_INFINITEPAY = "https://api.checkout.infinitepay.io/links";

export default function CarrinhoGaveta() {
  const navigate = useNavigate();
  const [processando, setProcessando] = useState(null);
  const [selecionados, setSelecionados] = useState({});
  const { config } = useConfiguracoes();

  const {
    carrinho,
    carrinhoAberto,
    setCarrinhoAberto,
    atualizarQuantidade,
    removerDoCarrinho,
  } = useCarrinho();

  useEffect(() => {
    const novos = { ...selecionados };
    carrinho.forEach((item) => {
      const chave = `${item.Id}__${item.varianteId || "base"}`;
      if (novos[chave] === undefined) novos[chave] = true;
    });
    setSelecionados(novos);
  }, [carrinho]);

  if (!carrinhoAberto) return null;

  const toggleSelecao = (item) => {
    const chave = `${item.Id}__${item.varianteId || "base"}`;
    setSelecionados((prev) => ({ ...prev, [chave]: !prev[chave] }));
  };

  const itensAtivos = carrinho.filter((i) => selecionados[`${i.Id}__${i.varianteId || "base"}`] !== false);
  const valorSelecionado = itensAtivos.reduce((s, i) => s + i.precoUnit * i.quantidadeCarrinho, 0);

  const descontoPix = Number(config.financeiro.descontoPix || 0);
  const valorPix = valorSelecionado * (1 - descontoPix / 100);
  const maxParcelas = Number(config.financeiro.maxParcelas || 12);

  const registrarPedidos = async (metodo) => {
    const usuario = auth.currentUser;
    if (!usuario) {
      toast.error("Entre com sua conta para finalizar a compra");
      navigate("/login");
      return null;
    }
    if (itensAtivos.length === 0) {
      toast.error("Selecione pelo menos um item com o checkbox");
      return null;
    }

    const pronta = itensAtivos.filter((i) => Number(i.QuantidadeEstoque) > 0);
    const encomenda = itensAtivos.filter((i) => Number(i.QuantidadeEstoque) <= 0);

    let nsu = `ENC${Date.now().toString().substring(8)}`;
    try {
      if (pronta.length > 0) {
        const contadorRef = ref(db, "configuracoes/ultimoPedidoId");
        const resultado = await runTransaction(contadorRef, (atual) => (atual === null ? 1 : atual + 1));
        const idLimpo = String(resultado.snapshot.val()).padStart(7, "0");
        nsu = idLimpo;
        await set(push(ref(db, "pedidos")), {
          NumeroPedido: `#${idLimpo}`,
          NumeroPedidoLimpo: idLimpo,
          UsuarioId: usuario.uid,
          UsuarioEmail: usuario.email,
          MetodoPagamento: metodo,
          Itens: pronta.map((i) => ({
            Id: i.Id, Nome: i.Nome, Variante: i.varianteNome || "",
            PrecoReal: i.precoUnit, Quantidade: i.quantidadeCarrinho,
          })),
          ValorTotal: pronta.reduce((s, i) => s + i.precoUnit * i.quantidadeCarrinho, 0),
          DataPedido: new Date().toLocaleDateString("pt-BR"),
          HoraPedido: new Date().toLocaleTimeString("pt-BR"),
          Status: "Aguardando Pagamento",
        });
      }
      if (encomenda.length > 0) {
        const loteRef = push(ref(db, `encomendas/${usuario.uid}`));
        await set(loteRef, {
          LoteId: loteRef.key,
          UsuarioEmail: usuario.email,
          MetodoPagamento: metodo,
          DataEncomenda: new Date().toLocaleDateString("pt-BR"),
          HoraEncomenda: new Date().toLocaleTimeString("pt-BR"),
          Status: "Aguardando Pagamento",
          Itens: encomenda.map((i) => ({
            Id: i.Id, Nome: i.Nome, Variante: i.varianteNome || "",
            PrecoReal: i.precoUnit, Quantidade: i.quantidadeCarrinho,
          })),
        });
        nsu = (loteRef.key || nsu).replace(/[^a-zA-Z0-9]/g, "");
      }
    } catch (erro) {
      toast.error("Falha ao registrar o pedido. Verifique sua conexão e tente novamente.");
      return null;
    }
    return nsu;
  };

  const pagarPix = async () => {
    setProcessando("pix");
    try {
      const nsu = await registrarPedidos("InfinitePay Pix");
      if (!nsu) return;

      const nomeItem = (i) => (i.varianteNome ? `${i.Nome} - ${i.varianteNome}` : i.Nome).toUpperCase();
      const items = itensAtivos.map((i) => ({
        name: nomeItem(i),
        description: nomeItem(i),
        price: Math.round(i.precoUnit * (1 - descontoPix / 100) * 100),
        quantity: i.quantidadeCarrinho,
      }));

      const handle = config.pagamentos.infinitepayHandle || "michelrsouza";
      const webhookN8n = config.pagamentos.infinitepayWebhookN8n;

      let url = null;
      if (webhookN8n) {
        const resposta = await fetch(webhookN8n, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle, redirect_url: window.location.origin + "/meus-pedidos", order_nsu: nsu, items }),
        });
        const dados = await resposta.json();
        url = (dados && (dados.url || (dados.body && dados.body.url) || (dados.data && dados.data.url))) || null;
      } else {
        const resposta = await fetch(API_INFINITEPAY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle, redirect_url: window.location.origin + "/meus-pedidos", order_nsu: nsu, items }),
        });
        if (!resposta.ok) throw new Error("InfinitePay recusou o checkout");
        const dados = await resposta.json();
        url = dados.url || dados.checkout_url || null;
      }

      if (!url) throw new Error("Sem URL de checkout");

      itensAtivos.forEach((i) => removerDoCarrinho(i));
      setCarrinhoAberto(false);
      window.location.href = url;
    } catch (erro) {
      toast.error("Não foi possível abrir o pagamento por Pix. Tente novamente.");
    } finally {
      setProcessando(null);
    }
  };

  const pagarCartao = async () => {
    setProcessando("cartao");
    try {
      const nsu = await registrarPedidos("Mercado Pago");
      if (!nsu) return;

      const resposta = await fetch(`${apiBase}/api/mercadopago/create-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itensAtivos.map((i) => ({
            title: (i.varianteNome ? `${i.Nome} - ${i.varianteNome}` : i.Nome).toUpperCase(),
            quantity: i.quantidadeCarrinho,
            unit_price: Number(i.precoUnit),
          })),
          payerEmail: (auth.currentUser && auth.currentUser.email) || "",
          origin: window.location.origin,
          orderNsu: nsu,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.initPoint) {
        throw new Error(dados.error || "Falha ao iniciar pagamento");
      }

      itensAtivos.forEach((i) => removerDoCarrinho(i));
      setCarrinhoAberto(false);
      window.location.assign(dados.initPoint);
    } catch (erro) {
      toast.error(erro.message || "Não foi possível iniciar o pagamento com cartão.");
    } finally {
      setProcessando(null);
    }
  };

  return (
    <AnimatePresence>
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 overflow-hidden" data-testid="sacola-gaveta">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-espresso/40 backdrop-blur-sm"
            onClick={() => setCarrinhoAberto(false)}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="absolute inset-y-0 right-0 w-screen max-w-md bg-creme shadow-2xl border-l border-pessego/30 flex flex-col"
            data-testid="sacola-painel"
          >
            <div className="p-5 border-b border-pessego/20 bg-white flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-espresso" data-testid="sacola-titulo">
                Sua Sacola ({carrinho.length})
              </h2>
              <button onClick={() => setCarrinhoAberto(false)} className="p-1.5 rounded-full hover:bg-creme text-espresso" aria-label="Fechar sacola" data-testid="sacola-fechar">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {carrinho.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-espresso/40 p-6" data-testid="sacola-vazia">
                  <p className="font-display italic text-2xl text-espresso/30 mb-2">Sua sacola está vazia</p>
                  <button onClick={() => { setCarrinhoAberto(false); navigate("/catalogo"); }} className="text-[11px] font-bold uppercase tracking-widest text-rose mt-2" data-testid="sacola-ver-catalogo">
                    Ver catálogo
                  </button>
                </div>
              ) : (
                carrinho.map((item) => {
                  const chave = `${item.Id}__${item.varianteId || "base"}`;
                  const encomenda = Number(item.QuantidadeEstoque) <= 0;
                  const marcado = selecionados[chave] !== false;
                  return (
                    <div
                      key={chave}
                      className={`flex items-center gap-3 bg-white p-3 rounded-2xl border shadow-sm transition-all ${
                        marcado ? (encomenda ? "border-amber-200" : "border-pessego/40") : "border-espresso/5 opacity-60"
                      }`}
                      data-testid="sacola-item"
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => toggleSelecao(item)}
                        className="w-4 h-4 rounded-md accent-rose cursor-pointer"
                        aria-label={`Selecionar ${item.Nome}`}
                      />
                      <div className="w-16 h-20 bg-creme rounded-xl overflow-hidden border border-espresso/5 shrink-0">
                        {item.FotoUrl && <img src={item.FotoUrl} alt={item.Nome} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-espresso uppercase tracking-wide truncate" data-testid="sacola-item-nome">
                          {item.Nome}
                          {item.varianteNome && <span className="text-rose"> · {item.varianteNome}</span>}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-mono font-bold text-rose">{brl(item.precoUnit)}</p>
                          {encomenda && (
                            <span className="text-[8px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">
                              Encomenda
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-pessego/30 rounded-full bg-creme">
                            <button onClick={() => atualizarQuantidade(item, item.quantidadeCarrinho - 1)} className="px-2 py-1 text-espresso/50 hover:text-rose" aria-label="Diminuir quantidade" data-testid="sacola-item-diminuir">
                              <FiMinus size={10} />
                            </button>
                            <span className="text-xs font-bold px-1 font-mono text-espresso">{item.quantidadeCarrinho}</span>
                            <button onClick={() => atualizarQuantidade(item, item.quantidadeCarrinho + 1)} className="px-2 py-1 text-espresso/50 hover:text-rose" aria-label="Aumentar quantidade" data-testid="sacola-item-aumentar">
                              <FiPlus size={10} />
                            </button>
                          </div>
                          <button onClick={() => removerDoCarrinho(item)} className="text-espresso/25 hover:text-rose transition-colors" aria-label="Remover item" data-testid="sacola-item-remover">
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-5 bg-white border-t border-pessego/20 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-espresso/50">Subtotal selecionado</span>
                <span className="text-lg font-display font-black text-rose" data-testid="sacola-subtotal">{brl(valorSelecionado)}</span>
              </div>
              {descontoPix > 0 && (
                <div className="flex items-center justify-between text-[11px] text-emerald-700">
                  <span className="uppercase tracking-widest font-semibold">No Pix ({descontoPix}% off)</span>
                  <span className="font-mono font-bold" data-testid="sacola-subtotal-pix">{brl(valorPix)}</span>
                </div>
              )}
              <button
                onClick={pagarPix}
                disabled={itensAtivos.length === 0 || processando !== null}
                className="w-full bg-espresso hover:bg-ink disabled:bg-espresso/20 text-creme py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-md flex items-center justify-center gap-2"
                data-testid="checkout-pix-botao"
              >
                {processando === "pix" ? (
                  <span className="w-4 h-4 border-2 border-creme border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Pagar com Pix {descontoPix > 0 ? `· ${descontoPix}% off` : ""} <FiChevronRight size={14} />
                  </>
                )}
              </button>
              <button
                onClick={pagarCartao}
                disabled={itensAtivos.length === 0 || processando !== null}
                className="w-full bg-rose hover:bg-rosedark disabled:bg-rose/30 text-white py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-md flex items-center justify-center gap-2"
                data-testid="checkout-cartao-botao"
              >
                {processando === "cartao" ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCreditCard size={13} /> Pagar com Cartão · até {maxParcelas}x
                  </>
                )}
              </button>
              <p className="text-center text-[9px] text-espresso/35 uppercase tracking-widest">
                Pix via InfinitePay · Cartão via Mercado Pago
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
