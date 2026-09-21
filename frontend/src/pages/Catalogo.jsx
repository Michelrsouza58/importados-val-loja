// src/pages/Catalogo.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProdutos, CATEGORIAS, precoEfetivo, estoqueEfetivo } from "../lib/produtos";
import { useCarrinho } from "../context/CarrinhoContext";
import { useConfiguracoes } from "../lib/configuracoes";
import ProdutoModal from "../components/ProdutoModal";
import Footer from "./Footer";
import { brl, valorParcela } from "../lib/formato";
import { FiSearch, FiPlus, FiBox, FiLayers } from "react-icons/fi";

export default function Catalogo() {
  const { produtos, carregando, fonteDemo } = useProdutos();
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [statusEstoque, setStatusEstoque] = useState("Todos");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const { adicionarAoCarrinho } = useCarrinho();
  const { config } = useConfiguracoes();

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return produtos.filter((prod) => {
      const bateBusca =
        prod.Nome.toLowerCase().includes(termo) || prod.CodigoBarras.toLowerCase().includes(termo);
      const bateCategoria =
        categoriaAtiva === "Todos" || prod.Categoria.toLowerCase() === categoriaAtiva.toLowerCase();
      let bateEstoque = true;
      const estoque = estoqueEfetivo(prod, null);
      if (statusEstoque === "Estoque") bateEstoque = estoque > 0;
      else if (statusEstoque === "Encomenda") bateEstoque = estoque === 0;
      return bateBusca && bateCategoria && bateEstoque;
    });
  }, [produtos, busca, categoriaAtiva, statusEstoque]);

  const parcela3 = (valor) => valorParcela(valor, 3, config.financeiro.taxas);

  return (
    <div className="min-h-screen bg-creme pb-24" data-testid="pagina-catalogo">
      <div className="pt-28 pb-10 px-4 max-w-3xl mx-auto text-center">
        <p className="uppercase tracking-[0.3em] text-[11px] font-semibold text-rose mb-4" data-testid="catalogo-eyebrow">
          Nossa curadoria
        </p>
        <h1 className="font-display italic text-4xl md:text-5xl text-espresso tracking-tight" data-testid="catalogo-titulo">
          O catálogo <span className="text-rose">da Val</span>
        </h1>
        <div className="flex items-center justify-center gap-3 my-5">
          <div className="h-px w-10 bg-pessego/60" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-espresso/50 font-light">
            Cosméticos e Importados de Qualidade
          </p>
          <div className="h-px w-10 bg-pessego/60" />
        </div>

        {fonteDemo && (
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold px-4 py-2 rounded-full" data-testid="catalogo-aviso-demo">
            Modo demonstração — conecte o Firebase corretamente para ver seus produtos reais
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-6 mb-6">
        <div className="relative group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-rose text-sm" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquise por nome ou código de barras..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-pessego/40 rounded-full focus:outline-none focus:border-rose text-xs tracking-widest shadow-sm transition-all placeholder:italic text-espresso"
            data-testid="catalogo-busca-input"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mb-10 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 justify-start md:justify-center scrollbar-none">
          {CATEGORIAS.map((cat) => {
            const ativo = categoriaAtiva === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 whitespace-nowrap shrink-0 ${
                  ativo
                    ? "bg-espresso text-creme border-espresso shadow-sm"
                    : "bg-white text-espresso/50 border-pessego/20 hover:border-rose hover:text-rose"
                }`}
                data-testid={`catalogo-filtro-categoria-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2.5">
          {[
            { valor: "Todos", rotulo: "Todos os Itens", teste: "catalogo-filtro-todos" },
            { valor: "Estoque", rotulo: "Pronta Entrega", teste: "catalogo-filtro-estoque" },
            { valor: "Encomenda", rotulo: "Sob Encomenda", teste: "catalogo-filtro-encomenda" },
          ].map((f) => {
            const ativo = statusEstoque === f.valor;
            return (
              <button
                key={f.valor}
                onClick={() => setStatusEstoque(f.valor)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                  ativo
                    ? "bg-white text-rose border-rose shadow-inner font-black"
                    : "bg-white/40 text-espresso/40 border-espresso/10 hover:text-espresso/70"
                }`}
                data-testid={f.teste}
              >
                {f.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {carregando ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-rose border-t-transparent rounded-full animate-spin" data-testid="catalogo-carregando" />
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-espresso/40 max-w-sm mx-auto" data-testid="catalogo-vazio">
            <p className="text-xs uppercase tracking-wider font-semibold">
              Nenhum produto encontrado com os filtros selecionados.
            </p>
            <button
              onClick={() => { setCategoriaAtiva("Todos"); setStatusEstoque("Todos"); setBusca(""); }}
              className="mt-4 text-[10px] font-bold text-rose underline uppercase tracking-widest"
              data-testid="catalogo-limpar-filtros"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-8">
            <AnimatePresence>
              {produtosFiltrados.map((prod, idx) => {
                const temEstoque = estoqueEfetivo(prod, null) > 0;
                const numVariantes = prod.Variantes.length;
                return (
                  <motion.div
                    layout
                    key={prod.Id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => setProdutoSelecionado(prod)}
                    className="group bg-white rounded-3xl border border-pessego/20 p-2.5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between cursor-pointer"
                    data-testid={`produto-card-${prod.Id}`}
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-creme relative border border-espresso/5">
                      {prod.FotoUrl ? (
                        <img src={prod.FotoUrl} alt={prod.Nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-espresso/20 uppercase tracking-widest">Imagem</div>
                      )}
                      <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
                        <span className={`text-[8px] font-bold tracking-tight uppercase ${temEstoque ? "text-rose" : "text-amber-700"}`}>
                          {temEstoque ? "Disponível" : "Encomenda"}
                        </span>
                      </div>
                      {numVariantes > 0 && (
                        <div className="absolute bottom-2.5 left-2.5 bg-espresso/85 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                          <FiLayers size={9} className="text-creme" />
                          <span className="text-[8px] font-bold text-creme uppercase tracking-wider">
                            {numVariantes} {numVariantes > 1 ? "aromas" : "aroma"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-center px-1 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="text-[11px] md:text-xs font-semibold text-espresso uppercase tracking-wider line-clamp-2 leading-tight min-h-[28px]">
                          {prod.Nome}
                        </h3>
                        <p className="text-[9px] font-mono font-bold text-espresso/30 tracking-wide mt-1">
                          COD: {prod.CodigoBarras}
                        </p>
                        <p className="text-sm md:text-base font-display font-bold text-rose mt-2" data-testid={`produto-preco-${prod.Id}`}>
                          {brl(precoEfetivo(prod, null))}
                        </p>
                        {Number(config.financeiro.taxas[3]) > 0 && (
                          <p className="text-[9px] text-espresso/40 font-medium mt-0.5">
                            ou 3x de {brl(parcela3(precoEfetivo(prod, null)))}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (numVariantes > 0) {
                            setProdutoSelecionado(prod);
                          } else {
                            adicionarAoCarrinho(prod, null, 1);
                          }
                        }}
                        className={`mt-4 w-full py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-300 active:scale-95 shadow-sm flex items-center justify-center gap-1 ${
                          temEstoque || numVariantes > 0
                            ? "bg-rose hover:bg-rosedark text-white"
                            : "bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800"
                        }`}
                        data-testid={`produto-adicionar-${prod.Id}`}
                      >
                        {numVariantes > 0 ? (
                          <><FiBox size={11} /> Escolher tipo</>
                        ) : temEstoque ? (
                          <><FiPlus size={11} /> Adicionar</>
                        ) : (
                          <><FiBox size={11} /> Encomendar</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {produtoSelecionado && (
        <ProdutoModal produto={produtoSelecionado} onFechar={() => setProdutoSelecionado(null)} />
      )}

      <Footer />
    </div>
  );
}
