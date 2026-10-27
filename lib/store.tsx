"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Agendamento, Aviso, Cliente, Origem, Pagamento, Status } from "./types";
import { AGENDA, ocupa } from "./mock/agenda";
import { CLIENTES } from "./mock/clientes";
import { AVISOS } from "./mock/avisos";
import { SEMANA, AGORA } from "./mock/calendario";
import { servico } from "./mock/servicos";
import { profissional, usuario, USUARIOS } from "./mock/equipe";
import { hora, nomeCurto } from "./format";
import { pulso } from "./bus";

// One in-memory "API" for the whole page. The phone and the reception panel both call it,
// with network latency, and it is the only place that decides whether a time is still free.

export interface Toast {
  id: number;
  texto: string;
  tom: "ok" | "erro" | "info";
}

export interface Mudanca {
  id: number;
  hora: number;
  origem: Origem;
  quem: string;
  texto: string;
  agId?: string;
}

export interface Pedido {
  clienteId: string;
  servicoId: string;
  profissionalId: string;
  dia: number;
  inicio: number;
}

export type Resultado =
  | { ok: true; ag: Agendamento }
  | { ok: false; motivo: "ocupado"; conflito: Agendamento; sugestoes: number[] }
  | { ok: false; motivo: "semSinal" | "fechado" };

export interface DadosCliente {
  id?: string;
  nome: string;
  telefone: string;
  preferidoId?: string;
  obs?: string;
}

interface Estado {
  pronto: boolean;
  usuarioId: string | null;
  online: boolean;
  sincronizadoEm: number;
  agenda: Agendamento[];
  foto: Agendamento[] | null;
  clientes: Cliente[];
  avisos: Aviso[];
  toasts: Toast[];
  log: Mudanca[];
  recepcaoVeCaixa: boolean;
  novidades: string[];
  relogio: number;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

const sobrepoe = (a: { inicio: number; fim: number }, b: { inicio: number; fim: number }) => a.inicio < b.fim && b.inicio < a.fim;

export function horariosLivres(agenda: Agendamento[], proId: string, dia: number, dur: number, ignorar?: string, aPartir?: number) {
  const d = SEMANA[dia];
  const ocupados = agenda.filter((a) => a.profissionalId === proId && a.dia === dia && ocupa(a) && a.id !== ignorar);
  const inicio = Math.max(d.abre, dia === 0 ? Math.ceil((AGORA.min + 5) / 15) * 15 : d.abre, aPartir ?? 0);
  const out: number[] = [];
  for (let t = inicio; t + dur <= d.fecha; t += 15) {
    if (!ocupados.some((a) => sobrepoe(a, { inicio: t, fim: t + dur }))) out.push(t);
  }
  return out;
}

interface Api extends Estado {
  usuario: ReturnType<typeof usuario> | null;
  agendaVisivel: Agendamento[];
  entrar: (id: string, manter: boolean) => Promise<void>;
  sair: () => void;
  mudarSinal: (online: boolean) => void;
  marcar: (p: Pedido, origem: Origem) => Promise<Resultado>;
  remarcar: (id: string, dia: number, inicio: number, origem: Origem) => Promise<Resultado>;
  cancelar: (id: string, origem: Origem) => Promise<boolean>;
  mudarStatus: (id: string, status: Status, pagamento?: Pagamento) => Promise<boolean>;
  salvarCliente: (c: DadosCliente) => Promise<Cliente>;
  excluirCliente: (id: string) => Promise<void>;
  lerAvisos: () => void;
  avisar: (texto: string, tom?: Toast["tom"]) => void;
  setRecepcaoVeCaixa: (v: boolean) => void;
  limparNovidades: () => void;
}

const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Estado>(() => ({
    pronto: false,
    usuarioId: null,
    online: true,
    sincronizadoEm: AGORA.min,
    agenda: AGENDA,
    foto: null,
    clientes: CLIENTES,
    avisos: AVISOS,
    toasts: [],
    log: [
      { id: 3, hora: 13 * 60 + 41, origem: "web", quem: "Júlia", texto: "marcou Eduardo P. às 18:00 com Rafael" },
      { id: 2, hora: 11 * 60 + 12, origem: "app", quem: "Camila", texto: "remarcou Ana Clara M. para sexta às 10:00" },
      { id: 1, hora: 9 * 60 + 58, origem: "web", quem: "Júlia", texto: "cancelou a manicure de Larissa G. às 16:00" },
    ],
    recepcaoVeCaixa: true,
    novidades: [],
    relogio: AGORA.min,
  }));
  const ref = useRef(s);
  ref.current = s;
  const toastId = useRef(1);
  const logId = useRef(10);

