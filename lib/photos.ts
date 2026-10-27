// Real Unsplash photos, chosen for a São Paulo salon and barbershop and checked by eye.
export const FOTOS: Record<string, string> = {
  // equipe
  rafael: "photo-1513872900980-460ea4c87668",
  diego: "photo-1771594836586-837aa05be563",
  thiago: "photo-1717700921740-a1440f3b89a4",
  camila: "photo-1562322140-8baeececf3df",
  renata: "photo-1780387477222-730504564368",
  bruno: "photo-1626201061255-51c25afa69e6",
  patricia: "photo-1662850886700-4ec19bd30d11",
  aline: "photo-1788995860034-ef88e7a636d8",
  julia: "photo-1586391975091-40b8eb04bfc7",
  marina: "photo-1761839256840-7780a45b85dc",
  // ambientes
  salao: "photo-1633681926022-84c23e8cb2d6",
  barbearia: "photo-1792735207211-a96ca7e6ea77",
  atendimento: "photo-1675034743339-0b0747047727",
  recepcao: "photo-1556740758-90de374c12ad",
  // serviços
  corteMasc: "photo-1701891123509-e983d6c45259",
  barba: "photo-1717089256239-dc2ed4d9dfc6",
  corteFem: "photo-1580618672591-eb180b1a973f",
  coloracao: "photo-1707979577466-2d6109c68a45",
  manicure: "photo-1457972729786-0411a3b2b626",
  pedicure: "photo-1519419451778-14599a49ec41",
  sobrancelha: "photo-1785860945533-918a531bcdeb",
  limpeza: "photo-1570172619644-dfd03ed5d881",
};

export function foto(chave: string, w: number, h: number, rosto = false) {
  const id = FOTOS[chave] || chave;
  return rosto
    ? `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=facearea&facepad=3&q=80&auto=format`
    : `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}
