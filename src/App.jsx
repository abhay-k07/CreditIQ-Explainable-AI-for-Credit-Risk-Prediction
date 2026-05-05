import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Brain, BarChart3, History, Shield } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MetricsDashboard from './pages/MetricsDashboard';
import PredictionHistory from './pages/PredictionHistory';
import FairnessPage from './pages/FairnessPage';

const navItems = [
  { to: '/',          icon: Brain,     label: 'Predict' },
  { to: '/metrics',   icon: BarChart3, label: 'Metrics' },
  { to: '/history',   icon: History,   label: 'History' },
  { to: '/fairness',  icon: Shield,    label: 'Fairness' },
];

export default function App() {
  return (
    <Router>
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/5 flex items-center justify-center gap-2 px-4 py-3 md:top-auto md:bottom-0 font-space uppercase tracking-wider">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? 'text-[#2E5BFF] bg-[#2E5BFF]/10 shadow-[0_0_15px_rgba(46,91,255,0.2)]'
                  : 'text-[#8e90a2] hover:text-[#d4e4fa] hover:bg-white/5'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Page content with bottom padding for nav */}
      <div className="pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/metrics" element={<MetricsDashboard />} />
          <Route path="/history" element={<PredictionHistory />} />
          <Route path="/fairness" element={<FairnessPage />} />
        </Routes>
      </div>
    </Router>
  );
}
