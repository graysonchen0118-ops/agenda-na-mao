// The page talks to the 3D scene through window events, so the scene never re-renders React.
export type Pulso = "confirmado" | "recusado" | "cancelado" | "remarcado" | "semSinal" | "sinalVoltou" | "login" | "status";

export function pulso(tipo: Pulso) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("agenda:pulso", { detail: { tipo } }));
}
