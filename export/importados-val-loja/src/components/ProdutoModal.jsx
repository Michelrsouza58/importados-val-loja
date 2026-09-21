// src/components/ProdutoModal.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCarrinho } from "../context/CarrinhoContext";
import { useConfiguracoes } from "../lib/configuracoes";
import { precoEfetivo, estoqueEfetivo } from "../lib/produtos";
import { brl, valorParcela } from "../lib/formato";
import { FiX, FiCheckCircle, FiInfo, FiShoppingBag, FiPlus, FiMinus } from "react-icons/fi";

export default function ProdutoModal({ produto, onFechar }) {
  const { adicionarAoCarrinho } = useCarrinho();
  const { config } = useConfiguracoes();
  const [varianteAtiva, setVarianteAtiva] = useState(null);
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    setVarianteAtiva(produto && produto.Variantes && produto.Variantes.length ? produto.Variantes[0] : null);
    setQuantidade(1);
  }, [produto]);

  if (!produto) return null;

  const variante = produto.Variantes && produto.Variantes.length ? varianteAtiva : null;
  const preco = precoEfetivo(produto, variante);
  const estoque = estoqueEfetivo(produto, variante);
  const temEstoque = estoque > 0;
  const foto = (variante && variante.FotoUrl) || produto.FotoUrl;
  const taxas = config.financeiro.taxas;
  const parcelasSimuladas = [1, 2, 3, 6, 10, 12].filter((n) => n <= (config.financeiro.maxParcelas || 12));

  const adicionar = () => {
    adicionarAoCarrinho(produto, variante, quantidade);
    onFechar();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-espresso/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        onClick={onFechar}
        data-testid="produto-modal-fundo"
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-pessego/20 flex flex-col md:flex-row overflow-hidden max-h-[92vh] my-auto"
          onClick={(e) => e.stopPropagation()}
          data-testid="produto-modal-conteudo"
        >
          <div className="w-full md:w-1/2 bg-creme p-6 flex items-center justify-center relative">
            <button
              onClick={onFechar}
              className="absolute top-4 left-4 md:top-4 md:right-4 md:left-auto p-2 rounded-full bg-white/90 shadow-md text-espresso z-10"
              aria-label="Fechar"
              data-testid="produto-modal-fechar"
            >
              <FiX size={18} />
            </button>
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-espresso/5">
              {foto ? (
                <img src={foto} alt={produto.Nome} className="w-full h-full object-cover" data-testid="produto-modal-foto" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-espresso/30 uppercase tracking-widest">Sem foto</div>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-rose block mb-1" data-testid="produto-modal-codigo">
                COD: {produto.CodigoBarras}
              </span>
              <h2 className="font-display text-xl md:text-2xl font-bold text-espresso leading-tight" data-testid="produto-modal-nome">
                {produto.Nome}
              </h2>
              <p className="font-display text-2xl font-bold text-rose mt-3" data-testid="produto-modal-preco">
                {brl(preco)}
              </p>
              {taxas && Number(taxas[3]) > 0 && (
                <p className="text-[11px] text-espresso/50 mt-1">
                  ou 3x de {brl(valorParcela(preco, 3, taxas))} no cartão
                </p>
              )}
            </div>

            <div
              className={`p-3 rounded-2xl border flex items-start gap-2 ${temEstoque ? "bg-emerald-50/60 border-emerald-100" : "bg-amber-50/60 border-amber-100"}`}
              data-testid="produto-modal-disponibilidade"
            >
              {temEstoque ? (
                <>
                  <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={14} />
                  <p className="text-[11px] text-espresso/70">
                    <strong className="text-emerald-700">Pronta Entrega.</strong> Item disponível para envio imediato.
                  </p>
                </>
              ) : (
                <>
                  <FiInfo className="text-amber-700 mt-0.5 shrink-0" size={14} />
                  <p className="text-[11px] text-espresso/70">
                    <strong className="text-amber-700">Sob Encomenda.</strong> Importamos direto para você na próxima remessa.
                  </p>
                </>
              )}
            </div>

            {produto.Variantes && produto.Variantes.length > 0 && (
              <div data-testid="produto-modal-variantes">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-espresso/40 mb-2">Escolha o tipo</p>
                <div className="flex flex-wrap gap-2">
                  {produto.Variantes.map((v) => {
                    const ativo = varianteAtiva && varianteAtiva.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVarianteAtiva(v)}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${
                          ativo
                            ? "bg-espresso text-white border-espresso shadow-sm"
                            : "bg-white text-espresso/60 border-espresso/15 hover:border-rose hover:text-rose"
                        }`}
                        data-testid={`produto-modal-variante-${String(v.Nome || v.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                      >
                        {v.Nome || "Padrão"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-espresso/40 mb-1.5">Descrição</p>
              <p className="text-xs text-espresso/70 leading-relaxed" data-testid="produto-modal-descricao">
                {produto.Descricao}
              </p>
            </div>

            <div className="mt-auto pt-4 border-t border-espresso/5 flex items-center gap-4">
              <div className="flex items-center border border-espresso/15 rounded-full bg-creme" data-testid="produto-modal-quantidade">
                <button onClick={() => setQuantidade(Math.max(1, quantidade - 1))} className="px-3 py-2 text-espresso/50 hover:text-rose" aria-label="Diminuir">
                  <FiMinus size={12} />
                </button>
                <span className="px-2 text-sm font-bold font-mono text-espresso">{quantidade}</span>
                <button onClick={() => setQuantidade(quantidade + 1)} className="px-3 py-2 text-espresso/50 hover:text-rose" aria-label="Aumentar">
                  <FiPlus size={12} />
                </button>
              </div>
              <button
                onClick={adicionar}
                className={`flex-1 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
                  temEstoque ? "bg-rose hover:bg-rosedark text-white" : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
                data-testid="produto-modal-adicionar-botao"
              >
                <FiShoppingBag size={13} />
                {temEstoque ? "Colocar na Sacola" : "Fazer Encomenda"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
