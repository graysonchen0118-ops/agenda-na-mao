"use client";

import { useState } from "react";
import { Check, LockKeyhole, Scissors } from "lucide-react";
import { useStore } from "@/lib/store";
import { USUARIOS, PAPEL_NOME } from "@/lib/mock/equipe";
import { Avatar, Spinner } from "../ui";

// Same credentials as the web system. The three accounts show what each role sees.
export function Login() {
  const { entrar } = useStore();
  const [escolhido, setEscolhido] = useState("u-rafael");
  const [manter, setManter] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const u = USUARIOS.find((x) => x.id === escolhido)!;
  const email = `${u.curto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()}@studioaroeira`;

  const ir = async () => {
    setEnviando(true);
    await entrar(escolhido, manter);
    setEnviando(false);
  };

  return (
    <div className="login">
      <div className="login-marca">
        <span className="marca-icone">
          <Scissors size={20} />
        </span>
        <div>
          <strong>Agenda na Mão</strong>
          <small>Studio Aroeira</small>
        </div>
      </div>
      <h2>Entrar com o acesso do sistema</h2>
      <p className="login-sub">O mesmo usuário e a mesma senha da recepção. Escolha uma das contas da equipe para ver o que cada pessoa enxerga.</p>
      <div className="login-contas" role="radiogroup" aria-label="Conta">
        {USUARIOS.map((x) => (
          <button key={x.id} role="radio" aria-checked={x.id === escolhido} className={`conta ${x.id === escolhido ? "on" : ""}`} onClick={() => setEscolhido(x.id)}>
            <Avatar chave={x.foto} nome={x.nome} size={40} />
            <span>
              <b>{x.curto}</b>
              <small>{PAPEL_NOME[x.papel]}</small>
            </span>
            {x.id === escolhido && <Check size={16} className="conta-ok" />}
          </button>
        ))}
      </div>
      <p className="login-desc">{u.descricao}</p>
      <label className="campo">
        <span>Usuário</span>
        <input value={email} readOnly aria-label="Usuário" />
      </label>
      <label className="campo">
        <span>Senha</span>
        <input value="••••••••" readOnly type="text" aria-label="Senha" />
      </label>
      <label className="check">
        <input type="checkbox" checked={manter} onChange={(e) => setManter(e.target.checked)} />
        <span className="check-box">{manter && <Check size={13} />}</span>
        Manter conectado neste celular
      </label>
      <button className="btn btn-primario btn-largo" onClick={ir} disabled={enviando}>
        {enviando ? <Spinner /> : <LockKeyhole size={17} />}
        {enviando ? "Conferindo acesso" : "Entrar"}
      </button>
    </div>
  );
}
