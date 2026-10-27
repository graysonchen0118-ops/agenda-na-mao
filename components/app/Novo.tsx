"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Search, UserPlus, WifiOff, X } from "lucide-react";
import { useStore, horariosLivres, type Resultado } from "@/lib/store";
import { EQUIPE, profissional } from "@/lib/mock/equipe";
import { SERVICOS, servico } from "@/lib/mock/servicos";
import { SEMANA } from "@/lib/mock/calendario";
import { hora, nomeCurto, semAcento, reais, duracao } from "@/lib/format";
import type { Prefill } from "@/lib/cena";
import { Avatar, Sheet, Spinner } from "../ui";

export function Novo({ prefill, onFechar }: { prefill: Prefill | null; onFechar: () => void }) {
  const { usuario, clientes, agendaVisivel, online, marcar, salvarCliente, avisar } = useStore();
  const ehPro = usuario?.papel === "profissional";
  const [clienteId, setClienteId] = useState<string | undefined>();
  const [busca, setBusca] = useState("");
  const [servicoId, setServicoId] = useState<string | undefined>();
  const [proId, setProId] = useState<string | undefined>();
  const [dia, setDia] = useState(0);
  const [inicio, setInicio] = useState<number | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [recusa, setRecusa] = useState<Extract<Resultado, { ok: false; motivo: "ocupado" }> | null>(null);
  const [cadastro, setCadastro] = useState<{ nome: string; telefone: string } | null>(null);
  const recusaRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (recusa) recusaRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [recusa]);

  useEffect(() => {
    if (!prefill) return;
    setClienteId(prefill.clienteId);
    setServicoId(prefill.servicoId);
    setProId(ehPro ? usuario!.profissionalId : prefill.profissionalId);
    setDia(prefill.dia ?? 0);
    setInicio(prefill.inicio);
    setBusca("");
    setRecusa(null);
    setCadastro(null);
    setEnviando(false);
  }, [prefill, ehPro, usuario]);

  const pro = proId ? profissional(proId) : null;
  const servicosPossiveis = useMemo(() => (pro ? SERVICOS.filter((s) => pro.categorias.includes(s.categoria)) : SERVICOS), [pro]);
  const sv = servicoId ? servico(servicoId) : null;
  const livres = useMemo(() => (proId && sv ? horariosLivres(agendaVisivel, proId, dia, sv.duracao) : []), [agendaVisivel, proId, sv, dia]);
  const opcoes = useMemo(() => (inicio !== undefined && !livres.includes(inicio) && proId && sv ? [inicio, ...livres].sort((a, b) => a - b) : livres), [livres, inicio, proId, sv]);

  const achados = useMemo(() => {
    const q = semAcento(busca.trim());
    const base = q ? clientes.filter((c) => semAcento(c.nome).includes(q) || c.telefone.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "#")) : clientes.filter((c) => !proId || c.preferidoId === proId);
    return base.slice(0, 6);
  }, [busca, clientes, proId]);

  const cli = clienteId ? clientes.find((c) => c.id === clienteId) : null;
  const pronto = !!(cli && sv && proId && inicio !== undefined);

  const confirmar = async () => {
    if (!pronto) return;
    setEnviando(true);
    setRecusa(null);
    const r = await marcar({ clienteId: clienteId!, servicoId: servicoId!, profissionalId: proId!, dia, inicio: inicio! }, "app");
    setEnviando(false);
    if (r.ok) {
      avisar(`Confirmado: ${nomeCurto(cli!.nome)}, ${dia === 0 ? "hoje" : SEMANA[dia].curto.toLowerCase()} às ${hora(inicio!)}.`);
      onFechar();
    } else if (r.motivo === "ocupado") {
      setRecusa(r);
      setInicio(undefined);
    } else if (r.motivo === "semSinal") {
      avisar("Sem sinal. A mudança não saiu do celular.", "erro");
    } else {
      avisar("Esse serviço passa do horário de fechamento.", "erro");
    }
  };

  const cadastrar = async () => {
    if (!cadastro || cadastro.nome.trim().length < 3 || cadastro.telefone.replace(/\D/g, "").length < 10) return;
    setEnviando(true);
    const c = await salvarCliente({ nome: cadastro.nome.trim(), telefone: cadastro.telefone, preferidoId: proId });
    setEnviando(false);
    setClienteId(c.id);
    setCadastro(null);
    avisar(`${c.nome} cadastrada na base.`);
  };

  const conflitoCli = recusa ? clientes.find((c) => c.id === recusa.conflito.clienteId) : null;

  return (
    <Sheet aberto={!!prefill} titulo="Novo horário" onFechar={onFechar} alto>
      {!online && (
        <div className="aviso-faixa aviso-off">
          <WifiOff size={16} /> Sem sinal. Dá para ver a agenda, mas marcar só com internet.
        </div>
      )}

      {recusa && (
        <div className="recusa" role="alert" ref={recusaRef}>
          <AlertTriangle size={18} />
          <div>
            <b>O sistema recusou: esse horário acabou de ser ocupado.</b>
            <p>
              {recusa.conflito.porUltimo ? `${recusa.conflito.porUltimo} marcou` : "Já estava marcado:"} {conflitoCli ? nomeCurto(conflitoCli.nome) : "outra cliente"} às {hora(recusa.conflito.inicio)}
              {recusa.conflito.origem === "web" ? " pela recepção" : " pelo app"}. Nada foi gravado em dobro.
            </p>
            {recusa.sugestoes.length > 0 && (
              <>
                <small>Livres para {pro?.curto} logo depois:</small>
                <div className="chips">
                  {recusa.sugestoes.map((t) => (
                    <button key={t} className="chip" onClick={() => { setInicio(t); setRecusa(null); }}>
                      {hora(t)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <section className="form-bloco">
        <h4>Cliente</h4>
        {cli ? (
          <div className="escolhido">
            <span>
              <b>{cli.nome}</b>
              <small>{cli.telefone}</small>
            </span>
            <button className="link" onClick={() => setClienteId(undefined)}>
              Trocar
            </button>
          </div>
        ) : cadastro ? (
          <div className="mini-form">
            <input placeholder="Nome completo" value={cadastro.nome} onChange={(e) => setCadastro({ ...cadastro, nome: e.target.value })} aria-label="Nome" />
            <input placeholder="Celular com DDD" inputMode="tel" value={cadastro.telefone} onChange={(e) => setCadastro({ ...cadastro, telefone: mascara(e.target.value) })} aria-label="Celular" />
            <div className="linha-btn">
              <button className="btn btn-fantasma" onClick={() => setCadastro(null)}>
                Voltar
              </button>
              <button className="btn btn-primario" onClick={cadastrar} disabled={enviando || cadastro.nome.trim().length < 3 || cadastro.telefone.replace(/\D/g, "").length < 10}>
                {enviando ? <Spinner /> : <UserPlus size={16} />} Cadastrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="busca">
              <Search size={16} />
              <input placeholder="Buscar por nome ou celular" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar cliente" />
              {busca && (
                <button className="icon-btn" onClick={() => setBusca("")} aria-label="Limpar">
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="sugestoes-cli">
              {achados.map((c) => (
                <button key={c.id} onClick={() => setClienteId(c.id)}>
                  <b>{c.nome}</b>
                  <small>{c.telefone}</small>
                </button>
              ))}
              {achados.length === 0 && <p className="vazio-mini">Ninguém com esse nome na base.</p>}
            </div>
            <button className="link link-icone" onClick={() => setCadastro({ nome: busca, telefone: "" })}>
              <UserPlus size={15} /> Cadastrar cliente nova
            </button>
          </>
        )}
      </section>

      {!ehPro && (
        <section className="form-bloco">
          <h4>Profissional</h4>
          <div className="chips">
            {EQUIPE.filter((p) => !sv || p.categorias.includes(sv.categoria)).map((p) => (
              <button key={p.id} className={`chip chip-pro ${proId === p.id ? "on" : ""}`} onClick={() => { setProId(p.id); setInicio(undefined); setRecusa(null); }}>
                <Avatar chave={p.foto} nome={p.nome} size={20} /> {p.curto}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="form-bloco">
        <h4>Serviço</h4>
        <div className="chips">
          {servicosPossiveis.map((s) => (
            <button key={s.id} className={`chip ${servicoId === s.id ? "on" : ""}`} onClick={() => { setServicoId(s.id); setRecusa(null); }}>
              {s.nome} <small>{duracao(s.duracao)} · {reais(s.preco)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="form-bloco">
        <h4>Dia</h4>
        <div className="chips">
          {SEMANA.map((d) => (
            <button key={d.i} className={`chip ${dia === d.i ? "on" : ""}`} onClick={() => { setDia(d.i); setInicio(undefined); setRecusa(null); }}>
              {d.i === 0 ? "Hoje" : d.curto} {d.data}
            </button>
          ))}
        </div>
      </section>

      <section className="form-bloco">
        <h4>Horário</h4>
        {!proId || !sv ? (
          <p className="vazio-mini">Escolha {!proId ? "o profissional e " : ""}o serviço para ver os horários livres.</p>
        ) : opcoes.length === 0 ? (
          <p className="vazio-mini">Sem horário livre para esse serviço neste dia.</p>
        ) : (
          <div className="chips chips-hora">
            {opcoes.slice(0, 16).map((t) => (
              <button key={t} className={`chip ${inicio === t ? "on" : ""}`} onClick={() => { setInicio(t); setRecusa(null); }}>
                {hora(t)}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="sheet-rodape">
        {sv && pro && inicio !== undefined && (
          <p className="resumo-pedido">
            {sv.nome} com {pro.curto}, {dia === 0 ? "hoje" : SEMANA[dia].curto.toLowerCase()} das {hora(inicio)} às {hora(inicio + sv.duracao)}
          </p>
        )}
        <button className="btn btn-primario btn-largo" onClick={confirmar} disabled={!pronto || enviando || !online} data-acao="confirmar-novo">
          {enviando ? <Spinner /> : <CheckCircle2 size={17} />}
          {enviando ? "Confirmando com o sistema" : "Confirmar horário"}
        </button>
      </div>
    </Sheet>
  );
}

export function mascara(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