  // first load: the app asks the API for the day, so the skeleton is really seen
  useEffect(() => {
    let lembrado: string | null = null;
    try {
      lembrado = window.localStorage.getItem("agenda-na-mao:usuario");
    } catch {
      lembrado = null;
    }
    const t = setTimeout(() => {
      setS((x) => ({ ...x, pronto: true, usuarioId: lembrado && USUARIOS.some((u) => u.id === lembrado) ? lembrado : null }));
    }, 900);
    return () => clearTimeout(t);
  }, []);

  const avisar = useCallback((texto: string, tom: Toast["tom"] = "ok") => {
    const id = toastId.current++;
    setS((x) => ({ ...x, toasts: [...x.toasts.slice(-2), { id, texto, tom }] }));
    setTimeout(() => setS((x) => ({ ...x, toasts: x.toasts.filter((t) => t.id !== id) })), 3600);
  }, []);

  const quem = (origem: Origem) => {
    if (origem === "web") return "Júlia";
    const u = ref.current.usuarioId ? usuario(ref.current.usuarioId) : null;
    return u ? u.curto : "App";
  };

  const registrar = (origem: Origem, texto: string, agId?: string) => {
    const id = logId.current++;
    setS((x) => {
      const relogio = Math.min(x.relogio + 1, 14 * 60 + 55);
      return { ...x, relogio, log: [{ id, hora: relogio, origem, quem: quem(origem), texto, agId }, ...x.log].slice(0, 14) };
    });
  };

  const notificar = (para: string[], tipo: Aviso["tipo"], titulo: string, texto: string) => {
    setS((x) => ({ ...x, avisos: [{ id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, para, tipo, titulo, texto, hora: x.relogio, lido: false }, ...x.avisos] }));
  };

  // who should be told about a change to this professional's agenda
  const destinatarios = (proId: string, origem: Origem) => {
    const out = new Set<string>(["u-julia"]);
    const dono = USUARIOS.find((u) => u.profissionalId === proId);
    if (dono) out.add(dono.id);
    if (origem === "web") out.delete("u-julia");
    if (origem === "app" && ref.current.usuarioId) out.delete(ref.current.usuarioId);
    return [...out];
  };

  const entrar = useCallback(async (id: string, manter: boolean) => {
    await espera(1000);
    try {
      if (manter) window.localStorage.setItem("agenda-na-mao:usuario", id);
      else window.localStorage.removeItem("agenda-na-mao:usuario");
    } catch {
      /* sem armazenamento, segue sem lembrar */
    }
    setS((x) => ({ ...x, usuarioId: id }));
    pulso("login");
  }, []);

  const sair = useCallback(() => {
    try {
      window.localStorage.removeItem("agenda-na-mao:usuario");
    } catch {
      /* nada */
    }
    setS((x) => ({ ...x, usuarioId: null, online: true, foto: null, novidades: [] }));
  }, []);

  const mudarSinal = useCallback(
    (online: boolean) => {
      const x = ref.current;
      if (online === x.online) return;
      if (!online) {
        setS((y) => ({ ...y, online: false, foto: y.agenda, sincronizadoEm: y.relogio, novidades: [] }));
        pulso("semSinal");
        return;
      }
      const antes = new Map((x.foto ?? []).map((a) => [a.id, a]));
      const mudou = x.agenda.filter((a) => {
        const b = antes.get(a.id);
        return !b || b.status !== a.status || b.inicio !== a.inicio || b.dia !== a.dia;
      });
      const meu = x.usuarioId ? usuario(x.usuarioId) : null;
      const relevantes = meu?.profissionalId ? mudou.filter((a) => a.profissionalId === meu.profissionalId) : mudou;
      setS((y) => ({ ...y, online: true, foto: null, sincronizadoEm: y.relogio, novidades: relevantes.map((a) => a.id) }));
      pulso("sinalVoltou");
      avisar(relevantes.length ? `Sinal de volta. ${relevantes.length === 1 ? "1 mudança da recepção entrou" : `${relevantes.length} mudanças da recepção entraram`} na sua agenda.` : "Sinal de volta. Sua agenda já está atualizada.", "info");
    },
    [avisar],
  );

