import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

/**
 * Generate a human-readable AI insight based on the top reason string.
 */
function generateInsight(topReason, probability) {
  if (!topReason) return null;
  const lower = topReason.toLowerCase();
  const prob  = Math.round((probability ?? 0) * 100);

  // Delinquency-driven high risk
  if (lower.includes('delinq')) {
    return {
      icon: AlertTriangle,
      iconColor: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
      headline: '⚠️ High risk driven mainly by delinquency behavior.',
      body: `Past late payments are the primary signal raising risk to ${prob}%. Even a single payment improvement in the next 3–6 months can meaningfully shift this score.`,
    };
  }

  // Debt-ratio driven
  if (lower.includes('debt_ratio') || lower.includes('debt ratio')) {
    return {
      icon: TrendingUp,
      iconColor: '#f97316',
      bg: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.2)',
      headline: '⚠️ Elevated debt load is the main risk driver.',
      body: `A high debt-to-income ratio (currently reflected in your score of ${prob}%) signals financial overextension. Bringing the ratio below 0.4 would significantly improve creditworthiness.`,
    };
  }

  // Income reducing risk
  if (
    (lower.includes('monthly_inc') || lower.includes('monthly inc') || lower.includes('income')) &&
    lower.includes('decreased')
  ) {
    return {
      icon: TrendingDown,
      iconColor: '#22c55e',
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.2)',
      headline: '💡 Strong income is helping to reduce your risk.',
      body: `Your monthly income is the most protective factor in this assessment (risk: ${prob}%). Maintaining or growing income stability will continue to work in your favor.`,
    };
  }

  // Revolving utilization
  if (lower.includes('rev_util') || lower.includes('revolving')) {
    return {
      icon: TrendingUp,
      iconColor: '#eab308',
      bg: 'rgba(234,179,8,0.08)',
      border: 'rgba(234,179,8,0.2)',
      headline: '⚠️ High credit utilization is a key risk signal.',
      body: `Revolving utilization above 30% negatively impacts risk models. Paying down balances to below 30% of credit limits could reduce the ${prob}% score noticeably.`,
    };
  }

  // Generic fallback
  if (lower.includes('increased')) {
    return {
      icon: AlertTriangle,
      iconColor: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
      headline: `⚠️ Risk is elevated at ${prob}% — action recommended.`,
      body: 'The primary factor shown above is driving up risk. Review the recommendations below for steps to improve your credit profile.',
    };
  }

  return {
    icon: Lightbulb,
    iconColor: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    headline: `💡 Risk profile looks manageable at ${prob}%.`,
    body: 'The leading factor in this assessment is working in your favor. Maintaining current financial habits will help keep risk low.',
  };
}

export default function InsightBox({ topReasons, probability }) {
  const topReason = topReasons?.[0] ?? null;
  const insight   = generateInsight(topReason, probability);

  if (!insight) return null;

  const Icon = insight.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{
        background: insight.bg,
        border: `1px solid ${insight.border}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
        style={{ background: `${insight.iconColor}22` }}
      >
        <Icon size={18} style={{ color: insight.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-manrope font-semibold text-white leading-snug mb-1.5 tracking-tight">
          {insight.headline}
        </p>
        <p className="text-[#d4e4fa] font-inter text-xs leading-relaxed opacity-90">{insight.body}</p>
      </div>
    </motion.div>
  );
}
