"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, LogOut, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { EQUIPE, CATEGORIAS, PAPEL_NOME } from "@/lib/mock/equipe";
import { SERVICOS } from "@/lib/mock/servicos";
import { AGORA } from "@/lib/mock/calendario";
import type { Categoria } from "@/lib/types";
import { hora, reais, duracao } from "@/lib/format";
import { Avatar, Foto } from "../ui";

export function Mais() {
  const { usuario, sair, agendaVisivel } = useStore();
  const [aba, setAba] = useState<"equipe" | "servicos">("equipe");
  const [cat, setCat] = useState<Categoria | "todas">("todas");

  const situacao = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of EQUIPE) {
      const agora = agendaVisivel.find((a) => a.profissionalId === p.id && a.dia === 0 && a.status !== "cancelado" && a.inicio <= AGORA.min && a.fim > AGORA.min);
      const prox = agendaVisivel.filter((a) => a.profissionalId === p.id && a.dia === 0 && a.status === "confirmado" && a.inicio > AGORA.min).sort((a, b) => a.inicio - b.inicio)[0];
      m.set(p.id, agora ? `Atendendo até ${hora(agora.fim)}` : prox ? `Livre até ${hora(prox.inicio)}` : "Livre o resto do dia");
    }
    return m;
  }, [agendaVisivel]);

  const servs = SERVICOS.filter((s) => cat === "todas" || s.categoria === cat);

  return (
    <div className="mais">
      {usuario && (
        <div className="conta-card">
          <Avatar chave={usuario.foto} nome={usuario.nome} size={46} />
          <span>
            <b>{usuario.nome}</b>
            <small>
              {PAPEL_NOME[usuario.papel]} · conectado neste celular
            </small>
          </span>
          <button className="btn btn-fantasma" onClick={sair}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      )}
      <div className="seg" role="tablist" aria-label="Seção">
        <button role="tab" aria-selected={aba === "equipe"} className={aba === "equipe" ? "on" : ""} onClick={() => setAba("equipe")}>
          Equipe
        </button>
        <button role="tab" aria-selected={aba === "servicos"} className={aba === "servicos" ? "on" : ""} onClick={() => setAba("servicos")}>
          Serviços
        </button>
      </div>
      {aba === "equipe" ? (
        <ul className="equipe">
          {EQUIPE.map((p) => (
            <li key={p.id}>
              <Avatar chave={p.foto} nome={p.nome} size={42} />
              <span>
                <b>{p.nome}</b>
                <small>
                  {p.funcao} · desde {p.desde}
                </small>
                <small className={situacao.get(p.id)?.startsWith("Atendendo") ? "ocupado" : "livre-txt-mini"}>{situacao.get(p.id)}</small>
              </span>
              {p.parceiro && (
                <span className="tag" title="Contrato de parceria, Lei 13.352">
                  <BadgeCheck size={13} /> Parceiro
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="chips chips-rolagem">
            <button className={`chip ${cat === "todas" ? "on" : ""}`} onClick={() => setCat("todas")}>
              Todas
            </button>
            {CATEGORIAS.map((c) => (
              <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <ul className="servicos">
            {servs.map((s) => (
              <li key={s.id}>
                <Foto chave={s.foto} w={96} h={96} alt={s.nome} className="serv-foto" />
                <span>
                  <b>{s.nome}</b>
                  <small>
                    {s.categoria} · {duracao(s.duracao)}
                  </small>
                </span>
                <b className="preco">{reais(s.preco)}</b>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="nota nota-icone">
        <ShieldCheck size={15} /> Relatórios, configurações e planos continuam no sistema web.
      </p>
    </div>
  );
}
