// Shapes the app reads, written the way a REST API would return them.

export type Papel = "dona" | "recepcao" | "profissional";
export type Categoria = "Barbearia" | "Cabelo" | "Unhas" | "Estética";
export type Status = "confirmado" | "em_atendimento" | "concluido" | "cancelado" | "faltou";
export type Origem = "app" | "web";
export type Pagamento = "Pix" | "Cartão" | "Dinheiro";

export interface Profissional {
  id: string;
  nome: string;
  curto: string;
  funcao: string;
  categorias: Categoria[];
  foto: string;
  parceiro: boolean;
  /** percentual do valor de cada serviço que fica com o profissional (cota-parte) */
  cota: number;
  desde: string;
  cor: string;
}

export interface Usuario {
  id: string;
  nome: string;
  curto: string;
  papel: Papel;
  foto: string;
  profissionalId?: string;
  descricao: string;
}

export interface Servico {
  id: string;
  nome: string;
  categoria: Categoria;
  duracao: number;
  preco: number;
  foto: string;
}

export interface Visita {
  data: string;
  servicoId: string;
  profissionalId: string;
  valor: number;
  faltou?: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  desde: string;
  preferidoId?: string;
  obs?: string;
  visitas: Visita[];
  /** dias desde a última visita, contados a partir de hoje */
  ultimaHa: number;
}

export interface Agendamento {
  id: string;
  clienteId: string;
  profissionalId: string;
  servicoId: string;
  dia: number;
  inicio: number;
  fim: number;
  status: Status;
  origem: Origem;
  valor: number;
  pagamento?: Pagamento;
  /** quem mexeu por último, e quando, para o painel da recepção */
  porUltimo?: string;
  atualizadoEm?: number;
}

export interface Aviso {
  id: string;
  para: string[];
  tipo: "novo" | "cancelado" | "remarcado" | "lembrete" | "resumo" | "sinal";
  titulo: string;
  texto: string;
  hora: number;
  lido: boolean;
}

export interface FechamentoDia {
  dia: number; // dia do mês
  profissionalId: string;
  atendimentos: number;
  valor: number;
}
