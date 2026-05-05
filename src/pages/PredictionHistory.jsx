import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, Download, ArrowUpDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

function getRiskBadge(label) {
  if (label === 'HIGH') return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  if (label === 'MEDIUM') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
}

export default function PredictionHistory() {
  const [history, setHistory] = useState([]);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [filterRisk, setFilterRisk] = useState('all');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('creditiq_history') || '[]');
    setHistory(stored);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('creditiq_history');
    setHistory([]);
  };

  const exportCSV = () => {
    if (!history.length) return;
    const headers = ['Timestamp', 'Risk', 'Probability', 'Label', 'Age', 'Income', 'DebtRatio', 'RevUtil', 'Top Reason'];
    const rows = history.map((h) => [
      h.timestamp,
      h.result.risk,
      h.result.probability.toFixed(4),
      h.result.risk_label,
      h.input.age,
      h.input.monthly_inc,
      h.input.debt_ratio,
      h.input.rev_util,
      `"${(h.result.top_reasons?.[0] || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creditiq_history_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let items = [...history];
    if (filterRisk !== 'all') items = items.filter(h => h.result.risk_label === filterRisk);
    items.sort((a, b) => {
      let va, vb;
      if (sortBy === 'timestamp') { va = a.timestamp; vb = b.timestamp; }
      else if (sortBy === 'probability') { va = a.result.probability; vb = b.result.probability; }
      else if (sortBy === 'age') { va = parseInt(a.input.age) || 0; vb = parseInt(b.input.age) || 0; }
      else { va = a.timestamp; vb = b.timestamp; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [history, sortBy, sortDir, filterRisk]);

  // Stats
  const totalCount = history.length;
  const highRiskCount = history.filter(h => h.result.risk_label === 'HIGH').length;
  const avgProb = totalCount ? (history.reduce((s, h) => s + h.result.probability, 0) / totalCount) : 0;

  return (
    <div className="bg-[#051424] text-[#d4e4fa] min-h-screen font-inter selection:bg-[#2E5BFF]/30 pb-24">
      {/* Header */}
      <header className="glass border-b border-white/5 px-6 py-4 flex items-center gap-3 sticky top-0 z-40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E5BFF] to-[#124af0] flex items-center justify-center shadow-[0_0_15px_rgba(46,91,255,0.4)]">
          <History size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-manrope font-bold text-lg leading-none tracking-tight">Prediction History</h1>
          <p className="text-[#8e90a2] font-space text-[11px] uppercase tracking-widest mt-1">{totalCount} predictions saved locally</p>
        </div>
      </header>

      <div className="p-6" style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-2xl p-5 text-center border border-white/5 shadow-xl">
            <p className="text-3xl font-space font-bold text-white tracking-tight">{totalCount}</p>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mt-1">Total Predictions</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center border border-white/5 shadow-xl">
            <p className="text-3xl font-space font-bold text-[#ef4444] tracking-tight">{highRiskCount}</p>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mt-1">High Risk Flagged</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center border border-white/5 shadow-xl">
            <p className="text-3xl font-space font-bold text-[#2E5BFF] tracking-tight">{(avgProb * 100).toFixed(1)}%</p>
            <p className="font-space text-[10px] uppercase tracking-widest text-[#8e90a2] mt-1">Avg Probability</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Filter */}
          <div className="flex items-center gap-1">
            {['all', 'LOW', 'MEDIUM', 'HIGH'].map(f => (
              <button
                key={f}
                onClick={() => setFilterRisk(f)}
                className={`px-4 py-2 rounded-xl font-space text-[11px] uppercase tracking-widest font-bold transition-all ${
                  filterRisk === f
                    ? 'bg-[#2E5BFF]/20 text-[#d4e4fa] border border-[#2E5BFF]/30 shadow-[0_0_10px_rgba(46,91,255,0.2)]'
                    : 'text-[#8e90a2] hover:text-[#d4e4fa] border border-white/5 hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <button onClick={exportCSV} disabled={!totalCount}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-space text-[11px] uppercase tracking-widest font-bold text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 hover:bg-[#10b981]/20 transition-all disabled:opacity-30">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={clearHistory} disabled={!totalCount}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-space text-[11px] uppercase tracking-widest font-bold text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 hover:bg-[#ef4444]/20 transition-all disabled:opacity-30">
            <Trash2 size={14} /> Clear
          </button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/5 shadow-xl">
            <Clock size={36} className="text-[#8e90a2] mx-auto mb-4 opacity-50" />
            <p className="text-[#d4e4fa] font-inter text-sm mb-2">No predictions yet.</p>
            <p className="text-[#8e90a2] font-inter text-xs">Run a prediction on the Dashboard — it will appear here automatically.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {[
                      { key: 'timestamp', label: 'Time' },
                      { key: 'probability', label: 'Probability' },
                      { key: null, label: 'Risk' },
                      { key: 'age', label: 'Age' },
                      { key: null, label: 'Income' },
                      { key: null, label: 'Debt Ratio' },
                      { key: null, label: 'Top Reason' },
                    ].map(({ key, label }) => (
                      <th
                        key={label}
                        className={`px-5 py-4 text-left font-space text-[10px] uppercase tracking-widest text-[#8e90a2] font-semibold ${key ? 'cursor-pointer hover:text-white transition-colors' : ''}`}
                        onClick={() => key && toggleSort(key)}
                      >
                        <span className="flex items-center gap-1.5">
                          {label}
                          {key && sortBy === key && <ArrowUpDown size={12} className="text-[#2E5BFF]" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((h, i) => {
                      const badge = getRiskBadge(h.result.risk_label);
                      return (
                        <motion.tr
                          key={h.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-5 py-4 font-space text-[11px] text-[#8e90a2] group-hover:text-[#d4e4fa] transition-colors">
                            {new Date(h.timestamp).toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-white font-space font-bold tracking-wide">{(h.result.probability * 100).toFixed(1)}%</span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="px-3 py-1 rounded-full font-space text-[10px] uppercase tracking-widest font-bold"
                              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}40` }}
                            >
                              {h.result.risk_label}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-space text-[12px] text-[#d4e4fa]">{h.input.age}</td>
                          <td className="px-5 py-4 font-space text-[12px] text-[#d4e4fa]">${Number(h.input.monthly_inc).toLocaleString()}</td>
                          <td className="px-5 py-4 font-space text-[12px] text-[#d4e4fa]">{Number(h.input.debt_ratio).toFixed(2)}</td>
                          <td className="px-5 py-4 font-inter text-xs text-[#8e90a2] max-w-[220px] truncate group-hover:text-[#d4e4fa] transition-colors">
                            {h.result.top_reasons?.[0] || '—'}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
