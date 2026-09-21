// src/components/Marquee.jsx
import React from "react";

const ITENS = [
  "Perfumes Importados",
  "Body Splash",
  "Maquiagem Internacional",
  "Skincare Premium",
  "Cabelos",
  "Sob Encomenda",
];

export default function Marquee() {
  const linha = (aria) => (
    <div className="flex shrink-0 items-center" aria-hidden={aria || undefined}>
      {ITENS.map((item) => (
        <span key={item + (aria ? "-b" : "-a")} className="flex items-center">
          <span className="px-8 text-sm md:text-base uppercase tracking-[0.35em] font-medium text-creme whitespace-nowrap">
            {item}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-gold" data-testid="marquee-dot" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="bg-espresso overflow-hidden py-4 border-y border-white/5" data-testid="marquee-editorial">
      <div className="flex w-max animate-marquee">
        {linha(false)}
        {linha(true)}
      </div>
    </div>
  );
}
