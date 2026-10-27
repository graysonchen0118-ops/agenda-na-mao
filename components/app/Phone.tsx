"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarDays, ChartPie, LayoutGrid, Plus, RefreshCw, Signal, Sparkles, Users, WifiOff, BatteryMedium, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { AGORA } from "@/lib/mock/calendario";
import { PAPEL_NOME } from "@/lib/mock/equipe";
import { hora } from "@/lib/format";
import type { Cena, Prefill } from "@/lib/cena";
import { dica, quando } from "@/lib/cena";
import type { Cliente } from "@/lib/types";
import { Avatar, Skel } from "../ui";
import { Login } from "./Login";
import { Agenda } from "./Agenda";
import { Novo } from "./Novo";
import { Detalhe } from "./Detalhe";
import { Clientes, FichaCliente, FormCliente } from "./Clientes";
import { Resumo } from "./Resumo";
import { Avisos } from "./Avisos";
import { Mais } from "./Mais";

type Aba = "agenda" | "clientes" | "resumo" | "avisos" | "mais";

export function Phone() {
  const st = useStore();
  const { pronto, usuario, online, mudarSinal, sincronizadoEm, avisos, novidades, limparNovidades, entrar } = st;
  const [aba, setAba] = useState<Aba>("agenda");
  const [modo, setModo] = useState<"dia" | "semana">("dia");
  const [dia, setDia] = useState(0);
  const [pro, setPro] = useState("todos");
  const [novo, setNovo] = useState<Prefill | null>(null);
  const [det, setDet] = useState<string | null>(null);
  const [ficha, setFicha] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Cliente> | null>(null);

  // the guided situations from the bar above the phone
  useEffect(() => {
    const on = async (e: Event) => {
      const c = (e as CustomEvent<Cena>).detail;
      setDet(null);
      setFicha(null);
      setForm(null);
      setNovo(null);
      if (st.usuarioId !== "u-rafael") await entrar("u-rafael", true);
      setAba("agenda");
      setModo("dia");
      setDia(c.dia);
      if (c.tipo === "corrida") {
        if (!st.online) mudarSinal(true);
        setTimeout(() => setNovo({ clienteId: c.clienteApp, servicoId: c.servicoId, profissionalId: "p-rafael", dia: c.dia, inicio: c.inicio }), 250);
        dica(`Rafael abriu ${quando(c.dia, c.inicio)} no celular. Ao mesmo tempo, a recepção vai marcar o mesmo horário no computador. Quando aparecer lá, toque em Confirmar horário.`);
      } else {
        setTimeout(() => mudarSinal(false), 300);
        dica(`O celular de Rafael perdeu o sinal. A agenda continua na tela, mas não muda. Enquanto isso, a recepção marca ${quando(c.dia, c.inicio)}. Depois, toque no sinal no topo do celular para ele voltar.`);
      }
    };
    window.addEventListener("agenda:cena", on);
    return () => window.removeEventListener("agenda:cena", on);
  }, [st.usuarioId, st.online, entrar, mudarSinal]);

  useEffect(() => {
    if (!usuario) {
      setAba("agenda");
      setNovo(null);
      setDet(null);
      setFicha(null);
      setForm(null);
    }
  }, [usuario]);

  useEffect(() => {
    if (online) return;
    setNovo(null);
  }, [online]);

  const naoLidos = usuario ? avisos.filter((v) => v.para.includes(usuario.id) && !v.lido).length : 0;
  const abrirNovo = (p: Prefill = {}) => setNovo({ profissionalId: usuario?.papel === "profissional" ? usuario.profissionalId : pro !== "todos" ? pro : undefined, dia, ...p });

  const ABAS: [Aba, string, typeof CalendarDays][] = [
    ["agenda", "Agenda", CalendarDays],
    ["clientes", "Clientes", Users],
    ["resumo", "Resumo", ChartPie],
    ["avisos", "Avisos", Bell],
    ["mais", "Mais", LayoutGrid],
  ];

  return (
    <div className="aparelho" data-online={online ? "sim" : "nao"}>
      <div className="aparelho-borda">
        <div className="tela">
          <div className="barra-status">
            <span>{hora(AGORA.min)}</span>
            <span className="ilha" aria-hidden="true" />
            <span className="barra-icones">
              <button className={`sinal ${online ? "" : "off"}`} onClick={() => usuario && mudarSinal(!online)} aria-label={online ? "Simular perda de sinal" : "Devolver o sinal"} title={online ? "Simular perda de sinal" : "Devolver o sinal"} data-acao="sinal">
                {online ? <Signal size={14} /> : <WifiOff size={14} />}
              </button>
              <BatteryMedium size={16} />
            </span>
          </div>

          {!pronto ? (
            <div className="carregando">
              <Skel h={44} w="60%" r={14} />
              <Skel h={18} w="85%" />
              <Skel h={64} r={16} />
              <Skel h={64} r={16} />
              <Skel h={64} r={16} />
              <Skel h={64} r={16} />
            </div>
          ) : !usuario ? (
            <Login />
          ) : (
            <>
              <header className="app-topo">
                <Avatar chave={usuario.foto} nome={usuario.nome} size={36} />
                <span>
                  <small>Boa tarde,</small>
                  <b>{usuario.curto}</b>
                </span>
                <span className="papel">{PAPEL_NOME[usuario.papel]}</span>
                <button className="icon-btn sino" onClick={() => setAba("avisos")} aria-label={`Avisos, ${naoLidos} sem ler`}>
                  <Bell size={19} />
                  {naoLidos > 0 && <em>{naoLidos}</em>}
                </button>
              </header>

              {!online && (
                <div className="faixa-off" role="status">
                  <WifiOff size={16} />
                  <span>
                    <b>Sem sinal.</b> Agenda de {hora(sincronizadoEm)}, só para consulta.
                  </span>
                  <button onClick={() => mudarSinal(true)} aria-label="Tentar de novo">
                    <RefreshCw size={15} />
                  </button>
                </div>
              )}
              {online && novidades.length > 0 && (
                <div className="faixa-novo" role="status">
                  <Sparkles size={16} />
                  <span>
                    {novidades.length === 1 ? "1 horário mudou" : `${novidades.length} horários mudaram`} enquanto o celular estava sem sinal. Estão destacados.
                  </span>
                  <button onClick={limparNovidades} aria-label="Dispensar">
                    <X size={15} />
                  </button>
                </div>
              )}

              <main className="app-corpo" key={aba}>
                {aba === "agenda" && <Agenda modo={modo} setModo={setModo} dia={dia} setDia={setDia} pro={pro} setPro={setPro} onAbrir={setDet} onNovo={abrirNovo} />}
                {aba === "clientes" && <Clientes onAbrir={setFicha} onNovoCliente={() => setForm({})} />}
                {aba === "resumo" && <Resumo />}
                {aba === "avisos" && <Avisos />}
                {aba === "mais" && <Mais />}
              </main>

              {(aba === "agenda" || aba === "clientes") && (
                <button className="fab" onClick={() => abrirNovo()} aria-label="Novo horário" disabled={!online} data-acao="novo">
                  <Plus size={24} />
                </button>
              )}

              <nav className="abas" aria-label="Seções do app">
                {ABAS.map(([k, n, I]) => (
                  <button key={k} className={aba === k ? "on" : ""} onClick={() => setAba(k)} aria-current={aba === k ? "page" : undefined} data-aba={k}>
                    <span className="aba-icone">
                      <I size={20} />
                      {k === "avisos" && naoLidos > 0 && <em>{naoLidos}</em>}
                    </span>
                    {n}
                  </button>
                ))}
              </nav>

              <Novo prefill={novo} onFechar={() => setNovo(null)} />
              <Detalhe
                id={det}
                onFechar={() => setDet(null)}
                onVerCliente={(id) => { setDet(null); setFicha(id); }}
                onNovo={(p) => { setDet(null); setNovo({ ...p, dia }); }}
              />
              <FichaCliente
                id={ficha}
                onFechar={() => setFicha(null)}
                onEditar={(c) => setForm(c)}
                onMarcar={(c) => { setFicha(null); abrirNovo({ clienteId: c.id, profissionalId: usuario.papel === "profissional" ? usuario.profissionalId : c.preferidoId }); }}
              />
              <FormCliente cliente={form} onFechar={() => setForm(null)} onSalvo={(c) => { setForm(null); setFicha(c.id); }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
