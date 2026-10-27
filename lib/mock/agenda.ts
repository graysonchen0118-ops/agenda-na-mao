import type { Agendamento, Pagamento, Status, Origem } from "../types";
import { EQUIPE } from "./equipe";
import { SERVICOS, servico } from "./servicos";
import { CLIENTES } from "./clientes";
import { SEMANA, AGORA } from "./calendario";
import { seeded, pick } from "../rand";

// The week's appointments. Rafael's Tuesday is written by hand, because it is the day the
// page walks through: a client in the chair at 14:20 and the 15:00 slot still free.
const RAFAEL_HOJE: [number, string, string, Status, Pagamento?][] = [
  [9 * 60, "s-corte-barba", "Lucas Pereira", "concluido", "Pix"],
  [10 * 60, "s-corte-m", "Caio Mendes", "concluido", "Cartão"],
  [10 * 60 + 30, "s-barba", "Gabriel Nogueira", "faltou"],
  [11 * 60, "s-corte-m", "Gustavo Ribeiro", "concluido", "Pix"],
  [11 * 60 + 30, "s-pezinho", "Bruno Tavares", "concluido", "Dinheiro"],
  [13 * 60, "s-corte-barba", "Pedro Henrique Lima", "concluido", "Pix"],
  [14 * 60, "s-corte-m", "Otávio Rezende", "em_atendimento"],
  [14 * 60 + 30, "s-barba", "Samuel Batista", "confirmado"],
  [15 * 60 + 30, "s-corte-barba", "Felipe Cardoso", "confirmado"],
  [16 * 60 + 30, "s-corte-m", "Vinícius Campos", "confirmado"],
  [17 * 60, "s-corte-barba", "João Vitor Barros", "confirmado"],
  [18 * 60, "s-corte-m", "Eduardo Pacheco", "confirmado"],
];

const clientePorNome = (n: string) => CLIENTES.find((c) => c.nome === n)!.id;

function gerar(): Agendamento[] {
  const r = seeded(1527);
  const out: Agendamento[] = [];
  let n = 1;
  const id = () => `a-${String(n++).padStart(4, "0")}`;
  const pagamento = (): Pagamento => {
    const x = r();
    return x < 0.56 ? "Pix" : x < 0.9 ? "Cartão" : "Dinheiro";
  };
  const origem = (): Origem => (r() < 0.62 ? "web" : "app");

  const ORIGEM_RAFAEL: Origem[] = ["web", "web", "web", "app", "web", "app", "web", "web", "web", "app", "app", "web"];
  RAFAEL_HOJE.forEach(([inicio, sid, nome, status, pg], k) => {
    const s = servico(sid);
    out.push({ id: id(), clienteId: clientePorNome(nome), profissionalId: "p-rafael", servicoId: sid, dia: 0, inicio, fim: inicio + s.duracao, status, origem: ORIGEM_RAFAEL[k], valor: s.preco, pagamento: pg });
  });

  for (const dia of SEMANA) {
    for (const p of EQUIPE) {
      if (p.id === "p-rafael" && dia.i === 0) continue;
      const servs = SERVICOS.filter((s) => p.categorias.includes(s.categoria));
      const meus = CLIENTES.filter((c) => c.preferidoId === p.id);
      const vizinhos = CLIENTES.filter((c) => {
        const pref = EQUIPE.find((x) => x.id === c.preferidoId);
        return pref && pref.categorias.some((k) => p.categorias.includes(k));
      });
      const ocupacao = [0.78, 0.66, 0.6, 0.72, 0.84][dia.i];
      const almoco = 12 * 60 + (r() < 0.5 ? 0 : 30);
      let t = dia.abre + (r() < 0.3 ? 30 : 0);
      while (t < dia.fecha) {
        if (t >= almoco && t < almoco + 60) {
          t = almoco + 60;
          continue;
        }
        if (r() < ocupacao) {
          const cabem = servs.filter((s) => t + s.duracao <= dia.fecha && !(t < almoco + 60 && t + s.duracao > almoco));
          if (!cabem.length) {
            t += 15;
            continue;
          }
          const s = pick(r, cabem);
          const c = r() < 0.7 && meus.length ? pick(r, meus) : pick(r, vizinhos.length ? vizinhos : CLIENTES);
          const fim = t + s.duracao;
          let status: Status = "confirmado";
          let pg: Pagamento | undefined;
          if (dia.i === 0) {
            if (fim <= AGORA.min) {
              const x = r();
              status = x < 0.06 ? "faltou" : x < 0.1 ? "cancelado" : "concluido";
              if (status === "concluido") pg = pagamento();
            } else if (t <= AGORA.min) status = "em_atendimento";
            else if (r() < 0.05) status = "cancelado";
          } else if (r() < 0.04) status = "cancelado";
          out.push({ id: id(), clienteId: c.id, profissionalId: p.id, servicoId: s.id, dia: dia.i, inicio: t, fim, status, origem: origem(), valor: s.preco, pagamento: pg });
          t = fim + (r() < 0.25 ? 15 : 0);
        } else {
          t += 30;
        }
      }
    }
  }
  return out;
}

export const AGENDA: Agendamento[] = gerar();

export const ATIVOS: Status[] = ["confirmado", "em_atendimento", "concluido"];
export const ocupa = (a: Agendamento) => a.status !== "cancelado";
