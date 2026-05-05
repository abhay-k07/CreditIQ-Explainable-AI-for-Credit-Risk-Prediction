import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, CreditCard, TrendingDown, Briefcase, ShieldCheck } from 'lucide-react';

const RULE_MAP = [
  {
    match: (r) => r.includes('delinq'),
    icon: Clock,
    color: '#ef4444',
    text: 'Reduce late payments — set up auto-pay to avoid missed due dates.',
  },
  {
    match: (r) => r.includes('debt_ratio') || r.includes('debt ratio'),
    icon: TrendingDown,
    color: '#f97316',
    text: 'Lower your debt-to-income ratio below 0.4 by paying off high-interest liabilities first.',
  },
  {
    match: (r) =>
      (r.includes('monthly_inc') || r.includes('income')) && r.includes('increased'),
    icon: Briefcase,
    color: '#eab308',
    text: 'Increase income stability — consider additional income streams or reducing expenses.',
  },
  {
    match: (r) => r.includes('rev_util') || r.includes('revolving'),
    icon: CreditCard,
    color: '#a78bfa',
    text: 'Keep revolving credit utilization below 30% of your total credit limit.',
  },
  {
    match: (r) => r.includes('open_credit') || r.includes('open credit'),
    icon: ShieldCheck,
    color: '#60a5fa',
    text: 'Avoid opening too many new credit lines simultaneously; it signals higher risk.',
  },
  {
    match: (r) => r.includes('late_30') || r.includes('late_60') || r.includes('late_90'),
    icon: Clock,
    color: '#ef4444',
    text: 'Address overdue accounts — contact lenders about payment plans or hardship programs.',
  },
];

function buildRecommendations(topReasons) {
  if (!topReasons?.length) return [];
  const seen = new Set();
  const recs = [];

  for (const reason of topReasons) {
    const lower = reason.toLowerCase();
    for (const rule of RULE_MAP) {
      const key = rule.text;
      if (!seen.has(key) && rule.match(lower)) {
        seen.add(key);
        recs.push(rule);
      }
    }
  }

  // Always add a generic baseline if < 2 recs found
  if (recs.length < 2) {
    recs.push({
      icon: CheckCircle,
      color: '#22c55e',
      text: "Maintain consistent on-time payment history — it's the single biggest credit score driver.",
    });
  }

  return recs;
}

export default function Recommendations({ topReasons }) {
  const recs = buildRecommendations(topReasons);

  if (!recs.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass rounded-2xl p-6 border border-white/5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#2E5BFF]/10 flex items-center justify-center border border-[#2E5BFF]/20 shadow-[0_0_15px_rgba(46,91,255,0.1)]">
          <CheckCircle size={18} className="text-[#2E5BFF]" />
        </div>
        <div>
          <h2 className="text-xl font-manrope font-semibold text-white leading-none tracking-tight">Recommendations</h2>
          <p className="text-[#8e90a2] font-inter text-xs mt-1">How to improve your score</p>
        </div>
      </div>

      <div className="space-y-3">
        {recs.map((rec, i) => {
          const Icon = rec.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.35 }}
              whileHover={{ scale: 1.012, translateX: 3 }}
              className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-default"
              style={{
                background: `${rec.color}0d`,
                border: `1px solid ${rec.color}30`,
                transition: 'box-shadow 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 10px ${rec.color}28`; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: `${rec.color}22` }}
              >
                <Icon size={15} style={{ color: rec.color }} />
              </div>
              <p className="text-[#d4e4fa] font-inter text-sm leading-relaxed">{rec.text}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
