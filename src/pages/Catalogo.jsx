// src/pages/Catalogo.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { useCarrinho } from '../context/CarrinhoContext';
import { FiSearch, FiPlus, FiBox, FiX, FiCheckCircle, FiInfo, FiShoppingBag, FiLayers, FiCheck } from 'react-icons/fi';

// 💳 Taxas oficiais do Link de Pagamento da InfinitePay (Recebimento D+1)
const TAXAS_INFINITEPAY = {
  1: 0.0420,  // 4.20%
  2: 0.0609,  // 6.09%
  3: 0.0701,  // 7.01%
  4: 0.0791,  // 7.91%
  5: 0.0880,  // 8.80%
  6: 0.0967,  // 9.67%
  7: 0.1259,  // 12.59%
  8: 0.1342,  // 13.42%
  9: 0.1425,  // 14.25%
  10: 0.1506, // 15.06%
  11: 0.1587, // 15.87%
  12: 0.1666  // 16.66%
};

// 🏷️ Lista estática de categorias para os filtros elegante (Bate com o seu cadastro)
const CATEGORIAS = ['Todos', 'Cabelos', 'Maquiagem', 'Perfumaria', 'Skincare','Outros'];

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  
  // 🎯 NOVOS ESTADOS: Filtros ativos
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [statusEstoque, setStatusEstoque] = useState('Todos'); // 'Todos' | 'Estoque' | 'Encomenda'

  // Estados para o Modal de Detalhes
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeDesejada, setQuantidadeDesejada] = useState(1);

  const { adicionarAoCarrinho } = useCarrinho();

  useEffect(() => {
    const produtosRef = ref(db, 'items');
    const unsubscribe = onValue(produtosRef, (snapshot) => {
      setCarregando(true);
      if (snapshot.exists()) {
        const dados = snapshot.val();
        const listaFormatada = Object.entries(dados).map(([key, valores]) => ({
          Id: valores.Id || key,
          Nome: valores.Nome || '',
          PrecoReal: valores.PrecoReal || 0,
          FotoUrl: valores.FotoUrl || '',
          Descricao: valores.Descricao || 'Nenhuma descrição informada para este produto.',
          QuantidadeEstoque: valores.QuantidadeEstoque !== undefined ? Number(valores.QuantidadeEstoque) : 0,
          CodigoBarras: valores.CodigoBarras || '---',
          // 🎯 CAPTURA A CATEGORIA: Garante tratamento caso não exista no banco
          Categoria: valores.Categoria || 'Outros',
        }));
        setProdutos(listaFormatada);
      } else { 
        setProdutos([]); 
      }
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // 🎯 LÓGICA DE FILTRAGEM TRIPLA: Busca + Categoria + Disponibilidade
  const produtosFiltrados = produtos.filter((prod) => {
    const termo = busca.toLowerCase();
    
    // 1. Filtro da Barra de Pesquisa (Nome ou Código de Barras)
    const bateBusca = prod.Nome.toLowerCase().includes(termo) || prod.CodigoBarras.toLowerCase().includes(termo);
    
    // 2. Filtro de Categorias
    const bateCategoria = categoriaAtiva === 'Todos' || prod.Categoria.toLowerCase() === categoriaAtiva.toLowerCase();
    
    // 3. Filtro de Estoque (Quantidade > 0 e Quantidade = 0)
    let bateEstoque = true;
    if (statusEstoque === 'Estoque') {
      bateEstoque = prod.QuantidadeEstoque > 0;
    } else if (statusEstoque === 'Encomenda') {
      bateEstoque = prod.QuantidadeEstoque === 0;
    }

    return bateBusca && bateCategoria && bateEstoque;
  });

  const abrirDetalhes = (produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeDesejada(1);
  };

  const handleAdicionarMultiplos = () => {
    for (let i = 0; i < quantidadeDesejada; i++) {
      adicionarAoCarrinho(produtoSelecionado);
    }
    setProdutoSelecionado(null);
  };

  const calcularParcelaInfinitePay = (valorTotal, parcelas) => {
    const taxa = TAXAS_INFINITEPAY[parcelas] || 0;
    const valorComJuros = valorTotal * (1 + taxa);
    return (valorComJuros / parcelas).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 font-['Montserrat'] select-none">
      
      {/* Header Luxo */}
      <div className="pt-16 pb-8 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-['Playfair_Display'] italic text-[#4A3737] tracking-tight">
          <span className="text-[#B76E79]">Importados da Val</span>
        </h1>
        <div className="flex items-center justify-center gap-3 my-4">
          <div className="h-[1px] w-10 bg-[#B76E79]/40"></div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8C7A7A] font-light">
            Cosméticos e Importados de Qualidade
          </p>
          <div className="h-[1px] w-10 bg-[#B76E79]/40"></div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="max-w-md mx-auto px-6 mb-6">
        <div className="relative group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B76E79] text-sm" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquise por nome ou código de barras..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E5B299]/40 rounded-full focus:outline-none focus:border-[#B76E79] text-xs tracking-widest shadow-md transition-all placeholder:italic text-[#4A3737]"
          />
        </div>
      </div>

      {/* ─── CONTROLES DE FILTROS ELEGANTES (BOUTIQUE) ────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 mb-10 space-y-4">
        
        {/* Filtro 1: Categorias (Scroll Horizontal Suave no Celular) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none justify-start md:justify-center">
          {CATEGORIAS.map((cat) => {
            const ativo = categoriaAtiva === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 whitespace-nowrap shrink-0 ${
                  ativo 
                    ? 'bg-[#4A3737] text-white border-[#4A3737] shadow-sm' 
                    : 'bg-white text-[#8C7A7A] border-[#E5B299]/20 hover:border-[#B76E79]/50 hover:text-[#B76E79]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Filtro 2: Disponibilidade / Modalidade de Compra */}
        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={() => setStatusEstoque('Todos')}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 border ${
              statusEstoque === 'Todos'
                ? 'bg-white text-[#B76E79] border-[#B76E79] shadow-inner font-black'
                : 'bg-white/40 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
          >
            Todos os Itens
          </button>
          
          <button
            onClick={() => setStatusEstoque('Estoque')}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 border flex items-center gap-1 ${
              statusEstoque === 'Estoque'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm font-black'
                : 'bg-white/40 text-slate-400 border-slate-200 hover:text-emerald-700'
            }`}
          >
            ⚡ Pronta Entrega
          </button>

          <button
            onClick={() => setStatusEstoque('Encomenda')}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 border flex items-center gap-1 ${
              statusEstoque === 'Encomenda'
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm font-black'
                : 'bg-white/40 text-slate-400 border-slate-200 hover:text-amber-700'
            }`}
          >
            ✈️ Sob Encomenda
          </button>
        </div>
      </div>

      {/* Grid Boutique */}
      <div className="max-w-7xl mx-auto px-4">
        {carregando ? (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-[#B76E79] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          // Estado de busca vazia ou sem filtros correspondentes
          <div className="text-center py-20 text-slate-400 max-w-sm mx-auto">
            <span className="text-2xl block mb-2">🔍</span>
            <p className="text-xs uppercase tracking-wider font-semibold">Nenhum produto encontrado com os filtros selecionados.</p>
            <button 
              onClick={() => { setCategoriaAtiva('Todos'); setStatusEstoque('Todos'); setBusca(''); }}
              className="mt-4 text-[10px] font-bold text-[#B76E79] underline uppercase tracking-widest"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            {produtosFiltrados.map((prod) => {
              const temEstoque = prod.QuantidadeEstoque > 0;

              return (
                <div 
                  key={prod.Id} 
                  onClick={() => abrirDetalhes(prod)}
                  className="group bg-white rounded-3xl border border-[#E5B299]/20 p-2.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  {/* Imagem */}
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#FAF9F6] relative border border-slate-100">
                    {prod.FotoUrl ? (
                      <img src={prod.FotoUrl} alt={prod.Nome} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">IMAGE</div>
                    )}
                    
                    {/* Badge de Status Dinâmica */}
                    <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm border border-[#E5B299]/10">
                      <span className={`text-[8px] font-bold tracking-tighter uppercase ${temEstoque ? 'text-[#B76E79]' : 'text-amber-700'}`}>
                        {temEstoque ? 'Disponível' : 'Sob Encomenda'}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes do Card */}
                  <div className="mt-4 text-center px-1 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-[11px] md:text-xs font-semibold text-[#4A3737] uppercase tracking-wider line-clamp-2 leading-tight min-h-[28px]">
                        {prod.Nome}
                      </h3>
                      
                      <p className="text-[9px] font-mono font-bold text-slate-400 tracking-wide mt-1">
                        COD: {prod.CodigoBarras}
                      </p>

                      <p className="text-sm md:text-base font-['Playfair_Display'] font-bold text-[#B76E79] mt-2">
                        R$ {Number(prod.PrecoReal).toFixed(2)}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        ou 3x de R$ {calcularParcelaInfinitePay(Number(prod.PrecoReal), 3)}
                      </p>
                    </div>
                    
                    {/* Botão de Compra Rápida */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        adicionarAoCarrinho(prod);
                      }}
                      className={`mt-4 w-full py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-300 active:scale-95 shadow-sm flex items-center justify-center gap-1 ${
                        temEstoque 
                          ? 'bg-[#B76E79] hover:bg-[#a35c67] text-white' 
                          : 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800'
                      }`}
                    >
                      {temEstoque ? (
                        <>
                          <FiPlus size={11} /> Adicionar
                        </>
                      ) : (
                        <>
                          <FiBox size={11} /> Encomendar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL DE DETALHES DO PRODUTO ──────────────────────────────────── */}
      {produtoSelecionado && (
        <div className="fixed inset-0 bg-[#4A3737]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E5B299]/20 flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-none animate-in fade-in zoom-in-95 duration-200">
            
            {/* Esquerda: Foto do Produto */}
            <div className="w-full md:w-1/2 bg-[#FAF9F6] p-6 flex items-center justify-center relative border-r border-slate-50">
              <button 
                onClick={() => setProdutoSelecionado(null)}
                className="absolute top-4 left-4 md:hidden p-2 rounded-full bg-white/80 shadow-md text-[#4A3737]"
              >
                <FiX size={18} />
              </button>
              
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                {produtoSelecionado.FotoUrl ? (
                  <img src={produtoSelecionado.FotoUrl} alt={produtoSelecionado.Nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-300">SEM FOTO</div>
                )}
              </div>
            </div>

            {/* Direita: Textos e Lógica */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[75vh]">
              
              {/* Botão Fechar Desktop */}
              <div className="hidden md:flex justify-end mb-2">
                <button 
                  onClick={() => setProdutoSelecionado(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Informações Básicas */}
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#B76E79] block mb-1">
                  COD: {produtoSelecionado.CodigoBarras}
                </span>
                <h2 className="text-base md:text-lg font-bold text-[#4A3737] uppercase tracking-wide leading-tight">
                  {produtoSelecionado.Nome}
                </h2>
                
                <p className="text-xl font-['Playfair_Display'] font-bold text-[#B76E79] mt-3">
                  R$ {Number(produtoSelecionado.PrecoReal).toFixed(2)}
                </p>

                {/* Badge Informativa sobre Entrega */}
                <div className="mt-3 p-2.5 rounded-xl border flex items-start gap-2 bg-slate-50 border-slate-100">
                  {produtoSelecionado.QuantidadeEstoque > 0 ? (
                    <>
                      <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={13} />
                      <p className="text-[10px] text-slate-600 font-medium">
                        <strong className="text-emerald-700">Pronta Entrega!</strong> Item disponível em estoque para envio imediato.
                      </p>
                    </>
                  ) : (
                    <>
                      <FiInfo className="text-amber-700 mt-0.5 shrink-0" size={13} />
                      <p className="text-[10px] text-slate-600 font-medium">
                        <strong className="text-amber-700">Produto sob Encomenda.</strong> Nós importamos direto para você. Fale conosco para conferir prazos!
                      </p>
                    </>
                  )}
                </div>

                {/* Descrição */}
                <div className="mt-5">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Descrição do Produto</h4>
                  <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed text-justify max-h-28 overflow-y-auto pr-1">
                    {produtoSelecionado.Descricao}
                  </p>
                </div>

                {/* 💳 SIMULADOR DE PARCELAS REAL DA INFINITEPAY */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Simulação de Parcelas (InfinitePay)</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E5B299]/10">
                    <p className="text-[10px] font-medium text-slate-600">1x (À vista): <span className="font-bold text-[#4A3737]">R$ {calcularParcelaInfinitePay(produtoSelecionado.PrecoReal, 1)}</span></p>
                    <p className="text-[10px] font-medium text-slate-600">2x: <span className="font-bold text-[#4A3737]">R$ {calcularParcelaInfinitePay(produtoSelecionado.PrecoReal, 2)}</span></p>
                    <p className="text-[10px] font-medium text-slate-600">3x: <span className="font-bold text-[#B76E79]">R$ {calcularParcelaInfinitePay(produtoSelecionado.PrecoReal, 3)}</span></p>
                    <p className="text-[10px] font-medium text-slate-600">4x: <span className="font-bold text-[#4A3737]">R$ {calcularParcelaInfinitePay(produtoSelecionado.PrecoReal, 4)}</span></p>
                    <p className="text-[10px] font-medium text-slate-600">6x: <span className="font-bold text-[#4A3737]">R$ {calcularParcelaInfinitePay(produtoSelecionado.PrecoReal, 6)}</span></p>
                    <p className="text-[10px] font-medium text-slate-600">12x: <span className="font-bold text-[#4A3737]">R$ {calcularParcelaInfinitePay(produtoSelecionado.PrecoReal, 12)}</span></p>
                  </div>
                </div>
              </div>

              {/* Seletor de Quantidade e Botão Final */}
              <div className="mt-6 border-t border-slate-100 pt-4 flex items-center gap-4">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                  <button 
                    onClick={() => setQuantidadeDesejada(Math.max(1, quantidadeDesejada - 1))}
                    className="px-3 py-2 text-sm font-bold text-slate-500 hover:text-[#B76E79]"
                  >
                    -
                  </button>
                  <span className="px-2 text-xs font-bold font-mono text-[#4A3737]">{quantidadeDesejada}</span>
                  <button 
                    onClick={() => setQuantidadeDesejada(quantidadeDesejada + 1)}
                    className="px-3 py-2 text-sm font-bold text-slate-500 hover:text-[#B76E79]"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdicionarMultiplos}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
                    produtoSelecionado.QuantidadeEstoque > 0
                      ? 'bg-[#B76E79] hover:bg-[#a35c67] text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  <FiShoppingBag size={13} />
                  {produtoSelecionado.QuantidadeEstoque > 0 ? 'Colocar na Sacola' : 'Fazer Encomenda'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}