  const marcar = useCallback(
    async (p: Pedido, origem: Origem): Promise<Resultado> => {
      if (origem === "app" && !ref.current.online) return { ok: false, motivo: "semSinal" };
      await espera(origem === "app" ? 1100 : 650);
      const sv = servico(p.servicoId);
      const novo = { inicio: p.inicio, fim: p.inicio + sv.duracao };
      if (novo.fim > SEMANA[p.dia].fecha) return { ok: false, motivo: "fechado" };
      const atual = ref.current.agenda;
      const conflito = atual.find((a) => a.profissionalId === p.profissionalId && a.dia === p.dia && ocupa(a) && sobrepoe(a, novo));
      if (conflito) {
        pulso("recusado");
        return { ok: false, motivo: "ocupado", conflito, sugestoes: horariosLivres(atual, p.profissionalId, p.dia, sv.duracao, undefined, p.inicio - 60).slice(0, 4) };
      }
      const ag: Agendamento = {
        id: `a-n${Date.now().toString(36)}`,
        ...p,
        fim: novo.fim,
        status: "confirmado",
        origem,
        valor: sv.preco,
        porUltimo: quem(origem),
        atualizadoEm: ref.current.relogio + 1,
      };
      setS((x) => ({ ...x, agenda: [...x.agenda, ag] }));
      const c = ref.current.clientes.find((k) => k.id === p.clienteId);
      const pro = profissional(p.profissionalId);
      const quando = `${p.dia === 0 ? "hoje" : SEMANA[p.dia].curto.toLowerCase()} às ${hora(p.inicio)}`;
      registrar(origem, `marcou ${c ? nomeCurto(c.nome) : "cliente"} ${quando} com ${pro.curto}`, ag.id);
      notificar(destinatarios(p.profissionalId, origem), "novo", `Novo horário ${quando}`, `${c?.nome ?? "Cliente"}, ${sv.nome}, com ${pro.curto}. ${origem === "web" ? "Marcado pela recepção." : "Marcado pelo app."}`);
      pulso("confirmado");
      return { ok: true, ag };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const remarcar = useCallback(async (id: string, dia: number, inicio: number, origem: Origem): Promise<Resultado> => {
    if (origem === "app" && !ref.current.online) return { ok: false, motivo: "semSinal" };
    await espera(origem === "app" ? 1000 : 600);
    const atual = ref.current.agenda;
    const ag = atual.find((a) => a.id === id)!;
    const dur = ag.fim - ag.inicio;
    const alvo = { inicio, fim: inicio + dur };
    if (alvo.fim > SEMANA[dia].fecha) return { ok: false, motivo: "fechado" };
    const conflito = atual.find((a) => a.id !== id && a.profissionalId === ag.profissionalId && a.dia === dia && ocupa(a) && sobrepoe(a, alvo));
    if (conflito) {
      pulso("recusado");
      return { ok: false, motivo: "ocupado", conflito, sugestoes: horariosLivres(atual, ag.profissionalId, dia, dur, id, inicio - 60).slice(0, 4) };
    }
    const novo = { ...ag, dia, inicio, fim: alvo.fim, porUltimo: quem(origem), atualizadoEm: ref.current.relogio + 1 };
    setS((x) => ({ ...x, agenda: x.agenda.map((a) => (a.id === id ? novo : a)) }));
    const c = ref.current.clientes.find((k) => k.id === ag.clienteId);
    const quando = `${dia === 0 ? "hoje" : SEMANA[dia].curto.toLowerCase()} às ${hora(inicio)}`;
    registrar(origem, `remarcou ${c ? nomeCurto(c.nome) : "cliente"} para ${quando}`, id);
    notificar(destinatarios(ag.profissionalId, origem), "remarcado", `Remarcação para ${quando}`, `${c?.nome ?? "Cliente"} saiu das ${hora(ag.inicio)} de ${SEMANA[ag.dia].curto.toLowerCase()} e foi para ${quando}.`);
    pulso("remarcado");
    return { ok: true, ag: novo };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelar = useCallback(async (id: string, origem: Origem) => {
    if (origem === "app" && !ref.current.online) return false;
    await espera(origem === "app" ? 900 : 500);
    const ag = ref.current.agenda.find((a) => a.id === id)!;
    setS((x) => ({ ...x, agenda: x.agenda.map((a) => (a.id === id ? { ...a, status: "cancelado" as Status, porUltimo: quem(origem), atualizadoEm: x.relogio + 1 } : a)) }));
    const c = ref.current.clientes.find((k) => k.id === ag.clienteId);
    const quando = `${ag.dia === 0 ? "hoje" : SEMANA[ag.dia].curto.toLowerCase()} às ${hora(ag.inicio)}`;
    registrar(origem, `cancelou ${c ? nomeCurto(c.nome) : "cliente"} ${quando}`, id);
    notificar([...destinatarios(ag.profissionalId, origem), "u-marina"], "cancelado", `Cancelamento ${quando}`, `${c?.nome ?? "Cliente"}, ${servico(ag.servicoId).nome}, com ${profissional(ag.profissionalId).curto}. O horário voltou para a agenda.`);
    pulso("cancelado");
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mudarStatus = useCallback(async (id: string, status: Status, pagamento?: Pagamento) => {
    if (!ref.current.online) return false;
    await espera(700);
    setS((x) => ({ ...x, agenda: x.agenda.map((a) => (a.id === id ? { ...a, status, pagamento: pagamento ?? a.pagamento, porUltimo: quem("app"), atualizadoEm: x.relogio + 1 } : a)) }));
    const ag = ref.current.agenda.find((a) => a.id === id)!;
    const c = ref.current.clientes.find((k) => k.id === ag.clienteId);
    const rotulo = status === "em_atendimento" ? "iniciou o atendimento de" : status === "concluido" ? "fechou o atendimento de" : status === "faltou" ? "marcou falta de" : "confirmou";
    registrar("app", `${rotulo} ${c ? nomeCurto(c.nome) : "cliente"}`, id);
    pulso("status");
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvarCliente = useCallback(async (c: DadosCliente) => {
    await espera(800);
    let salvo: Cliente;
    if (c.id) {
      const antigo = ref.current.clientes.find((k) => k.id === c.id)!;
      salvo = { ...antigo, ...c, id: c.id };
      setS((x) => ({ ...x, clientes: x.clientes.map((k) => (k.id === c.id ? salvo : k)) }));
    } else {
      salvo = { ...c, id: `c-n${Date.now().toString(36)}`, desde: "2026", visitas: [], ultimaHa: 999 };
      setS((x) => ({ ...x, clientes: [salvo, ...x.clientes] }));
    }
    return salvo;
  }, []);

  const excluirCliente = useCallback(async (id: string) => {
    await espera(700);
    setS((x) => ({ ...x, clientes: x.clientes.filter((k) => k.id !== id) }));
  }, []);

  const lerAvisos = useCallback(() => {
    const u = ref.current.usuarioId;
    if (!u) return;
    setS((x) => ({ ...x, avisos: x.avisos.map((v) => (v.para.includes(u) ? { ...v, lido: true } : v)) }));
  }, []);

  const api = useMemo<Api>(
    () => ({
      ...s,
      usuario: s.usuarioId ? usuario(s.usuarioId) : null,
      agendaVisivel: s.online || !s.foto ? s.agenda : s.foto,
      entrar,
      sair,
      mudarSinal,
      marcar,
      remarcar,
      cancelar,
      mudarStatus,
      salvarCliente,
      excluirCliente,
      lerAvisos,
      avisar,
      setRecepcaoVeCaixa: (v: boolean) => setS((x) => ({ ...x, recepcaoVeCaixa: v })),
      limparNovidades: () => setS((x) => ({ ...x, novidades: [] })),
    }),
    [s, entrar, sair, mudarSinal, marcar, remarcar, cancelar, mudarStatus, salvarCliente, excluirCliente, lerAvisos, avisar],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fora do provider");
  return v;
}
