import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip,
  CartesianGrid, Legend,
} from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { fetchFairness } from '../services/api';

const GROUP_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a78bfa'];

export default function FairnessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFairness()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail || 'Failed to load fairness data. Run train.py first.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#051424] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#2E5BFF]/20 border-t-[#2E5BFF] animate-spin mx-auto mb-3 shadow-[0_0_15px_rgba(46,91,255,0.5)]" />
          <p className="font-space text-[11px] uppercase tracking-widest text-[#8e90a2]">Loading fairness analysis…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#051424] min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-md text-center border border-[#ef4444]/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <p className="text-[#ef4444] font-inter text-sm mb-2">⚠️ {error}</p>
          <p className="text-[#8e90a2] font-inter text-xs">Run <code className="text-[#2E5BFF] bg-[#2E5BFF]/10 px-1.5 py-0.5 rounded">python model/train.py</code> to generate fairness data.</p>
        </div>
      </div>
    );
  }

  const groups = data?.groups || [];
  const di = data?.disparate_impact_ratio;
  const isFair = di !== null && di >= 0.8;

  // Chart data
  const predRateData = groups.map((g, i) => ({
    group: g.group,
    'Prediction Rate': g.prediction_rate,
    'Actual Default Rate': g.actual_default_rate,
    color: GROUP_COLORS[i],
  }));

  const accuracyData = groups.map((g, i) => ({
    group: g.group,
    accuracy: g.accuracy,
    color: GROUP_COLORS[i],
  }));

  return (
    <div className="bg-[#051424] text-[#d4e4fa] min-h-screen font-inter selection:bg-[#2E5BFF]/30 pb-24">
      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center gap-3 sticky top-0 z-40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E5BFF] to-[#124af0] flex items-center justify-center shadow-[0_0_15px_rgba(46,91,255,0.4)]">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-manrope font-bold text-lg leading-none tracking-tight">Fairness & Bias Analysis</h1>
          <p className="text-[#8e90a2] font-space text-[11px] uppercase tracking-widest mt-1">Model fairness across age demographics</p>
        </div>
      </header>

      <div className="p-6" style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Disparate Impact Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6 flex items-start gap-4 shadow-2xl"
          style={{
            background: isFair ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isFair ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <div
            className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-inner"
            style={{ background: isFair ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}
          >
            {isFair
              ? <CheckCircle size={24} className="text-[#10b981]" />
              : <AlertTriangle size={24} className="text-[#ef4444]" />
            }
          </div>
          <div>
            <h2 className="text-white font-manrope font-semibold text-xl mb-1 tracking-tight">
              Disparate Impact Ratio: <span style={{ color: isFair ? '#10b981' : '#ef4444' }}>
                {di !== null ? di.toFixed(3) : 'N/A'}
              </span>
            </h2>
            <p className="text-[#d4e4fa] font-inter text-sm leading-relaxed opacity-90 mt-2">
              {data?.interpretation}
            </p>
            <p className="text-[#8e90a2] font-inter text-xs mt-3">
              The U.S. EEOC 80% rule: a ratio below 0.8 may indicate adverse impact against a protected group.
              <br/>Threshold used: <span className="font-space">{data?.threshold_used}</span>
            </p>
          </div>
        </motion.div>

        {/* Group Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {groups.map((g, i) => (
            <motion.div
              key={g.group}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5 border border-white/5 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users size={16} style={{ color: GROUP_COLORS[i] }} />
                <span className="text-[15px] font-manrope font-semibold text-white tracking-tight">Age {g.group}</span>
                <span className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] ml-auto">{g.count} samples</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2]">Accuracy</span>
                  <span className="font-space text-sm font-bold text-white">{(g.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2]">Pred. Rate</span>
                  <span className="font-space text-sm font-bold" style={{ color: g.prediction_rate > 0.3 ? '#ef4444' : '#10b981' }}>
                    {(g.prediction_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2]">True Default</span>
                  <span className="font-space text-sm font-bold text-[#d4e4fa]">{(g.actual_default_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2]">Avg Prob</span>
                  <span className="font-space text-sm font-bold text-[#2E5BFF]">{(g.avg_probability * 100).toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

          {/* Prediction Rate vs Actual Default Rate */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-[15px] font-manrope font-semibold text-white mb-1 tracking-tight">Prediction Rate vs Actual Default Rate</h3>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mb-4">Comparing model predictions against ground truth by age group</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={predRateData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="group" tick={{ fill: '#8e90a2', fontSize: 11, fontFamily: 'Space Grotesk' }} />
                <YAxis tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(5,20,36,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }}
                  formatter={(v) => `${(v*100).toFixed(1)}%`}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Space Grotesk' }} />
                <Bar dataKey="Prediction Rate" fill="#ef444488" stroke="#ef4444" radius={[4,4,0,0]} />
                <Bar dataKey="Actual Default Rate" fill="#2E5BFF88" stroke="#2E5BFF" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Accuracy by Group */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-[15px] font-manrope font-semibold text-white mb-1 tracking-tight">Model Accuracy by Age Group</h3>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mb-4">Does the model perform equally well across demographics?</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="group" tick={{ fill: '#8e90a2', fontSize: 11, fontFamily: 'Space Grotesk' }} />
                <YAxis domain={[0, 1]} tick={{ fill: '#8e90a2', fontSize: 10, fontFamily: 'Space Grotesk' }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(5,20,36,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }}
                  formatter={(v) => `${(v*100).toFixed(1)}%`}
                />
                <Bar dataKey="accuracy" radius={[4,4,0,0]}>
                  {accuracyData.map((_, i) => (
                    <Cell key={i} fill={`${GROUP_COLORS[i]}88`} stroke={GROUP_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Methodology note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 border border-white/5 shadow-xl"
        >
          <h3 className="text-[15px] font-manrope font-semibold text-white mb-3 tracking-tight">📋 Methodology</h3>
          <div className="text-xs font-inter text-[#8e90a2] leading-relaxed space-y-3">
            <p>
              <strong className="text-white font-semibold">Protected attribute:</strong> Age (binned into 18-30, 31-45, 46-60, 61+). While age is used as a model input feature, this analysis examines whether the model&apos;s predictions are disproportionately harsh toward any age group.
            </p>
            <p>
              <strong className="text-white font-semibold">Disparate Impact Ratio (DIR):</strong> Calculated as min(prediction_rate) / max(prediction_rate) across groups. The U.S. EEOC "4/5ths rule" considers a DIR below 0.8 as evidence of adverse impact.
            </p>
            <p>
              <strong className="text-white font-semibold">Limitations:</strong> This analysis only examines age-based fairness. A complete fairness audit should include gender, race, geography, and intersectional analysis. The dataset does not contain these attributes.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
