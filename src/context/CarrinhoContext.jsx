// src/context/CarrinhoContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, set, get } from 'firebase/database';

const CarrinhoContext = createContext();

export function CarrinhoProvider({ children }) {
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState(null);

  // 🔄 EFEITO PRINCIPAL: Monitora Login/Logout e gerencia as fontes de dados
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUsuarioAtual(user);

      if (user) {
        // --- 🟢 USUÁRIO LOGADO: Sincronização com Firebase ---
        const carrinhoLocalRef = localStorage.getItem('carrinho_val');
        const itensLocais = carrinhoLocalRef ? JSON.parse(carrinhoLocalRef) : [];
        
        const dbCarrinhoRef = ref(db, `carrinho/${user.uid}`);
        
        // 1. Faz o Merge (mesclagem) se houver itens guardados no localStorage antes do login
        if (itensLocais.length > 0) {
          const snapshot = await get(dbCarrinhoRef);
          let itensNuvem = snapshot.exists() ? snapshot.val() : [];
          
          // Garante que itensNuvem seja um array válido para manipulação
          if (!Array.isArray(itensNuvem)) {
            itensNuvem = Object.values(itensNuvem);
          }

          // Combina as duas listas
          let carrinhoMesclado = [...itensNuvem];

          itensLocais.forEach((itemLocal) => {
            const index = carrinhoMesclado.findIndex((item) => item.Id === itemLocal.Id);
            if (index !== -1) {
              // Se já existe na nuvem, soma as quantidades
              carrinhoMesclado[index].quantidadeCarrinho += itemLocal.quantidadeCarrinho;
            } else {
              // Se não existe, adiciona o item novo vindo do local
              carrinhoMesclado.push(itemLocal);
            }
          });

          // Grava a lista combinada definitiva no Firebase e limpa o localStorage
          await set(dbCarrinhoRef, carrinhoMesclado);
          localStorage.removeItem('carrinho_val');
        }

        // 2. Cria o Listener em tempo real para escutar o carrinho do Firebase
        const unsubscribeLiveCarrinho = onValue(dbCarrinhoRef, (snapshot) => {
          if (snapshot.exists()) {
            const dados = snapshot.val();
            // Garante que sempre trate como Array, mesmo que o Firebase mude a estrutura interna
            setCarrinho(Array.isArray(dados) ? dados : Object.values(dados));
          } else {
            setCarrinho([]);
          }
        });

        // Limpa o listener do banco caso o usuário mude de estado/deslogue
        return () => unsubscribeLiveCarrinho();

      } else {
        // --- ⚪ USUÁRIO DESLOGADO: Mantém o padrão antigo no localStorage ---
        const salvo = localStorage.getItem('carrinho_val');
        setCarrinho(salvo ? JSON.parse(salvo) : []);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 💾 Função auxiliar para atualizar o banco ou o localStorage dependendo do login
  const persistirCarrinho = async (novoCarrinho) => {
    if (usuarioAtual) {
      // Grava direto no nó do cliente no Firebase Realtime
      const dbCarrinhoRef = ref(db, `carrinho/${usuarioAtual.uid}`);
      await set(dbCarrinhoRef, novoCarrinho);
    } else {
      // Modo visitante: joga no localStorage clássico
      setCarrinho(novoCarrinho);
      localStorage.setItem('carrinho_val', JSON.stringify(novoCarrinho));
    }
  };

  const adicionarAoCarrinho = async (produto) => {
    let novoCarrinho = [];
    const existe = carrinho.find((item) => item.Id === produto.Id);

    if (existe) {
      novoCarrinho = carrinho.map((item) =>
        item.Id === produto.Id 
          ? { ...item, quantidadeCarrinho: item.quantidadeCarrinho + 1 } 
          : item
      );
    } else {
      novoCarrinho = [
        ...carrinho, 
        { 
          ...produto, 
          quantidadeCarrinho: 1,
          QuantidadeEstoque: produto.QuantidadeEstoque !== undefined ? Number(produto.QuantidadeEstoque) : 0
        }
      ];
    }

    await persistirCarrinho(novoCarrinho);
  };

  const atualizarQuantidade = async (id, novaQtd) => {
    if (novaQtd <= 0) {
      await removerDoCarrinho(id);
      return;
    }

    const novoCarrinho = carrinho.map((item) =>
      item.Id === id ? { ...item, Comprehensive: novaQtd, quantidadeCarrinho: novaQtd } : item
    );

    await persistirCarrinho(novoCarrinho);
  };

  const removerDoCarrinho = async (id) => {
    const novoCarrinho = carrinho.filter((item) => item.Id !== id);
    await persistirCarrinho(novoCarrinho);
  };

  const limparCarrinho = async () => {
    if (usuarioAtual) {
      const dbCarrinhoRef = ref(db, `carrinho/${usuarioAtual.uid}`);
      await set(dbCarrinhoRef, null); // Remove o nó do Firebase limpando a nuvem
    } else {
      setCarrinho([]);
      localStorage.removeItem('carrinho_val');
    }
  };

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