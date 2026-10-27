import type { Profissional, Usuario, Categoria } from "../types";

// Studio Aroeira: one owner, one receptionist and eight partner professionals (Lei 13.352/2016).
export const EQUIPE: Profissional[] = [
  { id: "p-rafael", nome: "Rafael Moura", curto: "Rafael", funcao: "Barbeiro", categorias: ["Barbearia"], foto: "rafael", parceiro: true, cota: 60, desde: "2021", cor: "#8E3A6C" },
  { id: "p-diego", nome: "Diego Santana", curto: "Diego", funcao: "Barbeiro", categorias: ["Barbearia"], foto: "diego", parceiro: true, cota: 55, desde: "2023", cor: "#B76E4B" },
  { id: "p-thiago", nome: "Thiago Lins", curto: "Thiago", funcao: "Barbeiro", categorias: ["Barbearia"], foto: "thiago", parceiro: true, cota: 55, desde: "2024", cor: "#4F6D7A" },
  { id: "p-camila", nome: "Camila Rocha", curto: "Camila", funcao: "Cabeleireira", categorias: ["Cabelo"], foto: "camila", parceiro: true, cota: 50, desde: "2019", cor: "#6E8B5A" },
  { id: "p-renata", nome: "Renata Oliveira", curto: "Renata", funcao: "Colorista", categorias: ["Cabelo"], foto: "renata", parceiro: true, cota: 50, desde: "2020", cor: "#A0577A" },
  { id: "p-bruno", nome: "Bruno Carvalho", curto: "Bruno", funcao: "Cabeleireiro", categorias: ["Cabelo", "Barbearia"], foto: "bruno", parceiro: true, cota: 55, desde: "2022", cor: "#5B5F9E" },
  { id: "p-patricia", nome: "Patrícia Souza", curto: "Patrícia", funcao: "Manicure", categorias: ["Unhas"], foto: "patricia", parceiro: true, cota: 60, desde: "2018", cor: "#C0705E" },
  { id: "p-aline", nome: "Aline Ferreira", curto: "Aline", funcao: "Esteticista", categorias: ["Estética"], foto: "aline", parceiro: true, cota: 55, desde: "2022", cor: "#3F8A80" },
];

export const profissional = (id: string) => EQUIPE.find((p) => p.id === id)!;

export const USUARIOS: Usuario[] = [
  { id: "u-rafael", nome: "Rafael Moura", curto: "Rafael", papel: "profissional", foto: "rafael", profissionalId: "p-rafael", descricao: "Barbeiro parceiro. Vê a própria agenda e a própria parte." },
  { id: "u-julia", nome: "Júlia Ramos", curto: "Júlia", papel: "recepcao", foto: "julia", descricao: "Recepção. Vê a agenda de todos e o caixa do dia." },
  { id: "u-marina", nome: "Marina Albuquerque", curto: "Marina", papel: "dona", foto: "marina", descricao: "Dona do salão. Vê tudo, inclusive os repasses." },
];

export const usuario = (id: string) => USUARIOS.find((u) => u.id === id)!;

export const PAPEL_NOME: Record<string, string> = { dona: "Dona", recepcao: "Recepção", profissional: "Profissional" };

export const CATEGORIAS: Categoria[] = ["Barbearia", "Cabelo", "Unhas", "Estética"];
