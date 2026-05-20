// src/context/CarrinhoContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CarrinhoContext = createContext();

export function CarrinhoProvider({ children }) {
  const [carrinho, setCarrinho] = useState(() => {
    const salvo = localStorage.getItem('carrinho_val');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  useEffect(() => {
    localStorage.setItem('carrinho_val', JSON.stringify(carrinho));
  }, [carrinho]);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((itensAtuais) => {
      const existe = itensAtuais.find((item) => item.Id === produto.Id);
      if (existe) {
        return itensAtuais.map((item) =>
          item.Id === produto.Id 
            ? { ...item, quantidadeCarrinho: item.quantidadeCarrinho + 1 } 
            : item
        );
      }
      
      // O QuantidadeEstoque entra aqui convertido como número
      return [
        ...itensAtuais, 
        { 
          ...produto, 
          quantidadeCarrinho: 1,
          QuantidadeEstoque: produto.QuantidadeEstoque !== undefined ? Number(produto.QuantidadeEstoque) : 0
        }
      ];
    });
    
    // 🎯 ANTES TINHA UMA LINHA AQUI: setCarrinhoAberto(true);
    // Removendo ela, o item acumula na sacola silenciosamente sem abrir a gaveta na tela!
  };

  const atualizarQuantidade = (id, novaQtd) => {
    if (novaQtd <= 0) {
      removerDoCarrinho(id);
      return;
    }
    setCarrinho((itensAtuais) =>
      itensAtuais.map((item) =>
        item.Id === id ? { ...item, Comprehensive: novaQtd, quantidadeCarrinho: novaQtd } : item
      )
    );
  };

  const removerDoCarrinho = (id) => {
    setCarrinho((itensAtuais) => itensAtuais.filter((item) => item.Id !== id));
  };

  const limparCarrinho = () => setCarrinho([]);

  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidadeCarrinho, 0);
  const valorTotal = carrinho.reduce((soma, item) => soma + (item.PrecoReal * item.quantidadeCarrinho), 0);

  return (
    <CarrinhoContext.Provider value={{
      carrinho,
      adicionarAoCarrinho,
      atualizarQuantidade,
      removerDoCarrinho,
      limparCarrinho,
      totalItens,
      valorTotal,
      carrinhoAberto,
      setCarrinhoAberto
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  return useContext(CarrinhoContext);
}