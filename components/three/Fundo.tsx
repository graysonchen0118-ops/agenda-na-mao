"use client";

import dynamic from "next/dynamic";

// The scene never renders on the server. The styled placeholder stays if WebGL is missing.
const Backdrop = dynamic(() => import("./Backdrop"), { ssr: false, loading: () => null });

export function Fundo() {
  return (
    <>
      <div className="cena-placeholder" aria-hidden="true" />
      <Backdrop />
    </>
  );
}
