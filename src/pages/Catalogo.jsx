// src/pages/Catalogo.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { useCarrinho } from '../context/CarrinhoContext';
import { FiSearch, FiPlus, FiBox } from 'react-icons/fi';

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
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
          QuantidadeEstoque: valores.QuantidadeEstoque !== undefined ? Number(valores.QuantidadeEstoque) : 0,
        }));
        
        // 🎯 MUDANÇA: Tiramos o filtro de estoque > 0 para mostrar os itens esgotados que aceitam encomenda!
        setProdutos(listaFormatada);
      } else { setProdutos([]); }
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  const produtosFiltrados = produtos.filter((prod) =>
    prod.Nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 font-['Montserrat']">
      
      {/* Header Luxo */}
      <div className="pt-16 pb-10 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-['Playfair_Display'] italic text-[#4A3737] tracking-tight">
          Val <span className="text-[#B76E79]">Importados da Val</span>
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
      <div className="max-w-md mx-auto px-6 mb-12">
        <div className="relative group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B76E79] text-sm" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="O que você deseja?"
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E5B299]/40 rounded-full focus:outline-none focus:border-[#B76E79] text-xs tracking-widest shadow-md transition-all placeholder:italic text-[#4A3737]"
          />
        </div>
      </div>

      {/* Grid Boutique */}
      <div className="max-w-7xl mx-auto px-4">
        {carregando ? (
          <div className="flex justify-center py-24"><div className="w-6 h-6 border-2 border-[#B76E79] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            {produtosFiltrados.map((prod) => {
              const temEstoque = prod.QuantidadeEstoque > 0;

              return (
                <div 
                  key={prod.Id} 
                  className="group bg-white rounded-3xl border border-[#E5B299]/20 p-2.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Imagem */}
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#FAF9F6] relative border border-slate-100">
                    {prod.FotoUrl ? (
                      <img src={prod.FotoUrl} alt={prod.Nome} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">IMAGE</div>
                    )}
                    
                    {/* Badge de Status Dinâmica (Disponível vs Encomenda) */}
                    <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm border border-[#E5B299]/10">
                      <span className={`text-[8px] font-bold tracking-tighter uppercase ${temEstoque ? 'text-[#B76E79]' : 'text-amber-700'}`}>
                        {temEstoque ? 'Disponível' : 'Sob Encomenda'}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="mt-4 text-center px-1 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-[11px] md:text-xs font-semibold text-[#4A3737] uppercase tracking-wider line-clamp-2 leading-tight min-h-[28px]">
                        {prod.Nome}
                      </h3>
                      <p className="text-sm md:text-base font-['Playfair_Display'] font-bold text-[#B76E79] mt-2">
                        R$ {Number(prod.PrecoReal).toFixed(2)}
                      </p>
                    </div>
                    
                    {/* 🎯 BOTÃO DINÂMICO: Muda de cor e texto dependendo do estoque */}
                    <button
                      onClick={() => adicionarAoCarrinho(prod)}
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
    </div>
  );
}