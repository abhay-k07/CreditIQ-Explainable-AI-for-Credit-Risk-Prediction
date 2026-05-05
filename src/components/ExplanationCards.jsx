import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

/**
 * FIXED: Classify by "increased" / "decreased" keywords in the reason string,
 * which are injected directly by the SHAP explanation layer.
 */
function classifyReason(reason) {
  const lower = reason.toLowerCase();
  if (lower.includes('increased')) return 'negative';   // risk went up
  if (lower.includes('decreased')) return 'positive';   // risk went down
  return 'neutral';
}

export default function ExplanationCards({ topReasons }) {
  if (!topReasons || topReasons.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/5">
        <h2 className="text-xl font-manrope font-semibold text-white mb-2 tracking-tight">Key Risk Factors</h2>
        <p className="text-[#8e90a2] font-inter text-sm">Run a prediction to see explanations.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 border border-white/5"
    >
      <h2 className="text-xl font-manrope font-semibold text-white mb-1 tracking-tight">Key Risk Factors</h2>
      <p className="text-[#8e90a2] font-inter text-xs mb-4">Top drivers of this prediction</p>

      <div className="grid grid-cols-1 gap-3">
        {topReasons.map((reason, i) => {
          const type = classifyReason(reason);
          const isNeg = type === 'negative';
          const isPos = type === 'positive';

          const config = isNeg
            ? {
                icon: TrendingUp,
                color: '#ef4444',
                bg: 'rgba(239,68,68,0.08)',
                border: 'rgba(239,68,68,0.22)',
                label: 'Risk Increased',
                arrow: '↑',
              }
            : isPos
            ? {
                icon: TrendingDown,
                color: '#22c55e',
                bg: 'rgba(34,197,94,0.08)',
                border: 'rgba(34,197,94,0.22)',
                label: 'Risk Reduced',
                arrow: '↓',
              }
            : {
                icon: AlertTriangle,
                color: '#eab308',
                bg: 'rgba(234,179,8,0.08)',
                border: 'rgba(234,179,8,0.22)',
                label: 'Notable Factor',
                arrow: '~',
              };

          const Icon = config.icon;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.015, translateX: 2 }}
              className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-default transition-all"
              style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
                boxShadow: `0 0 0 0 ${config.color}`,
                transition: 'box-shadow 0.25s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 0 12px ${config.color}33`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = `0 0 0 0 ${config.color}`;
              }}
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: `${config.color}22` }}
              >
                <Icon size={15} style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="font-space text-[10px] font-bold uppercase tracking-widest block mb-1"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
                <p className="text-[#d4e4fa] font-inter text-sm leading-relaxed">{reason}</p>
              </div>
              <span
                className="flex-shrink-0 text-lg font-bold mt-1"
                style={{ color: config.color }}
              >
                {config.arrow}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
