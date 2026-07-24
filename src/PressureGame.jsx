import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mountain,
  Thermometer as ThermometerIcon,
  Gauge,
  Droplets,
  Star,
  RotateCcw,
  ArrowRight,
  ChevronRight,
  Waves,
  CookingPot,
  FlaskConical,
  Flame,
  Check,
  X,
} from "lucide-react";

// ─── SOUND EFFECTS (Web Audio API) ───

const audioCtxRef = { current: null };
function getAudioCtx() {
  if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtxRef.current;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, t);
      osc.frequency.setValueAtTime(659, t + 0.08);
      osc.frequency.setValueAtTime(784, t + 0.16);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === "wrong") {
      osc.type = "square";
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.setValueAtTime(150, t + 0.1);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    } else if (type === "levelup") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, t);
      osc.frequency.setValueAtTime(659, t + 0.1);
      osc.frequency.setValueAtTime(784, t + 0.2);
      osc.frequency.setValueAtTime(1047, t + 0.3);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (type === "drop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  } catch (e) { /* audio not available */ }
}

// ─── COLORS (Studium-huisstijl; gold alleen voor beloningssterren/confetti) ───

const C = {
  brown: "#0D4868",
  brownDark: "#0D4868",
  brownLight: "#5b7280",
  cream: "#f2f7f8",
  creamLight: "#f8fbfc",
  gold: "#D4A84B",
  goldLight: "#99D3D8",
  red: "#D92C2C",
  green: "#1E8F6E",
  greenLight: "#30B5AE",
  white: "#FFFFFF",
  waterBlue: "#60A5FA",
  r290Green: "#34D399",
  thermRed: "#EF4444",
  boilingOrange: "#F97316",
  gaugeRed: "#EF4444",
};

// ─── FLOATING POINTS COMPONENT ───

const COMPLIMENTS = ["Top!", "Netjes!", "Goed zo!", "Geweldig!", "Mooi!", "Knap!", "Lekker bezig!", "Yes!"];

