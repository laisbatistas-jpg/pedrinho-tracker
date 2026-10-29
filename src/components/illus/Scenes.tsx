/**
 * Ilustrações em SVG (desenhadas por código) para os passos de cada estímulo.
 * Poucas cenas parametrizáveis (de bruços, de costas, sentado, rosto a rosto, espelho, passeio, banho)
 * e objetos que se encaixam nelas: a mesma cena serve para várias brincadeiras.
 */
import type { ReactNode } from "react";

const SKIN = "#f7c9a3";
const SKIN_D = "#e9a883";
const ADULT = "#d9966b";
const ONESIE = "#a78bfa";
const PANTS = "#7b8cde";
const SHIRT = "#ff8fab";
const INK = "#3b2a4a";
const CHEEK = "#ff9e9e";
const MINT = "#8fd3c4";

/* ---------- extras (setas, notas, balões de fala...) ---------- */

export type Ex =
  | { k: "notes" | "spark" | "bubbles" | "motion" | "heart"; x: number; y: number; s?: number }
  | { k: "say"; x: number; y: number; text: string }
  | { k: "arrow"; x1: number; y1: number; x2: number; y2: number };

function Star({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -9 L2.6 -2.8 L9 -2.2 L4.1 2.2 L5.6 8.6 L0 5.2 L-5.6 8.6 L-4.1 2.2 L-9 -2.2 L-2.6 -2.8 Z"
      fill="#ffd166"
      stroke="#f4a62a"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  );
}

function Over({ x = [] }: { x?: Ex[] }) {
  return (
    <>
      {x.map((e, i) => {
        if (e.k === "spark") return <Star key={i} x={e.x} y={e.y} s={e.s ?? 1} />;
        if (e.k === "heart")
          return (
            <path
              key={i}
              transform={`translate(${e.x} ${e.y}) scale(${e.s ?? 1})`}
              d="M0 6 C-12 -3 -6 -11 0 -5 C6 -11 12 -3 0 6Z"
              fill="#ff7a8a"
            />
          );
        if (e.k === "notes")
          return (
            <g key={i} transform={`translate(${e.x} ${e.y}) scale(${e.s ?? 1})`} fill="#7c5cd6" stroke="#7c5cd6" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="0" cy="10" r="4" stroke="none" />
              <path d="M4 10 V-8 L14 -6" fill="none" />
              <circle cx="12" cy="6" r="4" stroke="none" />
              <path d="M16 6 V-10" fill="none" />
            </g>
          );
        if (e.k === "bubbles")
          return (
            <g key={i} transform={`translate(${e.x} ${e.y}) scale(${e.s ?? 1})`} fill="#e6f6ff" fillOpacity=".7" stroke="#8cc8ee" strokeWidth="1.6">
              <circle cx="0" cy="0" r="9" />
              <circle cx="22" cy="-14" r="6" />
              <circle cx="-4" cy="-26" r="5" />
              <circle cx="30" cy="8" r="4" />
              <circle cx="14" cy="-34" r="7" />
            </g>
          );
        if (e.k === "motion")
          return (
            <g key={i} transform={`translate(${e.x} ${e.y}) scale(${e.s ?? 1})`} stroke="#9a86d9" strokeWidth="2.4" strokeLinecap="round" fill="none">
              <path d="M0 0 q-5 6 0 12" />
              <path d="M8 -4 q-6 10 0 20" />
              <path d="M16 0 q-5 6 0 12" />
            </g>
          );
        if (e.k === "say") {
          const w = Math.max(34, e.text.length * 6.4 + 16);
          return (
            <g key={i} transform={`translate(${e.x} ${e.y})`}>
              <rect x={-w / 2} y="-12" width={w} height="22" rx="11" fill="#fff" stroke="#cdbdf5" strokeWidth="1.5" />
              <path d="M-4 9 l3 8 l6 -8" fill="#fff" stroke="#cdbdf5" strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="-6" y="7" width="14" height="4" fill="#fff" />
              <text x="0" y="3.5" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK} fontFamily="system-ui, sans-serif">
                {e.text}
              </text>
            </g>
          );
        }
        if (e.k !== "arrow") return null;
        const ang = Math.atan2(e.y2 - e.y1, e.x2 - e.x1);
        const hx = e.x2 - Math.cos(ang) * 1;
        const hy = e.y2 - Math.sin(ang) * 1;
        const p = (a: number) => `${hx - Math.cos(ang + a) * 9},${hy - Math.sin(ang + a) * 9}`;
        return (
          <g key={i} stroke="#7c5cd6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d={`M${e.x1} ${e.y1} L${e.x2} ${e.y2}`} strokeDasharray="1 7" />
            <path d={`M${p(0.5)} L${hx},${hy} L${p(-0.5)}`} />
          </g>
        );
      })}
    </>
  );
}

