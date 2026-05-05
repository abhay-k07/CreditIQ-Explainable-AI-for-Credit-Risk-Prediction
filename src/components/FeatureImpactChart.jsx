import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';

/**
 * Build chart data from REAL SHAP values returned by the API.
 * Falls back to reason-text heuristic only if shapValues is unavailable.
 */
function buildChartData(topReasons, shapValues) {
  if (!topReasons?.length) return [];

  // If we have real SHAP values, use them (fixes A3)
  if (shapValues && typeof shapValues === 'object' && Object.keys(shapValues).length > 0) {
    const sorted = Object.entries(shapValues)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 8); // Show top 8 features

    return sorted.map(([feature, value]) => {
      // Clean up feature name for display
      const label = feature
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const displayLabel = label.length > 28 ? label.slice(0, 28) + '…' : label;

      return {
        label: displayLabel,
        fullLabel: label,
        value: parseFloat(value.toFixed(4)),
        isNegative: value > 0, // positive SHAP = increases risk = bad
      };
    });
  }

  // Fallback: heuristic from reason strings (legacy behavior)
  return topReasons.map((reason, i) => {
    const lower = reason.toLowerCase();
    const isNegative = lower.includes('increased');
    const magnitude = parseFloat((0.35 - i * 0.04).toFixed(3));
    const value = isNegative ? magnitude : -magnitude;
    const label = reason.length > 38 ? reason.slice(0, 38) + '…' : reason;
    return { label, value, isNegative };
  });
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    const impact = Math.abs(d.value);
    return (
      <div className="glass-strong rounded-xl px-4 py-3 text-[11px] max-w-[280px] border border-white/10 shadow-2xl">
        <p className="text-[#d4e4fa] font-inter leading-relaxed mb-1 font-medium">
          {d.fullLabel || d.label}
        </p>
        <p style={{ color: d.isNegative ? '#ef4444' : '#10b981' }} className="font-space font-semibold uppercase tracking-widest text-[10px]">
          {d.isNegative ? '↑' : '↓'} SHAP Impact: {d.value > 0 ? '+' : ''}{d.value.toFixed(4)}
        </p>
        <p className="text-[#8e90a2] font-inter mt-1.5 opacity-90">
          {d.isNegative ? 'Increases default risk' : 'Decreases default risk'}
        </p>
      </div>
    );
  }
  return null;
};

export default function FeatureImpactChart({ topReasons, shapValues }) {
  const data = useMemo(() => buildChartData(topReasons, shapValues), [topReasons, shapValues]);

  if (!data.length) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-manrope font-semibold text-white mb-2 tracking-tight">Feature Impact (SHAP)</h2>
        <p className="text-[#8e90a2] font-inter text-sm">Run a prediction to see feature impact.</p>
      </div>
    );
  }

  // Determine axis domain from actual data
  const maxVal = Math.max(...data.map(d => Math.abs(d.value)));
  const domain = [-(maxVal * 1.2), maxVal * 1.2];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass rounded-2xl p-6 border border-white/5"
    >
      <h2 className="text-xl font-manrope font-semibold text-white mb-1 tracking-tight">Feature Impact (SHAP)</h2>
      <p className="text-[#8e90a2] font-inter text-xs mb-5">
        <span className="text-[#ffb4ab] font-medium">Red →</span> increases risk &nbsp;|&nbsp;
        <span className="text-[#10b981] font-medium">Green →</span> reduces risk
        {shapValues && <span className="text-[#2E5BFF] ml-2 font-medium">• Real SHAP values</span>}
      </p>

      <ResponsiveContainer width="100%" height={data.length * 52 + 20}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <XAxis
            type="number"
            domain={domain}
            tickFormatter={(v) => v.toFixed(2)}
            tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            tickLine={false}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={180}
            tick={{ fill: '#d4e4fa', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isNegative ? '#ef444466' : '#10b98166'}
                stroke={entry.isNegative ? '#ef4444' : '#10b981'}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
