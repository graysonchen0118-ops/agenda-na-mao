"use client";

import { useMemo, useState } from "react";
import { BellRing, CalendarClock, CalendarPlus, CalendarX2, ChartColumn, CheckCheck, Wifi } from "lucide-react";
import { useStore } from "@/lib/store";
import { hora } from "@/lib/format";

const ICONE = { novo: CalendarPlus, cancelado: CalendarX2, remarcado: CalendarClock, lembrete: BellRing, resumo: ChartColumn, sinal: Wifi };

export function Avisos() {
  const { avisos, usuario, lerAvisos } = useStore();
  const meus = useMemo(() => avisos.filter((v) => usuario && v.para.includes(usuario.id)), [avisos, usuario]);
  const [prefs, setPrefs] = useState({ novos: true, cancel: true, lembrete: true, resumo: usuario?.papel === "dona" });
  const naoLidos = meus.filter((v) => !v.lido).length;

  return (
    <div className="avisos">
      <div className="lista-meta">
        <span>{naoLidos ? `${naoLidos} sem ler` : "Tudo lido"}</span>
        {naoLidos > 0 && (
          <button className="link link-icone" onClick={lerAvisos}>
            <CheckCheck size={15} /> Marcar como lidos
          </button>
        )}
      </div>
      {meus.length === 0 ? (
        <p className="vazio">Nenhum aviso para você hoje.</p>
      ) : (
        <ul className="lista-avisos">
          {meus.map((v, i) => {
            const I = ICONE[v.tipo];
            return (
              <li key={v.id} className={`aviso tipo-${v.tipo} ${v.lido ? "" : "nao-lido"}`} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                <span className="aviso-icone">
                  <I size={17} />
                </span>
                <span className="aviso-txt">
                  <b>{v.titulo}</b>
                  <small>{v.texto}</small>
                </span>
                <span className="aviso-hora">{hora(v.hora)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <h4 className="ficha-h">O que chega neste celular</h4>
      <div className="prefs">
        {([
          ["novos", usuario?.papel === "profissional" ? "Horários novos na minha agenda" : "Horários novos"],
          ["cancel", "Cancelamentos e faltas"],
          ["lembrete", "Próximo cliente, 10 minutos antes"],
          ["resumo", "Resumo do caixa ao meio-dia"],
        ] as [keyof typeof prefs, string][]).map(([k, n]) => (
          <label key={k} className="interruptor">
            <span>{n}</span>
            <input type="checkbox" checked={!!prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
            <i aria-hidden="true" />
          </label>
        ))}
      </div>
      <p className="nota">Cada aviso vai só para quem pode agir nele. O barbeiro não recebe o horário da manicure.</p>
    </div>
  );
}
