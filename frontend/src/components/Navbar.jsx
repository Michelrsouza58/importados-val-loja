// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCarrinho } from "../context/CarrinhoContext";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useConfiguracoes, ehAdmin } from "../lib/configuracoes";
import { brl } from "../lib/formato";
import { FiUser, FiShoppingBag, FiLogOut, FiPackage, FiMenu, FiX, FiSettings } from "react-icons/fi";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItens, valorTotal, setCarrinhoAberto } = useCarrinho();
  const { config } = useConfiguracoes();

  const [usuario, setUsuario] = useState(null);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    function aoClicarFora(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuPerfilAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  useEffect(() => {
    setMenuAberto(false);
    setMenuPerfilAberto(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuPerfilAberto(false);
      navigate("/");
    } catch (error) {}
  };

  const admin = ehAdmin(usuario, config);
  const links = [
    { para: "/", rotulo: "Início" },
    { para: "/catalogo", rotulo: "Catálogo" },
    { para: "/meus-pedidos", rotulo: "Meus Pedidos" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 h-16 z-40 bg-creme/85 backdrop-blur-md border-b border-espresso/10 flex items-center justify-between px-4 sm:px-6"
      data-testid="navbar-principal"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="md:hidden p-2 text-espresso hover:text-rose transition-colors"
          aria-label="Abrir menu"
          data-testid="navbar-menu-mobile-botao"
        >
          {menuAberto ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
        <Link to="/" className="focus:outline-none" data-testid="navbar-logo">
          <span className="font-display italic text-xl sm:text-2xl text-espresso tracking-tight">
            Importados <span className="text-rose">da Val</span>
          </span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <Link
            key={l.para}
            to={l.para}
            className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-rose ${
              location.pathname === l.para ? "text-rose" : "text-espresso/70"
            }`}
          >
            {l.rotulo}
          </Link>
        ))}
        {admin && (
          <Link
            to="/admin"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold hover:text-rose transition-colors"
            data-testid="navbar-link-admin"
          >
            Painel Admin
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {usuario ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
              className="p-1.5 text-espresso hover:text-rose transition-colors"
              aria-label="Menu da conta"
              data-testid="navbar-perfil-botao"
            >
              <FiUser size={19} />
            </button>
            {menuPerfilAberto && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-espresso/10 rounded-2xl shadow-xl py-2 z-50">
                <div className="px-4 py-3 border-b border-espresso/5">
                  <p className="text-[10px] uppercase tracking-wider text-espresso/40">Conta</p>
                  <p className="text-xs font-semibold text-espresso truncate mt-0.5">{usuario.email}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { navigate("/meus-pedidos"); setMenuPerfilAberto(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs text-espresso hover:bg-creme rounded-xl transition-all font-medium"
                    data-testid="navbar-menu-meus-pedidos"
                  >
                    <FiPackage size={14} /> Meus Pedidos
                  </button>
                  {admin && (
                    <button
                      onClick={() => { navigate("/admin"); setMenuPerfilAberto(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs text-espresso hover:bg-creme rounded-xl transition-all font-medium"
                      data-testid="navbar-menu-admin"
                    >
                      <FiSettings size={14} /> Painel Admin
                    </button>
                  )}
                </div>
                <div className="border-t border-espresso/5 p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs text-rose hover:bg-rose/5 rounded-xl transition-all font-semibold"
                    data-testid="navbar-menu-sair"
                  >
                    <FiLogOut size={14} /> Sair da Conta
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-[10px] font-bold text-espresso tracking-widest uppercase hover:text-rose border border-espresso/15 px-4 py-1.5 rounded-full transition-all bg-white"
            data-testid="navbar-botao-entrar"
          >
            Entrar
          </button>
        )}

        <button onClick={() => setCarrinhoAberto(true)} className="flex items-center gap-2 group" data-testid="navbar-sacola-botao">
          <span className="relative p-0.5">
            <FiShoppingBag size={20} className="text-espresso group-hover:text-rose transition-colors" />
            {totalItens > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 bg-rose text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                data-testid="navbar-sacola-contador"
              >
                {totalItens}
              </span>
            )}
          </span>
          {totalItens > 0 && (
            <span className="hidden md:inline text-[11px] font-semibold text-rose font-mono" data-testid="navbar-sacola-total">
              {brl(valorTotal)}
            </span>
          )}
        </button>
      </div>

      {menuAberto && (
        <div className="fixed inset-0 top-16 bg-creme md:hidden z-30 p-6">
          <div className="flex flex-col gap-2 pt-4">
            {links.map((l) => (
              <Link
                key={l.para}
                to={l.para}
                className="py-4 border-b border-espresso/5 font-display italic text-2xl text-espresso"
                data-testid={`navbar-mobile-${l.para.replace("/", "") || "inicio"}`}
              >
                {l.rotulo}
              </Link>
            ))}
            {admin && (
              <Link to="/admin" className="py-4 border-b border-espresso/5 font-display italic text-2xl text-gold" data-testid="navbar-mobile-admin">
                Painel Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
