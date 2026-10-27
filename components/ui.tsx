"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { foto } from "@/lib/photos";

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tom}`}>
          {t.tom === "ok" ? <CheckCircle2 size={18} /> : t.tom === "erro" ? <TriangleAlert size={18} /> : <Info size={18} />}
          <span>{t.texto}</span>
        </div>
      ))}
    </div>
  );
}

export function Foto({ chave, w, h, alt, className, eager, rosto }: { chave: string; w: number; h: number; alt: string; className?: string; eager?: boolean; rosto?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={foto(chave, w, h, rosto)}
      width={w}
      height={h}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`foto ${ok ? "foto-ok" : ""} ${className ?? ""}`}
      onLoad={() => setOk(true)}
    />
  );
}

export function Avatar({ chave, nome, size = 36, className }: { chave: string; nome: string; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto(chave, size * 2, size * 2, true)} width={size} height={size} alt={nome} className={`avatar ${className ?? ""}`} style={{ width: size, height: size }} loading="lazy" />
  );
}

/** inline skeleton, a span so it is safe inside text */
export function Skel({ h = 14, w = "100%", r = 8 }: { h?: number; w?: number | string; r?: number }) {
  return <span className="skel" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

/** tilts the element in real perspective under the pointer, with the light following */
export function Tilt({ children, className, max = 6 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
    el.style.setProperty("--lx", `${((x + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--ly", `${((y + 0.5) * 100).toFixed(0)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div ref={ref} className={`tilt ${className ?? ""}`} onPointerMove={move} onPointerLeave={leave}>
      {children}
      <span className="tilt-light" aria-hidden="true" />
    </div>
  );
}

/** bottom sheet inside the phone screen */
export function Sheet({ aberto, titulo, onFechar, children, alto }: { aberto: boolean; titulo: string; onFechar: () => void; children: React.ReactNode; alto?: boolean }) {
  const [montado, setMontado] = useState(aberto);
  useEffect(() => {
    if (aberto) setMontado(true);
    else {
      const t = setTimeout(() => setMontado(false), 260);
      return () => clearTimeout(t);
    }
  }, [aberto]);
  if (!montado) return null;
  return (
    <div className={`sheet-wrap ${aberto ? "show" : ""}`}>
      <button className="sheet-scrim" aria-label="Fechar" onClick={onFechar} />
      <div className={`sheet ${alto ? "sheet-alto" : ""}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="sheet-head">
          <span className="sheet-grip" aria-hidden="true" />
          <h3>{titulo}</h3>
          <button className="icon-btn" onClick={onFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** a count that rolls up when the number changes */
export function Numero({ valor, formato }: { valor: number; formato: (v: number) => string }) {
  const [v, setV] = useState(valor);
  const de = useRef(valor);
  useEffect(() => {
    const ini = de.current;
    const t0 = performance.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 600);
      const e = 1 - Math.pow(1 - k, 3);
      setV(ini + (valor - ini) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else de.current = valor;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return <>{formato(v)}</>;
}
