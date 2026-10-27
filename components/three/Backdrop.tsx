"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mount, damp, softShadow, labelTexture, cssVar } from "./kit";
import { foto } from "@/lib/photos";
import type { Pulso } from "@/lib/bus";

// One fixed canvas behind the whole page. At the top, the salon itself: the chair, the mirror,
// the reception desk with its screen and the phone in the air, with appointment cards travelling
// between the two doors. Lower down, time slots float at different depths as the camera descends.

const HORARIOS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
const SERVS = ["Corte", "Barba", "Escova", "Coloração", "Manicure", "Pedicure", "Sobrancelha", "Mechas"];

function telaCelular(accent: string, off: boolean) {
  const c = document.createElement("canvas");
  c.width = 360;
  c.height = 720;
  const g = c.getContext("2d")!;
  g.fillStyle = off ? "#e9e3e6" : "#fbf8f6";
  g.fillRect(0, 0, 360, 720);
  g.fillStyle = off ? "#8d8590" : accent;
  g.fillRect(0, 0, 360, 92);
  g.fillStyle = "#fff";
  const fam = getComputedStyle(document.body).fontFamily || "sans-serif";
  g.font = `800 30px ${fam}`;
  g.fillText(off ? "Sem sinal" : "Hoje, Rafael", 24, 58);
  const linhas = [
    ["14:00", "Otávio R.", "#d9a441"],
    ["14:30", "Samuel B.", "#5b8c6e"],
    ["15:00", "Livre", "#cfc7cc"],
    ["15:30", "Felipe C.", "#5b8c6e"],
    ["16:30", "Vinícius C.", "#5b8c6e"],
    ["17:00", "João V.", "#5b8c6e"],
    ["18:00", "Eduardo P.", "#5b8c6e"],
  ];
  linhas.forEach((l, i) => {
    const y = 116 + i * 84;
    g.fillStyle = "#ffffff";
    g.strokeStyle = "#eadfe4";
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(18, y, 324, 70, 14);
    g.fill();
    g.stroke();
    g.fillStyle = off ? "#b8afb5" : l[2];
    g.fillRect(18, y + 10, 6, 50);
    g.fillStyle = "#3a2f3a";
    g.font = `800 24px ${fam}`;
    g.fillText(l[0], 40, y + 44);
    g.font = `600 22px ${fam}`;
    g.fillStyle = l[1] === "Livre" ? "#a39aa1" : "#5a4f59";
    g.fillText(l[1], 130, y + 44);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function telaMonitor(accent: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 300;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f7f3f1";
  g.fillRect(0, 0, 512, 300);
  g.fillStyle = "#2a2230";
  g.fillRect(0, 0, 512, 34);
  const cores = [accent, "#b76e4b", "#5b8c6e", "#4f6d7a", "#a0577a"];
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 7; row++) {
      if ((col * 7 + row * 3) % 5 === 1) continue;
      g.fillStyle = cores[(col + row) % cores.length];
      g.globalAlpha = 0.85;
      g.fillRect(14 + col * 82, 46 + row * 35, 74, 28);
    }
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function Backdrop() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = mount(el);
    if (!st) return;
    el.dataset.pronto = "1";
    const { scene, renderer, small, reduce } = st;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));

    const accent = cssVar("--accent", "#8e3a6c");
    const accent2 = cssVar("--accent-2", "#b76e4b");
    const ink = cssVar("--ink", "#231b27");

    scene.fog = new THREE.Fog(new THREE.Color("#f6f1ee"), 14, 34);
    scene.add(new THREE.HemisphereLight(0xfff6f0, 0xd8cfd6, 1.55));
    const sol = new THREE.DirectionalLight(0xffffff, 1.6);
    sol.position.set(4, 7, 6);
    scene.add(sol);

    const { w, h } = st.size();
    const camera = new THREE.PerspectiveCamera(small ? 48 : 38, w / h, 0.1, 80);
    const salao = new THREE.Group();
    scene.add(salao);
    // desktop: the salon sits to the right of the headline; phones: above the text card
    const enquadrar = (W: number, H: number) => {
      camera.aspect = W / H;
      camera.fov = W < 1024 ? 48 : 38;
      camera.updateProjectionMatrix();
      if (W >= 1024) {
        salao.scale.setScalar(W >= 1400 ? 0.8 : 0.7);
        salao.position.set(W >= 1400 ? 2.75 : 2.2, 0.15, 0);
      } else {
        salao.scale.setScalar(W < 600 ? 0.5 : 0.66);
        salao.position.set(0, W < 600 ? 1.55 : 1.25, 0);
      }
    };
    enquadrar(w, h);
    st.onResize(enquadrar);

    // floor slab
    const mBase = new THREE.MeshLambertMaterial({ color: "#efe6e1" });
    const piso = new THREE.Mesh(new RoundedBoxGeometry(8.4, 0.36, 4.8, 4, 0.14), mBase);
    piso.position.set(0, -1.38, 0);
    salao.add(piso);
    const faixa = new THREE.Mesh(new THREE.BoxGeometry(8.42, 0.06, 4.82), new THREE.MeshLambertMaterial({ color: accent }));
    faixa.position.set(0, -1.56, 0);
    salao.add(faixa);
    const sombraPiso = softShadow(10, 6, 0.22);
    sombraPiso.position.set(0, -1.9, 0);
    salao.add(sombraPiso);

    // barber chair
    const cadeira = new THREE.Group();
    const couro = new THREE.MeshPhongMaterial({ color: accent, shininess: 40 });
    const metal = new THREE.MeshPhongMaterial({ color: "#c9c3c7", shininess: 90, specular: 0x777777 });
    const assento = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.32, 1.1, 3, 0.1), couro);
    assento.position.y = 0.05;
    const encosto = new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.3, 0.24, 3, 0.1), couro);
    encosto.position.set(0, 0.78, -0.48);
    encosto.rotation.x = -0.12;
    const apoio = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.3, 0.2, 3, 0.08), couro);
    apoio.position.set(0, 1.58, -0.58);
    const bracoE = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.14, 1.0, 2, 0.05), metal);
    bracoE.position.set(-0.66, 0.36, -0.02);
    const bracoD = bracoE.clone();
    bracoD.position.x = 0.66;
    const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.95, 18), metal);
    coluna.position.y = -0.6;
    const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.1, 28), metal);
    pe.position.y = -1.12;
    const descanso = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.08, 0.34, 2, 0.03), metal);
    descanso.position.set(0, -0.48, 0.74);
    cadeira.add(assento, encosto, apoio, bracoE, bracoD, coluna, pe, descanso);
    cadeira.position.set(-2.1, 0, 0.6);
    cadeira.rotation.y = 0.45;
    salao.add(cadeira);
    const sombraCadeira = softShadow(2.2, 2.2, 0.32);
    sombraCadeira.position.set(-2.1, -1.18, 0.6);
    salao.add(sombraCadeira);

    // mirror with a real salon photo
    const espelho = new THREE.Group();
    const moldura = new THREE.Mesh(new RoundedBoxGeometry(2.1, 2.9, 0.12, 3, 0.05), new THREE.MeshPhongMaterial({ color: "#d8b38d", shininess: 60 }));
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const fotoMat = new THREE.MeshBasicMaterial({ color: "#d9cdd3" });
    loader.load(foto("salao", 640, 880), (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      fotoMat.map = t;
      fotoMat.color.set("#ffffff");
      fotoMat.needsUpdate = true;
    });
    const vidro = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 2.66), fotoMat);
    vidro.position.z = 0.065;
    espelho.add(moldura, vidro);
    espelho.position.set(-2.55, 0.75, -1.8);
    espelho.rotation.y = 0.32;
    salao.add(espelho);

    // reception desk with the web system on screen
    const balcao = new THREE.Group();
    const madeira = new THREE.MeshLambertMaterial({ color: "#c49a74" });
    const tampo = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.12, 1.1, 2, 0.04), new THREE.MeshLambertMaterial({ color: "#f7f2ee" }));
    tampo.position.y = 0.05;
    const corpo = new THREE.Mesh(new RoundedBoxGeometry(2.5, 1.1, 1.0, 3, 0.06), madeira);
    corpo.position.y = -0.52;
    const frente = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.08, 1.02), new THREE.MeshLambertMaterial({ color: accent2 }));
    frente.position.y = -0.2;
    const telaMon = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.8), new THREE.MeshBasicMaterial({ map: telaMonitor(accent) }));
    telaMon.position.set(0, 0.68, -0.18);
    const caixaMon = new THREE.Mesh(new RoundedBoxGeometry(1.46, 0.9, 0.06, 2, 0.02), new THREE.MeshPhongMaterial({ color: ink }));
    caixaMon.position.set(0, 0.68, -0.22);
    const hasteMon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 10), metal);
    hasteMon.position.set(0, 0.22, -0.22);
    balcao.add(tampo, corpo, frente, caixaMon, telaMon, hasteMon);
    balcao.position.set(2.35, -0.15, 0.3);
    balcao.rotation.y = -0.35;
    salao.add(balcao);
    const sombraBalcao = softShadow(3.2, 1.8, 0.3);
    sombraBalcao.position.set(2.35, -1.18, 0.3);
    salao.add(sombraBalcao);

    // the phone in the air
    const celular = new THREE.Group();
    const corpoCel = new THREE.Mesh(new RoundedBoxGeometry(0.98, 1.96, 0.1, 4, 0.12), new THREE.MeshPhongMaterial({ color: ink, shininess: 80 }));
    const matTela = new THREE.MeshBasicMaterial({ map: telaCelular(accent, false) });
    const telaCel = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.76), matTela);
    telaCel.position.z = 0.052;
    const brilho = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.3), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false }));
    brilho.position.z = -0.08;
    celular.add(brilho, corpoCel, telaCel);
    celular.position.set(0.1, 1.05, 1.0);
    salao.add(celular);
    const telaOn = matTela.map!;
    const telaOff = telaCelular(accent, true);
    const sombraCel = softShadow(1.4, 0.8, 0.22);
    sombraCel.position.set(0.1, -1.18, 1.0);
    salao.add(sombraCel);

    // appointment cards travelling between the two doors
    const pontoMon = new THREE.Vector3(2.2, 0.75, 0.4);
    const pontoCel = new THREE.Vector3(0.1, 1.05, 1.05);
    const ida = new THREE.QuadraticBezierCurve3(pontoMon, new THREE.Vector3(1.15, 2.5, 1.6), pontoCel);
    const volta = new THREE.QuadraticBezierCurve3(pontoCel, new THREE.Vector3(1.15, -0.1, 2.2), pontoMon);
    interface Cartao { mesh: THREE.Mesh; t: number; rota: THREE.QuadraticBezierCurve3; vel: number; }
    const cartoes: Cartao[] = [];
    const geoCartao = new THREE.PlaneGeometry(0.62, 0.18);
    for (let i = 0; i < (small ? 4 : 6); i++) {
      const tex = labelTexture(`${HORARIOS[(i * 3 + 8) % HORARIOS.length]}  ${SERVS[i % SERVS.length]}`, { bg: "#ffffff", color: "#3a2f3a", w: 300, h: 86, size: 30, border: i % 2 ? accent2 : accent });
      const mesh = new THREE.Mesh(geoCartao, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      mesh.renderOrder = 3;
      salao.add(mesh);
      cartoes.push({ mesh, t: i / 6, rota: i % 2 ? volta : ida, vel: 0.09 + (i % 3) * 0.015 });
    }

    // event cards: green when the system confirms, red when it refuses
    const geoEvento = new THREE.PlaneGeometry(0.9, 0.26);
    const texOk = labelTexture("Confirmado", { bg: "#2f8a5b", color: "#ffffff", w: 300, h: 86, size: 32 });
    const texNao = labelTexture("Horário ocupado", { bg: "#c2414b", color: "#ffffff", w: 360, h: 86, size: 32 });
    const texSem = labelTexture("Sem sinal", { bg: "#6d6470", color: "#ffffff", w: 300, h: 86, size: 32 });
    const evento = new THREE.Mesh(geoEvento, new THREE.MeshBasicMaterial({ map: texOk, transparent: true, opacity: 0, depthWrite: false }));
    evento.renderOrder = 4;
    salao.add(evento);
    let eventoT = 1;
    let eventoTipo: "ok" | "nao" = "ok";
    let tremor = 0;
    let brilhoAlvo = 0;
    let offline = false;
    const selo = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.23), new THREE.MeshBasicMaterial({ map: texSem, transparent: true, opacity: 0, depthWrite: false }));
    selo.position.set(0, 1.18, 0.09);
    selo.renderOrder = 5;
    celular.add(selo);

    const onPulso = (e: Event) => {
      const tipo = (e as CustomEvent<{ tipo: Pulso }>).detail.tipo;
      if (tipo === "confirmado" || tipo === "remarcado" || tipo === "status" || tipo === "sinalVoltou" || tipo === "login") {
        eventoTipo = "ok";
        (evento.material as THREE.MeshBasicMaterial).map = texOk;
        eventoT = 0;
        brilhoAlvo = 0.55;
      }
      if (tipo === "recusado") {
        eventoTipo = "nao";
        (evento.material as THREE.MeshBasicMaterial).map = texNao;
        eventoT = 0;
        tremor = 1;
      }
      if (tipo === "cancelado") {
        brilhoAlvo = 0.3;
        tremor = 0.4;
      }
      if (tipo === "semSinal") {
        offline = true;
        matTela.map = telaOff;
        matTela.needsUpdate = true;
      }
      if (tipo === "sinalVoltou") {
        offline = false;
        matTela.map = telaOn;
        matTela.needsUpdate = true;
      }
    };
    window.addEventListener("agenda:pulso", onPulso);

    // floating time slots and service photos further down the page
    const camadas: { m: THREE.Mesh; base: THREE.Vector3; fase: number; giro: number }[] = [];
    const geoSlot = new THREE.PlaneGeometry(1.15, 0.36);
    const nSlots = small ? 14 : 26;
    for (let i = 0; i < nSlots; i++) {
      const livre = i % 4 === 2;
      const tex = labelTexture(livre ? `${HORARIOS[i % HORARIOS.length]}  livre` : `${HORARIOS[i % HORARIOS.length]}  ${SERVS[(i * 5) % SERVS.length]}`, {
        bg: livre ? "#f4eef1" : "#ffffff",
        color: livre ? "#8d7f89" : "#3a2f3a",
        w: 320,
        h: 100,
        size: 32,
        border: livre ? "#d6c8d0" : i % 3 ? accent : accent2,
      });
      const m = new THREE.Mesh(geoSlot, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.92 }));
      const lado = i % 2 ? 1 : -1;
      const base = new THREE.Vector3(lado * (3.2 + (i * 1.37) % 4.2), -5 - i * 1.85, -2 - ((i * 2.3) % 7));
      m.position.copy(base);
      m.rotation.y = -lado * 0.35;
      scene.add(m);
      camadas.push({ m, base, fase: i * 0.7, giro: lado });
    }
    const chavesFoto = ["barbearia", "corteFem", "manicure", "coloracao", "barba", "limpeza"];
    const nFotos = small ? 3 : 6;
    for (let i = 0; i < nFotos; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: "#e8dfe3", transparent: true, opacity: 0.95 });
      loader.load(foto(chavesFoto[i], 480, 360), (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        mat.map = t;
        mat.color.set("#ffffff");
        mat.needsUpdate = true;
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), mat);
      const lado = i % 2 ? -1 : 1;
      const base = new THREE.Vector3(lado * (5.4 + (i % 3) * 0.6), -9 - i * 7.5, -5 - (i % 3) * 1.6);
      m.position.copy(base);
      m.rotation.y = -lado * 0.42;
      scene.add(m);
      camadas.push({ m, base, fase: i * 1.3, giro: lado });
    }

    // camera follows scroll and pointer
    const alvo = { x: 0, y: 0 };
    const cam = { x: 0, y: 1.2, desce: 0 };
    const onMove = (e: PointerEvent) => {
      alvo.x = (e.clientX / window.innerWidth - 0.5) * 2;
      alvo.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const posBase = new THREE.Vector3();
    st.loop((dt, t) => {
      const vh = window.innerHeight || 800;
      const p = window.scrollY / vh;
      cam.desce = damp(cam.desce, p, 5, dt);
      cam.x = damp(cam.x, alvo.x * 0.55, 3, dt);
      cam.y = damp(cam.y, -alvo.y * 0.3, 3, dt);
      camera.position.set(cam.x, 1.5 + cam.y - cam.desce * 5.2, 8.6 - Math.min(cam.desce, 1) * 1.4);
      camera.lookAt(cam.x * 0.25, 0.35 - cam.desce * 5.4, 0);

      // the salon turns a little as the visitor leaves the hero
      salao.rotation.y = damp(salao.rotation.y, -0.12 + Math.min(cam.desce, 1.4) * 0.38, 4, dt);

      const anda = reduce ? 0 : dt;
      const tempo = reduce ? 0 : t;
      for (const c of cartoes) {
        if (!offline) c.t = (c.t + anda * c.vel) % 1;
        c.rota.getPoint(c.t, posBase);
        c.mesh.position.copy(posBase);
        c.mesh.lookAt(camera.position);
        const borda = Math.min(c.t, 1 - c.t) * 8;
        (c.mesh.material as THREE.MeshBasicMaterial).opacity = (offline ? 0.25 : 1) * Math.min(1, borda);
      }

      celular.position.y = 1.05 + Math.sin(tempo * 1.2) * 0.06;
      celular.rotation.y = -0.18 + Math.sin(tempo * 0.6) * 0.06 + (tremor > 0 ? Math.sin(t * 60) * 0.05 * tremor : 0);
      tremor = Math.max(0, tremor - dt * 1.8);
      const bm = brilho.material as THREE.MeshBasicMaterial;
      bm.opacity = damp(bm.opacity, brilhoAlvo, 6, dt);
      brilhoAlvo = Math.max(0, brilhoAlvo - dt * 0.7);
      const sm = selo.material as THREE.MeshBasicMaterial;
      sm.opacity = damp(sm.opacity, offline ? 1 : 0, 6, dt);

      if (eventoT < 1) {
        eventoT = Math.min(1, eventoT + dt * 0.55);
        const rota = eventoTipo === "ok" ? ida : volta;
        rota.getPoint(eventoTipo === "ok" ? Math.min(1, eventoT * 1.4) : Math.min(1, eventoT * 1.2), posBase);
        evento.position.copy(posBase);
        evento.position.z += 0.2;
        evento.lookAt(camera.position);
        const s = 1 + Math.sin(eventoT * Math.PI) * 0.25;
        evento.scale.set(s, s, s);
        (evento.material as THREE.MeshBasicMaterial).opacity = Math.sin(eventoT * Math.PI);
      } else (evento.material as THREE.MeshBasicMaterial).opacity = 0;

      for (const c of camadas) {
        c.m.position.y = c.base.y + Math.sin(tempo * 0.5 + c.fase) * 0.18;
        c.m.rotation.y = -c.giro * 0.35 + Math.sin(tempo * 0.3 + c.fase) * 0.08 + cam.x * 0.06;
      }

      st.renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("agenda:pulso", onPulso);
      window.removeEventListener("pointermove", onMove);
      telaOff.dispose();
      texOk.dispose();
      texNao.dispose();
      texSem.dispose();
      st.dispose();
    };
  }, []);

  return <div ref={ref} className="cena-fundo" aria-hidden="true" />;
}
