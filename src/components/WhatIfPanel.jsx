import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders, RefreshCw } from 'lucide-react';

const sliderConfig = [
  {
    key: 'monthly_inc',
    label: 'Monthly Income',
    min: 0,
    max: 20000,
    step: 100,
    format: (v) => `$${Number(v).toLocaleString()}`,
    color: '#2E5BFF',
  },
  {
    key: 'debt_ratio',
    label: 'Debt Ratio',
    min: 0,
    max: 2,
    step: 0.01,
    format: (v) => Number(v).toFixed(2),
    color: '#b8c3ff',
  },
  {
    key: 'rev_util',
    label: 'Revolving Utilization',
    min: 0,
    max: 1,
    step: 0.01,
    format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
    color: '#124af0',
  },
];

export default function WhatIfPanel({ values, onChange, isLoading }) {
  const [localVals, setLocalVals] = useState({
    monthly_inc: values.monthly_inc ?? 5000,
    debt_ratio: values.debt_ratio ?? 0.3,
    rev_util: values.rev_util ?? 0.3,
  });

  const debounceRef = React.useRef(null);

  const handleSlider = useCallback(
    (key, val) => {
      const next = { ...localVals, [key]: val };
      setLocalVals(next);

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange({ ...values, ...next });
      }, 600);
    },
    [localVals, values, onChange]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-2xl p-6 border border-white/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2E5BFF]/10 flex items-center justify-center border border-[#2E5BFF]/20 shadow-[0_0_15px_rgba(46,91,255,0.1)]">
            <Sliders size={18} className="text-[#2E5BFF]" />
          </div>
          <div>
            <h2 className="text-lg font-manrope font-semibold text-white leading-none tracking-tight">What-If Analysis</h2>
            <p className="text-[#8e90a2] font-inter text-xs mt-1">Adjust to see real-time risk changes</p>
          </div>
        </div>
        {isLoading && (
          <RefreshCw size={16} className="text-[#2E5BFF] animate-spin shadow-[0_0_10px_rgba(46,91,255,0.5)] rounded-full" />
        )}
      </div>

      <div className="space-y-6">
        {sliderConfig.map(({ key, label, min, max, step, format, color }) => {
          const val = localVals[key];
          const pct = ((val - min) / (max - min)) * 100;

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-space uppercase tracking-wider text-[#d4e4fa]">{label}</label>
                <motion.span
                  key={val}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="font-space font-bold text-sm tracking-wide"
                  style={{ color }}
                >
                  {format(val)}
                </motion.span>
              </div>

              {/* Custom styled range */}
              <div className="relative">
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-1">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: color,
                      boxShadow: `0 0 8px ${color}80`,
                    }}
                    layout
                    transition={{ duration: 0.15 }}
                  />
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={(e) => handleSlider(key, parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 h-1.5 cursor-pointer"
                  style={{ background: 'transparent' }}
                />
              </div>

              <div className="flex justify-between font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mt-2">
                <span>{format(min)}</span>
                <span>{format(max)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2]/50 text-center mt-6">
        Updates automatically with 600ms debounce
      </p>
    </motion.div>
  );
}
