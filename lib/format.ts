// Small formatters in Brazilian Portuguese.

export const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const reais = (v: number) => brl.format(Math.round(v)).replace(/ /g, " ");
export const reaisCent = (v: number) => brl2.format(v).replace(/ /g, " ");

export const duracao = (min: number) => (min < 60 ? `${min} min` : min % 60 === 0 ? `${min / 60} h` : `${Math.floor(min / 60)} h ${min % 60}`);

export const primeiroNome = (n: string) => n.split(" ")[0];
export const nomeCurto = (n: string) => {
  const p = n.split(" ");
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : n;
};

export const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