function Frame({ children, bg = "#f1ebff" }: { children: ReactNode; bg?: string }) {
  return (
    <svg viewBox="0 0 240 170" role="img" className="w-full h-auto block" style={{ background: bg }}>
      {children}
    </svg>
  );
}

/* ---------- rostos e objetos ---------- */

type Mouth = "calm" | "smile" | "silly" | "open";

function Face({ cx, cy, r, mouth = "calm", dx = 0, hair = true, eyes = "open" }: { cx: number; cy: number; r: number; mouth?: Mouth; dx?: number; hair?: boolean; eyes?: "open" | "closed" }) {
  const k = r / 30;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${k})`}>
      <circle cx="0" cy="0" r="30" fill={SKIN} />
      {hair && <path d="M-6 -30 q8 -12 16 -2 q-4 3 -8 3" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />}
      {eyes === "open" ? (
        <>
          <circle cx={-11 + dx} cy="-3" r="3" fill={INK} />
          <circle cx={11 + dx} cy="-3" r="3" fill={INK} />
        </>
      ) : (
        <>
          <path d="M-15 -3 q4 4 8 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M7 -3 q4 4 8 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      <circle cx="-19" cy="7" r="5" fill={CHEEK} opacity=".6" />
      <circle cx="19" cy="7" r="5" fill={CHEEK} opacity=".6" />
      {mouth === "calm" && <path d="M-6 11 q6 3 12 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />}
      {mouth === "smile" && <path d="M-10 9 q10 12 20 0" fill="#fff" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
      {mouth === "silly" && <ellipse cx="0" cy="13" rx="6" ry="7.5" fill="#c4506b" stroke={INK} strokeWidth="2" />}
      {mouth === "open" && <path d="M-8 9 q8 14 16 0 z" fill="#c4506b" stroke={INK} strokeWidth="2" strokeLinejoin="round" />}
    </g>
  );
}

function Rattle({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x="-2.5" y="4" width="5" height="17" rx="2.5" fill="#ffd166" />
      <circle cx="0" cy="23" r="5" fill="none" stroke="#ffd166" strokeWidth="3" />
      <circle cx="0" cy="-2" r="11" fill="#ff7a8a" />
      <circle cx="-4" cy="-6" r="3" fill="#fff" opacity=".6" />
      <path d="M-9 0 Q0 6 9 0" stroke="#e85a70" strokeWidth="2" fill="none" />
    </g>
  );
}

function Ball({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#5bc0eb" />
      <path d={`M${-r} 0 Q0 ${r * 0.6} ${r} 0`} stroke="#fff" strokeWidth="2.4" fill="none" />
      <circle cx={-r * 0.35} cy={-r * 0.4} r={r * 0.2} fill="#fff" opacity=".6" />
    </g>
  );
}

function Blocks({ x, y, fallen = false }: { x: number; y: number; fallen?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {fallen ? (
        <>
          <rect x="-26" y="-14" width="16" height="16" rx="3" fill="#ff7a8a" transform="rotate(-14 -18 -6)" />
          <rect x="-6" y="-16" width="16" height="16" rx="3" fill="#ffd166" transform="rotate(8 2 -8)" />
          <rect x="14" y="-14" width="16" height="16" rx="3" fill="#5bc0eb" transform="rotate(-6 22 -6)" />
        </>
      ) : (
        <>
          <rect x="-8" y="-16" width="16" height="16" rx="3" fill="#ff7a8a" />
          <rect x="-8" y="-32" width="16" height="16" rx="3" fill="#ffd166" />
          <rect x="-8" y="-48" width="16" height="16" rx="3" fill="#5bc0eb" />
        </>
      )}
    </g>
  );
}

function Book({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-30 -14 L0 -8 L30 -14 L30 14 L0 20 L-30 14Z" fill="#fff" stroke="#cdbdf5" strokeWidth="2" strokeLinejoin="round" />
      <path d="M0 -8 V20" stroke="#cdbdf5" strokeWidth="2" />
      <circle cx="-15" cy="2" r="7" fill="#ff7a8a" />
      <path d="M8 10 L16 -4 L24 10Z" fill="#5bc0eb" />
    </g>
  );
}

function Teether({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="10" fill="none" stroke="#5bc0eb" strokeWidth="6" />
      <circle cx="-10" cy="0" r="4" fill="#ffd166" />
      <circle cx="10" cy="0" r="4" fill="#ff7a8a" />
    </g>
  );
}

function Crinkle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-22 -8 L-12 -16 L-4 -8 L6 -16 L14 -8 L24 -14 L22 8 L12 16 L4 8 L-6 16 L-14 8 L-24 12Z" fill="#cfd8e8" stroke="#9fb0cc" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-12 -4 L-6 4 M4 -6 L10 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Swatch({ x, y, c, w = 26 }: { x: number; y: number; c: string; w?: number }) {
  return <rect x={x} y={y} width={w} height={w} rx="5" fill={c} stroke="#fff" strokeWidth="2" />;
}

function Duck({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="6" rx="14" ry="9" fill="#ffd166" />
      <circle cx="8" cy="-6" r="8" fill="#ffd166" />
      <path d="M14 -6 l8 2 l-8 3z" fill="#ff9f43" />
      <circle cx="10" cy="-8" r="1.6" fill={INK} />
    </g>
  );
}

function Cloth({ x, y, w = 60, h = 34 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <path
      d={`M${x - w / 2} ${y + h} Q${x - w / 2} ${y} ${x} ${y} Q${x + w / 2} ${y} ${x + w / 2} ${y + h} Q${x + w / 4} ${y + h - 6} ${x} ${y + h} Q${x - w / 4} ${y + h - 6} ${x - w / 2} ${y + h}Z`}
      fill="#ffb86b"
      stroke="#f0953a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  );
}

function Hand({ x, y, from, s = 1 }: { x: number; y: number; from: [number, number]; s?: number }) {
  return (
    <g>
      <path d={`M${from[0]} ${from[1]} L${x} ${y}`} stroke={ADULT} strokeWidth={14 * s} strokeLinecap="round" />
      <circle cx={x} cy={y} r={9 * s} fill={ADULT} />
    </g>
  );
}

/* ---------- cena: bebê de bruços (de lado) ---------- */

export type TummyProps = {
  head?: "low" | "up" | "high";
  reach?: boolean;
  toy?: "none" | "near" | "far" | "ball" | "rattle";
  toyX?: number;
  hand?: boolean;
  /** brinquedos espalhados ao redor */
  around?: boolean;
  /** bebê girando de lado */
  roll?: boolean;
  x?: Ex[];
};

export function Tummy({ head = "up", reach = false, toy = "none", toyX, hand = false, around = false, roll = false, x }: TummyProps) {
  const headY = head === "low" ? 106 : head === "up" ? 94 : 82;
  const chestY = head === "low" ? 112 : head === "up" ? 106 : 100;
  const hx = 80;
  const tX = toyX ?? (toy === "far" ? 24 : 44);
  const toyY = 112;
  return (
    <Frame>
      <circle cx="205" cy="34" r="16" fill="#ffe9a8" opacity=".8" />
      <rect x="8" y="128" width="224" height="26" rx="13" fill={MINT} />
      <rect x="8" y="128" width="224" height="8" rx="4" fill="#a7e2d5" />
      {around && (
        <>
          <Ball x={30} y={118} r={9} />
          <Blocks x={196} y={126} fallen />
          <Rattle x={20} y={90} s={0.8} rot={-30} />
        </>
      )}
      <g transform={roll ? "rotate(-9 140 120)" : undefined}>
        <rect x="176" y="114" width="34" height="13" rx="6.5" fill={SKIN} />
        <circle cx="209" cy="124" r="7" fill={SKIN_D} />
        <circle cx="178" cy="114" r="16" fill="#fff" stroke="#e5ddf7" strokeWidth="1.5" />
        <ellipse cx="140" cy="116" rx="44" ry="17" fill={ONESIE} />
        <ellipse cx="104" cy={chestY + 4} rx="26" ry="20" fill={ONESIE} />
        {reach ? (
          <>
            <path d={`M96 ${chestY + 12} L72 124`} stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
            <circle cx="68" cy="125" r="6.5" fill={SKIN} />
            <path d={`M98 ${chestY + 8} L${tX + 12} ${toyY + 6}`} stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
            <circle cx={tX + 8} cy={toyY + 6} r="7" fill={SKIN} />
          </>
        ) : (
          <>
            <rect x="62" y="119" width="44" height="10" rx="5" fill={SKIN} />
            <circle cx="62" cy="124" r="6.5" fill={SKIN} />
          </>
        )}
        <circle cx={hx} cy={headY} r="22" fill={SKIN} />
        <path d={`M${hx - 6} ${headY - 21} q6 -9 13 -2 q-3 3 -6 4`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx={hx - 10} cy={headY - 2} r="2.4" fill={INK} />
        <circle cx={hx - 15} cy={headY + 7} r="4.2" fill={CHEEK} opacity=".65" />
        <path d={`M${hx - 18} ${headY + 9} q5 6 10 1`} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <circle cx={hx + 18} cy={headY + 2} r="5" fill={SKIN_D} />
      </g>
      {toy === "ball" && <Ball x={tX} y={toyY + 2} />}
      {(toy === "near" || toy === "far" || toy === "rattle") && <Rattle x={tX} y={toyY - 8} />}
      {hand && toy !== "none" && <Hand x={tX + 6} y={toyY - 30} from={[tX + 40, 0]} />}
      <Over x={x} />
    </Frame>
  );
}

/* ---------- cena: bebê de costas ---------- */

export type LieProps = {
  arms?: "rest" | "up" | "open" | "hold";
  kick?: boolean;
  mouth?: Mouth;
  lookDx?: number;
  mobile?: boolean;
  /** mão do adulto segurando um brinquedo sobre o bebê */
  holdX?: number;
  toySide?: "left" | "right";
  rattleHand?: boolean;
  toyFoot?: boolean;
  x?: Ex[];
};

export function Lie({ arms = "rest", kick = false, mouth = "smile", lookDx = 0, mobile = false, holdX, toySide, rattleHand = false, toyFoot = false, x }: LieProps) {
  const hx = 76;
  const hy = 104;
  return (
    <Frame>
      <rect x="8" y="132" width="224" height="24" rx="12" fill={MINT} />
      <rect x="8" y="132" width="224" height="8" rx="4" fill="#a7e2d5" />
      {mobile && (
        <g>
          <path d="M30 14 Q120 -6 210 14" fill="none" stroke="#c9b6f5" strokeWidth="5" strokeLinecap="round" />
          <path d="M70 6 V38 M120 2 V46 M170 6 V38" stroke="#c9b6f5" strokeWidth="2" />
          <circle cx="70" cy="46" r="9" fill="#ff7a8a" />
          <g transform="translate(120 56)">
            <Star x={0} y={0} s={1.5} />
          </g>
          <path d="M170 38 a10 10 0 1 0 10 14 a8 8 0 1 1 -10 -14z" fill="#5bc0eb" />
        </g>
      )}
      {/* pernas */}
      <path d={kick ? "M176 116 L200 98 L194 78" : "M176 116 L202 112 L208 100"} fill="none" stroke={SKIN} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M178 122 L206 122 L214 112" fill="none" stroke={SKIN} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="170" cy="116" r="16" fill="#fff" stroke="#e5ddf7" strokeWidth="1.5" />
      <ellipse cx="136" cy="116" rx="40" ry="17" fill={ONESIE} />
      <ellipse cx="104" cy="112" rx="22" ry="16" fill={ONESIE} />
      {/* braços */}
      {arms === "rest" && <path d="M100 114 L128 124" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />}
      {arms === "open" && (
        <>
          <path d="M98 108 L84 80" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />
          <circle cx="82" cy="76" r="6.5" fill={SKIN} />
          <path d="M112 110 L146 90" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />
          <circle cx="150" cy="88" r="6.5" fill={SKIN} />
        </>
      )}
      {arms === "up" && (
        <>
          <path d="M98 108 L96 72" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />
          <circle cx="96" cy="68" r="6.5" fill={SKIN} />
          <path d="M112 106 L122 70" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />
          <circle cx="123" cy="66" r="6.5" fill={SKIN} />
        </>
      )}
      {arms === "hold" && (
        <>
          <path d="M100 114 L128 124" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />
          <path d="M112 106 L122 76" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />
          <circle cx="123" cy="72" r="6.5" fill={SKIN} />
        </>
      )}
      {rattleHand && <Rattle x={124} y={58} s={0.85} />}
      {toyFoot && <Rattle x={192} y={56} s={0.8} rot={160} />}
      <Face cx={hx} cy={hy} r={24} mouth={mouth} dx={lookDx} />
      {toySide && <Ball x={toySide === "left" ? 22 : 214} y={124} r={9} />}
      {holdX !== undefined && (
        <g>
          <Hand x={holdX} y={42} from={[holdX + 30, -6]} />
          <Rattle x={holdX - 2} y={52} s={0.9} />
        </g>
      )}
      <Over x={x} />
    </Frame>
  );
}

/* ---------- cena: bebê sentado (de frente) ---------- */

export type SitProps = {
  mouth?: Mouth;
  dx?: number;
  /** objeto nas mãos */
  hold?: "none" | "rattle" | "book" | "crinkle" | "teether";
  /** no chão, à frente */
  floor?: "none" | "ball" | "blocks" | "blocksFallen" | "cloth" | "clothToy" | "swatches" | "toys" | "rattle";
  /** adulto: apoio e colo */
  adult?: "none" | "hands" | "lap";
  /** com o colo, também mostra as mãos do adulto na cintura */
  adult2?: "hands";
  cushions?: boolean;
  window?: boolean;
  lean?: boolean;
  x?: Ex[];
};

export function Sit({ mouth = "smile", dx = 0, hold = "none", floor = "none", adult = "none", adult2, cushions = false, window: win = false, lean = false, x }: SitProps) {
  const cx = 120;
  return (
    <Frame bg={win ? "#eaf4ff" : "#f1ebff"}>
      {win && (
        <g>
          <rect x="130" y="14" width="96" height="86" rx="8" fill="#bfe3ff" stroke="#fff" strokeWidth="6" />
          <path d="M178 14 V100 M130 57 H226" stroke="#fff" strokeWidth="4" />
          <circle cx="204" cy="34" r="9" fill="#ffe9a8" />
          <path d="M146 100 q8 -16 16 0z" fill="#7bc77b" />
        </g>
      )}
      <rect x="0" y="150" width="240" height="20" fill="#e5dafa" />
      {adult === "lap" && <rect x="30" y="134" width="180" height="44" rx="20" fill={PANTS} />}
      {cushions && (
        <>
          <ellipse cx="76" cy="134" rx="26" ry="20" fill="#ffb86b" />
          <ellipse cx="166" cy="134" rx="26" ry="20" fill="#ffb86b" />
          <ellipse cx="120" cy="160" rx="62" ry="12" fill="#ffd9a8" />
        </>
      )}
      <g transform={lean ? `rotate(5 ${cx} 150)` : undefined}>
        <ellipse cx="94" cy="150" rx="15" ry="8" fill={SKIN} />
        <ellipse cx="146" cy="150" rx="15" ry="8" fill={SKIN} />
        <circle cx="82" cy="148" r="6" fill={SKIN_D} />
        <circle cx="158" cy="148" r="6" fill={SKIN_D} />
        <ellipse cx={cx} cy="128" rx="34" ry="26" fill={ONESIE} />
        {hold === "none" ? (
          <>
            <path d="M92 112 L80 134" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
            <circle cx="79" cy="137" r="6.5" fill={SKIN} />
            <path d="M148 112 L160 134" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
            <circle cx="161" cy="137" r="6.5" fill={SKIN} />
          </>
        ) : (
          <>
            <path d="M92 112 L112 126" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
            <path d="M148 112 L128 126" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
          </>
        )}
        <Face cx={cx} cy={80} r={31} mouth={mouth} dx={dx} />
        {hold === "rattle" && <Rattle x={cx} y={116} s={0.9} />}
        {hold === "book" && <Book x={cx} y={124} s={0.9} />}
        {hold === "crinkle" && <Crinkle x={cx} y={122} s={0.9} />}
        {hold === "teether" && <Teether x={cx + 4} y={108} s={0.9} />}
        {hold !== "none" && (
          <>
            <circle cx="112" cy="127" r="6.5" fill={SKIN} />
            <circle cx="128" cy="127" r="6.5" fill={SKIN} />
          </>
        )}
      </g>
      {(adult === "hands" || adult2 === "hands" || adult === "lap") && (
        <>
          <circle cx="84" cy="130" r="9" fill={ADULT} />
          <circle cx="156" cy="130" r="9" fill={ADULT} />
        </>
      )}
      {floor === "ball" && <Ball x={192} y={146} />}
      {floor === "blocks" && <Blocks x={190} y={162} />}
      {floor === "blocksFallen" && <Blocks x={190} y={162} fallen />}
      {floor === "cloth" && <Cloth x={188} y={132} />}
      {floor === "clothToy" && (
        <>
          <Cloth x={188} y={134} w={50} h={28} />
          <Rattle x={170} y={150} s={0.6} rot={-70} />
        </>
      )}
      {floor === "swatches" && (
        <>
          <Swatch x={38} y={140} c="#ffb3c6" w={24} />
          <Swatch x={70} y={140} c="#b5e0b0" w={24} />
          <Swatch x={168} y={140} c="#ffd9a0" w={24} />
          <Swatch x={200} y={140} c="#a9d3f5" w={24} />
        </>
      )}
      {floor === "toys" && (
        <>
          <Ball x={40} y={158} r={9} />
          <Rattle x={204} y={154} s={0.7} rot={-70} />
          <Blocks x={30} y={140} fallen />
        </>
      )}
      {floor === "rattle" && <Rattle x={196} y={148} s={0.8} rot={-70} />}
      <Over x={x} />
    </Frame>
  );
}

/* ---------- cena: rosto a rosto ---------- */

export type FaceProps = {
  baby?: Mouth;
  adult?: Mouth;
  babyDx?: number;
  closeUp?: boolean;
  x?: Ex[];
};

export function FaceToFace({ baby = "calm", adult = "smile", babyDx = 0, x }: FaceProps) {
  return (
    <Frame bg="#fff3f0">
      <rect x="0" y="150" width="240" height="20" fill="#f7dcd4" />
      <ellipse cx="78" cy="148" rx="34" ry="22" fill={ONESIE} />
      <Face cx={78} cy={102} r={32} mouth={baby} dx={babyDx} />
      <circle cx="46" cy="140" r="9" fill={ADULT} />
      <Face cx={176} cy={92} r={42} mouth={adult} hair={false} />
      <path d="M135 76 q40 -48 82 0" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <path d="M137 86 q-8 24 0 44" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <Over x={x} />
    </Frame>
  );
}

/* ---------- cena: espelho ---------- */

export type MirrorProps = {
  baby?: Mouth;
  adult?: "none" | "silly" | "smile";
  x?: Ex[];
};

export function Mirror({ baby = "calm", adult = "none", x }: MirrorProps) {
  return (
    <Frame bg="#fdf0ff">
      <rect x="0" y="146" width="240" height="24" fill="#e9defa" />
      <rect x="132" y="12" width="98" height="136" rx="16" fill="#f4d58d" />
      <rect x="140" y="20" width="82" height="120" rx="10" fill="#dff1ff" />
      <path d="M150 30 L176 30 L150 70 Z" fill="#fff" opacity=".55" />
      <g>
        <Face cx={181} cy={88} r={16} mouth={baby} />
        <ellipse cx="181" cy="124" rx="19" ry="12" fill={ONESIE} opacity=".9" />
        {adult !== "none" && <Face cx={206} cy={74} r={11} mouth={adult} hair={false} />}
      </g>
      {adult !== "none" && (
        <g>
          <Face cx={22} cy={94} r={30} mouth={adult} hair={false} />
          <path d="M-4 80 q28 -34 56 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        </g>
      )}
      <ellipse cx="88" cy="132" rx="34" ry="24" fill={ONESIE} />
      <Face cx={88} cy={84} r={32} mouth={baby} />
      <circle cx="56" cy="130" r="9" fill={ADULT} />
      <circle cx="120" cy="130" r="9" fill={ADULT} />
      <Over x={x} />
    </Frame>
  );
}

/* ---------- cena: passeio no colo (ao ar livre) ---------- */

export type WalkProps = { mouth?: Mouth; x?: Ex[]; bird?: boolean };

export function Walk({ mouth = "smile", bird = true, x }: WalkProps) {
  return (
    <Frame bg="#d9f0ff">
      <circle cx="200" cy="30" r="16" fill="#ffe27a" />
      <path d="M0 140 Q60 120 120 138 T240 132 V170 H0Z" fill="#8fd69a" />
      <rect x="196" y="82" width="10" height="56" fill="#b0845b" />
      <circle cx="201" cy="70" r="26" fill="#6cc17a" />
      {bird && (
        <g transform="translate(150 50)">
          <ellipse cx="0" cy="0" rx="10" ry="7" fill="#ff7a8a" />
          <circle cx="9" cy="-4" r="5" fill="#ff7a8a" />
          <path d="M13 -4 l7 2 l-7 3z" fill="#ffb347" />
          <path d="M-6 -2 q-8 -8 -2 -12" stroke="#e85a70" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      <rect x="36" y="104" width="84" height="66" rx="30" fill={SHIRT} />
      <circle cx="78" cy="66" r="26" fill={ADULT} />
      <path d="M52 62 q26 -34 52 0 q-6 -10 -26 -10 q-20 0 -26 10z" fill={INK} />
      <circle cx="68" cy="68" r="2.6" fill={INK} />
      <circle cx="88" cy="68" r="2.6" fill={INK} />
      <path d="M70 78 q8 7 16 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="132" cy="122" rx="26" ry="22" fill={ONESIE} />
      <Face cx={134} cy={90} r={24} mouth={mouth} dx={4} />
      <circle cx="108" cy="118" r="8" fill={ADULT} />
      <Over x={x} />
    </Frame>
  );
}

/* ---------- cena: banho ---------- */

export type BathProps = { mouth?: Mouth; cup?: boolean; duck?: boolean; splash?: boolean; x?: Ex[] };

export function Bath({ mouth = "smile", cup = false, duck = false, splash = false, x }: BathProps) {
  return (
    <Frame bg="#e6f7f4">
      <rect x="0" y="146" width="240" height="24" fill="#cfeee8" />
      <ellipse cx="120" cy="110" rx="40" ry="26" fill={SKIN} opacity="0" />
      <Face cx={120} cy={74} r={30} mouth={mouth} />
      <circle cx="82" cy="102" r="7" fill={SKIN} />
      <circle cx="158" cy="102" r="7" fill={SKIN} />
      <path d="M26 96 H214 L204 140 Q200 156 184 156 H56 Q40 156 36 140Z" fill="#fff" stroke="#cfeee8" strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 108 Q60 100 90 108 T150 108 T210 108 L204 140 Q200 150 184 150 H56 Q40 150 36 140Z" fill="#9edcf5" opacity=".92" />
      {duck && <Duck x={178} y={106} s={0.9} />}
      <g fill="#fff" stroke="#9edcf5" strokeWidth="1.6">
        <circle cx="64" cy="102" r="7" />
        <circle cx="78" cy="96" r="5" />
        <circle cx="168" cy="100" r="6" />
      </g>
      {cup && (
        <g>
          <path d="M214 20 L170 46" stroke={ADULT} strokeWidth="14" strokeLinecap="round" />
          <g transform="translate(160 56) rotate(-40)">
            <path d="M-12 -12 H12 L9 14 H-9Z" fill="#ff7a8a" />
          </g>
          {splash && (
            <>
              <path d="M148 64 q-4 14 -2 30" stroke="#6ec3ee" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M140 66 q-6 12 -6 26" stroke="#6ec3ee" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          )}
        </g>
      )}
      <Over x={x} />
    </Frame>
  );
}

/* ---------- cena: esconde-achou (pano no rosto) ---------- */

export type PeekProps = { cloth?: "face" | "off" | "partial"; mouth?: Mouth; showCloth?: boolean; x?: Ex[] };

export function Peek({ cloth = "off", mouth = "smile", showCloth = false, x }: PeekProps) {
  return (
    <Frame bg="#fff6e8">
      <rect x="0" y="150" width="240" height="20" fill="#f6e3c4" />
      <ellipse cx="120" cy="136" rx="34" ry="26" fill={ONESIE} />
      <path d="M92 118 L80 98" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
      <circle cx="79" cy="95" r="6.5" fill={SKIN} />
      <path d="M148 118 L160 98" stroke={SKIN} strokeWidth="10" strokeLinecap="round" />
      <circle cx="161" cy="95" r="6.5" fill={SKIN} />
      <Face cx={120} cy={86} r={31} mouth={cloth === "face" ? "calm" : mouth} eyes={cloth === "face" ? "open" : "open"} />
      {cloth === "face" && (
        <path d="M82 54 Q120 40 158 54 L162 122 Q120 132 78 122Z" fill="#ffb86b" stroke="#f0953a" strokeWidth="2.4" strokeLinejoin="round" />
      )}
      {showCloth && <Cloth x={196} y={128} w={56} h={30} />}
      {cloth === "partial" && (
        <path d="M82 52 Q120 38 158 52 L156 76 Q120 70 84 76Z" fill="#ffb86b" stroke="#f0953a" strokeWidth="2.4" strokeLinejoin="round" />
      )}
      <Over x={x} />
    </Frame>
  );
}

/* ---------- registro ---------- */

export type SceneName = "tummy" | "lie" | "sit" | "face" | "mirror" | "walk" | "bath" | "peek";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Art({ scene, p }: { scene: SceneName; p?: any }) {
  switch (scene) {
    case "tummy":
      return <Tummy {...p} />;
    case "lie":
      return <Lie {...p} />;
    case "sit":
      return <Sit {...p} />;
    case "face":
      return <FaceToFace {...p} />;
    case "mirror":
      return <Mirror {...p} />;
    case "walk":
      return <Walk {...p} />;
    case "bath":
      return <Bath {...p} />;
    case "peek":
      return <Peek {...p} />;
  }
}
