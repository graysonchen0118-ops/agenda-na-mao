"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleSlash, Copy, MessageCircle, Play, UserRound, WifiOff, XCircle, Monitor, Smartphone } from "lucide-react";
import { useStore, horariosLivres } from "@/lib/store";
import type { Pagamento } from "@/lib/types";
import { profissional } from "@/lib/mock/equipe";
import { servico } from "@/lib/mock/servicos";
import { SEMANA } from "@/lib/mock/calendario";
import { hora, reais, primeiroNome, duracao } from "@/lib/format";
import { Avatar, Sheet, Spinner } from "../ui";
import { STATUS_NOME } from "./Agenda";

type Passo = "ver" | "remarcar" | "cancelar" | "fechar" | "whats";

export function Detalhe({ id, onFechar, onVerCliente, onNovo }: { id: string | null; onFechar: () => void; onVerCliente: (id: string) => void; onNovo: (p: { clienteId: string; servicoId: string; profissionalId: string }) => void }) {
  const { agenda, agendaVisivel, clientes, usuario, online, sincronizadoEm, remarcar, cancelar, mudarStatus, avisar } = useStore();
  const [passo, setPasso] = useState<Passo>("ver");
  const [dia, setDia] = useState(0);
  const [inicio, setInicio] = useState<number | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [pagamento, setPagamento] = useState<Pagamento>("Pix");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemDe, setMensagemDe] = useState<{ dia: number; inicio: number } | null>(null);

  const ag = useMemo(() => (id ? agendaVisivel.find((a) => a.id === id) ?? agenda.find((a) => a.id === id) : null), [id, agendaVisivel, agenda]);

  useEffect(() => {
    setPasso("ver");
    setErro(null);
    setInicio(undefined);
    if (ag) setDia(ag.dia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const livres = useMemo(() => (ag ? horariosLivres(agendaVisivel, ag.profissionalId, dia, ag.fim - ag.inicio, ag.id) : []), [ag, agendaVisivel, dia]);

  if (!ag) return <Sheet aberto={false} titulo="" onFechar={onFechar}>{null}</Sheet>;
  const cli = clientes.find((c) => c.id === ag.clienteId);
  const sv = servico(ag.servicoId);
  const pro = profissional(ag.profissionalId);
  const parteDele = Math.round((ag.valor * pro.cota) / 100);
  const parteSalao = ag.valor - parteDele;
  const ehPro = usuario?.papel === "profissional";
  const ehDona = usuario?.papel === "dona";

  const fazer = async (fn: () => Promise<unknown>) => {
    setEnviando(true);
    setErro(null);
    await fn();
    setEnviando(false);
  };

  const confirmarRemarcacao = async () => {
    if (inicio === undefined) return;
    setEnviando(true);
    setErro(null);
    const r = await remarcar(ag.id, dia, inicio, "app");
    setEnviando(false);
    if (r.ok) {
      avisar(`Remarcado para ${dia === 0 ? "hoje" : SEMANA[dia].curto.toLowerCase()} às ${hora(inicio)}.`);
      setMensagemDe({ dia, inicio });
      setPasso("whats");
    } else if (r.motivo === "ocupado") {
      setErro(`Esse horário acabou de ser ocupado. Livres logo depois: ${r.sugestoes.map(hora).join(", ") || "nenhum neste dia"}.`);
      setInicio(undefined);
    } else setErro(r.motivo === "semSinal" ? "Sem sinal. A remarcação não saiu do celular." : "Passa do horário de fechamento.");
  };

  const msg = (() => {
    const quando = mensagemDe ?? { dia: ag.dia, inicio: ag.inicio };
    const d = SEMANA[quando.dia];
    const nome = cli ? primeiroNome(cli.nome) : "";
    return `Oi, ${nome}! Seu horário no Studio Aroeira mudou para ${d.nome.split(",")[0].toLowerCase()}, ${d.data}, às ${hora(quando.inicio)}, com ${pro.curto}. Se não der para você, é só responder aqui que a gente acha outro.`;
  })();

  const podeMexer = online && (ag.status === "confirmado" || ag.status === "em_atendimento");

  return (
    <Sheet aberto={!!id} titulo={passo === "remarcar" ? "Remarcar" : passo === "cancelar" ? "Cancelar horário" : passo === "fechar" ? "Fechar atendimento" : passo === "whats" ? "Avisar a cliente" : "Horário"} onFechar={onFechar}>
      <div className="det-topo">
        <Avatar chave={pro.foto} nome={pro.nome} size={44} />
        <div>
          <b>{cli?.nome ?? "Cliente removido"}</b>
          <small>
            {sv.nome} · {duracao(sv.duracao)} · {pro.curto}
          </small>
          <small>
            {ag.dia === 0 ? "Hoje" : SEMANA[ag.dia].nome.split(",")[0]}, {hora(ag.inicio)} às {hora(ag.fim)}
          </small>
        </div>
        <span className={`st st-${ag.status}`}>{STATUS_NOME[ag.status]}</span>
      </div>
      <div className="det-meta">
        <span>{ag.origem === "app" ? <Smartphone size={14} /> : <Monitor size={14} />} {ag.origem === "app" ? "Marcado pelo app" : "Marcado pela recepção"}</span>
        <span>{ehPro ? `Sua parte ${reais(parteDele)}` : reais(ag.valor)}</span>
      </div>

      {!online && (
        <div className="aviso-faixa aviso-off">
          <WifiOff size={16} /> Sem sinal: este horário aparece como estava às {hora(sincronizadoEm)}. Mudanças voltam quando o sinal voltar.
        </div>
      )}

      {erro && (
        <div className="recusa" role="alert">
          <AlertTriangle size={18} />
          <div>
            <p>{erro}</p>
          </div>
        </div>
      )}

      {passo === "ver" && (
        <>
          {ag.status === "concluido" && (
            <div className="divisao">
              <span>
                <small>Entrou no caixa</small>
                <b>{reais(ag.valor)}</b>
                <small>{ag.pagamento}</small>
              </span>
              {(ehDona || ehPro) && (
                <span>
                  <small>{ehPro ? "Sua parte" : `Parte de ${pro.curto}`}</small>
                  <b>{reais(parteDele)}</b>
                  <small>{pro.cota}% do contrato</small>
                </span>
              )}
              {ehDona && (
                <span>
                  <small>Parte do salão</small>
                  <b>{reais(parteSalao)}</b>
                  <small>{100 - pro.cota}%</small>
                </span>
              )}
            </div>
          )}
          <div className="acoes">
            {ag.status === "confirmado" && (
              <button className="btn btn-primario" disabled={!podeMexer || enviando} onClick={() => fazer(async () => { await mudarStatus(ag.id, "em_atendimento"); avisar("Atendimento iniciado."); })}>
                {enviando ? <Spinner /> : <Play size={16} />} Começar atendimento
              </button>
            )}
            {ag.status === "em_atendimento" && (
              <button className="btn btn-primario" disabled={!podeMexer} onClick={() => setPasso("fechar")}>
                <CheckCircle2 size={16} /> Fechar atendimento
              </button>
            )}
            {(ag.status === "confirmado" || ag.status === "em_atendimento") && (
              <>
                <button className="btn" disabled={!podeMexer} onClick={() => { setDia(ag.dia); setPasso("remarcar"); }}>
                  <CalendarClock size={16} /> Remarcar
                </button>
                <button className="btn" onClick={() => { setMensagemDe(null); setPasso("whats"); }}>
                  <MessageCircle size={16} /> WhatsApp
                </button>
                {ag.status === "confirmado" && (
                  <button className="btn btn-perigo-suave" disabled={!podeMexer || enviando} onClick={() => fazer(async () => { await mudarStatus(ag.id, "faltou"); avisar("Falta registrada na ficha.", "info"); })}>
                    <CircleSlash size={16} /> Não veio
                  </button>
                )}
                <button className="btn btn-perigo-suave" disabled={!podeMexer} onClick={() => setPasso("cancelar")}>
                  <XCircle size={16} /> Cancelar
                </button>
              </>
            )}
            {(ag.status === "cancelado" || ag.status === "faltou") && (
              <button className="btn btn-primario" disabled={!online} onClick={() => onNovo({ clienteId: ag.clienteId, servicoId: ag.servicoId, profissionalId: ag.profissionalId })}>
                <CalendarClock size={16} /> Marcar de novo
              </button>
            )}
            {cli && (
              <button className="btn btn-fantasma" onClick={() => onVerCliente(cli.id)}>
                <UserRound size={16} /> Ficha de {primeiroNome(cli.nome)}
              </button>
            )}
          </div>
        </>
      )}

      {passo === "fechar" && (
        <div className="passo">
          <p className="passo-txt">Como {cli ? primeiroNome(cli.nome) : "a cliente"} pagou?</p>
          <div className="chips">
            {(["Pix", "Cartão", "Dinheiro"] as Pagamento[]).map((p) => (
              <button key={p} className={`chip ${pagamento === p ? "on" : ""}`} onClick={() => setPagamento(p)}>
                {p}
              </button>
            ))}
          </div>
          <div className="divisao">
            <span>
              <small>Entra no caixa</small>
              <b>{reais(ag.valor)}</b>
            </span>
            {(ehDona || ehPro) && (
              <span>
                <small>{ehPro ? "Sua parte" : `Parte de ${pro.curto}`}</small>
                <b>{reais(parteDele)}</b>
              </span>
            )}
            {ehDona && (
              <span>
                <small>Parte do salão</small>
                <b>{reais(parteSalao)}</b>
              </span>
            )}
          </div>
          <div className="linha-btn">
            <button className="btn btn-fantasma" onClick={() => setPasso("ver")}>
              Voltar
            </button>
            <button className="btn btn-primario" disabled={enviando || !online} onClick={() => fazer(async () => { await mudarStatus(ag.id, "concluido", pagamento); avisar(`Atendimento fechado no ${pagamento}.`); setPasso("ver"); })}>
              {enviando ? <Spinner /> : <CheckCircle2 size={16} />} Fechar no {pagamento}
            </button>
          </div>
        </div>
      )}

      {passo === "remarcar" && (
        <div className="passo">
          <div className="chips">
            {SEMANA.map((d) => (
              <button key={d.i} className={`chip ${dia === d.i ? "on" : ""}`} onClick={() => { setDia(d.i); setInicio(undefined); }}>
                {d.i === 0 ? "Hoje" : d.curto} {d.data}
              </button>
            ))}
          </div>
          {livres.length === 0 ? (
            <p className="vazio-mini">Sem horário livre com {pro.curto} neste dia.</p>
          ) : (
            <div className="chips chips-hora">
              {livres.slice(0, 16).map((t) => (
                <button key={t} className={`chip ${inicio === t ? "on" : ""}`} onClick={() => setInicio(t)}>
                  {hora(t)}
                </button>
              ))}
            </div>
          )}
          <div className="linha-btn">
            <button className="btn btn-fantasma" onClick={() => setPasso("ver")}>
              Voltar
            </button>
            <button className="btn btn-primario" disabled={inicio === undefined || enviando || !online} onClick={confirmarRemarcacao} data-acao="confirmar-remarcar">
              {enviando ? <Spinner /> : <CalendarClock size={16} />} {enviando ? "Conferindo" : "Remarcar"}
            </button>
          </div>
        </div>
      )}

      {passo === "cancelar" && (
        <div className="passo">
          <p className="passo-txt">
            Cancelar {cli ? primeiroNome(cli.nome) : "a cliente"} às {hora(ag.inicio)}? O horário volta para a agenda e a recepção recebe o aviso.
          </p>
          <div className="linha-btn">
            <button className="btn btn-fantasma" onClick={() => setPasso("ver")}>
              Manter
            </button>
            <button className="btn btn-perigo" disabled={enviando || !online} onClick={() => fazer(async () => { const ok = await cancelar(ag.id, "app"); if (ok) { avisar("Horário cancelado e liberado.", "info"); onFechar(); } })}>
              {enviando ? <Spinner /> : <XCircle size={16} />} Cancelar horário
            </button>
          </div>
        </div>
      )}

      {passo === "whats" && (
        <div className="passo">
          <p className="passo-txt">{mensagemDe ? "Remarcação feita. Falta só a cliente ficar sabendo:" : "Mensagem pronta para a cliente:"}</p>
          <div className="balao-whats">{msg}</div>
          <div className="linha-btn">
            <button className="btn" onClick={() => { try { navigator.clipboard?.writeText(msg); } catch { /* sem área de transferência */ } avisar("Mensagem copiada.", "info"); }}>
              <Copy size={16} /> Copiar
            </button>
            <a className="btn btn-whats" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> Abrir no WhatsApp
            </a>
          </div>
          <button className="link" onClick={() => setPasso("ver")}>
            Voltar ao horário
          </button>
        </div>
      )}
    </Sheet>
  );
}

