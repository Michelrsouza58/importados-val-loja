// src/lib/produtos.js
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

export const CATEGORIAS = ["Todos", "Cabelos", "Maquiagem", "Perfumaria", "Skincare", "Outros"];

export function normalizarProduto(chave, valores) {
  const v = valores || {};
  const variantes = v.Variantes
    ? Object.entries(v.Variantes).map(([id, va]) => ({
        id,
        Nome: (va && va.Nome) || "",
        FotoUrl: (va && va.FotoUrl) || "",
        Preco: Number((va && va.Preco) || 0),
        QuantidadeEstoque: Number((va && va.QuantidadeEstoque) || 0),
      }))
    : [];
  return {
    Id: v.Id || chave,
    FirebaseKey: chave,
    Nome: v.Nome || "",
    Categoria: v.Categoria || "Outros",
    PrecoReal: Number(v.PrecoReal || 0),
    Descricao: v.Descricao || "Nenhuma descrição informada para este produto.",
    QuantidadeEstoque: Number(v.QuantidadeEstoque !== undefined ? v.QuantidadeEstoque : 0),
    CodigoBarras: v.CodigoBarras || "---",
    FotoUrl: v.FotoUrl || "",
    Variantes: variantes,
  };
}

// Preço efetivo de um produto com (ou sem) variante ativa
export function precoEfetivo(produto, variante) {
  if (variante && Number(variante.Preco) > 0) return Number(variante.Preco);
  return Number(produto && produto.PrecoReal ? produto.PrecoReal : 0);
}

export function estoqueEfetivo(produto, variante) {
  if (variante) return Number(variante.QuantidadeEstoque || 0);
  return Number(produto && produto.QuantidadeEstoque ? produto.QuantidadeEstoque : 0);
}

// Fallback: catálogo de demonstração usado quando o Firebase não responde
// (ex.: regras de leitura fechadas). Em produção, com as regras corretas, os
// produtos reais do painel admin aparecem automaticamente.
export const DEMO_PRODUTOS = [
  {
    Id: "demo-body", FirebaseKey: "demo-body", Nome: "Body Splash Premium 250ml", Categoria: "Perfumaria",
    PrecoReal: 79.9, Descricao: "Body splash importado com fragrância duradoura e toque suave na pele. Disponível em dois aromas exclusivos.",
    QuantidadeEstoque: 8, CodigoBarras: "7890000000010", FotoUrl: "https://images.pexels.com/photos/14882100/pexels-photo-14882100.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    Variantes: [
      { id: "v1", Nome: "Aroma 1 — Doce", FotoUrl: "https://images.pexels.com/photos/14882100/pexels-photo-14882100.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", Preco: 79.9, QuantidadeEstoque: 5 },
      { id: "v2", Nome: "Aroma 2 — Floral", FotoUrl: "https://images.pexels.com/photos/14882099/pexels-photo-14882099.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", Preco: 79.9, QuantidadeEstoque: 3 },
    ],
  },
  {
    Id: "demo-perfume", FirebaseKey: "demo-perfume", Nome: "Perfume Importado Feminino 100ml", Categoria: "Perfumaria",
    PrecoReal: 249.9, Descricao: "Eau de parfum importado, fixação prolongada e assinatura marcante. Edição com curadoria da Val.",
    QuantidadeEstoque: 4, CodigoBarras: "7890000000027", FotoUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?crop=entropy&cs=srgb&fm=jpg&q=85",
    Variantes: [],
  },
  {
    Id: "demo-batom", FirebaseKey: "demo-batom", Nome: "Batom Matte Longa Duração", Categoria: "Maquiagem",
    PrecoReal: 39.9, Descricao: "Batom matte importado com cobertura intensa e confortável. Não resseca os lábios.",
    QuantidadeEstoque: 12, CodigoBarras: "7890000000034", FotoUrl: "https://images.unsplash.com/photo-1618510069246-21f564373621?crop=entropy&cs=srgb&fm=jpg&q=85",
    Variantes: [],
  },
  {
    Id: "demo-serum", FirebaseKey: "demo-serum", Nome: "Sérum Facial Revitalizante", Categoria: "Skincare",
    PrecoReal: 129.9, Descricao: "Sérum importado para a rotina de skincare noturna, com acabamento acetinado e rápida absorção.",
    QuantidadeEstoque: 6, CodigoBarras: "7890000000041", FotoUrl: "https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    Variantes: [],
  },
  {
    Id: "demo-creme", FirebaseKey: "demo-creme", Nome: "Creme Hidratante Corporal", Categoria: "Skincare",
    PrecoReal: 89.9, Descricao: "Hidratação profunda com fragrância delicada. Ideal para uso diário após o banho.",
    QuantidadeEstoque: 0, CodigoBarras: "7890000000058", FotoUrl: "https://images.pexels.com/photos/7670759/pexels-photo-7670759.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    Variantes: [],
  },
  {
    Id: "demo-mascara", FirebaseKey: "demo-mascara", Nome: "Máscara de Cílios Volume", Categoria: "Maquiagem",
    PrecoReal: 59.9, Descricao: "Máscara importada de alta definição, efeito volume desde a primeira aplicação.",
    QuantidadeEstoque: 0, CodigoBarras: "7890000000065", FotoUrl: "https://images.unsplash.com/photo-1555050455-f96634b5cba6?crop=entropy&cs=srgb&fm=jpg&q=85",
    Variantes: [],
  },
];

export function useProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [fonteDemo, setFonteDemo] = useState(false);

  useEffect(() => {
    const produtosRef = ref(db, "items");
    const unsubscribe = onValue(
      produtosRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const dados = snapshot.val();
          const lista = Object.entries(dados).map(([chave, valores]) => normalizarProduto(chave, valores));
          setProdutos(lista);
          setFonteDemo(false);
        } else {
          setProdutos([]);
          setFonteDemo(false);
        }
        setCarregando(false);
      },
      (erro) => {
        // Leitura negada pelas regras do Firebase (ou indisponível): catálogo demo
        setProdutos(DEMO_PRODUTOS);
        setFonteDemo(true);
        setCarregando(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { produtos, carregando, fonteDemo };
}
