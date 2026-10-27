"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarPlus, Monitor, Smartphone, X, AlertTriangle, History } from "lucide-react";
import { useStore, horariosLivres } from "@/lib/store";
import type { Cena } from "@/lib/cena";
import { dica, quando } from "@/lib/cena";
import { EQUIPE, profissional } from "@/lib/mock/equipe";
import { SERVICOS, servico } from "@/lib/mock/servicos";
import { SEMANA } from "@/lib/mock/calendario";
import { hora, nomeCurto, semAcento } from "@/lib/format";
import { Avatar, Spinner } from "./ui";
import { STATUS_NOME } from "./app/Agenda";

interface Form {
  inicio: number;
  clienteId: string;
  servicoId: string;
  busca: string;
}

// The web system the reception already uses. Same API, the other door.
export function Recepcao() {
  const { agenda, clientes, log, marcar, cancelar, pronto } = useStore();
  const [pro, setPro] = useState("p-rafael");
  const [dia, setDia] = useState(0);
  const [form, setForm] = useState<Form | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [destaque, setDestaque] = useState<string | null>(null);
  const autoRef = useRef<number | null>(null);
  const tabelaRef = useRef<HTMLDivElement | null>(null);
  // keep the table on what matters: the highlighted row, or the afternoon of today
  const rolarPara = (sel: string) => {
    const box = tabelaRef.current;
    const el = box?.querySelector<HTMLElement>(sel);
    if (!box || !el) return;
    box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2), behavior: "smooth" });
  };
  const p = profissional(pro);
  const servs = SERVICOS.filter((s) => p.categorias.includes(s.categoria));

  const linhas = useMemo(() => agenda.filter((a) => a.profissionalId === pro && a.dia === dia).sort((a, b) => a.inicio - b.inicio), [agenda, pro, dia]);

  const livres = useMemo(() => {
    const d = SEMANA[dia];
    const sv = form ? servico(form.servicoId) : servs[0];
    return horariosLivres(agenda, pro, dia, sv?.duracao ?? 30).filter((t) => t >= d.abre);
  }, [agenda, pro, dia, form, servs]);

  // free gaps of at least 30 minutes, shown as rows the reception can click
  const vagas = useMemo(() => {
    const d = SEMANA[dia];
    const out: { de: number; ate: number }[] = [];
    const ativos = linhas.filter((a) => a.status !== "cancelado");
    let cursor = d.abre;
    const base = dia === 0 ? 14 * 60 + 30 : d.abre;
    for (const a of ativos) {
      const de = Math.max(cursor, base);
      if (a.inicio - de >= 30) out.push({ de, ate: a.inicio });
      cursor = Math.max(cursor, a.fim);
    }
    const de = Math.max(cursor, base);
    if (d.fecha - de >= 30) out.push({ de, ate: d.fecha });
    return out;
  }, [linhas, dia]);

  useEffect(() => {
    if (!pronto) return;
    const t = setTimeout(() => (dia === 0 ? rolarPara('[data-t="agora"]') : tabelaRef.current?.scrollTo({ top: 0 })), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, pro, dia]);

  useEffect(() => {
    if (!destaque) return;
    const t = setTimeout(() => rolarPara(".rec-destaque"), 120);
    return () => clearTimeout(t);
  }, [destaque]);

  const enviar = async (f: Form, proId: string, diaN: number) => {
    setEnviando(true);
    setErro(null);
    const r = await marcar({ clienteId: f.clienteId, servicoId: f.servicoId, profissionalId: proId, dia: diaN, inicio: f.inicio }, "web");
    setEnviando(false);
    if (r.ok) {
      setForm(null);
      setDestaque(r.ag.id);
      setTimeout(() => setDestaque(null), 4000);
      return true;
    }
    if (r.motivo === "ocupado") setErro(`O ${hora(f.inicio)} acabou de ser ocupado${r.conflito.origem === "app" ? " pelo app" : ""}. Livres: ${r.sugestoes.map(hora).join(", ") || "nenhum"}.`);
    else setErro("Esse serviço passa do horário de fechamento.");
    return false;
  };

  useEffect(() => {
    const on = (e: Event) => {
      const c = (e as CustomEvent<Cena>).detail;
      setPro("p-rafael");
      setDia(c.dia);
      setErro(null);
      if (autoRef.current) window.clearTimeout(autoRef.current);
      const espera = c.tipo === "corrida" ? 2200 : 2600;
      autoRef.current = window.setTimeout(() => {
        const f = { inicio: c.inicio, clienteId: c.clienteWeb, servicoId: c.servicoId, busca: "" };
        setForm(f);
        autoRef.current = window.setTimeout(async () => {
          const ok = await enviar(f, "p-rafael", c.dia);
          if (ok)
            dica(
              c.tipo === "corrida"
                ? `A recepção marcou ${quando(c.dia, c.inicio)} para Rafael. O celular ainda não sabe. Toque em Confirmar horário no celular e veja a resposta do sistema.`
                : `A recepção marcou ${quando(c.dia, c.inicio)}. O celular sem sinal ainda mostra esse horário livre, mas não deixa marcar nada nele. Toque no sinal, no topo do celular, para ver o que muda.`,
            );
        }, 1700);
      }, espera);
    };
    window.addEventListener("agenda:cena", on);
    return () => window.removeEventListener("agenda:cena", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcar]);

  const achados = useMemo(() => {
    if (!form) return [];
    const q = semAcento(form.busca.trim());
    return (q ? clientes.filter((c) => semAcento(c.nome).includes(q)) : clientes.filter((c) => c.preferidoId === pro)).slice(0, 5);
  }, [form, clientes, pro]);

  const nomeCli = (id: string) => clientes.find((c) => c.id === id)?.nome ?? "Cliente removido";

  return (
    <div className="recepcao">
      <div className="rec-janela">
        <span className="rec-pontos" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="rec-titulo">
          <Monitor size={14} /> Sistema web · Recepção
        </span>
        <span className="rec-quem">
          <Avatar chave="julia" nome="Júlia Ramos" size={22} /> Júlia
        </span>
      </div>
      <div className="rec-corpo">
        <div className="rec-pros" aria-label="Profissional">
          {EQUIPE.map((x) => (
            <button key={x.id} className={`rec-pro ${pro === x.id ? "on" : ""}`} onClick={() => { setPro(x.id); setForm(null); setErro(null); }}>
              <Avatar chave={x.foto} nome={x.nome} size={30} />
              <span>{x.curto}</span>
            </button>
          ))}
        </div>
        <div className="rec-dias">
          {SEMANA.map((d) => (
            <button key={d.i} className={dia === d.i ? "on" : ""} onClick={() => { setDia(d.i); setForm(null); }}>
              {d.i === 0 ? "Hoje" : d.curto} {d.data}
            </button>
          ))}
        </div>
        <div className="rec-grade">
          <div className="rec-tabela" role="table" aria-label={`Agenda de ${p.curto}`} ref={tabelaRef}>
            <div className="rec-th" role="row">
              <span>Horário</span>
              <span>Cliente</span>
              <span>Serviço</span>
              <span>Status</span>
            </div>
            {!pronto ? (
              <div className="rec-carregando">
                <Spinner /> Carregando a agenda
              </div>
            ) : (
              [...linhas.map((a) => ({ t: a.inicio, a })), ...vagas.map((v) => ({ t: v.de, v }))]
                .sort((x, y) => x.t - y.t)
                .map((item) =>
                  "a" in item && item.a ? (
                    <div key={item.a.id} role="row" data-t={item.a.dia === 0 && item.a.inicio <= 14 * 60 + 20 && item.a.fim > 14 * 60 + 20 ? "agora" : undefined} className={`rec-tr st-${item.a.status} ${destaque === item.a.id ? "rec-destaque" : ""}`}>
                      <span>
                        {hora(item.a.inicio)}
                        <small>{hora(item.a.fim)}</small>
                      </span>
                      <span>{nomeCurto(nomeCli(item.a.clienteId))}</span>
                      <span className="rec-serv">
                        {servico(item.a.servicoId).nome}
                        <small>{item.a.origem === "app" ? <><Smartphone size={11} /> pelo app</> : <><Monitor size={11} /> recepção</>}</small>
                      </span>
                      <span className="rec-st">
                        <em className={`st st-${item.a.status}`}>{STATUS_NOME[item.a.status]}</em>
                        {item.a.status === "confirmado" && (
                          <button className="icon-btn" onClick={() => cancelar(item.a.id, "web")} aria-label="Cancelar horário" title="Cancelar">
                            <X size={14} />
                          </button>
                        )}
                      </span>
                    </div>
                  ) : "v" in item && item.v ? (
                    <div key={`v-${item.v.de}`} role="row" className="rec-tr rec-livre">
                      <span>{hora(item.v.de)}</span>
                      <span className="rec-livre-txt">Livre até {hora(item.v.ate)}</span>
                      <span />
                      <span>
                        <button className="btn btn-mini" onClick={() => setForm({ inicio: item.v!.de, clienteId: "", servicoId: servs[0].id, busca: "" })} data-acao="rec-marcar">
                          <CalendarPlus size={14} /> Marcar
                        </button>
                      </span>
                    </div>
                  ) : null,
                )
            )}
          </div>

          <aside className="rec-log">
            <h4>
              <History size={15} /> O que mudou agora
            </h4>
            <ul>
              {log.slice(0, 7).map((m) => (
                <li key={m.id} className="rec-log-item">
                  <span className={`rec-origem ${m.origem}`}>{m.origem === "app" ? <Smartphone size={12} /> : <Monitor size={12} />}</span>
                  <span>
                    <b>{m.quem}</b> {m.texto}
                    <small>
                      {hora(m.hora)} · {m.origem === "app" ? "pelo app" : "pela recepção"}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {form && (
          <div className="rec-form" role="dialog" aria-label="Marcar horário">
            <div className="rec-form-topo">
              <b>
                Marcar com {p.curto}, {dia === 0 ? "hoje" : SEMANA[dia].curto.toLowerCase()}
              </b>
              <button className="icon-btn" onClick={() => { setForm(null); setErro(null); }} aria-label="Fechar">
                <X size={16} />
              </button>
            </div>
            <div className="rec-form-grade">
              <label className="campo">
                <span>Horário</span>
                <select value={form.inicio} onChange={(e) => setForm({ ...form, inicio: Number(e.target.value) })}>
                  {[form.inicio, ...livres.filter((t) => t !== form.inicio)].sort((a, b) => a - b).slice(0, 24).map((t) => (
                    <option key={t} value={t}>
                      {hora(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span>Serviço</span>
                <select value={form.servicoId} onChange={(e) => setForm({ ...form, servicoId: e.target.value })}>
                  {servs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo rec-cli">
                <span>Cliente</span>
                {form.clienteId ? (
                  <span className="escolhido">
                    <b>{nomeCli(form.clienteId)}</b>
                    <button className="link" onClick={() => setForm({ ...form, clienteId: "" })}>
                      Trocar
                    </button>
                  </span>
                ) : (
                  <>
                    <input placeholder="Buscar cliente" value={form.busca} onChange={(e) => setForm({ ...form, busca: e.target.value })} />
                    <span className="rec-achados">
                      {achados.map((c) => (
                        <button key={c.id} onClick={() => setForm({ ...form, clienteId: c.id })}>
                          {c.nome}
                        </button>
                      ))}
                    </span>
                  </>
                )}
              </label>
            </div>
            {erro && (
              <p className="rec-erro">
                <AlertTriangle size={14} /> {erro}
              </p>
            )}
            <button className="btn btn-primario" disabled={!form.clienteId || enviando} onClick={() => enviar(form, pro, dia)} data-acao="rec-confirmar">
              {enviando ? <Spinner /> : <CalendarPlus size={16} />} {enviando ? "Gravando" : "Marcar horário"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
