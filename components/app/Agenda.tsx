"use client";

import { useMemo } from "react";
import { CalendarPlus, ChevronRight, Clock3, Smartphone, Monitor } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Agendamento } from "@/lib/types";
import { EQUIPE, profissional } from "@/lib/mock/equipe";
import { servico } from "@/lib/mock/servicos";
import { SEMANA, AGORA } from "@/lib/mock/calendario";
import { hora, nomeCurto, duracao } from "@/lib/format";
import { Avatar } from "../ui";
import type { Prefill } from "@/lib/cena";

export const STATUS_NOME: Record<string, string> = {
  confirmado: "Confirmado",
  em_atendimento: "Na cadeira",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

interface Props {
  modo: "dia" | "semana";
  setModo: (m: "dia" | "semana") => void;
  dia: number;
  setDia: (d: number) => void;
  pro: string;
  setPro: (p: string) => void;
  onAbrir: (id: string) => void;
  onNovo: (p: Prefill) => void;
}

type Linha = { tipo: "ag"; ag: Agendamento } | { tipo: "livre"; de: number; ate: number } | { tipo: "agora" };

export function Agenda({ modo, setModo, dia, setDia, pro, setPro, onAbrir, onNovo }: Props) {
  const { agendaVisivel, usuario, clientes, novidades, online } = useStore();
  const ehPro = usuario?.papel === "profissional";
  const proAtivo = ehPro ? usuario!.profissionalId! : pro;

  const doDia = useMemo(() => agendaVisivel.filter((a) => a.dia === dia).sort((a, b) => a.inicio - b.inicio), [agendaVisivel, dia]);

  const linhas = useMemo<Linha[]>(() => {
    if (proAtivo === "todos") return [];
    const d = SEMANA[dia];
    const meus = doDia.filter((a) => a.profissionalId === proAtivo);
    const ativos = meus.filter((a) => a.status !== "cancelado");
    const out: Linha[] = [];
    let cursor = d.abre;
    let agoraPosto = dia !== 0;
    const empurraAgora = (antes: number) => {
      if (!agoraPosto && AGORA.min <= antes) {
        out.push({ tipo: "agora" });
        agoraPosto = true;
      }
    };
    for (const a of meus) {
      if (a.status === "cancelado") {
        empurraAgora(a.inicio);
        out.push({ tipo: "ag", ag: a });
        continue;
      }
      if (a.inicio - cursor >= 30) {
        const de = dia === 0 ? Math.max(cursor, Math.ceil((AGORA.min + 5) / 15) * 15) : cursor;
        if (a.inicio - de >= 30) {
          empurraAgora(de);
          out.push({ tipo: "livre", de, ate: a.inicio });
        }
      }
      empurraAgora(a.inicio);
      out.push({ tipo: "ag", ag: a });
      cursor = Math.max(cursor, a.fim);
    }
    const fimDia = d.fecha;
    const de = dia === 0 ? Math.max(cursor, Math.ceil((AGORA.min + 5) / 15) * 15) : cursor;
    if (fimDia - de >= 30) {
      empurraAgora(de);
      out.push({ tipo: "livre", de, ate: fimDia });
    }
    if (!agoraPosto) out.push({ tipo: "agora" });
    void ativos;
    return out;
  }, [doDia, proAtivo, dia]);

  const nomeCli = (id: string) => clientes.find((c) => c.id === id)?.nome ?? "Cliente removido";

  const ocupacao = (pid: string, d: number) => {
    const dd = SEMANA[d];
    const total = dd.fecha - dd.abre;
    const usado = agendaVisivel.filter((a) => a.profissionalId === pid && a.dia === d && a.status !== "cancelado").reduce((s, a) => s + (a.fim - a.inicio), 0);
    return Math.min(100, Math.round((usado / total) * 100));
  };

  return (
    <div className="agenda">
      <div className="seg" role="tablist" aria-label="Período">
        <button role="tab" aria-selected={modo === "dia"} className={modo === "dia" ? "on" : ""} onClick={() => setModo("dia")}>
          Dia
        </button>
        <button role="tab" aria-selected={modo === "semana"} className={modo === "semana" ? "on" : ""} onClick={() => setModo("semana")}>
          Semana
        </button>
      </div>

      <div className="dias" role="tablist" aria-label="Dia">
        {SEMANA.map((d) => (
          <button key={d.i} role="tab" aria-selected={dia === d.i} className={`dia-chip ${dia === d.i ? "on" : ""}`} onClick={() => setDia(d.i)}>
            <small>{d.i === 0 ? "Hoje" : d.curto}</small>
            <b>{d.data.slice(0, 2)}</b>
          </button>
        ))}
      </div>

      {!ehPro && (
        <div className="pros" aria-label="Profissional">
          <button className={`pro-chip ${proAtivo === "todos" ? "on" : ""}`} onClick={() => setPro("todos")}>
            Todos
          </button>
          {EQUIPE.map((p) => (
            <button key={p.id} className={`pro-chip ${proAtivo === p.id ? "on" : ""}`} onClick={() => setPro(p.id)}>
              <Avatar chave={p.foto} nome={p.nome} size={22} />
              {p.curto}
            </button>
          ))}
        </div>
      )}

      {modo === "semana" ? (
        proAtivo === "todos" ? (
          <div className="mapa-semana">
            <div className="ms-head">
              <span />
              {SEMANA.map((d) => (
                <span key={d.i}>{d.curto}</span>
              ))}
            </div>
            {EQUIPE.map((p) => (
              <div className="ms-linha" key={p.id}>
                <span className="ms-nome">
                  <Avatar chave={p.foto} nome={p.nome} size={22} />
                  {p.curto}
                </span>
                {SEMANA.map((d) => {
                  const o = ocupacao(p.id, d.i);
                  return (
                    <button key={d.i} className="ms-cel" style={{ ["--o" as string]: `${o}%` }} onClick={() => { setPro(p.id); setDia(d.i); setModo("dia"); }} aria-label={`${p.curto}, ${d.nome}, ${o}% ocupado`}>
                      {o}%
                    </button>
                  );
                })}
              </div>
            ))}
            <p className="nota">Ocupação de cada cadeira no dia. Toque para abrir a agenda.</p>
          </div>
        ) : (
          <div className="semana-lista">
            {SEMANA.map((d) => {
              const ags = agendaVisivel.filter((a) => a.profissionalId === proAtivo && a.dia === d.i && a.status !== "cancelado").sort((a, b) => a.inicio - b.inicio);
              const o = ocupacao(proAtivo, d.i);
              return (
                <button key={d.i} className="semana-dia" onClick={() => { setDia(d.i); setModo("dia"); }}>
                  <div>
                    <b>{d.i === 0 ? "Hoje" : d.nome.split(",")[0]}</b>
                    <small>{d.data}</small>
                  </div>
                  <div className="sd-meio">
                    <span>{ags.length ? `${ags.length} ${ags.length === 1 ? "cliente" : "clientes"}` : "Sem clientes"}</span>
                    <small>{ags.length ? `${hora(ags[0].inicio)} até ${hora(ags[ags.length - 1].fim)}` : `${hora(d.abre)} às ${hora(d.fecha)}`}</small>
                    <span className="barra">
                      <i style={{ width: `${o}%` }} />
                    </span>
                  </div>
                  <ChevronRight size={18} />
                </button>
              );
            })}
          </div>
        )
      ) : proAtivo === "todos" ? (
        <div className="lista-todos">
          {doDia.filter((a) => a.status !== "cancelado").length === 0 && <p className="vazio">Nenhum horário marcado neste dia.</p>}
          {doDia.map((a) => (
            <button key={a.id} className={`ag-mini st-${a.status} ${novidades.includes(a.id) ? "novo-sync" : ""}`} onClick={() => onAbrir(a.id)}>
              <span className="ag-hora">{hora(a.inicio)}</span>
              <Avatar chave={profissional(a.profissionalId).foto} nome={profissional(a.profissionalId).nome} size={28} />
              <span className="ag-txt">
                <b>{nomeCurto(nomeCli(a.clienteId))}</b>
                <small>
                  {servico(a.servicoId).nome} · {profissional(a.profissionalId).curto}
                </small>
              </span>
              <span className={`st st-${a.status}`}>{STATUS_NOME[a.status]}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="timeline">
          {linhas.map((l, i) => {
            if (l.tipo === "agora")
              return (
                <div key={`agora-${i}`} className="agora">
                  <span>{hora(AGORA.min)}</span>
                  <i />
                </div>
              );
            if (l.tipo === "livre")
              return (
                <button key={`l-${l.de}`} className="livre" onClick={() => onNovo({ profissionalId: proAtivo, dia, inicio: l.de })} disabled={!online}>
                  <span className="ag-hora">{hora(l.de)}</span>
                  <span className="livre-txt">
                    Livre até {hora(l.ate)} <small>{duracao(l.ate - l.de)}</small>
                  </span>
                  <span className="livre-acao">
                    <CalendarPlus size={15} /> Marcar
                  </span>
                </button>
              );
            const a = l.ag;
            const s = servico(a.servicoId);
            return (
              <button key={a.id} className={`ag st-${a.status} ${novidades.includes(a.id) ? "novo-sync" : ""}`} onClick={() => onAbrir(a.id)} style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                <span className="ag-hora">
                  {hora(a.inicio)}
                  <small>{hora(a.fim)}</small>
                </span>
                <span className="ag-corpo">
                  <b>{nomeCli(a.clienteId)}</b>
                  <small>
                    <Clock3 size={12} /> {s.nome} · {duracao(s.duracao)}
                  </small>
                </span>
                <span className="ag-lado">
                  <span className={`st st-${a.status}`}>{STATUS_NOME[a.status]}</span>
                  <span className="origem" title={a.origem === "app" ? "Marcado pelo app" : "Marcado pela recepção"}>
                    {a.origem === "app" ? <Smartphone size={12} /> : <Monitor size={12} />}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
