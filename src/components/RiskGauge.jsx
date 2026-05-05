import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap } from 'lucide-react';

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Smoothly animate a numeric value */
function useAnimatedValue(target, duration = 600) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    startRef.current = null;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(function tick(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setValue(current);
      fromRef.current = current;
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

export default function RiskGauge({ probability }) {
  const targetPct = typeof probability === 'number' ? Math.max(0, Math.min(100, probability * 100)) : 0;
  const pct = useAnimatedValue(targetPct, 700);

  const { color, glowClass, label, labelColor } = useMemo(() => {
    if (targetPct < 40) return { color: '#22c55e', glowClass: 'glow-green', label: 'LOW RISK',    labelColor: '#22c55e' };
    if (targetPct < 70) return { color: '#eab308', glowClass: 'glow-yellow', label: 'MEDIUM RISK', labelColor: '#eab308' };
    return                    { color: '#ef4444', glowClass: 'glow-red',    label: 'HIGH RISK',   labelColor: '#ef4444' };
  }, [targetPct]);

  const startAngle  = -135;
  const totalSweep  = 270;
  const endAngle    = startAngle + (pct / 100) * totalSweep;

  const cx = 120, cy = 120, r = 88;
  const trackPath = describeArc(cx, cy, r, startAngle, startAngle + totalSweep);
  const valuePath = pct > 0.1
    ? describeArc(cx, cy, r, startAngle, Math.min(endAngle, startAngle + totalSweep - 0.01))
    : null;

  const ticks = [0, 25, 50, 75, 100];
  const confidence = Math.round(targetPct);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className={`glass rounded-2xl p-6 flex flex-col items-center ${glowClass} border border-white/5`}
      style={{ position: 'relative' }}
    >
      {/* Header row */}
      <div className="w-full flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-manrope font-semibold text-white leading-none tracking-tight">Risk Assessment</h2>
          <p className="text-[#8e90a2] font-inter text-xs mt-1">AI-generated credit risk score</p>
        </div>

        {/* Confidence + Model info — top right */}
        {targetPct > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="text-right"
          >
            <div className="flex items-center gap-1 justify-end mb-0.5">
              <Zap size={11} className="text-[#f59e0b]" />
              <span className="font-space text-[11px] uppercase tracking-widest font-bold text-white">Confidence: {confidence}%</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Cpu size={11} className="text-[#2E5BFF]" />
              <span className="font-space text-[10px] uppercase tracking-wider text-[#8e90a2]">XGBoost + SHAP</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* SVG Gauge */}
      <div className="relative" style={{ width: 240, height: 200 }}>
        <svg width="240" height="200" viewBox="0 0 240 200">
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Zone bands */}
          <path d={describeArc(cx, cy, r, startAngle, startAngle + 270 * 0.4)} fill="none" stroke="rgba(34,197,94,0.15)"  strokeWidth="14" strokeLinecap="round" />
          <path d={describeArc(cx, cy, r, startAngle + 270 * 0.4, startAngle + 270 * 0.7)} fill="none" stroke="rgba(234,179,8,0.15)" strokeWidth="14" strokeLinecap="round" />
          <path d={describeArc(cx, cy, r, startAngle + 270 * 0.7, startAngle + 270)} fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="14" strokeLinecap="round" />

          {/* Animated value arc (driven by JS rAF, no pathLength trick needed) */}
          {valuePath && (
            <path
              d={valuePath}
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
          )}

          {/* Tick labels */}
          {ticks.map((t) => {
            const angle = startAngle + (t / 100) * totalSweep;
            const pos = polarToCartesian(cx, cy, r + 22, angle);
            return (
              <text
                key={t}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(148,163,184,0.7)"
                fontSize="9"
                fontWeight="500"
                fontFamily="Inter, sans-serif"
              >
                {t}
              </text>
            );
          })}

          {/* Center text */}
          <text x={cx} y={cy - 14} textAnchor="middle" fill="white" fontSize="36" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
            {Math.round(pct)}%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill={labelColor} fontSize="11" fontWeight="700" fontFamily="Space Grotesk, sans-serif" letterSpacing="2">
            {label}
          </text>

          {/* Needle dot */}
          {valuePath && (() => {
            const tip = polarToCartesian(cx, cy, r, Math.min(endAngle, startAngle + totalSweep - 0.01));
            return (
              <circle
                cx={tip.x}
                cy={tip.y}
                r="7"
                fill={color}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            );
          })()}
        </svg>
      </div>

      {/* Risk badge */}
      <motion.div
        key={label}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 px-6 py-2 rounded-full font-space text-[11px] font-bold tracking-[0.15em] uppercase"
        style={{
          background: `${color}22`,
          border: `1px solid ${color}55`,
          color: color,
          boxShadow: `0 0 16px ${color}33`,
        }}
      >
        {label}
      </motion.div>
    </motion.div>
  );
}
