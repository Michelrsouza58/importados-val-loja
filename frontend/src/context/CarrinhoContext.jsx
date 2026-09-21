// src/context/CarrinhoContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, set, get } from "firebase/database";

const CarrinhoContext = createContext();

const CHAVE_LOCAL = "carrinho_val_v2";

function chaveItem(item) {
  return `${item.Id}__${item.varianteId || "base"}`;
}

function normalizarLista(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter((i) => i && i.Id).map((i) => ({
    ...i,
    quantidadeCarrinho: Number(i.quantidadeCarrinho || 1),
    precoUnit: Number(i.precoUnit || i.PrecoReal || 0),
  }));
}

export function CarrinhoProvider({ children }) {
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUsuarioAtual(user);

      if (user) {
        const itensLocais = normalizarLista(
          JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "[]")
        );
        const dbCarrinhoRef = ref(db, `carrinho/${user.uid}`);

        try {
          const snapshot = await get(dbCarrinhoRef);
          let itensNuvem = normalizarLista(snapshot.exists() ? snapshot.val() : []);

          let mesclado = [...itensNuvem];
          itensLocais.forEach((itemLocal) => {
            const idx = mesclado.findIndex((i) => chaveItem(i) === chaveItem(itemLocal));
            if (idx !== -1) {
              mesclado[idx].quantidadeCarrinho += itemLocal.quantidadeCarrinho;
            } else {
              mesclado.push(itemLocal);
            }
          });

          await set(dbCarrinhoRef, mesclado);
          localStorage.removeItem(CHAVE_LOCAL);
          setCarrinho(mesclado);
        } catch (e) {
          // Sem permissão de escrita/leitura: segue com o carrinho local
          setCarrinho(itensLocais);
        }

        const unsubscribeLive = onValue(
          dbCarrinhoRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setCarrinho(normalizarLista(snapshot.val()));
            } else {
              setCarrinho([]);
            }
          },
          () => {}
        );
        return () => unsubscribeLive();
      } else {
        const salvo = normalizarLista(JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "[]"));
        setCarrinho(salvo);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const persistir = async (novoCarrinho) => {
    if (usuarioAtual) {
      try {
        await set(ref(db, `carrinho/${usuarioAtual.uid}`), novoCarrinho);
      } catch (e) {
        setCarrinho(novoCarrinho);
        localStorage.setItem(CHAVE_LOCAL, JSON.stringify(novoCarrinho));
      }
    } else {
      setCarrinho(novoCarrinho);
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(novoCarrinho));
    }
  };

  const adicionarAoCarrinho = async (produto, variante, quantidade = 1) => {
    const v = variante || null;
    const precoUnit = v && Number(v.Preco) > 0 ? Number(v.Preco) : Number(produto.PrecoReal || 0);
    const item = {
      Id: produto.Id,
      Nome: produto.Nome,
      Categoria: produto.Categoria || "Outros",
      FotoUrl: v && v.FotoUrl ? v.FotoUrl : produto.FotoUrl,
      varianteId: v ? v.id : null,
      varianteNome: v ? v.Nome : null,
      precoUnit,
      QuantidadeEstoque: v ? Number(v.QuantidadeEstoque || 0) : Number(produto.QuantidadeEstoque || 0),
      quantidadeCarrinho: quantidade,
    };

    const existe = carrinho.find((i) => chaveItem(i) === chaveItem(item));
    let novoCarrinho;
    if (existe) {
      novoCarrinho = carrinho.map((i) =>
        chaveItem(i) === chaveItem(item)
          ? { ...i, quantidadeCarrinho: i.quantidadeCarrinho + quantidade, precoUnit, FotoUrl: item.FotoUrl }
          : i
      );
    } else {
      novoCarrinho = [...carrinho, item];
    }
    await persistir(novoCarrinho);
  };

  const atualizarQuantidade = async (item, novaQtd) => {
    if (novaQtd <= 0) {
      await removerDoCarrinho(item);
      return;
    }
    const novoCarrinho = carrinho.map((i) =>
      chaveItem(i) === chaveItem(item) ? { ...i, quantidadeCarrinho: novaQtd } : i
    );
    await persistir(novoCarrinho);
  };

  const removerDoCarrinho = async (item) => {
    const novoCarrinho = carrinho.filter((i) => chaveItem(i) !== chaveItem(item));
    await persistir(novoCarrinho);
  };

  const limparCarrinho = async () => {
    if (usuarioAtual) {
      try {
        await set(ref(db, `carrinho/${usuarioAtual.uid}`), null);
      } catch (e) {}
    }
    setCarrinho([]);
    localStorage.removeItem(CHAVE_LOCAL);
  };

  const totalItens = carrinho.reduce((soma, i) => soma + i.quantidadeCarrinho, 0);
  const valorTotal = carrinho.reduce((soma, i) => soma + i.precoUnit * i.quantidadeCarrinho, 0);

  return (
    <CarrinhoContext.Provider
      value={{
        carrinho,
        adicionarAoCarrinho,
        atualizarQuantidade,
        removerDoCarrinho,
        limparCarrinho,
        totalItens,
        valorTotal,
        carrinhoAberto,
        setCarrinhoAberto,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  return useContext(CarrinhoContext);
}
