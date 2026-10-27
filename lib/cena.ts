// Guided situations, shared by the phone, the reception panel and the scenario bar.

export interface Prefill {
  clienteId?: string;
  servicoId?: string;
  profissionalId?: string;
  dia?: number;
  inicio?: number;
}

export type Cena =
  | { tipo: "corrida"; dia: number; inicio: number; clienteApp: string; clienteWeb: string; servicoId: string }
  | { tipo: "semSinal"; dia: number; inicio: number; clienteWeb: string; servicoId: string };

import { SEMANA } from "./mock/calendario";
import { hora } from "./format";

/** "as 15:00" today, "quarta às 10:00" on another day */
export const quando = (dia: number, inicio: number) => (dia === 0 ? `as ${hora(inicio)}` : `${SEMANA[dia].nome.split(",")[0].toLowerCase()} às ${hora(inicio)}`);

export function disparar(c: Cena) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("agenda:cena", { detail: c }));
}

export function dica(texto: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("agenda:dica", { detail: texto }));
}
