import type { Servico } from "../types";

// Price list of Studio Aroeira, Vila Madalena. Values in reais.
export const SERVICOS: Servico[] = [
  { id: "s-corte-m", nome: "Corte masculino", categoria: "Barbearia", duracao: 30, preco: 60, foto: "corteMasc" },
  { id: "s-barba", nome: "Barba com toalha quente", categoria: "Barbearia", duracao: 30, preco: 45, foto: "barba" },
  { id: "s-corte-barba", nome: "Corte e barba", categoria: "Barbearia", duracao: 60, preco: 95, foto: "barba" },
  { id: "s-pezinho", nome: "Acabamento e pezinho", categoria: "Barbearia", duracao: 15, preco: 25, foto: "corteMasc" },
  { id: "s-platinado", nome: "Platinado", categoria: "Barbearia", duracao: 120, preco: 220, foto: "coloracao" },
  { id: "s-corte-f", nome: "Corte feminino", categoria: "Cabelo", duracao: 60, preco: 120, foto: "corteFem" },
  { id: "s-escova", nome: "Escova modelada", categoria: "Cabelo", duracao: 45, preco: 75, foto: "corteFem" },
  { id: "s-hidratacao", nome: "Hidratação profunda", categoria: "Cabelo", duracao: 45, preco: 95, foto: "corteFem" },
  { id: "s-coloracao", nome: "Coloração", categoria: "Cabelo", duracao: 120, preco: 280, foto: "coloracao" },
  { id: "s-mechas", nome: "Mechas e tonalização", categoria: "Cabelo", duracao: 180, preco: 450, foto: "coloracao" },
  { id: "s-manicure", nome: "Manicure", categoria: "Unhas", duracao: 45, preco: 45, foto: "manicure" },
  { id: "s-pedicure", nome: "Pedicure", categoria: "Unhas", duracao: 45, preco: 55, foto: "pedicure" },
  { id: "s-mao-pe", nome: "Mão e pé", categoria: "Unhas", duracao: 90, preco: 90, foto: "manicure" },
  { id: "s-sobrancelha", nome: "Design de sobrancelha", categoria: "Estética", duracao: 30, preco: 60, foto: "sobrancelha" },
  { id: "s-limpeza", nome: "Limpeza de pele", categoria: "Estética", duracao: 75, preco: 170, foto: "limpeza" },
];

export const servico = (id: string) => SERVICOS.find((s) => s.id === id)!;
