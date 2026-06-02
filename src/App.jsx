import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";

const PRESETS = [
  { label: "ETF indiciel (ex: MSCI World)", value: 0.15, color: "#1a6b3c" },
  { label: "ETF actif / Robo-advisor", value: 0.75, color: "#b45309" },
  { label: "Assurance-vie classique", value: 1.5, color: "#b91c1c" },
  { label: "Fonds actif bancaire", value: 2.5, color: "#7c3aed" },
];

function formatEur(val) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M€`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k€`;
  return `${Math.round(val)}€`;
}

function simulateWithFee({ initial, monthly, grossRate, fee, years }) {
  const netMonthlyRate = (grossRate - fee) / 100 / 12;
  let value = initial;
  const data = [];
  for (let y = 0; y <= years; y++) {
    data.push({ year: y, value: Math.round(value) });
    for (let m = 0; m < 12; m++) {
      value = value * (1 + netMonthlyRate) + monthly;
    }
  }
  return data;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#fffef9",
        border: "1px solid #e5e0d5",
        borderRadius: 8,
        padding: "12px 16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
      }}>
        <div style={{ color: "#999", marginBottom: 8, fontFamily: "'Cormorant Garamond', serif", fontSize: 14 }}>
          Année {label}
        </div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 4, display: "flex", justifyContent: "space-between", gap: 24 }}>
            <span style={{ color: "#888" }}>{p.name}</span>
            <strong>{formatEur(p.value)}</strong>
          </div>
        ))}
        {payload.length >= 2 && (
          <div style={{ borderTop: "1px solid #e5e0d5", marginTop: 8, paddingTop: 8, color: "#b91c1c", fontWeight: 600 }}>
            Écart : {formatEur(Math.abs(payload[0].value - payload[payload.length - 1].value))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [initial, setInitial] = useState(5000);
  const [monthly, setMonthly] = useState(200);
  const [years, setYears] = useState(30);
  const [grossRate, setGrossRate] = useState(7);
  const [selectedFees, setSelectedFees] = useState([0, 2]);
  const [customFees, setCustomFees] = useState([
    { label: "Mon ETF", value: 0.15 },
    { label: "Concurrent", value: 1.5 },
  ]);

  const toggleFee = (i) => {
    setSelectedFees(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const totalInvested = initial + monthly * 12 * years;

  const chartData = useMemo(() => {
    const map = {};
    for (let y = 0; y <= years; y++) map[y] = { year: y };
    selectedFees.forEach(i => {
      const p = PRESETS[i];
      const series = simulateWithFee({ initial, monthly, grossRate, fee: p.value, years });
      series.forEach(({ year, value }) => {
        map[year][p.label] = value;
      });
    });
    return Object.values(map);
  }, [initial, monthly, years, grossRate, selectedFees]);

  const finals = useMemo(() => {
    return selectedFees.map(i => {
      const p = PRESETS[i];
      const series = simulateWithFee({ initial, monthly, grossRate, fee: p.value, years });
      return { ...p, final: series[series.length - 1].value };
    });
  }, [initial, monthly, years, grossRate, selectedFees]);

  const best = finals.length ? Math.max(...finals.map(f => f.final)) : 0;
  const worst = finals.length ? Math.min(...finals.map(f => f.final)) : 0;
  const gap = best - worst;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#faf9f5",
      color: "#1a1a1a",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 2px; background: #ddd; border-radius: 2px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #1a1a1a; cursor: pointer; }
        .fee-btn { border: 1px solid #e0dbd0; background: #fff; border-radius: 8px; padding: 12px 14px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; font-family: 'DM Sans', sans-serif; }
        .fee-btn:hover { border-color: #aaa; }
        .fee-btn.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
        .divider { height: 1px; background: #e8e3d8; margin: 20px 0; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #e8e3d8",
        padding: "32px 48px",
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
            Outil d'analyse · Frais de gestion
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            L'impact réel des frais<br />
            <em style={{ fontWeight: 400, color: "#b91c1c" }}>sur 30 ans d'investissement</em>
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#999", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Argent perdu en frais</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 600, color: "#b91c1c" }}>
            {formatEur(gap)}
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>entre le meilleur et le pire scénario</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "calc(100vh - 140px)" }}>

        {/* LEFT PANEL */}
        <div style={{ borderRight: "1px solid #e8e3d8", padding: "32px 24px", background: "#fff" }}>

          <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
            Paramètres
          </div>

          {[
            { label: "Capital initial", value: initial, set: setInitial, min: 0, max: 100000, step: 500, fmt: formatEur },
            { label: "Versement mensuel", value: monthly, set: setMonthly, min: 0, max: 3000, step: 50, fmt: v => `${formatEur(v)}/mois` },
            { label: "Horizon", value: years, set: setYears, min: 5, max: 40, step: 1, fmt: v => `${v} ans` },
            { label: "Rendement brut estimé", value: grossRate, set: setGrossRate, min: 2, max: 12, step: 0.5, fmt: v => `${v}%/an` },
          ].map(({ label, value, set, min, max, step, fmt }) => (
            <div key={label} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500 }}>{fmt(value)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(+e.target.value)} />
            </div>
          ))}

          <div className="divider" />

          <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
            Comparer les frais
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                className={`fee-btn ${selectedFees.includes(i) ? "active" : ""}`}
                onClick={() => toggleFee(i)}
              >
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{p.label}</div>
                <div style={{
                  fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  color: selectedFees.includes(i) ? "#aaa" : "#999"
                }}>
                  {p.value}% / an
                </div>
              </button>
            ))}
          </div>

          <div className="divider" />

          <div style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
            Total investi sur {years} ans
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600 }}>
            {formatEur(totalInvested)}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ padding: "32px 40px" }}>

          {/* Chart */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
              Évolution du patrimoine net de frais
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                <defs>
                  {selectedFees.map(i => (
                    <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PRESETS[i].color} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={PRESETS[i].color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
                <XAxis dataKey="year" stroke="#ccc" tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'DM Mono', monospace" }} tickFormatter={v => `${v}a`} />
                <YAxis stroke="#ccc" tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'DM Mono', monospace" }} tickFormatter={formatEur} width={65} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={totalInvested} stroke="#ddd" strokeDasharray="4 4" label={{ value: "Investi", fill: "#bbb", fontSize: 11 }} />
                {selectedFees.map(i => (
                  <Area
                    key={i}
                    type="monotone"
                    dataKey={PRESETS[i].label}
                    stroke={PRESETS[i].color}
                    strokeWidth={2}
                    fill={`url(#grad${i})`}
                    dot={false}
                    activeDot={{ r: 4, fill: PRESETS[i].color }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Results cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            {finals.map((f, i) => {
              const isBest = f.final === best;
              const gainLost = f.final - best;
              const feesPaid = (initial + monthly * 12 * years) * (f.value / 100) * years;
              return (
                <div key={i} style={{
                  border: `1px solid ${isBest ? "#1a6b3c" : "#e8e3d8"}`,
                  borderRadius: 12,
                  padding: "20px",
                  background: isBest ? "#f0faf4" : "#fff",
                  position: "relative",
                }}>
                  {isBest && (
                    <div style={{
                      position: "absolute", top: -1, right: 12,
                      background: "#1a6b3c", color: "#fff",
                      fontSize: 10, fontFamily: "'DM Mono', monospace",
                      padding: "3px 10px", borderRadius: "0 0 6px 6px",
                      letterSpacing: "0.08em"
                    }}>
                      OPTIMAL
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{f.label}</div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: f.color,
                    background: `${f.color}15`,
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    marginBottom: 12,
                  }}>
                    {f.value}%/an
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>
                    {formatEur(f.final)}
                  </div>
                  <div style={{ fontSize: 12, color: gainLost < 0 ? "#b91c1c" : "#1a6b3c", fontFamily: "'DM Mono', monospace" }}>
                    {gainLost < 0 ? `− ${formatEur(Math.abs(gainLost))} vs optimal` : "Meilleur scénario"}
                  </div>
                  <div className="divider" style={{ margin: "12px 0" }} />
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    Gain net : <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{formatEur(f.final - totalInvested)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insight box */}
          {finals.length >= 2 && (
            <div style={{
              background: "#fff9f9",
              border: "1px solid #fecaca",
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              gap: 20,
              alignItems: "center",
            }}>
              <div style={{ fontSize: 40, fontFamily: "'Cormorant Garamond', serif", color: "#b91c1c", fontWeight: 600, whiteSpace: "nowrap" }}>
                {formatEur(gap)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  C'est ce que coûte la différence de frais sur {years} ans
                </div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                  Soit <strong style={{ color: "#b91c1c" }}>{((gap / best) * 100).toFixed(0)}%</strong> de ton patrimoine final sacrifié en frais.
                  Un écart de frais qui semble minime chaque année devient colossal grâce aux intérêts composés.
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: "#ccc", marginTop: 24, fontFamily: "'DM Mono', monospace" }}>
            Simulation à titre indicatif · Les performances passées ne préjugent pas des performances futures
          </div>
        </div>
      </div>
    </div>
  );
}
