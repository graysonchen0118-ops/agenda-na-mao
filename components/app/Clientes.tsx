"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, ChevronRight, Pencil, Phone, Search, Trash2, UserPlus, X, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Cliente } from "@/lib/types";
import { EQUIPE, profissional } from "@/lib/mock/equipe";
import { servico } from "@/lib/mock/servicos";
import { reais, semAcento, primeiroNome } from "@/lib/format";
import { Avatar, Sheet, Spinner } from "../ui";
import { mascara } from "./Novo";

type Filtro = "todos" | "frequentes" | "faltas" | "sumidos";
type Ordem = "nome" | "recentes" | "visitas";

const quando = (dias: number) => (dias >= 999 ? "Ainda sem visita" : dias === 0 ? "Hoje" : dias === 1 ? "Ontem" : `Há ${dias} dias`);

export function Clientes({ onAbrir, onNovoCliente }: { onAbrir: (id: string) => void; onNovoCliente: () => void }) {
  const { clientes, usuario } = useStore();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [mostrar, setMostrar] = useState(14);
  const meuPro = usuario?.papel === "profissional" ? usuario.profissionalId : null;
  const [soMeus, setSoMeus] = useState(false);

  useEffect(() => setMostrar(14), [busca, filtro, ordem, soMeus]);

  const lista = useMemo(() => {
    const q = semAcento(busca.trim());
    let l = clientes.filter((c) => !q || semAcento(c.nome).includes(q) || (q.replace(/\D/g, "") && c.telefone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))));
    if (soMeus && meuPro) l = l.filter((c) => c.preferidoId === meuPro);
    if (filtro === "frequentes") l = l.filter((c) => c.visitas.length >= 6);
    if (filtro === "faltas") l = l.filter((c) => c.visitas.some((v) => v.faltou));
    if (filtro === "sumidos") l = l.filter((c) => c.ultimaHa >= 60 && c.ultimaHa < 999);
    const s = [...l];
    if (ordem === "nome") s.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (ordem === "recentes") s.sort((a, b) => a.ultimaHa - b.ultimaHa);
    if (ordem === "visitas") s.sort((a, b) => b.visitas.length - a.visitas.length);
    return s;
  }, [clientes, busca, filtro, ordem, soMeus, meuPro]);

  return (
    <div className="clientes">
      <div className="topo-lista">
        <label className="busca">
          <Search size={16} />
          <input placeholder="Nome ou celular" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar cliente" />
          {busca && (
            <button className="icon-btn" onClick={() => setBusca("")} aria-label="Limpar busca">
              <X size={14} />
            </button>
          )}
        </label>
        <button className="icon-btn icon-btn-cheio" onClick={onNovoCliente} aria-label="Cadastrar cliente">
          <UserPlus size={18} />
        </button>
      </div>
      <div className="chips chips-rolagem">
        {([
          ["todos", "Todos"],
          ["frequentes", "Frequentes"],
          ["faltas", "Com falta"],
          ["sumidos", "Sumidos há 60 dias"],
        ] as [Filtro, string][]).map(([k, n]) => (
          <button key={k} className={`chip ${filtro === k ? "on" : ""}`} onClick={() => setFiltro(k)}>
            {n}
          </button>
        ))}
        {meuPro && (
          <button className={`chip ${soMeus ? "on" : ""}`} onClick={() => setSoMeus(!soMeus)}>
            Só os meus
          </button>
        )}
      </div>
      <div className="lista-meta">
        <span>{lista.length === 1 ? "1 cliente" : `${lista.length} clientes`}</span>
        <label>
          Ordem
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar">
            <option value="recentes">Visita mais recente</option>
            <option value="nome">Nome</option>
            <option value="visitas">Mais visitas</option>
          </select>
        </label>
      </div>
      {lista.length === 0 ? (
        <div className="vazio">
          <p>Ninguém encontrado com esse filtro.</p>
          <button className="link" onClick={() => { setBusca(""); setFiltro("todos"); setSoMeus(false); }}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="lista-cli">
          {lista.slice(0, mostrar).map((c, i) => {
            const faltas = c.visitas.filter((v) => v.faltou).length;
            return (
              <button key={c.id} className="cli" onClick={() => onAbrir(c.id)} style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                <span className="cli-txt">
                  <b>{c.nome}</b>
                  <small>
                    {quando(c.ultimaHa)} · {c.visitas.length} {c.visitas.length === 1 ? "visita" : "visitas"}
                  </small>
                </span>
                {faltas > 0 && <span className="tag tag-alerta">{faltas === 1 ? "1 falta" : `${faltas} faltas`}</span>}
                <ChevronRight size={16} />
              </button>
            );
          })}
          {lista.length > mostrar && (
            <button className="btn btn-fantasma btn-largo" onClick={() => setMostrar(mostrar + 14)}>
              Mostrar mais {Math.min(14, lista.length - mostrar)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function FichaCliente({ id, onFechar, onEditar, onMarcar }: { id: string | null; onFechar: () => void; onEditar: (c: Cliente) => void; onMarcar: (c: Cliente) => void }) {
  const { clientes, excluirCliente, avisar, online } = useStore();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => setConfirmando(false), [id]);
  const c = id ? clientes.find((k) => k.id === id) : null;
  if (!c) return <Sheet aberto={false} titulo="" onFechar={onFechar}>{null}</Sheet>;
  const faltas = c.visitas.filter((v) => v.faltou).length;
  const gasto = c.visitas.filter((v) => !v.faltou).reduce((s, v) => s + v.valor, 0);
  const pref = c.preferidoId ? profissional(c.preferidoId) : null;

  return (
    <Sheet aberto={!!id} titulo="Ficha da cliente" onFechar={onFechar} alto>
      <div className="ficha-topo">
        <div>
          <b>{c.nome}</b>
          <small>
            <Phone size={12} /> {c.telefone} · cliente desde {c.desde}
          </small>
        </div>
      </div>
      <div className="ficha-num">
        <span>
          <b>{c.visitas.length}</b>
          <small>visitas</small>
        </span>
        <span>
          <b>{reais(gasto)}</b>
          <small>no histórico</small>
        </span>
        <span className={faltas ? "alerta" : ""}>
          <b>{faltas}</b>
          <small>{faltas === 1 ? "falta" : "faltas"}</small>
        </span>
      </div>
      {pref && (
        <div className="ficha-pref">
          <Avatar chave={pref.foto} nome={pref.nome} size={28} />
          <span>
            Costuma vir com <b>{pref.curto}</b>
          </span>
        </div>
      )}
      {c.obs && <p className="ficha-obs">{c.obs}</p>}
      <h4 className="ficha-h">Histórico</h4>
      {c.visitas.length === 0 ? (
        <p className="vazio-mini">Nenhuma visita registrada ainda.</p>
      ) : (
        <ul className="historico">
          {c.visitas.map((v, i) => (
            <li key={i} className={v.faltou ? "faltou" : ""}>
              <span>{v.data}</span>
              <span>
                <b>{servico(v.servicoId).nome}</b>
                <small>com {profissional(v.profissionalId).curto}</small>
              </span>
              <span>{v.faltou ? "Faltou" : reais(v.valor)}</span>
            </li>
          ))}
        </ul>
      )}
      {confirmando ? (
        <div className="passo">
          <p className="passo-txt">Excluir {primeiroNome(c.nome)} da base? O histórico some junto.</p>
          <div className="linha-btn">
            <button className="btn btn-fantasma" onClick={() => setConfirmando(false)}>
              Manter
            </button>
            <button className="btn btn-perigo" disabled={enviando} onClick={async () => { setEnviando(true); await excluirCliente(c.id); setEnviando(false); avisar(`${primeiroNome(c.nome)} foi excluída da base.`, "info"); onFechar(); }}>
              {enviando ? <Spinner /> : <Trash2 size={16} />} Excluir
            </button>
          </div>
        </div>
      ) : (
        <div className="acoes">
          <button className="btn btn-primario" disabled={!online} onClick={() => onMarcar(c)}>
            <CalendarPlus size={16} /> Marcar horário
          </button>
          <button className="btn" onClick={() => onEditar(c)}>
            <Pencil size={16} /> Editar
          </button>
          <button className="btn btn-perigo-suave" onClick={() => setConfirmando(true)}>
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      )}
    </Sheet>
  );
}

export function FormCliente({ cliente, onFechar, onSalvo }: { cliente: Partial<Cliente> | null; onFechar: () => void; onSalvo: (c: Cliente) => void }) {
  const { salvarCliente, avisar } = useStore();
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [pref, setPref] = useState("");
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tocado, setTocado] = useState(false);
  useEffect(() => {
    if (!cliente) return;
    setNome(cliente.nome ?? "");
    setTel(cliente.telefone ?? "");
    setPref(cliente.preferidoId ?? "");
    setObs(cliente.obs ?? "");
    setTocado(false);
  }, [cliente]);
  const erroNome = nome.trim().length < 3 ? "Escreva o nome completo." : "";
  const erroTel = tel.replace(/\D/g, "").length < 10 ? "Celular com DDD, como (11) 98765-4321." : "";

  const salvar = async () => {
    setTocado(true);
    if (erroNome || erroTel) return;
    setEnviando(true);
    const c = await salvarCliente({ id: cliente?.id, nome: nome.trim(), telefone: tel, preferidoId: pref || undefined, obs: obs.trim() || undefined });
    setEnviando(false);
    avisar(cliente?.id ? "Ficha atualizada." : `${primeiroNome(c.nome)} entrou na base.`);
    onSalvo(c);
  };

  return (
    <Sheet aberto={!!cliente} titulo={cliente?.id ? "Editar ficha" : "Cliente nova"} onFechar={onFechar} alto>
      <div className="form">
        <label className={`campo ${tocado && erroNome ? "erro" : ""}`}>
          <span>Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome e sobrenome" />
          {tocado && erroNome && <em>{erroNome}</em>}
        </label>
        <label className={`campo ${tocado && erroTel ? "erro" : ""}`}>
          <span>Celular</span>
          <input value={tel} inputMode="tel" onChange={(e) => setTel(mascara(e.target.value))} placeholder="(11) 98765-4321" />
          {tocado && erroTel && <em>{erroTel}</em>}
        </label>
        <label className="campo">
          <span>Costuma vir com</span>
          <select value={pref} onChange={(e) => setPref(e.target.value)}>
            <option value="">Sem preferência</option>
            {EQUIPE.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}, {p.funcao.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Observação</span>
          <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} placeholder="Alergias, preferências, o que vale lembrar na cadeira" />
        </label>
        <button className="btn btn-primario btn-largo" onClick={salvar} disabled={enviando}>
          {enviando ? <Spinner /> : <Save size={16} />} {enviando ? "Salvando" : "Salvar ficha"}
        </button>
      </div>
    </Sheet>
  );
}
