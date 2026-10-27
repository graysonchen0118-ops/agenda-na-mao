import type { FechamentoDia, Pagamento } from "../types";
import { EQUIPE } from "./equipe";
import { SERVICOS } from "./servicos";
import { seeded, pick } from "../rand";

// Closed days of October before today. The salon opens Tuesday to Saturday.
// 1 October 2026 is a Thursday.
const ABERTOS: number[] = [];
for (let d = 1; d < 27; d++) {
  const semana = (4 + d - 1) % 7; // 0 domingo ... 6 sábado; dia 1 = quinta (4)
  if (semana >= 2 && semana <= 6) ABERTOS.push(d);
}
export const DIAS_ABERTOS_MES = ABERTOS;

function gerar(): FechamentoDia[] {
  const r = seeded(1013);
  const out: FechamentoDia[] = [];
  for (const d of ABERTOS) {
    const semana = (4 + d - 1) % 7;
    const peso = semana === 6 ? 1.25 : semana === 5 ? 1.12 : semana === 2 ? 0.82 : 1;
    for (const p of EQUIPE) {
      const servs = SERVICOS.filter((s) => p.categorias.includes(s.categoria));
      const n = Math.max(2, Math.round((3 + r() * 5) * peso));
      let valor = 0;
      for (let k = 0; k < n; k++) valor += pick(r, servs).preco;
      out.push({ dia: d, profissionalId: p.id, atendimentos: n, valor });
    }
  }
  return out;
}

export const FECHAMENTOS: FechamentoDia[] = gerar();

/** how the month's money arrived, used for the split by payment method */
export const MIX_MES: Record<Pagamento, number> = { Pix: 0.57, Cartão: 0.34, Dinheiro: 0.09 };
