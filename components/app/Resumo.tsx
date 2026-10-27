"use client";

import { useMemo, useState } from "react";
import { Lock, Scale, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Pagamento } from "@/lib/types";
import { EQUIPE, profissional } from "@/lib/mock/equipe";
import { FECHAMENTOS, DIAS_ABERTOS_MES } from "@/lib/mock/financeiro";
import { DIA_MES_HOJE } from "@/lib/mock/calendario";
import { reais } from "@/lib/format";
import { Avatar, Numero } from "../ui";

const PAGS: Pagamento[] = ["Pix", "Cartão", "Dinheiro"];

export function Resumo() {
  const { agendaVisivel, usuario, recepcaoVeCaixa, setRecepcaoVeCaixa } = useStore();
  const [periodo, setPeriodo] = useState<"hoje" | "mes">("hoje");
  const papel = usuario?.papel;

  const hoje = useMemo(() => {
    const feitos = agendaVisivel.filter((a) => a.dia === 0 && a.status === "concluido");
    const porPro = EQUIPE.map((p) => {
      const meus = feitos.filter((a) => a.profissionalId === p.id);
      const valor = meus.reduce((s, a) => s + a.valor, 0);
      return { p, n: meus.length, valor, parte: Math.round((valor * p.cota) / 100) };
    });
    const caixa = feitos.reduce((s, a) => s + a.valor, 0);
    const repasse = porPro.reduce((s, x) => s + x.parte, 0);
    const mix = PAGS.map((k) => ({ k, v: feitos.filter((a) => a.pagamento === k).reduce((s, a) => s + a.valor, 0) }));
    const aFazer = agendaVisivel.filter((a) => a.dia === 0 && (a.status === "confirmado" || a.status === "em_atendimento"));
    return { feitos, porPro, caixa, repasse, salao: caixa - repasse, mix, aFazer };
  }, [agendaVisivel]);

  const mes = useMemo(() => {
    const porDia = DIAS_ABERTOS_MES.map((d) => ({ d, v: FECHAMENTOS.filter((f) => f.dia === d).reduce((s, f) => s + f.valor, 0) }));
    porDia.push({ d: DIA_MES_HOJE, v: hoje.caixa });
    const porPro = EQUIPE.map((p) => {
      const fs = FECHAMENTOS.filter((f) => f.profissionalId === p.id);
      const hojeP = hoje.porPro.find((x) => x.p.id === p.id)!;
      const valor = fs.reduce((s, f) => s + f.valor, 0) + hojeP.valor;
      const n = fs.reduce((s, f) => s + f.atendimentos, 0) + hojeP.n;
      return { p, valor, n, parte: Math.round((valor * p.cota) / 100) };
    }).sort((a, b) => b.valor - a.valor);
    const total = porDia.reduce((s, x) => s + x.v, 0);
    const repasse = porPro.reduce((s, x) => s + x.parte, 0);
    return { porDia, porPro, total, repasse, salao: total - repasse, max: Math.max(...porDia.map((x) => x.v)) };
  }, [hoje]);

  if (papel === "profissional") {
    const meu = profissional(usuario!.profissionalId!);
    const h = hoje.porPro.find((x) => x.p.id === meu.id)!;
    const m = mes.porPro.find((x) => x.p.id === meu.id)!;
    const pendente = hoje.aFazer.filter((a) => a.profissionalId === meu.id).reduce((s, a) => s + a.valor, 0);
    return (
      <div className="resumo">
        <div className="cartao-grande">
          <small>Sua parte hoje</small>
          <b>
            <Numero valor={h.parte} formato={reais} />
          </b>
          <span>
            {h.n} {h.n === 1 ? "atendimento fechado" : "atendimentos fechados"} · ainda na agenda {reais(Math.round((pendente * meu.cota) / 100))}
          </span>
        </div>
        <div className="duo">
          <div className="mini-card">
            <small>Sua parte em outubro</small>
            <b>{reais(m.parte)}</b>
            <span>{m.n} atendimentos</span>
          </div>
          <div className="mini-card">
            <small>Ticket médio</small>
            <b>{reais(m.n ? m.valor / m.n : 0)}</b>
            <span>por atendimento</span>
          </div>
        </div>
        <h4 className="ficha-h">Fechados hoje</h4>
        <ul className="historico">
          {hoje.feitos
            .filter((a) => a.profissionalId === meu.id)
            .sort((a, b) => a.inicio - b.inicio)
            .map((a) => (
              <li key={a.id}>
                <span>{String(Math.floor(a.inicio / 60)).padStart(2, "0")}h</span>
                <span>
                  <b>{a.pagamento}</b>
                  <small>sua parte de {reais(a.valor)}</small>
                </span>
                <span>{reais((a.valor * meu.cota) / 100)}</span>
              </li>
            ))}
        </ul>
        <p className="nota nota-icone">
          <Scale size={15} /> Você vê só a sua parte, pelo percentual do seu contrato de parceria ({meu.cota}%). O caixa da casa fica com a dona.
        </p>
      </div>
    );
  }

  if (papel === "recepcao") {
    return (
      <div className="resumo">
        {recepcaoVeCaixa ? (
          <>
            <div className="cartao-grande">
              <small>Caixa do dia</small>
              <b>
                <Numero valor={hoje.caixa} formato={reais} />
              </b>
              <span>{hoje.feitos.length} atendimentos fechados até agora</span>
            </div>
            <Mix mix={hoje.mix} total={hoje.caixa} />
          </>
        ) : (
          <div className="bloqueado">
            <Lock size={20} />
            <p>A dona desligou o caixa do dia para a recepção. A agenda continua igual.</p>
          </div>
        )}
        <p className="nota nota-icone">
          <Lock size={15} /> Repasses aos parceiros e o resumo do mês ficam com a dona.
        </p>
      </div>
    );
  }

  return (
    <div className="resumo">
      <div className="seg" role="tablist" aria-label="Período">
        <button role="tab" aria-selected={periodo === "hoje"} className={periodo === "hoje" ? "on" : ""} onClick={() => setPeriodo("hoje")}>
          Hoje
        </button>
        <button role="tab" aria-selected={periodo === "mes"} className={periodo === "mes" ? "on" : ""} onClick={() => setPeriodo("mes")}>
          Outubro
        </button>
      </div>
      {periodo === "hoje" ? (
        <>
          <div className="tres">
            <div className="tres-item">
              <small>Entrou no caixa</small>
              <b>
                <Numero valor={hoje.caixa} formato={reais} />
              </b>
            </div>
            <div className="tres-item">
              <small>Parte do salão</small>
              <b>
                <Numero valor={hoje.salao} formato={reais} />
              </b>
            </div>
            <div className="tres-item">
              <small>Dos parceiros</small>
              <b>
                <Numero valor={hoje.repasse} formato={reais} />
              </b>
            </div>
          </div>
          <Mix mix={hoje.mix} total={hoje.caixa} />
          <h4 className="ficha-h">Por profissional</h4>
          <ul className="por-pro">
            {hoje.porPro
              .filter((x) => x.n > 0)
              .sort((a, b) => b.valor - a.valor)
              .map((x) => (
                <li key={x.p.id}>
                  <Avatar chave={x.p.foto} nome={x.p.nome} size={28} />
                  <span>
                    <b>{x.p.curto}</b>
                    <small>
                      {x.n} {x.n === 1 ? "atendimento" : "atendimentos"} · {x.p.cota}% dele
                    </small>
                  </span>
                  <span className="valor-duplo">
                    <b>{reais(x.valor)}</b>
                    <small>repasse {reais(x.parte)}</small>
                  </span>
                </li>
              ))}
          </ul>
        </>
      ) : (
        <>
          <div className="tres">
            <div className="tres-item">
              <small>Entrou em outubro</small>
              <b>{reais(mes.total)}</b>
            </div>
            <div className="tres-item">
              <small>Parte do salão</small>
              <b>{reais(mes.salao)}</b>
            </div>
            <div className="tres-item">
              <small>Dos parceiros</small>
              <b>{reais(mes.repasse)}</b>
            </div>
          </div>
          <div className="grafico" aria-label="Caixa por dia em outubro">
            {mes.porDia.map((x) => (
              <span key={x.d} className={x.d === DIA_MES_HOJE ? "hoje" : ""} style={{ height: `${Math.max(6, (x.v / mes.max) * 100)}%` }} title={`${x.d}/10: ${reais(x.v)}`}>
                <i>{x.d}</i>
              </span>
            ))}
          </div>
          <h4 className="ficha-h">Ranking do mês</h4>
          <ul className="por-pro">
            {mes.porPro.map((x) => (
              <li key={x.p.id}>
                <Avatar chave={x.p.foto} nome={x.p.nome} size={28} />
                <span>
                  <b>{x.p.curto}</b>
                  <small>{x.n} atendimentos</small>
                </span>
                <span className="valor-duplo">
                  <b>{reais(x.valor)}</b>
                  <small>repasse {reais(x.parte)}</small>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <label className="interruptor">
        <span>
          <Wallet size={16} /> Recepção vê o caixa do dia
        </span>
        <input type="checkbox" checked={recepcaoVeCaixa} onChange={(e) => setRecepcaoVeCaixa(e.target.checked)} />
        <i aria-hidden="true" />
      </label>
      <p className="nota nota-icone">
        <Scale size={15} /> A parte de cada parceiro não é receita do salão. Por isso o dinheiro do caixa aparece dividido em três, e cada pessoa vê só o pedaço que lhe cabe.
      </p>
    </div>
  );
}

function Mix({ mix, total }: { mix: { k: Pagamento; v: number }[]; total: number }) {
  return (
    <div className="mix">
      <div className="mix-barra">
        {mix.map((m) => (
          <i key={m.k} className={`mix-${m.k === "Cartão" ? "cartao" : m.k.toLowerCase()}`} style={{ width: total ? `${(m.v / total) * 100}%` : "0%" }} />
        ))}
      </div>
      <div className="mix-legenda">
        {mix.map((m) => (
          <span key={m.k}>
            <i className={`mix-${m.k === "Cartão" ? "cartao" : m.k.toLowerCase()}`} /> {m.k} {total ? Math.round((m.v / total) * 100) : 0}%
          </span>
        ))}
      </div>
    </div>
  );
}
