// src/pages/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-ink text-creme/60 py-14" data-testid="footer-principal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="font-display italic text-2xl text-creme">
          Importados <span className="text-rose">da Val</span>
        </span>
        <nav className="flex items-center gap-8 text-[10px] font-semibold uppercase tracking-[0.2em]">
          <Link to="/" className="hover:text-creme transition-colors" data-testid="footer-link-inicio">Início</Link>
          <Link to="/catalogo" className="hover:text-creme transition-colors" data-testid="footer-link-catalogo">Catálogo</Link>
          <Link to="/meus-pedidos" className="hover:text-creme transition-colors" data-testid="footer-link-pedidos">Meus Pedidos</Link>
          <Link to="/admin" className="hover:text-creme transition-colors text-creme/30" data-testid="footer-link-admin">Admin</Link>
        </nav>
        <p className="text-[10px] uppercase tracking-[0.25em]">
          Cosméticos e importados de qualidade
        </p>
      </div>
    </footer>
  );
}
