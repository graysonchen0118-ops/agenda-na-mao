import type { Aviso } from "../types";

// Notifications already delivered this morning, each one to the people who can act on it.
export const AVISOS: Aviso[] = [
  { id: "v-01", para: ["u-rafael"], tipo: "lembrete", titulo: "Próximo cliente às 14:30", texto: "Samuel Batista, Barba com toalha quente. Chegou há pouco, está na recepção.", hora: 14 * 60 + 18, lido: false },
  { id: "v-02", para: ["u-rafael", "u-julia"], tipo: "novo", titulo: "Novo horário às 18:00", texto: "Eduardo Pacheco, Corte masculino, com Rafael. Marcado pela recepção.", hora: 13 * 60 + 41, lido: false },
  { id: "v-03", para: ["u-rafael", "u-julia", "u-marina"], tipo: "cancelado", titulo: "Falta às 10:30", texto: "Gabriel Nogueira não veio para a barba das 10:30 com Rafael. É a segunda falta dele no semestre.", hora: 10 * 60 + 46, lido: true },
  { id: "v-04", para: ["u-marina"], tipo: "resumo", titulo: "Resumo do meio-dia", texto: "Manhã fechada com 31 atendimentos e 2 faltas. O caixa está aberto desde as 8:50.", hora: 12 * 60 + 2, lido: true },
  { id: "v-05", para: ["u-julia"], tipo: "remarcado", titulo: "Remarcação pelo app", texto: "Camila passou Ana Clara Moreira de quinta para sexta às 10:00.", hora: 11 * 60 + 12, lido: true },
  { id: "v-06", para: ["u-julia", "u-marina"], tipo: "cancelado", titulo: "Cancelamento às 16:00", texto: "Larissa Gomes cancelou a manicure das 16:00 com Patrícia. O horário voltou para a agenda.", hora: 9 * 60 + 58, lido: true },
  { id: "v-07", para: ["u-rafael"], tipo: "novo", titulo: "Novo horário amanhã", texto: "Otávio Rezende marcou Platinado na quarta às 10:00.", hora: 9 * 60 + 15, lido: true },
  { id: "v-08", para: ["u-marina"], tipo: "resumo", titulo: "Repasses de segunda", texto: "Os repasses da semana passada aos oito parceiros foram calculados pelo percentual de cada contrato.", hora: 8 * 60 + 40, lido: true },
];
