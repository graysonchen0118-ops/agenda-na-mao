"use client";

import { useEffect, useState } from "react";
import { ArrowDown, BellRing, CalendarCheck2, Menu, Scissors, ShieldCheck, Smartphone, WifiOff, X, Scale, Monitor, LockKeyhole } from "lucide-react";
import { SERVICOS } from "@/lib/mock/servicos";
import { USUARIOS, PAPEL_NOME } from "@/lib/mock/equipe";
import { reais, duracao } from "@/lib/format";
import { Simulador } from "./Simulador";
import { Avatar, Foto, Tilt, Toasts } from "./ui";

const NAV = [
  ["#experimente", "Experimente"],
  ["#como", "Como funciona"],
  ["#papeis", "Quem vê o quê"],
  ["#servicos", "Serviços"],
];

export function Site() {
  const [menu, setMenu] = useState(false);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const on = () => setRolou(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // entrance on scroll
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-revela]");
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target as HTMLElement).classList.add("visto")),
      { threshold: 0.12 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header className={`topo ${rolou ? "rolou" : ""}`}>
        <a className="marca" href="#inicio">
          <span className="marca-icone">
            <Scissors size={18} />
          </span>
          Agenda na Mão
        </a>
        <nav className={`nav ${menu ? "aberto" : ""}`} aria-label="Principal">
          {NAV.map(([h, n]) => (
            <a key={h} href={h} onClick={() => setMenu(false)}>
              {n}
            </a>
          ))}
          <a className="btn btn-primario btn-nav" href="#experimente" onClick={() => setMenu(false)}>
            <Smartphone size={16} /> Abrir o app
          </a>
        </nav>
        <button className="icon-btn menu-btn" onClick={() => setMenu(!menu)} aria-label={menu ? "Fechar menu" : "Abrir menu"} aria-expanded={menu}>
          {menu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      <button className={`scrim ${menu ? "show" : ""}`} aria-label="Fechar menu" onClick={() => setMenu(false)} />

      <main className="main" id="inicio">
        <section className="hero">
          <div className="hero-txt">
            <span className="kicker">Para salões, barbearias e clínicas</span>
            <h1>
              A agenda do salão <em>na mão de quem atende</em>
            </h1>
            <p>
              O profissional marca, remarca e fecha o atendimento entre um cliente e outro, com uma mão só. A recepção vê no computador no mesmo instante, e nenhum horário é vendido duas vezes.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primario btn-grande" href="#experimente">
                <Smartphone size={18} /> Experimentar agora
              </a>
              <a className="btn btn-vidro btn-grande" href="#como">
                Como funciona <ArrowDown size={17} />
              </a>
            </div>
            <ul className="hero-selos">
              <li>
                <LockKeyhole size={15} /> Mesmo login do sistema
              </li>
              <li>
                <WifiOff size={15} /> Agenda do dia sem sinal
              </li>
              <li>
                <BellRing size={15} /> Aviso só para quem atende
              </li>
            </ul>
          </div>
        </section>

        <section className="secao" id="experimente">
          <div className="secao-cab" data-revela>
            <span className="kicker">Experimente</span>
            <h2>A equipe do Studio Aroeira, numa terça às 14:20</h2>
            <p>Os nomes, horários e valores são inventados. O celular e o computador abaixo falam com o mesmo sistema, como vai ser no dia a dia: o que muda num aparece no outro.</p>
          </div>
          <Simulador />
        </section>

        <section className="secao" id="como">
          <div className="secao-cab" data-revela>
            <span className="kicker">Como funciona</span>
            <h2>Três decisões que seguram a confiança na agenda</h2>
            <p>Uma agenda que erra uma vez vira caderno de novo no balcão. Estas três regras existem para isso não acontecer.</p>
          </div>
          <div className="cards-3">
            {[
              { k: "barbearia", I: WifiOff, t: "Sem sinal, a agenda aparece mas não muda", d: "O barbeiro no fundo do salão continua vendo o dia, com a hora da última atualização à vista. O que ele não consegue é prometer um horário que a recepção pode ter vendido no mesmo minuto." },
              { k: "recepcao", I: CalendarCheck2, t: "Um horário tem um dono só", d: "O celular e o computador pedem o horário ao mesmo sistema, e é ele quem responde. Quem chega um segundo depois recebe a recusa na hora, com os horários livres logo ao lado." },
              { k: "atendimento", I: BellRing, t: "Cada aviso para quem pode agir", d: "O cancelamento das 16:00 da manicure não toca no celular do barbeiro. Quem recebe só o que é seu não silencia o app, e não perde o aviso que importava." },
            ].map((c, i) => (
              <Tilt key={c.t} className="card-foto" max={5}>
                <div data-revela style={{ transitionDelay: `${i * 90}ms` }}>
                  <Foto chave={c.k} w={720} h={440} alt={c.t} className="card-img" />
                  <div className="card-corpo">
                    <span className="card-icone">
                      <c.I size={18} />
                    </span>
                    <h3>{c.t}</h3>
                    <p>{c.d}</p>
                  </div>
                </div>
              </Tilt>
            ))}
          </div>
        </section>

        <section className="secao" id="papeis">
          <div className="secao-cab" data-revela>
            <span className="kicker">Quem vê o quê</span>
            <h2>O caixa recebe tudo, mas cada um vê só o que é seu</h2>
            <p>No salão parceiro, o dinheiro do corte entra inteiro no caixa e depois se divide. A parte do profissional nem é receita do salão. Por isso o resumo financeiro mostra três números, e cada pessoa enxerga um pedaço.</p>
          </div>
          <div className="papeis">
            {USUARIOS.map((u, i) => (
              <Tilt key={u.id} className="papel-card" max={6}>
                <div data-revela style={{ transitionDelay: `${i * 90}ms` }}>
                  <div className="papel-topo">
                    <Avatar chave={u.foto} nome={u.nome} size={56} />
                    <span>
                      <b>{u.nome}</b>
                      <small>{PAPEL_NOME[u.papel]}</small>
                    </span>
                  </div>
                  <ul>
                    {u.papel === "dona" && (
                      <>
                        <li>
                          <Scale size={15} /> Caixa, parte do salão e repasse de cada parceiro
                        </li>
                        <li>
                          <CalendarCheck2 size={15} /> A agenda de todos, do dia e da semana
                        </li>
                        <li>
                          <ShieldCheck size={15} /> Decide se a recepção vê o caixa
                        </li>
                      </>
                    )}
                    {u.papel === "recepcao" && (
                      <>
                        <li>
                          <Monitor size={15} /> A mesma agenda do computador, no bolso
                        </li>
                        <li>
                          <CalendarCheck2 size={15} /> Encaixes e remarcações de todos
                        </li>
                        <li>
                          <LockKeyhole size={15} /> O caixa do dia, se a dona liberar
                        </li>
                      </>
                    )}
                    {u.papel === "profissional" && (
                      <>
                        <li>
                          <Smartphone size={15} /> A própria agenda e o próximo cliente
                        </li>
                        <li>
                          <Scale size={15} /> Só a própria parte, pelo percentual do contrato
                        </li>
                        <li>
                          <BellRing size={15} /> Avisos só dos próprios horários
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </Tilt>
            ))}
          </div>
        </section>

        <section className="secao" id="servicos">
          <div className="secao-cab" data-revela>
            <span className="kicker">Serviços</span>
            <h2>O cardápio do Studio Aroeira, como aparece no app</h2>
            <p>Duração e preço de cada serviço vêm do cadastro do sistema web. O app mostra, a recepção mantém.</p>
          </div>
          <div className="servicos-grade">
            {SERVICOS.filter((s, i, arr) => arr.findIndex((x) => x.foto === s.foto) === i).map((s, i) => (
              <Tilt key={s.id} className="serv-card" max={7}>
                <div data-revela style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
                  <Foto chave={s.foto} w={560} h={400} alt={s.nome} className="serv-img" />
                  <div className="serv-info">
                    <small>{s.categoria}</small>
                    <b>{s.nome}</b>
                    <span>
                      {duracao(s.duracao)} · {reais(s.preco)}
                    </span>
                  </div>
                </div>
              </Tilt>
            ))}
          </div>
        </section>

        <footer className="rodape">
          <span className="marca">
            <span className="marca-icone">
              <Scissors size={16} />
            </span>
            Agenda na Mão
          </span>
          <span>Studio Aroeira · Vila Madalena, São Paulo</span>
          <span>© 2026 Agenda na Mão · Fotos: Unsplash</span>
        </footer>
      </main>
      <Toasts />
    </>
  );
}
