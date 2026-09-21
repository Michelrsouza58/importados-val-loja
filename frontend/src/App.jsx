// src/App.jsx
import React, { Component, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "sonner";

import { CarrinhoProvider } from "./context/CarrinhoContext";
import Navbar from "./components/Navbar";
import CarrinhoGaveta from "./components/CarrinhoGaveta";
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import LoginCliente from "./pages/LoginCliente";
import MeusPedidos from "./pages/MeusPedidos";
import Admin from "./pages/admin/Admin";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }
  static getDerivedStateFromError(erro) {
    return { erro };
  }
  render() {
    if (this.state.erro) {
      return (
        <div className="min-h-screen bg-creme flex items-center justify-center p-6" data-testid="erro-limite">
          <div className="text-center max-w-sm">
            <p className="font-display italic text-3xl text-espresso mb-3">Ops, algo saiu do trilho</p>
            <p className="text-xs text-espresso/50 mb-6">Recarregue a página para voltar à loja.</p>
            <button onClick={() => window.location.reload()} className="bg-espresso text-creme px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest">
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function LenisSmooth() {
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let id;
    const raf = (tempo) => {
      lenis.raf(tempo);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);
  return null;
}

function RotaPrivada({ children }) {
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <CarrinhoProvider>
        <Router>
          <LenisSmooth />
          <ScrollToTop />
          <div className="min-h-screen bg-creme text-espresso font-sans antialiased">
            <Navbar />
            <CarrinhoGaveta />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/login" element={<LoginCliente />} />
                <Route path="/meus-pedidos" element={<RotaPrivada><MeusPedidos /></RotaPrivada>} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          <Toaster richColors position="top-center" toastOptions={{ style: { fontFamily: "Montserrat, sans-serif" } }} />
        </Router>
      </CarrinhoProvider>
    </ErrorBoundary>
  );
}
