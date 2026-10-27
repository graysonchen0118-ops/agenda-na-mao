// The salon's week, on a fixed clock: Tuesday 27 October 2026, 14:20 in São Paulo.
// A fixed clock keeps the server render and the browser identical.

export const AGORA = { dia: 0, min: 14 * 60 + 20 };

export interface DiaAgenda {
  i: number;
  curto: string;
  nome: string;
  data: string;
  abre: number;
  fecha: number;
}

export const SEMANA: DiaAgenda[] = [
  { i: 0, curto: "Ter", nome: "Terça, 27 de outubro", data: "27/10", abre: 9 * 60, fecha: 19 * 60 },
  { i: 1, curto: "Qua", nome: "Quarta, 28 de outubro", data: "28/10", abre: 9 * 60, fecha: 19 * 60 },
  { i: 2, curto: "Qui", nome: "Quinta, 29 de outubro", data: "29/10", abre: 9 * 60, fecha: 20 * 60 },
  { i: 3, curto: "Sex", nome: "Sexta, 30 de outubro", data: "30/10", abre: 9 * 60, fecha: 20 * 60 },
  { i: 4, curto: "Sáb", nome: "Sábado, 31 de outubro", data: "31/10", abre: 8 * 60, fecha: 17 * 60 },
];

export const DIA_MES_HOJE = 27;
export const MES = "outubro";
