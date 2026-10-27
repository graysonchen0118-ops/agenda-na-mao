"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Swords, WifiOff, X } from "lucide-react";
import { useStore, horariosLivres } from "@/lib/store";
import { disparar } from "@/lib/cena";
import { servico } from "@/lib/mock/servicos";
import { CLIENTES } from "@/lib/mock/clientes";
import { Phone } from "./app/Phone";
import { Recepcao } from "./Recepcao";

const idPorNome = (n: string) => CLIENTES.find((c) => c.nome === n)!.id;

export function Simulador() {
  const { agenda, online } = useStore();
  const [texto, setTexto] = useState<string | null>(null);

  useEffect(() => {
    const on = (e: Event) => setTexto((e as CustomEvent<string | null>).detail);
    window.addEventListener("agenda:dica", on);
    return () => window.removeEventListener("agenda:dica", on);
  }, []);

  // the first free time from aPartir, today if there is one, otherwise on the next open day
  const proximoLivre = (aPartir: number, dur: number) => {
    for (let d = 0; d < 5; d++) {
      const l = horariosLivres(agenda, "p-rafael", d, dur);
      const t = l.find((x) => x >= aPartir) ?? (d > 0 ? l[0] : undefined);
      if (t !== undefined) return { dia: d, inicio: t };
    }
    return null;
  };

  const corrida = () => {
    const sv = servico("s-corte-m");
    const t = proximoLivre(15 * 60, sv.duracao);
    if (!t) return;
    disparar({ tipo: "corrida", dia: t.dia, inicio: t.inicio, clienteApp: idPorNome("Henrique Dias"), clienteWeb: idPorNome("Mateus Araújo"), servicoId: sv.id });
  };

  const semSinal = () => {
    const sv = servico("s-corte-m");
    const t = proximoLivre(18 * 60 + 30, sv.duracao);
    if (!t) return;
    disparar({ tipo: "semSinal", dia: t.dia, inicio: t.inicio, clienteWeb: idPorNome("Murilo Saraiva"), servicoId: sv.id });
  };

  return (
    <div className="simulador">
      <div className="cenas" role="group" aria-label="Situações para testar">
        <span className="cenas-rotulo">Teste uma situação real:</span>
        <button className="btn btn-cena" onClick={corrida} data-acao="cena-corrida">
          <Swords size={16} /> Dois pedidos para o mesmo horário
        </button>
        <button className="btn btn-cena" onClick={semSinal} disabled={!online} data-acao="cena-sinal">
          <WifiOff size={16} /> O sinal caiu no fundo do salão
        </button>
      </div>
      {texto && (
        <div className="dica" role="status">
          <Lightbulb size={18} />
          <p>{texto}</p>
          <button className="icon-btn" onClick={() => setTexto(null)} aria-label="Fechar dica">
            <X size={15} />
          </button>
        </div>
      )}
      <div className="sim-grade">
        <div className="sim-celular">
          <span className="sim-rotulo">No celular de quem atende</span>
          <div className="celular-palco">
            <Phone />
          </div>
        </div>
        <div className="sim-web">
          <span className="sim-rotulo">No computador da recepção</span>
          <Recepcao />
        </div>
      </div>
    </div>
  );
}
