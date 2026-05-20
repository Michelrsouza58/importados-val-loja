// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CarrinhoProvider } from './context/CarrinhoContext';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Catalogo from './pages/Catalogo';
import LoginCliente from './pages/LoginCliente';
import MeusPedidos from './pages/MeusPedidos';
import Navbar from './components/Navbar';
import CarrinhoGaveta from './components/CarrinhoGaveta';

// Mantemos a RotaPrivada apenas para proteger a página de histórico de pedidos
function RotaPrivada({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#B76E79] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <CarrinhoProvider>
      <Router>
        <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans antialiased">
          
          <Navbar /> 
          <CarrinhoGaveta />
          
          <div className="pt-16">
            <Routes>
              {/* 🔓 AGORA É PÚBLICO: Qualquer visitante consegue ver o catálogo de cara */}
              <Route path="/" element={<Catalogo />} />

              {/* Rota pública para a tela de Login */}
              <Route path="/login" element={<LoginCliente />} />

              {/* 🔒 PROTEGIDA: Histórico exige estar logado */}
              <Route path="/meus-pedidos" element={
                <RotaPrivada>
                  <MeusPedidos />
                </RotaPrivada>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

        </div>
      </Router>
    </CarrinhoProvider>
  );
}