function FloatingPoints({ points, x, y, onDone }) {
  const [opacity, setOpacity] = useState(1);
  const [offsetY, setOffsetY] = useState(0);
  const compliment = useRef(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / 800);
      setOffsetY(-60 * progress);
      setOpacity(1 - progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else onDone();
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[100] font-bold text-xl italic text-center"
      style={{
        left: x - 40,
        top: y + offsetY,
        opacity,
        color: C.green,
        textShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    >
      +{points} {compliment.current}
    </div>
  );
}

// ─── CONFETTI BURST ───

function ConfettiBurst({ x, y, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = Array.from({ length: 30 }, () => ({
      x: 0, y: 0,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      size: 4 + Math.random() * 4,
      color: [C.gold, C.green, "#30B5AE", "#0D4868", "#99D3D8", "#E08A00"][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 20,
    }));

    const start = performance.now();
    let frame;
    const animate = (now) => {
      const elapsed = (now - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.vy += 0.3;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        const alpha = Math.max(0, 1 - elapsed / 0.8);
        if (alpha <= 0) return;
        alive = true;
        ctx.save();
        ctx.translate(canvas.width / 2 + p.x, canvas.height / 2 + p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      if (alive) frame = requestAnimationFrame(animate);
      else onDone();
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="fixed pointer-events-none z-[99]"
      style={{ left: x - 100, top: y - 100 }}
    />
  );
}

// ─── STREAK INDICATOR ───

function StreakIndicator({ streak }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (streak < 2) { setVisible(false); return; }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [streak]);

  if (!visible) return null;
  return (
    <div className="fixed top-20 right-4 z-[90] animate-bounce">
      <div className="rounded-xl px-4 py-2 shadow-lg border-2 font-bold italic text-sm"
        style={{ backgroundColor: "#99D3D8", borderColor: C.brownDark, color: C.brownDark }}>
        {streak >= 5 ? "ONSTOPBAAR! " : streak >= 3 ? "COMBO! " : ""}{streak}x op rij!
      </div>
    </div>
  );
}

// ─── GAME JUICE HOOK ───

function useGameJuice() {
  const [floatingPoints, setFloatingPoints] = useState([]);
  const [confettis, setConfettis] = useState([]);
  const [streak, setStreak] = useState(0);
  const [shaking, setShaking] = useState(false);
  const idRef = useRef(0);

  const triggerCorrect = useCallback((pts, mouseEvent) => {
    const id = ++idRef.current;
    const x = mouseEvent?.clientX ?? window.innerWidth / 2;
    const y = mouseEvent?.clientY ?? 200;

    playSound("correct");
    setStreak((s) => s + 1);
    setFloatingPoints((prev) => [...prev, { id, pts, x, y }]);
    setConfettis((prev) => [...prev, { id, x, y }]);
  }, []);

  const triggerWrong = useCallback(() => {
    playSound("wrong");
    setStreak(0);
    setShaking(true);
    setTimeout(() => setShaking(false), 300);
  }, []);

  const triggerLevelUp = useCallback(() => {
    playSound("levelup");
  }, []);

  const removeFloat = useCallback((id) => {
    setFloatingPoints((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const removeConfetti = useCallback((id) => {
    setConfettis((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const JuiceOverlay = useCallback(() => (
    <>
      {floatingPoints.map((f) => (
        <FloatingPoints key={f.id} points={f.pts} x={f.x} y={f.y} onDone={() => removeFloat(f.id)} />
      ))}
      {confettis.map((c) => (
        <ConfettiBurst key={c.id} x={c.x} y={c.y} onDone={() => removeConfetti(c.id)} />
      ))}
      <StreakIndicator streak={streak} />
    </>
  ), [floatingPoints, confettis, streak]);

  return { triggerCorrect, triggerWrong, triggerLevelUp, shaking, streak, JuiceOverlay };
}

// ─── DATA CONSTANTS ───

const WATER_BP = [
  { pressure: 0.33, boilingPoint: 71 },
  { pressure: 0.50, boilingPoint: 81 },
  { pressure: 0.70, boilingPoint: 90 },
  { pressure: 1.00, boilingPoint: 100 },
  { pressure: 1.50, boilingPoint: 111 },
  { pressure: 2.00, boilingPoint: 120 },
  { pressure: 2.50, boilingPoint: 127 },
  { pressure: 3.00, boilingPoint: 134 },
];

const R290_BP = [
  { pressure: 1.0, boilingPoint: -42 },
  { pressure: 2.0, boilingPoint: -25 },
  { pressure: 3.0, boilingPoint: -13 },
  { pressure: 4.0, boilingPoint: -2 },
  { pressure: 5.0, boilingPoint: 7 },
  { pressure: 7.0, boilingPoint: 22 },
  { pressure: 10.0, boilingPoint: 42 },
];

const R134A_BP = [
  { pressure: 1.0, boilingPoint: -26 },
  { pressure: 1.5, boilingPoint: -19 },
  { pressure: 2.0, boilingPoint: -10 },
  { pressure: 3.0, boilingPoint: 1 },
  { pressure: 4.0, boilingPoint: 9 },
  { pressure: 5.0, boilingPoint: 16 },
  { pressure: 6.0, boilingPoint: 22 },
  { pressure: 8.0, boilingPoint: 31 },
  { pressure: 10.0, boilingPoint: 39 },
];

const CO2_BP = [
  { pressure: 5.0, boilingPoint: -57 },
  { pressure: 7.0, boilingPoint: -49 },
  { pressure: 10.0, boilingPoint: -40 },
  { pressure: 15.0, boilingPoint: -28 },
  { pressure: 20.0, boilingPoint: -19 },
  { pressure: 25.0, boilingPoint: -13 },
  { pressure: 30.0, boilingPoint: -6 },
  { pressure: 35.0, boilingPoint: 0 },
];

const REFRIGERANTS = [
  { name: "Water", table: WATER_BP, color: "#60A5FA", minP: 0.33, maxP: 3.0 },
  { name: "R-134a", table: R134A_BP, color: "#A78BFA", minP: 1.0, maxP: 10.0 },
  { name: "R-290", table: R290_BP, color: "#34D399", minP: 1.0, maxP: 10.0 },
  { name: "CO\u2082", table: CO2_BP, color: "#F87171", minP: 5.0, maxP: 35.0 },
];

const M2R3_TASKS = [
  { fluid: "Water", targetTemp: 100, requiredPressure: 1.0, margin: 0.15, text: "Stel de druk in zodat water kookt bij 100\u00B0C." },
  { fluid: "R-134a", targetTemp: -26, requiredPressure: 1.0, margin: 0.15, text: "Stel de druk in zodat R-134a kookt bij -26\u00B0C." },
  { fluid: "CO\u2082", targetTemp: -19, requiredPressure: 20.0, margin: 2.0, text: "Stel de druk in zodat CO\u2082 kookt bij -19\u00B0C." },
  { fluid: "R-290", targetTemp: -10, requiredPressure: 2.8, margin: 0.3, text: "Stel de druk in zodat R-290 verdampt bij -10\u00B0C." },
];

function getBoilingPoint(pressureTable, pressure) {
  if (pressure <= pressureTable[0].pressure) return pressureTable[0].boilingPoint;
  if (pressure >= pressureTable[pressureTable.length - 1].pressure)
    return pressureTable[pressureTable.length - 1].boilingPoint;
  for (let i = 0; i < pressureTable.length - 1; i++) {
    const a = pressureTable[i], b = pressureTable[i + 1];
    if (pressure >= a.pressure && pressure <= b.pressure) {
      const t = (pressure - a.pressure) / (b.pressure - a.pressure);
      return Math.round(a.boilingPoint + t * (b.boilingPoint - a.boilingPoint));
    }
  }
  return pressureTable[0].boilingPoint;
}

const LOCATIONS = [
  { name: "Zeeniveau", altitude: 0, pressure: 1.0, boilingPoint: 100 },
  { name: "Mount Everest", altitude: 8849, pressure: 0.33, boilingPoint: 71 },
  { name: "Hogedrukpan", altitude: 0, pressure: 2.0, boilingPoint: 122 },
];

const M2_WATER_TASKS = [
  { targetTemp: 120, requiredPressure: 2.0, margin: 0.1, text: "Zorg dat water kookt bij 120\u00B0C." },
  { targetTemp: 80, requiredPressure: 0.47, margin: 0.1, text: "Zorg dat water kookt bij 80\u00B0C." },
];

const M2_R290_TASKS = [
  { type: "estimate", targetPressure: 1.0, correctTemp: -42, margin: 5, text: "De druk is 1 bar. Bij welke temperatuur kookt R-290?" },
  { type: "set_pressure", targetTemp: -10, requiredPressure: 2.8, margin: 0.3, text: "Stel de druk in zodat R-290 verdampt bij -10\u00B0C." },
];

const TEXTS = {
  m1_intro: <>Water kookt bij <span className="font-bold">100\u00B0C</span>. Maar is dat altijd zo?{"\n\n"}Beklim de berg en ontdek wat er met het <span className="font-bold">kookpunt</span> gebeurt als de <span className="font-bold">luchtdruk</span> verandert!</>,
  m1r1_question: "Je staat op zeeniveau. De luchtdruk is 1 bar. Bij welke temperatuur gaat dit water koken?",
  m1r1_correct: "Klopt! Bij een druk van 1 bar kookt water bij 100\u00B0C. Maar wat als we hoger gaan?",
  m1r1_wrong: "Niet helemaal. Op zeeniveau is de luchtdruk 1 bar, en daarbij kookt water bij 100\u00B0C.",
  m1r2_question: "Je staat nu op de top van de Mount Everest! De luchtdruk is hier maar 0,33 bar. Bij welke temperatuur denk je dat water hier kookt?",
  m1r2_correct: "Goed geschat! Op de Mount Everest kookt water al bij 71\u00B0C. Minder druk = lager kookpunt.",
  m1r2_wrong: "Het juiste antwoord is 71\u00B0C. Minder druk = lager kookpunt.",
  m1r3_intro: <>Je bent terug op zeeniveau. Maar nu heb je een <span className="font-bold">hogedrukpan</span>. Door het deksel af te sluiten stijgt de <span className="font-bold">druk</span> in de pan tot <span className="font-bold">2 bar</span>.</>,
  m1r3_direction: "De druk is nu 2 bar in plaats van 1 bar. Wat denk je: wat gebeurt er met het kookpunt?",
  m1r3_slider: "Stel met de slider in: bij welke temperatuur kookt water bij 2 bar?",
  m1r3_correct: "Bij 2 bar kookt water pas bij 122\u00B0C. Hogere druk = hoger kookpunt!",
  m1r3_wrong: "Het juiste antwoord is 122\u00B0C. Meer druk = hoger kookpunt.",
  m1_outro: <>Je hebt ontdekt dat het kookpunt niet vaststaat. <span className="font-bold">Lagere druk = lager kookpunt</span>, <span className="font-bold">hogere druk = hoger kookpunt</span>. In missie 2 ga jij zelf de druk regelen!</>,
  m2_intro: <>Nu ga jij zelf aan de knoppen draaien! Je krijgt een <span className="font-bold">drukvat</span> en een <span className="font-bold">drukregelaar</span>. En straks ontdek je hoe een <span className="font-bold">koelinstallatie</span> dit principe slim gebruikt.</>,
  m2r1_question: <>Speel met de <span className="font-bold">drukregelaar</span>! Wanneer begint het water te <span className="font-bold">koken</span>? Wanneer stopt het?</>,
  m2r1_check: "Wat gebeurt er met het kookpunt als je de druk verhoogt?",
  m2r1_correct: "Precies. Jij bepaalt het kookpunt door de druk te kiezen.",
  m2r2_question: "Stel de druk zo in dat water kookt bij de aangegeven temperatuur.",
  m2r2_correct: "Goed ingesteld! Je kunt het kookpunt precies sturen door de druk te kiezen.",
  m2r3_intro: "Nu zit er koudemiddel R-290 (propaan) in het vat. R-290 kookt bij 1 bar op -42\u00B0C.",
  m2r3_correct_estimate: "Klopt! R-290 kookt bij 1 bar op -42\u00B0C.",
  m2r3_correct_task: "Uitstekend! Bij ~2,8 bar verdampt R-290 op -10\u00B0C. Dat is het principe van koeltechniek!",
  ending: <>Gefeliciteerd! Het <span className="font-bold">kookpunt</span> hangt af van de <span className="font-bold">druk</span>. In de koeltechniek gebruiken we dit om <span className="font-bold">koudemiddelen</span> te laten <span className="font-bold">verdampen</span> op precies de temperatuur die we willen.</>,
};

// ─── HELPER: screen to mission/round ───

function screenToMR(screen) {
  const map = {
    mission1_intro: [1, 0], m1r1: [1, 1], m1r2: [1, 2], m1r3: [1, 3],
    mission2_intro: [2, 0], m2r1: [2, 1], m2r2: [2, 2], m2r3: [2, 3],
  };
  return map[screen] || [0, 0];
}

// ─── REUSABLE COMPONENTS ───

function ProgressBar({ screen, score, lives }) {
  const [mission, round] = screenToMR(screen);
  const [displayScore, setDisplayScore] = useState(score);
  const [scorePop, setScorePop] = useState(false);
  const allRounds = [
    { m: 1, r: 1 }, { m: 1, r: 2 }, { m: 1, r: 3 },
    { m: 2, r: 1 }, { m: 2, r: 2 }, { m: 2, r: 3 },
  ];

  useEffect(() => {
    if (displayScore === score) return;
    setScorePop(true);
    const timer = setInterval(() => {
      setDisplayScore((d) => {
        if (d < score) return d + 1;
        clearInterval(timer);
        return score;
      });
    }, 30);
    const popTimer = setTimeout(() => setScorePop(false), 400);
    return () => { clearInterval(timer); clearTimeout(popTimer); };
  }, [score]);

  return (
    <div className="flex items-center justify-between px-2 py-2 sm:px-4" style={{ background: "transparent" }}>
      <div className="flex items-center gap-1 sm:gap-1.5">
        <img src="/studium-beeldmerk.png" alt="Studium" className="h-5 w-auto mr-1 sm:mr-2" />
        <span className="hidden sm:inline text-sm font-bold mr-1" style={{ color: C.white }}>Ronde:</span>
        {allRounds.map((ar, i) => {
          const isComplete = ar.m < mission || (ar.m === mission && ar.r < round);
          const isCurrent = ar.m === mission && ar.r === round;
          return (
            <div
              key={i}
              className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded-full border-2 flex items-center justify-center"
              style={{
                background: isComplete ? "#99D3D8" : isCurrent ? C.white : "transparent",
                borderColor: isComplete ? "#99D3D8" : isCurrent ? C.white : "rgba(255,255,255,0.55)",
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="text-base sm:text-lg" style={{ color: i < lives ? "#D92C2C" : "rgba(255,255,255,0.6)" }}>
            {i < lives ? "\u2764" : "\u2661"}
          </span>
        ))}
      </div>
      <div
        className="text-sm font-bold transition-all duration-200 whitespace-nowrap"
        style={{
          color: scorePop ? "#99D3D8" : C.white,
          transform: scorePop ? "scale(1.5)" : "scale(1)",
        }}
      >
        <span className="hidden sm:inline">Score: </span>{displayScore}
      </div>
    </div>
  );
}

function GameButton({ onClick, children, variant = "primary", disabled = false, className = "" }) {
  const styles = {
    primary: { background: "#30B5AE", color: C.white, border: "2px solid #0D4868", boxShadow: "0 3px 0 #1F8A84" },
    secondary: { background: C.white, color: "#0D4868", border: "2px solid #0D4868", boxShadow: "0 3px 0 rgba(0,0,0,0.15)" },
    correct: { background: "#1E8F6E", color: C.white, border: "2px solid #0D4868", boxShadow: "0 3px 0 #166F56" },
    wrong: { background: "#D92C2C", color: C.white, border: "2px solid #0D4868", boxShadow: "0 3px 0 rgba(0,0,0,0.2)" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2.5 rounded-lg font-bold italic text-lg transition-all duration-200 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:brightness-110 cursor-pointer"} ${className}`}
      style={s}
    >
      {children}
    </button>
  );
}

function CardBox({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl p-5 shadow-md ${className}`}
      style={{ background: C.white, border: "2px solid #0D4868" }}
    >
      {children}
    </div>
  );
}

function ThermometerSVG({ temperature, minTemp = 0, maxTemp = 150, boilingPoint, targetTemp }) {
  const height = 220;
  const barX = 22;
  const barW = 16;
  const topY = 15;
  const fillFrac = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));
  const fillH = fillFrac * height;
  const bpFrac = boilingPoint != null ? (boilingPoint - minTemp) / (maxTemp - minTemp) : null;
  const tgtFrac = targetTemp != null ? (targetTemp - minTemp) / (maxTemp - minTemp) : null;

  const ticks = [];
  const step = maxTemp - minTemp <= 100 ? 20 : maxTemp - minTemp <= 200 ? 25 : 50;
  for (let t = minTemp; t <= maxTemp; t += step) {
    const frac = (t - minTemp) / (maxTemp - minTemp);
    ticks.push({ t, y: topY + height - frac * height });
  }

  return (
    <svg width="90" height="280" viewBox="0 0 90 280">
      {/* Outer tube */}
      <rect x={barX - 4} y={topY - 4} width={barW + 8} height={height + 8} rx="10" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1" />
      {/* Bulb */}
      <circle cx={barX + barW / 2} cy={topY + height + 12} r="14" fill={C.thermRed} />
      {/* Fill */}
      <rect x={barX} y={topY + height - fillH} width={barW} height={fillH} rx="4" fill={C.thermRed} style={{ transition: "all 500ms ease-out" }} />
      {/* Ticks */}
      {ticks.map(({ t, y }) => (
        <g key={t}>
          <line x1={barX + barW + 4} y1={y} x2={barX + barW + 12} y2={y} stroke="#5b7280" strokeWidth="1" />
          <text x={barX + barW + 15} y={y + 4} fontSize="9" fill="#5b7280">{t}°</text>
        </g>
      ))}
      {/* Boiling point line */}
      {bpFrac != null && (
        <g>
          <line
            x1={barX - 8} y1={topY + height - bpFrac * height}
            x2={barX + barW + 4} y2={topY + height - bpFrac * height}
            stroke={C.boilingOrange} strokeWidth="2" strokeDasharray="4,4"
            style={{ transition: "all 400ms ease-out" }}
          />
          <text x={0} y={topY + height - bpFrac * height - 4} fontSize="8" fill={C.boilingOrange} fontWeight="bold">KP</text>
        </g>
      )}
      {/* Target line */}
      {tgtFrac != null && (
        <g>
          <line
            x1={barX - 8} y1={topY + height - tgtFrac * height}
            x2={barX + barW + 4} y2={topY + height - tgtFrac * height}
            stroke={C.green} strokeWidth="2.5"
            style={{ transition: "all 400ms ease-out" }}
          />
          <text x={0} y={topY + height - tgtFrac * height - 4} fontSize="8" fill={C.green} fontWeight="bold">Doel</text>
        </g>
      )}
    </svg>
  );
}

function PressureGaugeSVG({ pressure, minP = 0, maxP = 3, unit = "bar" }) {
  const cx = 80, cy = 80, r = 65;
  const startAngle = 225;
  const endAngle = -45;
  const range = 270;
  const frac = Math.max(0, Math.min(1, (pressure - minP) / (maxP - minP)));
  const angle = startAngle - frac * range;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + Math.cos(rad) * (r - 12);
  const ny = cy - Math.sin(rad) * (r - 12);

  const ticks = [];
  const numTicks = 6;
  for (let i = 0; i <= numTicks; i++) {
    const f = i / numTicks;
    const a = ((startAngle - f * range) * Math.PI) / 180;
    const val = minP + f * (maxP - minP);
    ticks.push({
      x1: cx + Math.cos(a) * (r - 6),
      y1: cy - Math.sin(a) * (r - 6),
      x2: cx + Math.cos(a) * (r - 2),
      y2: cy - Math.sin(a) * (r - 2),
      lx: cx + Math.cos(a) * (r - 16),
      ly: cy - Math.sin(a) * (r - 16),
      val: val.toFixed(1),
    });
  }

  return (
    <svg width="160" height="170" viewBox="0 0 160 170">
      <circle cx={cx} cy={cy} r={r} fill={C.white} stroke="#9CA3AF" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="#E5E7EB" strokeWidth="4" />
      {ticks.map((tk, i) => (
        <g key={i}>
          <line x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2} stroke="#5b7280" strokeWidth="1.5" />
          <text x={tk.lx} y={tk.ly + 4} fontSize="9" fill="#5b7280" textAnchor="middle">{tk.val}</text>
        </g>
      ))}
      {/* Needle */}
      <line
        x1={cx} y1={cy} x2={nx} y2={ny}
        stroke={C.gaugeRed} strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: "all 400ms ease-out" }}
      />
      <circle cx={cx} cy={cy} r="5" fill={C.gaugeRed} />
      <text x={cx} y={cy + 28} fontSize="14" fontWeight="bold" fill={C.brownDark} textAnchor="middle">
        {pressure.toFixed(2)} {unit}
      </text>
    </svg>
  );
}

function BoilingPot({ isBoiling, fluidColor = C.waterBlue, variant = "open" }) {
  const bubblesRef = useRef([]);
  const [bubbles, setBubbles] = useState([]);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!isBoiling) {
      setBubbles([]);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }
    bubblesRef.current = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 60,
      y: 80 + Math.random() * 20,
      r: 2 + Math.random() * 4,
      speed: 0.4 + Math.random() * 0.8,
      opacity: 0.4 + Math.random() * 0.4,
    }));
    function animate() {
      bubblesRef.current = bubblesRef.current.map((b) => {
        let ny = b.y - b.speed;
        if (ny < 40) {
          ny = 80 + Math.random() * 20;
          b.x = 30 + Math.random() * 60;
          b.r = 2 + Math.random() * 4;
        }
        return { ...b, y: ny };
      });
      setBubbles([...bubblesRef.current]);
      frameRef.current = requestAnimationFrame(animate);
    }
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [isBoiling]);

  return (
    <svg width="120" height="130" viewBox="0 0 120 130">
      {/* Burner base */}
      <rect x="30" y="118" width="60" height="8" rx="3" fill="#4B5563" />
      <rect x="35" y="116" width="50" height="4" rx="2" fill="#6B7280" />
      {/* Gas ring holes */}
      {[40, 50, 60, 70, 80].map((x) => (
        <circle key={x} cx={x} cy="115" r="1.5" fill="#374151" />
      ))}
      {/* Flames - outer glow */}
      <ellipse cx="60" cy="108" rx="28" ry="8" fill="#F97316" opacity="0.15" />
      {/* Flames - individual tongues */}
      <path d="M42,114 Q40,105 44,98 Q42,105 46,114Z" fill="#3B82F6" opacity="0.7">
        <animate attributeName="d" values="M42,114 Q40,105 44,98 Q42,105 46,114Z;M42,114 Q41,106 43,100 Q43,106 46,114Z;M42,114 Q40,105 44,98 Q42,105 46,114Z" dur="0.4s" repeatCount="indefinite" />
      </path>
      <path d="M49,114 Q47,102 51,94 Q49,102 53,114Z" fill="#3B82F6" opacity="0.8">
        <animate attributeName="d" values="M49,114 Q47,102 51,94 Q49,102 53,114Z;M49,114 Q48,103 50,96 Q50,103 53,114Z;M49,114 Q47,102 51,94 Q49,102 53,114Z" dur="0.35s" repeatCount="indefinite" />
      </path>
      <path d="M56,114 Q54,100 60,92 Q56,100 60,114Z" fill="#60A5FA" opacity="0.9">
        <animate attributeName="d" values="M56,114 Q54,100 60,92 Q56,100 60,114Z;M56,114 Q55,101 59,94 Q57,101 60,114Z;M56,114 Q54,100 60,92 Q56,100 60,114Z" dur="0.3s" repeatCount="indefinite" />
      </path>
      <path d="M60,114 Q58,98 62,90 Q60,98 64,114Z" fill="#93C5FD" opacity="0.9">
        <animate attributeName="d" values="M60,114 Q58,98 62,90 Q60,98 64,114Z;M60,114 Q59,99 61,92 Q61,99 64,114Z;M60,114 Q58,98 62,90 Q60,98 64,114Z" dur="0.28s" repeatCount="indefinite" />
      </path>
      <path d="M64,114 Q62,100 66,93 Q64,100 68,114Z" fill="#60A5FA" opacity="0.9">
        <animate attributeName="d" values="M64,114 Q62,100 66,93 Q64,100 68,114Z;M64,114 Q63,101 65,95 Q65,101 68,114Z;M64,114 Q62,100 66,93 Q64,100 68,114Z" dur="0.32s" repeatCount="indefinite" />
      </path>
      <path d="M71,114 Q69,103 73,96 Q71,103 75,114Z" fill="#3B82F6" opacity="0.8">
        <animate attributeName="d" values="M71,114 Q69,103 73,96 Q71,103 75,114Z;M71,114 Q70,104 72,98 Q72,104 75,114Z;M71,114 Q69,103 73,96 Q71,103 75,114Z" dur="0.37s" repeatCount="indefinite" />
      </path>
      <path d="M78,114 Q76,106 80,100 Q78,106 82,114Z" fill="#3B82F6" opacity="0.7">
        <animate attributeName="d" values="M78,114 Q76,106 80,100 Q78,106 82,114Z;M78,114 Q77,107 79,102 Q79,107 82,114Z;M78,114 Q76,106 80,100 Q78,106 82,114Z" dur="0.42s" repeatCount="indefinite" />
      </path>
      {/* Inner flame tips (yellow/white hot core) */}
      <path d="M53,114 Q52,107 55,102 Q53,107 57,114Z" fill="#FBBF24" opacity="0.6">
        <animate attributeName="d" values="M53,114 Q52,107 55,102 Q53,107 57,114Z;M53,114 Q53,108 54,104 Q54,108 57,114Z;M53,114 Q52,107 55,102 Q53,107 57,114Z" dur="0.25s" repeatCount="indefinite" />
      </path>
      <path d="M60,114 Q59,105 62,98 Q60,105 63,114Z" fill="#FDE68A" opacity="0.7">
        <animate attributeName="d" values="M60,114 Q59,105 62,98 Q60,105 63,114Z;M60,114 Q60,106 61,100 Q61,106 63,114Z;M60,114 Q59,105 62,98 Q60,105 63,114Z" dur="0.22s" repeatCount="indefinite" />
      </path>
      <path d="M67,114 Q66,108 69,103 Q67,108 71,114Z" fill="#FBBF24" opacity="0.6">
        <animate attributeName="d" values="M67,114 Q66,108 69,103 Q67,108 71,114Z;M67,114 Q67,109 68,105 Q68,109 71,114Z;M67,114 Q66,108 69,103 Q67,108 71,114Z" dur="0.27s" repeatCount="indefinite" />
      </path>
      {/* Pot body */}
      <rect x="25" y="55" width="70" height="55" rx="5" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1.5" />
      {/* Pot shine */}
      <rect x="28" y="58" width="8" height="48" rx="4" fill="white" opacity="0.15" />
      {/* Handles */}
      <rect x="17" y="70" width="10" height="5" rx="2" fill="#9CA3AF" stroke="#6B7280" strokeWidth="0.5" />
      <rect x="93" y="70" width="10" height="5" rx="2" fill="#9CA3AF" stroke="#6B7280" strokeWidth="0.5" />
      {/* Fluid */}
      <rect x="27" y="65" width="66" height="43" rx="3" fill={fluidColor} opacity="0.7" />
      {/* Fluid surface highlight */}
      <ellipse cx="60" cy="66" rx="30" ry="2" fill="white" opacity="0.2" />
      {/* Lid for closed/pressure variants */}
      {variant !== "open" && (
        <g>
          <rect x="20" y="51" width="80" height="7" rx="3" fill="#9CA3AF" stroke="#6B7280" strokeWidth="0.5" />
          {variant === "pressure" && (
            <>
              <rect x="55" y="42" width="10" height="10" rx="2" fill="#6B7280" stroke="#4B5563" strokeWidth="1" />
              <circle cx="60" cy="40" r="3" fill="#EF4444" opacity="0.8" />
            </>
          )}
        </g>
      )}
      {/* Bubbles */}
      {bubbles.map((b) => (
        <circle key={b.id} cx={b.x} cy={b.y + 8} r={b.r} fill="white" opacity={b.opacity} />
      ))}
      {/* Steam lines for open pot */}
      {isBoiling && variant === "open" && (
        <g opacity="0.4">
          <path d="M40,53 Q38,38 42,25" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="d" values="M40,53 Q38,38 42,25;M40,53 Q42,38 38,25;M40,53 Q38,38 42,25" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M55,53 Q53,35 57,18" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="d" values="M55,53 Q53,35 57,18;M55,53 Q57,35 53,18;M55,53 Q53,35 57,18" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0.1;0.35" dur="1.8s" repeatCount="indefinite" />
          </path>
          <path d="M70,53 Q68,36 72,22" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="d" values="M70,53 Q68,36 72,22;M70,53 Q72,36 68,22;M70,53 Q68,36 72,22" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.2s" repeatCount="indefinite" />
          </path>
        </g>
      )}
    </svg>
  );
}

function PressureSlider({ value, min, max, step, onChange, label, unit = "bar" }) {
  return (
    <div className="w-full">
      {label && (
        <div className="text-center font-bold text-lg mb-1" style={{ color: C.brownDark }}>
          {label}: {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(2)) : value} {unit}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: "#30B5AE", background: "#dbe7ea" }}
      />
      <div className="flex justify-between text-xs mt-0.5" style={{ color: "#5b7280" }}>
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

function MountainSVG({ activeStop = 0 }) {
  const stops = [
    { x: 32, y: 162, label: "0m", pLabel: "1 bar" },
    { x: 105, y: 38, label: "8849m", pLabel: "0,33 bar" },
    { x: 172, y: 162, label: "0m", pLabel: "2 bar" },
  ];

  return (
    <svg width="220" height="200" viewBox="0 0 220 200">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="50%" stopColor="#5BA3D9" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="mountain-main" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B9DAF" />
          <stop offset="40%" stopColor="#6B7B8D" />
          <stop offset="100%" stopColor="#4A5568" />
        </linearGradient>
        <linearGradient id="mountain-shadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4A5568" />
          <stop offset="100%" stopColor="#6B7B8D" />
        </linearGradient>
        <linearGradient id="snow-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A7C59" />
          <stop offset="100%" stopColor="#2D5A3F" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="220" height="200" fill="url(#sky)" rx="10" />

      {/* Sun */}
      <circle cx="185" cy="28" r="16" fill="#FDE68A" opacity="0.9" />
      <circle cx="185" cy="28" r="22" fill="#FDE68A" opacity="0.2" />

      {/* Clouds */}
      <g opacity="0.7">
        <ellipse cx="45" cy="35" rx="18" ry="7" fill="white" />
        <ellipse cx="58" cy="32" rx="14" ry="6" fill="white" />
        <ellipse cx="35" cy="32" rx="12" ry="5" fill="white" />
      </g>
      <g opacity="0.5">
        <ellipse cx="150" cy="55" rx="15" ry="5" fill="white" />
        <ellipse cx="160" cy="53" rx="11" ry="4" fill="white" />
      </g>

      {/* Background mountain (smaller, lighter) */}
      <polygon points="160,50 210,170 110,170" fill="#7B8FA0" opacity="0.5" />

      {/* Main mountain - shadow side (left) */}
      <polygon points="105,30 10,170 105,170" fill="url(#mountain-shadow)" />
      {/* Main mountain - lit side (right) */}
      <polygon points="105,30 200,170 105,170" fill="url(#mountain-main)" />

      {/* Rock ridges / texture lines */}
      <line x1="105" y1="30" x2="60" y2="130" stroke="#5A6A7A" strokeWidth="0.5" opacity="0.4" />
      <line x1="105" y1="30" x2="145" y2="120" stroke="#8899AA" strokeWidth="0.5" opacity="0.3" />
      <line x1="70" y1="110" x2="50" y2="145" stroke="#5A6A7A" strokeWidth="0.5" opacity="0.3" />
      <line x1="140" y1="100" x2="165" y2="145" stroke="#8899AA" strokeWidth="0.5" opacity="0.25" />

      {/* Snow cap - irregular shape */}
      <path d="M105,30 L90,58 L82,55 L78,65 L88,68 L95,60 L105,65 L115,58 L122,62 L128,55 L125,65 L118,68 L112,60 L105,65 L98,72 L92,68 L88,75 L95,78 L105,72 L115,78 L120,72 L125,68 L130,58 L105,30Z" fill="url(#snow-grad)" />
      {/* Snow highlights */}
      <path d="M105,30 L95,52 L105,48 L115,52 Z" fill="white" opacity="0.9" />

      {/* Treeline */}
      {[25, 35, 48, 58, 70, 80, 135, 148, 158, 168, 178].map((x, i) => {
        const treeH = 8 + (i % 3) * 3;
        const baseY = 168;
        return (
          <polygon
            key={`tree-${i}`}
            points={`${x},${baseY - treeH} ${x - 3},${baseY} ${x + 3},${baseY}`}
            fill={i % 2 === 0 ? "#2D6A4F" : "#40916C"}
            opacity="0.8"
          />
        );
      })}

      {/* Ground */}
      <rect x="0" y="168" width="220" height="32" fill="url(#ground-grad)" rx="0" />
      {/* Ground texture */}
      <ellipse cx="30" cy="175" rx="25" ry="3" fill="#3A6B4A" opacity="0.4" />
      <ellipse cx="110" cy="178" rx="35" ry="3" fill="#3A6B4A" opacity="0.3" />
      <ellipse cx="185" cy="174" rx="20" ry="3" fill="#3A6B4A" opacity="0.4" />

      {/* Path/trail up the mountain */}
      <path d="M32,168 Q50,150 60,130 Q75,100 90,75 Q95,60 105,38" fill="none" stroke="#C4B5A0" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />

      {/* Stops */}
      {stops.map((s, i) => {
        const isActive = i === activeStop;
        const isDone = i < activeStop;
        return (
          <g key={i}>
            {/* Glow ring for active */}
            {isActive && (
              <circle cx={s.x} cy={s.y} r="16" fill="#30B5AE" opacity="0.25">
                <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0.1;0.25" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Pin shadow */}
            <ellipse cx={s.x} cy={s.y + 8} rx="6" ry="2" fill="black" opacity="0.2" />
            {/* Pin body */}
            <circle
              cx={s.x} cy={s.y} r={isActive ? 10 : 7}
              fill={isActive ? "#30B5AE" : isDone ? C.green : "#D1D5DB"}
              stroke={isActive ? C.brownDark : isDone ? "#166F56" : "#9CA3AF"}
              strokeWidth={isActive ? 2.5 : 1.5}
              style={{ transition: "all 300ms ease" }}
            />
            {/* Inner icon dot */}
            <circle cx={s.x} cy={s.y} r={isActive ? 3 : 2}
              fill={isActive ? C.white : isDone ? "white" : "#9CA3AF"}
            />
            {/* Label */}
            {isActive && (
              <g>
                {/* Label background */}
                <rect x={s.x - 28} y={s.y - 30} width="56" height="22" rx="4"
                  fill={C.brownDark} opacity="0.85" />
                <polygon points={`${s.x - 4},${s.y - 8} ${s.x + 4},${s.y - 8} ${s.x},${s.y - 3}`}
                  fill={C.brownDark} opacity="0.85" />
                <text x={s.x} y={s.y - 19} fontSize="8" fill={C.white} fontWeight="bold" textAnchor="middle">{s.label}</text>
                <text x={s.x} y={s.y - 11} fontSize="7" fill={C.goldLight} textAnchor="middle">{s.pLabel}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ComparisonView({ columns }) {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {columns.map((col, i) => (
        <div
          key={i}
          className="rounded-xl p-3 text-center shadow-md flex-1 min-w-[120px] max-w-[180px]"
          style={{
            background: C.creamLight,
            border: "2px solid #dbe7ea",
            animationDelay: `${i * 200}ms`,
          }}
        >
          <div className="text-xs font-bold mb-1" style={{ color: C.brownLight }}>{col.title}</div>
          <div className="text-sm" style={{ color: C.brownDark }}>Druk: {col.pressure} bar</div>
          <div className="text-2xl font-bold mt-1" style={{ color: col.boilingPoint < 0 ? "#2563EB" : C.red }}>
            {col.boilingPoint}°C
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedbackPopup({ type, text, onClose }) {
  if (!text) return null;
  const isCorrect = type === "correct";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="mx-4 max-w-md rounded-xl p-5 shadow-xl"
        style={{
          background: isCorrect ? "#e8f5f0" : "#fdeaea",
          border: `3px solid ${isCorrect ? C.green : C.red}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-2">
          {isCorrect ? <Check size={24} color={C.green} /> : <X size={24} color={C.red} />}
          <span className="font-bold text-lg" style={{ color: isCorrect ? C.green : C.red }}>
            {isCorrect ? "Goed!" : "Helaas!"}
          </span>
        </div>
        <p className="text-sm" style={{ color: C.brownDark }}>{text}</p>
        <div className="mt-3 text-right">
          <GameButton onClick={onClose} variant={isCorrect ? "correct" : "wrong"}>OK</GameButton>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN COMPONENTS ───

function StartScreen({ onStart }) {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: '#0D4868' }}>De Drukregulaar</h1>
        <h2 className="text-xl font-bold italic mb-6" style={{ color: '#5b7280' }}>Ontdek hoe druk het kookpunt bepaalt</h2>
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '2px solid #0D4868', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <p className="italic leading-relaxed" style={{ color: '#5b7280', lineHeight: 1.7 }}>
            Beklim de <span className="font-bold">berg</span>, kook water in de <span className="font-bold">hogedrukpan</span> en stel de <span className="font-bold">drukregelaar</span> in. Zo ontdek je hoe <span className="font-bold">druk</span> het <span className="font-bold">kookpunt</span> van een stof bepaalt en wat dat betekent voor de <span className="font-bold">koeltechniek</span>.
          </p>
        </div>
        <div className="inline-flex items-center justify-center w-32 h-20 rounded-lg mb-6" style={{ background: '#f8fbfc', border: '2px solid #0D4868', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
          <Gauge size={40} color="#0D4868" />
        </div>
        <div>
          <button onClick={onStart}
            className="px-10 py-4 text-white rounded-2xl font-extrabold italic text-xl cursor-pointer transition-all hover:brightness-90 active:scale-95"
            style={{ background: '#1E8F6E', border: '3px solid #0D4868', boxShadow: '0 4px 0 #166F56' }}>
            Start de game
          </button>
        </div>
      </div>
    </div>
  );
}

function Mission1Intro({ onNext }) {
  return (
    <div className="flex flex-col items-center gap-5 p-6">
      <div className="flex items-center gap-2 mb-2">
        <Mountain size={28} color={C.brown} />
        <h2 className="text-xl font-bold italic" style={{ color: C.brownDark }}>Missie 1: De Berg</h2>
      </div>
      <MountainSVG activeStop={-1} />
      <CardBox className="max-w-lg">
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: C.brownDark }}>{TEXTS.m1_intro}</p>
      </CardBox>
      <GameButton onClick={onNext}>Begin de klim</GameButton>
    </div>
  );
}

function M1R1Screen({ state, dispatch }) {
  const options = [
    { label: "71\u00B0C", value: 0 },
    { label: "85\u00B0C", value: 1 },
    { label: "100\u00B0C", value: 2 },
    { label: "122\u00B0C", value: 3 },
  ];
  const correctIdx = 2;
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showThermAnim, setShowThermAnim] = useState(false);
  const [temp, setTemp] = useState(20);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowThermAnim(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showThermAnim) return;
    const start = Date.now();
    const dur = 2000;
    function tick() {
      const elapsed = Date.now() - start;
      const frac = Math.min(1, elapsed / dur);
      setTemp(20 + frac * 80);
      if (frac < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [showThermAnim]);

  const handleCheck = () => {
    if (selected === null) return;
    const correct = selected === correctIdx;
    setIsCorrect(correct);
    setAnswered(true);
    if (correct) {
      setTemp(100);
      dispatch({ type: "SCORE", points: attempts === 0 ? 10 : 5 });
      dispatch({ type: "FEEDBACK", feedback: { type: "correct", text: TEXTS.m1r1_correct } });
    } else {
      setAttempts((a) => a + 1);
      if (attempts >= 1) {
        dispatch({ type: "FEEDBACK", feedback: { type: "incorrect", text: TEXTS.m1r1_wrong } });
        setAnswered(true);
        setIsCorrect(false);
      } else {
        dispatch({ type: "FEEDBACK", feedback: { type: "incorrect", text: TEXTS.m1r1_wrong } });
        setSelected(null);
        setAnswered(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center gap-1 text-sm font-bold" style={{ color: C.brownLight }}>
        <span>Missie 1</span><ChevronRight size={14} /><span>Ronde 1: Zeeniveau</span>
      </div>
      <div className="flex flex-wrap justify-center gap-6 items-start">
        <MountainSVG activeStop={0} />
        <div className="flex flex-col items-center gap-2">
          <ThermometerSVG temperature={temp} minTemp={0} maxTemp={120} boilingPoint={temp >= 100 ? 100 : undefined} />
          <BoilingPot isBoiling={temp >= 100} variant="open" />
        </div>
        <PressureGaugeSVG pressure={1.0} minP={0} maxP={2} />
      </div>
      <CardBox className="max-w-lg w-full">
        <p className="text-sm font-medium mb-3" style={{ color: C.brownDark }}>{TEXTS.m1r1_question}</p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => {
            const isThis = selected === opt.value;
            const wasWrong = answered && !isCorrect && isThis;
            const wasRight = answered && isCorrect && isThis;
            return (
              <button
                key={opt.value}
                onClick={() => !answered && setSelected(opt.value)}
                className="p-3 rounded-lg text-center font-bold transition-all cursor-pointer"
                style={{
                  background: wasRight ? "#e8f5f0" : wasWrong ? "#fdeaea" : isThis ? "#e6f4f5" : C.creamLight,
                  border: `2px solid ${wasRight ? C.green : wasWrong ? C.red : isThis ? "#30B5AE" : "#dbe7ea"}`,
                  color: C.brownDark,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {!answered && selected !== null && (
          <div className="mt-3 text-center">
            <GameButton onClick={handleCheck}>Controleer</GameButton>
          </div>
        )}
        {answered && (isCorrect || attempts >= 1) && (
          <div className="mt-3 text-center">
            <GameButton onClick={() => dispatch({ type: "NEXT_SCREEN" })}>
              Volgende <ArrowRight size={16} className="inline ml-1" />
            </GameButton>
          </div>
        )}
      </CardBox>
    </div>
  );
}

function M1R2Screen({ state, dispatch }) {
  const [estimate, setEstimate] = useState(100);
  const [submitted, setSubmitted] = useState(false);
  const [moved, setMoved] = useState(false);
  const [temp, setTemp] = useState(20);

  useEffect(() => {
    if (!submitted) return;
    const start = Date.now();
    const dur = 2000;
    function tick() {
      const elapsed = Date.now() - start;
      const frac = Math.min(1, elapsed / dur);
      setTemp(20 + frac * (71 - 20));
      if (frac < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [submitted]);

  const handleSubmit = () => {
    setSubmitted(true);
    const diff = Math.abs(estimate - 71);
    let points = 0;
    if (diff <= 5) points = 15;
    else if (diff <= 10) points = 10;
    else if (diff <= 20) points = 5;
    dispatch({ type: "SCORE", points });
    const isGood = diff <= 10;
    dispatch({ type: "FEEDBACK", feedback: { type: isGood ? "correct" : "incorrect", text: isGood ? TEXTS.m1r2_correct : TEXTS.m1r2_wrong } });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center gap-1 text-sm font-bold" style={{ color: C.brownLight }}>
        <span>Missie 1</span><ChevronRight size={14} /><span>Ronde 2: Mount Everest</span>
      </div>
      <div className="flex flex-wrap justify-center gap-6 items-start">
        <MountainSVG activeStop={1} />
        <div className="flex flex-col items-center gap-2">
          <ThermometerSVG temperature={submitted ? temp : 20} minTemp={0} maxTemp={120} boilingPoint={submitted ? 71 : undefined} />
          <BoilingPot isBoiling={submitted && temp >= 71} variant="open" />
        </div>
        <PressureGaugeSVG pressure={0.33} minP={0} maxP={1.5} />
      </div>
      <CardBox className="max-w-lg w-full">
        <p className="text-sm font-medium mb-3" style={{ color: C.brownDark }}>{TEXTS.m1r2_question}</p>
        {!submitted && (
          <>
            <div className="text-center text-2xl font-bold mb-2" style={{ color: C.brown }}>
              Jouw schatting: {estimate}°C
            </div>
            <PressureSlider
              value={estimate} min={50} max={120} step={1}
              onChange={(v) => { setEstimate(v); setMoved(true); }}
              label="" unit="°C"
            />
            {moved && (
              <div className="mt-3 text-center">
                <GameButton onClick={handleSubmit}>Bevestig schatting</GameButton>
              </div>
            )}
          </>
        )}
        {submitted && (
          <div className="mt-3">
            <div className="text-sm mb-2" style={{ color: C.brownDark }}>
              Jouw schatting: {estimate}°C. Werkelijk: 71°C
            </div>
            <ComparisonView columns={[
              { title: "Zeeniveau", pressure: "1,0", boilingPoint: 100 },
              { title: "Mount Everest", pressure: "0,33", boilingPoint: 71 },
            ]} />
            <div className="mt-3 text-center">
              <GameButton onClick={() => dispatch({ type: "NEXT_SCREEN" })}>
                Volgende <ArrowRight size={16} className="inline ml-1" />
              </GameButton>
            </div>
          </div>
        )}
      </CardBox>
    </div>
  );
}

function M1R3Screen({ state, dispatch }) {
  const [step, setStep] = useState("direction"); // direction -> slider -> done
  const [dirAnswer, setDirAnswer] = useState(null);
  const [dirDone, setDirDone] = useState(false);
  const [estimate, setEstimate] = useState(100);
  const [submitted, setSubmitted] = useState(false);
  const [moved, setMoved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [temp, setTemp] = useState(20);

  useEffect(() => {
    if (!submitted) return;
    const start = Date.now();
    const dur = 2000;
    function tick() {
      const elapsed = Date.now() - start;
      const frac = Math.min(1, elapsed / dur);
      setTemp(20 + frac * (122 - 20));
      if (frac < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [submitted]);

  const handleDirCheck = () => {
    if (dirAnswer === null) return;
    if (dirAnswer === 0) {
      dispatch({ type: "SCORE", points: attempts === 0 ? 5 : 3 });
      dispatch({ type: "FEEDBACK", feedback: { type: "correct", text: "Precies! Meer druk = hoger kookpunt." } });
      setDirDone(true);
      setStep("slider");
    } else {
      setAttempts((a) => a + 1);
      dispatch({ type: "FEEDBACK", feedback: { type: "incorrect", text: "Denk terug aan de berg: minder druk gaf een lager kookpunt. Wat zou meer druk dan doen?" } });
      if (attempts >= 1) {
        setDirDone(true);
        setStep("slider");
      } else {
        setDirAnswer(null);
      }
    }
  };

  const handleSliderSubmit = () => {
    setSubmitted(true);
    const diff = Math.abs(estimate - 122);
    let points = 0;
    if (diff <= 5) points = 15;
    else if (diff <= 10) points = 10;
    else if (diff <= 20) points = 5;
    dispatch({ type: "SCORE", points });
    const isGood = diff <= 10;
    dispatch({ type: "FEEDBACK", feedback: { type: isGood ? "correct" : "incorrect", text: isGood ? TEXTS.m1r3_correct : TEXTS.m1r3_wrong } });
  };

  const dirOptions = [
    { label: "Het kookpunt stijgt", value: 0 },
    { label: "Het kookpunt daalt", value: 1 },
    { label: "Het kookpunt blijft gelijk", value: 2 },
  ];

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center gap-1 text-sm font-bold" style={{ color: C.brownLight }}>
        <span>Missie 1</span><ChevronRight size={14} /><span>Ronde 3: Hogedrukpan</span>
      </div>
      <div className="flex flex-wrap justify-center gap-6 items-start">
        <MountainSVG activeStop={2} />
        <div className="flex flex-col items-center gap-2">
          <ThermometerSVG temperature={submitted ? temp : 20} minTemp={0} maxTemp={150} boilingPoint={submitted ? 122 : undefined} />
          <BoilingPot isBoiling={submitted && temp >= 122} variant="pressure" />
        </div>
        <PressureGaugeSVG pressure={2.0} minP={0} maxP={3} />
      </div>
      <CardBox className="max-w-lg w-full">
        <p className="text-sm mb-2" style={{ color: C.brownDark }}>{TEXTS.m1r3_intro}</p>

        {step === "direction" && (
          <>
            <p className="text-sm font-medium mb-3" style={{ color: C.brownDark }}>{TEXTS.m1r3_direction}</p>
            <div className="flex flex-col gap-2">
              {dirOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDirAnswer(opt.value)}
                  className="p-3 rounded-lg text-left font-medium transition-all cursor-pointer"
                  style={{
                    background: dirAnswer === opt.value ? "#e6f4f5" : C.creamLight,
                    border: `2px solid ${dirAnswer === opt.value ? "#30B5AE" : "#dbe7ea"}`,
                    color: C.brownDark,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {dirAnswer !== null && (
              <div className="mt-3 text-center">
                <GameButton onClick={handleDirCheck}>Controleer</GameButton>
              </div>
            )}
          </>
        )}

        {step === "slider" && !submitted && (
          <>
            <p className="text-sm font-medium mb-3" style={{ color: C.brownDark }}>{TEXTS.m1r3_slider}</p>
            <div className="text-center text-2xl font-bold mb-2" style={{ color: C.brown }}>
              Jouw schatting: {estimate}°C
            </div>
            <PressureSlider
              value={estimate} min={80} max={150} step={1}
              onChange={(v) => { setEstimate(v); setMoved(true); }}
              label="" unit="°C"
            />
            {moved && (
              <div className="mt-3 text-center">
                <GameButton onClick={handleSliderSubmit}>Bevestig schatting</GameButton>
              </div>
            )}
          </>
        )}

        {submitted && (
          <div className="mt-3">
            <div className="text-sm mb-2" style={{ color: C.brownDark }}>
              Jouw schatting: {estimate}°C. Werkelijk: 122°C
            </div>
            <ComparisonView columns={[
              { title: "Everest", pressure: "0,33", boilingPoint: 71 },
              { title: "Zeeniveau", pressure: "1,0", boilingPoint: 100 },
              { title: "Hogedrukpan", pressure: "2,0", boilingPoint: 122 },
            ]} />
            <CardBox className="mt-3">
              <p className="text-sm" style={{ color: C.brownDark }}>{TEXTS.m1_outro}</p>
            </CardBox>
            <div className="mt-3 text-center">
              <GameButton onClick={() => dispatch({ type: "NEXT_SCREEN" })}>
                Naar missie 2 <ArrowRight size={16} className="inline ml-1" />
              </GameButton>
            </div>
          </div>
        )}
      </CardBox>
    </div>
  );
}

function Mission2Intro({ onNext }) {
  return (
    <div className="flex flex-col items-center gap-5 p-6">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical size={28} color={C.brown} />
        <h2 className="text-xl font-bold italic" style={{ color: C.brownDark }}>Missie 2: Het Drukvat</h2>
      </div>
      <CardBox className="max-w-lg">
        <p className="text-sm leading-relaxed" style={{ color: C.brownDark }}>{TEXTS.m2_intro}</p>
      </CardBox>
      <GameButton onClick={onNext}>Aan de slag</GameButton>
    </div>
  );
}

function PressureVesselView({ pressure, onPressureChange, fluid = "water", temperature = 100, minP = 0.3, maxP = 3, gaugeMinP, gaugeMaxP, targetTemp }) {
  const table = fluid === "water" ? WATER_BP : R290_BP;
  const bp = getBoilingPoint(table, pressure);
  const isBoiling = temperature >= bp;

  const tMinTemp = fluid === "water" ? 0 : -60;
  const tMaxTemp = fluid === "water" ? 150 : 50;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-4 items-end">
        <PressureGaugeSVG pressure={pressure} minP={gaugeMinP != null ? gaugeMinP : minP} maxP={gaugeMaxP != null ? gaugeMaxP : maxP} />
        <div className="flex flex-col items-center">
          <BoilingPot
            isBoiling={isBoiling}
            fluidColor={fluid === "water" ? C.waterBlue : C.r290Green}
            variant="closed"
          />
          <div className="text-xs mt-1 px-2 py-0.5 rounded" style={{ background: fluid === "water" ? C.waterBlue + "30" : C.r290Green + "30", color: C.brownDark }}>
            {fluid === "water" ? "Water" : "R-290 (Propaan)"}
          </div>
        </div>
        <ThermometerSVG
          temperature={temperature}
          minTemp={tMinTemp}
          maxTemp={tMaxTemp}
          boilingPoint={bp}
          targetTemp={targetTemp}
        />
      </div>
      <div className="text-center text-sm font-medium" style={{ color: C.brownDark }}>
        Kookpunt: <span className="font-bold" style={{ color: C.boilingOrange }}>{bp}°C</span>
        {isBoiling && <span className="ml-2" style={{ color: C.red }}>Het kookt!</span>}
      </div>
      <div className="w-full max-w-xs">
        <PressureSlider
          value={pressure} min={minP} max={maxP}
          step={fluid === "water" ? 0.05 : 0.1}
          onChange={onPressureChange}
          label="Druk"
        />
      </div>
    </div>
  );
}

function M2R1Screen({ state, dispatch }) {
  const [pressure, setPressure] = useState(1.0);
  const [experimentDone, setExperimentDone] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [checkAnswer, setCheckAnswer] = useState(null);
  const [checkDone, setCheckDone] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - startTime.current > 10000) {
        setExperimentDone(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSnapIt = () => setShowCheck(true);

  const handleCheckAnswer = () => {
    if (checkAnswer === null) return;
    if (checkAnswer === 0) {
      dispatch({ type: "SCORE", points: attempts === 0 ? 10 : 5 });
      dispatch({ type: "FEEDBACK", feedback: { type: "correct", text: TEXTS.m2r1_correct } });
      setCheckDone(true);
    } else {
      setAttempts((a) => a + 1);
      dispatch({ type: "FEEDBACK", feedback: { type: "incorrect", text: "Probeer het nog eens: schuif de druk omhoog en kijk of het kookpunt stijgt of daalt." } });
      if (attempts >= 1) setCheckDone(true);
      else setCheckAnswer(null);
    }
  };

  const checkOptions = [
    "Het kookpunt stijgt",
    "Het kookpunt daalt",
    "Het kookpunt blijft gelijk",
  ];

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center gap-1 text-sm font-bold" style={{ color: C.brownLight }}>
        <span>Missie 2</span><ChevronRight size={14} /><span>Ronde 1: Experimenteer</span>
      </div>

      <PressureVesselView pressure={pressure} onPressureChange={setPressure} fluid="water" minP={0} maxP={2} />

      <CardBox className="max-w-lg w-full">
        {!showCheck && (
          <>
            <p className="text-sm mb-3" style={{ color: C.brownDark }}>{TEXTS.m2r1_question}</p>
            {experimentDone && (
              <div className="text-center">
                <GameButton onClick={handleSnapIt}>Ik snap het!</GameButton>
              </div>
            )}
          </>
        )}

        {showCheck && !checkDone && (
          <>
            <p className="text-sm font-medium mb-3" style={{ color: C.brownDark }}>{TEXTS.m2r1_check}</p>
            <div className="flex flex-col gap-2">
              {checkOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setCheckAnswer(i)}
                  className="p-3 rounded-lg text-left font-medium transition-all cursor-pointer"
                  style={{
                    background: checkAnswer === i ? "#e6f4f5" : C.creamLight,
                    border: `2px solid ${checkAnswer === i ? "#30B5AE" : "#dbe7ea"}`,
                    color: C.brownDark,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {checkAnswer !== null && (
              <div className="mt-3 text-center">
                <GameButton onClick={handleCheckAnswer}>Controleer</GameButton>
              </div>
            )}
          </>
        )}

        {checkDone && (
          <div className="mt-3 text-center">
            <GameButton onClick={() => dispatch({ type: "NEXT_SCREEN" })}>
              Volgende <ArrowRight size={16} className="inline ml-1" />
            </GameButton>
          </div>
        )}
      </CardBox>
    </div>
  );
}

function M2R2Screen({ state, dispatch }) {
  const [taskIdx, setTaskIdx] = useState(0);
  const [pressure, setPressure] = useState(1.0);
  const [attempts, setAttempts] = useState(0);
  const [taskDone, setTaskDone] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const task = M2_WATER_TASKS[taskIdx];
  const bp = getBoilingPoint(WATER_BP, pressure);

  const handleConfirm = () => {
    const diff = Math.abs(pressure - task.requiredPressure);
    if (diff <= task.margin) {
      const points = diff <= 0.1 ? 10 : diff <= 0.2 ? 7 : 4;
      dispatch({ type: "SCORE", points });
      dispatch({ type: "FEEDBACK", feedback: { type: "correct", text: TEXTS.m2r2_correct } });
      setTaskDone(true);
    } else {
      setAttempts((a) => a + 1);
      const direction = pressure < task.requiredPressure ? "hoger" : "lager";
      if (attempts >= 1) {
        dispatch({ type: "FEEDBACK", feedback: { type: "incorrect", text: `Het juiste antwoord is ~${task.requiredPressure} bar.` } });
        setTaskDone(true);
      } else {
        dispatch({ type: "FEEDBACK", feedback: { type: "incorrect", text: `Je zit er ${diff.toFixed(2)} bar naast. De druk moet ${direction}.` } });
      }
    }
  };

  const handleNext = () => {
    if (taskIdx < M2_WATER_TASKS.length - 1) {
      setTaskIdx((i) => i + 1);
      setPressure(1.0);
      setAttempts(0);
      setTaskDone(false);
    } else {
      setAllDone(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center gap-1 text-sm font-bold" style={{ color: C.brownLight }}>
        <span>Missie 2</span><ChevronRight size={14} /><span>Ronde 2: Opdrachten ({taskIdx + 1}/{M2_WATER_TASKS.length})</span>
      </div>

      <PressureVesselView
        pressure={pressure}
        onPressureChange={setPressure}
        fluid="water"
        targetTemp={task.targetTemp}
        minP={0}
        maxP={2}
      />

      <CardBox className="max-w-lg w-full">
        <p className="text-sm font-medium mb-2" style={{ color: C.brownDark }}>{task.text}</p>
        <p className="text-xs mb-3" style={{ color: C.brownLight }}>
          Breng de <span className="font-bold">oranje lijn</span> naar de <span className="font-bold">groene streep</span>!
        </p>
        {!taskDone ? (
          <div className="text-center">
            <GameButton onClick={handleConfirm}>Bevestig</GameButton>
          </div>
        ) : !allDone ? (
          <div className="text-center">
            <GameButton onClick={handleNext}>
              Volgende opdracht <ArrowRight size={16} className="inline ml-1" />
            </GameButton>
          </div>
        ) : (
          <div className="text-center">
            <GameButton onClick={() => dispatch({ type: "NEXT_SCREEN" })}>
              Volgende <ArrowRight size={16} className="inline ml-1" />
            </GameButton>
          </div>
        )}
      </CardBox>
    </div>
  );
}

function BoilingPointChart({ pressure, activeFluid, highlightFluid }) {
  const W = 580, H = 340;
  const padL = 55, padR = 20, padT = 20, padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const minP = 0.3, maxP = 40;
  const minT = -80, maxT = 140;

  const logMin = Math.log10(minP);
  const logMax = Math.log10(maxP);

  function pToX(p) {
    const logP = Math.log10(Math.max(minP, Math.min(maxP, p)));
    return padL + ((logP - logMin) / (logMax - logMin)) * plotW;
  }
  function tToY(t) {
    return padT + plotH - ((t - minT) / (maxT - minT)) * plotH;
  }

  // Pressure ticks (log scale)
  const pTicks = [0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30];
  // Temperature ticks
  const tTicks = [];
  for (let t = -80; t <= 140; t += 20) tTicks.push(t);

  // Build curve paths
  function curvePath(table) {
    const pts = table.filter(d => d.pressure >= minP && d.pressure <= maxP);
    if (pts.length < 2) return "";
    return pts.map((d, i) => `${i === 0 ? "M" : "L"}${pToX(d.pressure).toFixed(1)},${tToY(d.boilingPoint).toFixed(1)}`).join(" ");
  }

  // Find intersection of pressure line with a curve
  function getIntersection(table, p) {
    const bp = getBoilingPoint(table, p);
    if (bp === undefined || bp === null) return null;
    if (p < table[0].pressure || p > table[table.length - 1].pressure) return null;
    return bp;
  }

  const pressureX = pToX(pressure);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full h-auto">
      {/* Background */}
      <rect width={W} height={H} rx="8" fill={C.creamLight} />
      <rect x={padL} y={padT} width={plotW} height={plotH} fill={C.white} stroke="#dbe7ea" strokeWidth="1" />

      {/* Grid lines - horizontal (temperature) */}
      {tTicks.map((t) => (
        <g key={`t${t}`}>
          <line x1={padL} y1={tToY(t)} x2={padL + plotW} y2={tToY(t)} stroke="#eef4f6" strokeWidth="1" />
          <text x={padL - 6} y={tToY(t) + 4} fontSize="9" fill="#5b7280" textAnchor="end">{t}°</text>
        </g>
      ))}

      {/* Grid lines - vertical (pressure) */}
      {pTicks.map((p) => (
        <g key={`p${p}`}>
          <line x1={pToX(p)} y1={padT} x2={pToX(p)} y2={padT + plotH} stroke="#eef4f6" strokeWidth="1" />
          <text x={pToX(p)} y={padT + plotH + 14} fontSize="9" fill="#5b7280" textAnchor="middle">{p}</text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={padL + plotW / 2} y={H - 4} fontSize="10" fill={C.brownDark} textAnchor="middle" fontWeight="bold">Druk (bar)</text>
      <text x="12" y={padT + plotH / 2} fontSize="10" fill={C.brownDark} textAnchor="middle" fontWeight="bold" transform={`rotate(-90, 12, ${padT + plotH / 2})`}>Temperatuur (°C)</text>

      {/* 0°C reference line */}
      <line x1={padL} y1={tToY(0)} x2={padL + plotW} y2={tToY(0)} stroke="#99D3D8" strokeWidth="1" strokeDasharray="4,4" />
      <text x={padL + plotW + 2} y={tToY(0) + 4} fontSize="8" fill="#5b7280">0°C</text>

      {/* Boiling curves */}
      {REFRIGERANTS.map((ref) => {
        const isActive = activeFluid === ref.name;
        const isHighlight = highlightFluid === ref.name;
        const opacity = activeFluid && !isActive && !isHighlight ? 0.25 : 1;
        const strokeW = isActive || isHighlight ? 3 : 2;
        const path = curvePath(ref.table);
        // Label position: end of curve
        const lastPt = ref.table[ref.table.length - 1];
        const labelX = pToX(Math.min(lastPt.pressure, maxP));
        const labelY = tToY(lastPt.boilingPoint);

        return (
          <g key={ref.name} opacity={opacity} style={{ transition: "opacity 300ms" }}>
            <path d={path} fill="none" stroke={ref.color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
            <text x={labelX + 4} y={labelY + 4} fontSize="9" fill={ref.color} fontWeight="bold">{ref.name}</text>
          </g>
        );
      })}

      {/* Vertical pressure line */}
      {pressure > 0 && (
        <line
          x1={pressureX} y1={padT} x2={pressureX} y2={padT + plotH}
          stroke={C.boilingOrange} strokeWidth="2" strokeDasharray="6,4"
          style={{ transition: "x1 200ms, x2 200ms" }}
        />
      )}

      {/* Intersection dots */}
      {pressure > 0 && REFRIGERANTS.map((ref) => {
        const bp = getIntersection(ref.table, pressure);
        if (bp === null) return null;
        const isActive = activeFluid === ref.name;
        const opacity = activeFluid && !isActive ? 0.2 : 1;
        return (
          <g key={`dot-${ref.name}`} opacity={opacity} style={{ transition: "opacity 300ms" }}>
            <circle cx={pressureX} cy={tToY(bp)} r={isActive ? 6 : 4} fill={ref.color} stroke={C.white} strokeWidth="2" />
            {(isActive || !activeFluid) && (
              <g>
                <rect x={pressureX + 8} y={tToY(bp) - 10} width="42" height="16" rx="3" fill={ref.color} opacity="0.9" />
                <text x={pressureX + 12} y={tToY(bp) + 2} fontSize="10" fill="white" fontWeight="bold">{bp}°C</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function M2R3Screen({ state, dispatch }) {
  const [taskIdx, setTaskIdx] = useState(0);
  const [pressure, setPressure] = useState(5.0);
  const [attempts, setAttempts] = useState(0);
  const [taskDone, setTaskDone] = useState(false);
  const [allDone, setAllDone] = useState(false);

  // Logarithmic slider: position 0-1000 maps to log(0.3) - log(40)
  const logMin = Math.log10(0.3);
  const logMax = Math.log10(40);
  const sliderVal = ((Math.log10(pressure) - logMin) / (logMax - logMin)) * 1000;

  const handleSlider = (v) => {
    const logP = logMin + (v / 1000) * (logMax - logMin);
    setPressure(Math.round(Math.pow(10, logP) * 100) / 100);
  };

  const task = M2R3_TASKS[taskIdx];
  const pointsPerTask = [6, 6, 6, 7]; // totaal 25

  const handleConfirm = () => {
    const diff = Math.abs(pressure - task.requiredPressure);
    if (diff <= task.margin) {
      const pts = pointsPerTask[taskIdx];
      dispatch({ type: "SCORE", points: pts });
      const ref = REFRIGERANTS.find(r => r.name === task.fluid);
      dispatch({ type: "FEEDBACK", feedback: { type: "correct", text: `Goed! ${task.fluid} kookt bij ${task.requiredPressure} bar op ${task.targetTemp}\u00B0C.` } });
      setTaskDone(true);
    } else {
      setAttempts((a) => a + 1);
      const direction = pressure < task.requiredPressure ? "hoger" : "lager";
      if (attempts >= 1) {
        dispatch({ type: "SCORE", points: Math.max(0, pointsPerTask[taskIdx] - 3) });
        dispatch({ type: "FEEDBACK", feedback: { type: "incorrect", text: `De druk moet ~${task.requiredPressure} bar zijn voor ${task.targetTemp}\u00B0C.` } });
        setTaskDone(true);
      } else {
        dispatch({ type: "FEEDBACK", feedback: { type: "incorrect", text: `De druk moet ${direction}. Probeer het nog eens!` } });
      }
    }
  };

  const handleNext = () => {
    if (taskIdx < M2R3_TASKS.length - 1) {
      setTaskIdx((i) => i + 1);
      setPressure(5.0);
      setAttempts(0);
      setTaskDone(false);
    } else {
      setAllDone(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center gap-1 text-sm font-bold" style={{ color: C.brownLight }}>
        <span>Missie 2</span><ChevronRight size={14} /><span>Ronde 3: Koudemiddelen ({taskIdx + 1}/{M2R3_TASKS.length})</span>
      </div>

      <CardBox className="max-w-2xl mb-1">
        <p className="text-sm" style={{ color: C.brownDark }}>
          Elke stof heeft een eigen <span className="font-bold">kookpunt</span> dat afhangt van de <span className="font-bold">druk</span>. Verschuif de <span className="font-bold">drukslider</span> en zoek het juiste kookpunt op de grafiek!
        </p>
      </CardBox>

      {/* Chart */}
      <BoilingPointChart pressure={pressure} activeFluid={task.fluid} />

      {/* Slider */}
      <div className="w-full max-w-xl">
        <div className="text-center font-bold text-lg mb-1" style={{ color: C.brownDark }}>
          Druk: {pressure.toFixed(1)} bar
        </div>
        <input
          type="range"
          min={0} max={1000} step={1}
          value={sliderVal}
          onChange={(e) => handleSlider(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: "#30B5AE", background: "#dbe7ea" }}
        />
        <div className="flex justify-between text-xs mt-0.5" style={{ color: "#5b7280" }}>
          <span>0.3 bar</span>
          <span>40 bar</span>
        </div>
      </div>

      {/* Task card */}
      <CardBox className="max-w-lg w-full">
        <p className="text-sm font-medium mb-2" style={{ color: C.brownDark }}>
          <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: REFRIGERANTS.find(r => r.name === task.fluid)?.color }} />
          {task.text}
        </p>
        {!taskDone ? (
          <div className="text-center">
            <GameButton onClick={handleConfirm}>Bevestig</GameButton>
          </div>
        ) : !allDone ? (
          <div className="text-center">
            <GameButton onClick={handleNext}>
              Volgende opdracht <ArrowRight size={16} className="inline ml-1" />
            </GameButton>
          </div>
        ) : (
          <div className="text-center">
            <GameButton onClick={() => dispatch({ type: "NEXT_SCREEN" })}>
              Resultaat <ArrowRight size={16} className="inline ml-1" />
            </GameButton>
          </div>
        )}
      </CardBox>
    </div>
  );
}

function EndScreen({ score, onRestart }) {
  const stars = score >= 80 ? 3 : score >= 60 ? 2 : 1;

  return (
    <div className="flex flex-col items-center gap-5 p-6">
      <h2 className="text-2xl font-bold italic" style={{ color: C.brownDark }}>Resultaat</h2>
      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <Star
            key={s}
            size={40}
            fill={s <= stars ? C.gold : "transparent"}
            color={C.gold}
            strokeWidth={2}
          />
        ))}
      </div>
      <div className="text-4xl font-bold" style={{ color: C.brown }}>{score}/100</div>
      <CardBox className="max-w-lg">
        <p className="text-sm leading-relaxed" style={{ color: C.brownDark }}>{TEXTS.ending}</p>
      </CardBox>

      {/* Summary table */}
      <div className="w-full max-w-lg overflow-x-auto">
        <table className="w-full text-sm rounded-lg overflow-hidden" style={{ border: "2px solid #0D4868" }}>
          <thead>
            <tr style={{ background: C.brown, color: C.white }}>
              <th className="px-3 py-2 text-left font-bold">Stof</th>
              <th className="px-3 py-2 text-left font-bold">Druk</th>
              <th className="px-3 py-2 text-left font-bold">Kookpunt</th>
              <th className="px-3 py-2 text-left font-bold">Context</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Water", "0,33 bar", "71\u00B0C", "Mount Everest"],
              ["Water", "1 bar", "100\u00B0C", "Zeeniveau"],
              ["Water", "2 bar", "122\u00B0C", "Hogedrukpan"],
              ["R-290", "1 bar", "-42\u00B0C", "Standaard"],
              ["R-290", "~2,8 bar", "-10\u00B0C", "Koelinstallatie"],
            ].map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? C.creamLight : C.cream }}>
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2" style={{ color: C.brownDark, borderTop: "1px solid #dbe7ea" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GameButton onClick={onRestart}>
        <RotateCcw size={16} className="inline mr-2" />
        Opnieuw spelen
      </GameButton>
    </div>
  );
}

// ─── MAIN GAME COMPONENT ───

const SCREEN_ORDER = [
  "start", "mission1_intro", "m1r1", "m1r2", "m1r3",
  "mission2_intro", "m2r1", "m2r2", "m2r3", "end",
];

function gameReducer(state, action) {
  switch (action.type) {
    case "NEXT_SCREEN": {
      const idx = SCREEN_ORDER.indexOf(state.screen);
      const next = idx < SCREEN_ORDER.length - 1 ? SCREEN_ORDER[idx + 1] : state.screen;
      return { ...state, screen: next, feedback: null };
    }
    case "GO_TO":
      return { ...state, screen: action.screen, feedback: null };
    case "SCORE":
      return { ...state, score: state.score + action.points };
    case "LOSE_LIFE":
      return { ...state, lives: Math.max(0, state.lives - 1) };
    case "FEEDBACK":
      return { ...state, feedback: action.feedback };
    case "CLEAR_FEEDBACK":
      return { ...state, feedback: null };
    case "RESET":
      return { screen: "start", score: 0, lives: 5, feedback: null };
    default:
      return state;
  }
}

export default function PressureGame() {
  const [screen, setScreen] = useState("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [feedback, setFeedback] = useState(null);
  const juice = useGameJuice();

  const dispatch = useCallback((action) => {
    switch (action.type) {
      case "NEXT_SCREEN":
        setScreen((prev) => {
          const idx = SCREEN_ORDER.indexOf(prev);
          if (idx < SCREEN_ORDER.length - 1) {
            const next = SCREEN_ORDER[idx + 1];
            if (next.startsWith("mission") && !next.includes("intro") || next === "end") {
              juice.triggerLevelUp();
            }
          }
          return idx < SCREEN_ORDER.length - 1 ? SCREEN_ORDER[idx + 1] : prev;
        });
        setFeedback(null);
        break;
      case "GO_TO":
        setScreen(action.screen);
        setFeedback(null);
        break;
      case "SCORE":
        setScore((s) => s + action.points);
        juice.triggerCorrect(action.points, action.event);
        break;
      case "LOSE_LIFE":
        setLives((l) => Math.max(0, l - 1));
        juice.triggerWrong();
        break;
      case "FEEDBACK":
        setFeedback(action.feedback);
        if (action.feedback?.type === "incorrect") juice.triggerWrong();
        break;
      case "CLEAR_FEEDBACK":
        setFeedback(null);
        break;
      case "RESET":
        setScreen("start");
        setScore(0);
        setLives(5);
        setFeedback(null);
        break;
    }
  }, [juice]);

  const state = { screen, score, lives, feedback };

  const renderScreen = () => {
    switch (screen) {
      case "start":
        return <StartScreen onStart={() => dispatch({ type: "NEXT_SCREEN" })} />;
      case "mission1_intro":
        return <Mission1Intro onNext={() => dispatch({ type: "NEXT_SCREEN" })} />;
      case "m1r1":
        return <M1R1Screen state={state} dispatch={dispatch} />;
      case "m1r2":
        return <M1R2Screen state={state} dispatch={dispatch} />;
      case "m1r3":
        return <M1R3Screen state={state} dispatch={dispatch} />;
      case "mission2_intro":
        return <Mission2Intro onNext={() => dispatch({ type: "NEXT_SCREEN" })} />;
      case "m2r1":
        return <M2R1Screen state={state} dispatch={dispatch} />;
      case "m2r2":
        return <M2R2Screen state={state} dispatch={dispatch} />;
      case "m2r3":
        return <M2R3Screen state={state} dispatch={dispatch} />;
      case "end":
        return <EndScreen score={score} onRestart={() => dispatch({ type: "RESET" })} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: C.cream }}>
      <juice.JuiceOverlay />
      <div
        className="max-w-3xl mx-auto transition-transform"
        style={{ animation: juice.shaking ? "shake 0.3s ease-in-out" : "none" }}
      >
        {/* Header bar */}
        <div className="sticky top-0 z-40 rounded-b-lg shadow-md" style={{ background: "linear-gradient(120deg,#0D4868 0%,#1b7f96 55%,#30B5AE 100%)" }}>
          {screen !== "start" && screen !== "end" && (
            <ProgressBar screen={screen} score={score} lives={lives} />
          )}
          {(screen === "start" || screen === "end") && (
            <div className="py-2 px-4 flex items-center">
              <img src="/studium-beeldmerk.png" alt="Studium" className="h-6 w-auto" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pb-8">
          {renderScreen()}
        </div>

        {/* Feedback popup */}
        {feedback && (
          <FeedbackPopup
            type={feedback.type}
            text={feedback.text}
            onClose={() => setFeedback(null)}
          />
        )}

      </div>
    </div>
  );
}
