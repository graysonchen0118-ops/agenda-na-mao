import type { Cliente, Visita } from "../types";
import { EQUIPE } from "./equipe";
import { SERVICOS } from "./servicos";
import { seeded, pick } from "../rand";

// The salon's client base. Every record is invented, built from a fixed seed.
const BASE: [string, string, string?][] = [
  ["Lucas Pereira", "p-rafael", "Prefere máquina 2 nas laterais."],
  ["Gabriel Nogueira", "p-rafael"],
  ["Mateus Araújo", "p-diego", "Barba desenhada, sem navalha no pescoço."],
  ["Felipe Cardoso", "p-thiago"],
  ["Pedro Henrique Lima", "p-rafael", "Vem sempre na hora do almoço."],
  ["João Vitor Barros", "p-diego"],
  ["André Monteiro", "p-bruno"],
  ["Rodrigo Teixeira", "p-thiago", "Alergia a pós-barba com álcool."],
  ["Caio Mendes", "p-rafael"],
  ["Vinícius Campos", "p-diego"],
  ["Eduardo Pacheco", "p-thiago"],
  ["Leonardo Freitas", "p-bruno"],
  ["Gustavo Ribeiro", "p-rafael"],
  ["Henrique Dias", "p-diego"],
  ["Otávio Rezende", "p-rafael", "Platinado a cada seis semanas."],
  ["Samuel Batista", "p-thiago"],
  ["Ana Clara Moreira", "p-camila", "Corte reto, só as pontas."],
  ["Beatriz Lopes", "p-renata", "Mechas mel, tonalizante 9.1."],
  ["Juliana Castro", "p-camila"],
  ["Fernanda Siqueira", "p-renata"],
  ["Larissa Gomes", "p-patricia", "Esmalte nude, unha quadrada."],
  ["Mariana Duarte", "p-aline"],
  ["Carolina Pinto", "p-camila"],
  ["Isabela Fonseca", "p-renata", "Raiz a cada 30 dias."],
  ["Letícia Barbosa", "p-patricia"],
  ["Camila Prado", "p-aline", "Pele sensível, sem ácido."],
  ["Paula Vasconcelos", "p-bruno"],
  ["Débora Martins", "p-patricia"],
  ["Renata Coelho", "p-camila"],
  ["Tatiane Rocha", "p-renata"],
  ["Vanessa Moura", "p-patricia"],
  ["Priscila Andrade", "p-aline"],
  ["Luana Ferraz", "p-camila"],
  ["Helena Cavalcanti", "p-renata"],
  ["Sofia Almeida", "p-patricia", "Prefere sábado de manhã."],
  ["Bianca Teles", "p-aline"],
  ["Natália Queiroz", "p-bruno"],
  ["Gabriela Peixoto", "p-camila"],
  ["Marcos Vinícius Leal", "p-thiago"],
  ["Ricardo Assis", "p-diego"],
  ["Daniel Fontes", "p-bruno"],
  ["Thaís Bezerra", "p-patricia"],
  ["Aline Rangel", "p-aline"],
  ["Roberta Sales", "p-renata"],
  ["Bruno Tavares", "p-rafael"],
  ["Diego Furtado", "p-diego"],
  ["Elaine Correia", "p-camila"],
  ["Murilo Saraiva", "p-thiago"],
];

const HOJE = Date.UTC(2026, 9, 27);
const dataHa = (dias: number) => {
  const d = new Date(HOJE - dias * 86_400_000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
};

function gerar(): Cliente[] {
  const r = seeded(2710);
  return BASE.map(([nome, pref, obs], i) => {
    const pro = EQUIPE.find((p) => p.id === pref)!;
    const servs = SERVICOS.filter((s) => pro.categorias.includes(s.categoria) && s.duracao <= 120);
    const n = 1 + Math.floor(r() * 9);
    const sumido = r() < 0.16;
    let ha = sumido ? 62 + Math.floor(r() * 50) : 3 + Math.floor(r() * 30);
    const visitas: Visita[] = [];
    for (let k = 0; k < n; k++) {
      const s = pick(r, servs);
      const outro = r() < 0.15 ? pick(r, EQUIPE.filter((p) => p.categorias.some((c) => pro.categorias.includes(c)))) : pro;
      visitas.push({ data: dataHa(ha), servicoId: s.id, profissionalId: outro.id, valor: s.preco, faltou: r() < 0.07 });
      ha += 14 + Math.floor(r() * 28);
      if (ha > 400) break;
    }
    const desdeAno = 2019 + Math.floor(r() * 7);
    const ddd = r() < 0.85 ? "11" : pick(r, ["19", "13", "21"]);
    const tel = `(${ddd}) 9${String(1000 + Math.floor(r() * 8999))}-${String(1000 + Math.floor(r() * 8999))}`;
    return {
      id: `c-${String(i + 1).padStart(3, "0")}`,
      nome,
      telefone: tel,
      desde: String(Math.min(desdeAno, 2026)),
      preferidoId: pref,
      obs,
      visitas,
      ultimaHa: visitas.length ? Number(visitas[0] && (sumido ? 62 : 3)) : 999,
    };
  }).map((c) => {
    // dias desde a última visita, a partir da data guardada
    const [d, m, a] = c.visitas[0].data.split("/").map(Number);
    const ultima = Date.UTC(a, m - 1, d);
    return { ...c, ultimaHa: Math.round((HOJE - ultima) / 86_400_000) };
  });
}

export const CLIENTES: Cliente[] = gerar();

export const DATA_HOJE = dataHa(0);
