import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Rocket,
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Quote,
  Clock,
  ChevronRight,
  Layers,
  Bot
} from 'lucide-react';

const QUICK_PERSONAS = [
  { label: 'Sarah Connor', role: 'Manager', dept: 'Customer Success', email: 'manager@launchops.ai', desc: 'Approve plans & view blockers' },
  { label: 'David Kim', role: 'IT Lead', dept: 'IT', email: 'it@launchops.ai', desc: 'Manage Okta SSO & receive unblock alerts' },
  { label: 'Elena Rostova', role: 'Finance Lead', dept: 'Finance', email: 'finance@launchops.ai', desc: 'Track billing contact & invoices' },
  { label: 'Alex Rivera', role: 'Sales Rep', dept: 'Sales', email: 'sales@launchops.ai', desc: 'Upload kickoff notes & handoff' }
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@launchops.ai');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (personaEmail) => {
    setError('');
    setLoading(true);
    try {
      await login(personaEmail, 'Password123!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            LaunchOps <span className="text-indigo-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => handleQuickLogin('manager@launchops.ai')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>Live Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Split-Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 flex-1">
        {/* Left Column: The Hook, Pitch, and Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            ENTERPRISE ONBOARDING INTELLIGENCE
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            The Autonomous Brain for Your Customer Onboarding & Operations.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
            Eliminate fragmented kickoff notes, missing billing info, and stalled security sign-offs. LaunchOps AI turns unstructured sales handoffs into auditable, traceable action plans with automated blocker release.
          </p>

          {/* Primary Action Button and Secondary Action */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => handleQuickLogin('manager@launchops.ai')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer group"
              >
                <span>{loading ? 'Launching Workspace...' : 'Launch Operations Cockpit'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
              >
                {showManualForm ? 'Hide Sign In Form' : 'Sign In With Credentials'}
              </button>
            </div>

            {/* Micro-copy Proof */}
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                No setup required
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                Grounded Google Gemini citations
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                Role-based access
              </span>
            </div>
          </div>

          {/* 1-Click Demo Personas */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>Select Persona to Test Specific Role Permissions:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-lg">
              {QUICK_PERSONAS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleQuickLogin(p.email)}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/50 text-left border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center justify-between">
                    <span>{p.label}</span>
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[10px] text-indigo-400 font-semibold">{p.dept} • {p.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Manual Login Form */}
          {showManualForm && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 animate-in fade-in duration-150 max-w-lg">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Account Credentials</div>
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    placeholder="Email address"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    placeholder="Password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Product Mockup & Proof */}
        <div className="lg:col-span-6 relative">
          <div className="relative rounded-2xl glass-card border border-slate-700/80 shadow-2xl p-6 overflow-hidden space-y-4 glow-indigo">
            {/* Window Topbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-2 text-xs font-bold text-slate-300">Acme Logistics — Live Onboarding Workspace</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse font-semibold">
                ● Status: Blocked
              </span>
            </div>

            {/* Target Date and Customer Badge */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Target Launch: <strong className="text-white">Nov 15, 2026 (500 Enterprise Seats)</strong></span>
              <span className="text-indigo-400 font-semibold">Manager: Sarah Connor</span>
            </div>

            {/* Live Task Board Snippet */}
            <div className="space-y-2.5">
              {/* Task 1: Security Review */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Security
                    </span>
                    <span className="text-xs font-bold text-white">Complete Security & Compliance Review</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Owner: David Kim • Due: Oct 15</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  In Progress
                </span>
              </div>

              {/* Task 2: Okta SSO (Blocked by Task 1) */}
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      IT
                    </span>
                    <span className="text-xs font-bold text-white">Configure Okta Single Sign-On (SSO)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Blocked
                  </span>
                </div>
                <div className="text-[11px] text-rose-300/90 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Waiting on prerequisite: "Complete Security & Compliance Review"</span>
                </div>
              </div>

              {/* Task 3: Finance Billing */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Finance
                    </span>
                    <span className="text-xs font-bold text-white">Collect Customer Billing Contact & PO</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Missing customer invoicing email</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  In Progress
                </span>
              </div>
            </div>

            {/* AI Citation Grounding Tooltip Box */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/50 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
                <span className="flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  Gemini Grounded Source Citation
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/80">Paragraph 4</span>
              </div>
              <blockquote className="text-[11px] text-slate-300 italic border-l-2 border-indigo-500 pl-2">
                "IT architecture and API provisioning must strictly wait for Security approval before credentials are generated."
              </blockquote>
            </div>

            {/* Bottom Demo Launcher Strip */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
              <span>Interactive pre-seeded dataset</span>
              <button
                onClick={() => handleQuickLogin('manager@launchops.ai')}
                className="text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Click to explore full workspace →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-4 text-center text-xs text-slate-500 z-10 border-t border-slate-900">
        LaunchOps AI — Built for enterprise customer onboarding handoffs and automated dependency resolution.
      </footer>
    </div>
  );
}
