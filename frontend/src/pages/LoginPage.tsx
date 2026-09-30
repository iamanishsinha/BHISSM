import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Landmark,
  Hospital,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Sparkles
} from 'lucide-react';

interface CredentialItem {
  label: string;
  user: string;
  pass: string;
  role: 'National' | 'State' | 'Hospital';
  stateGroup: 'National' | 'Puducherry' | 'Tamil Nadu' | 'Karnataka' | 'Other';
  jurisdiction: string;
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('state_puducherry_admin');
  const [password, setPassword] = useState('BHISSM@State#P01');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'National' | 'Puducherry' | 'Tamil Nadu' | 'Karnataka' | 'Other'>('All');

  // If already logged in, redirect immediately to dashboard
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handlePerformLogin = async (userToAuth: string, passToAuth: string) => {
    setError('');
    setLoading(true);
    try {
      await login(userToAuth, passToAuth);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (!err.response) {
        setError(`Cannot reach BHISSM API (${err.message || 'Network Error'}). Please check /api/health.`);
      } else {
        const errorText = err.response?.data?.error || err.response?.data?.message || `HTTP ${err.response.status}: Authentication failed`;
        setError(errorText);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePerformLogin(username, password);
  };

  const demoCredentials: CredentialItem[] = [
    // National Command
    {
      label: 'National Stockpile Monitor',
      user: 'national_monitor_01',
      pass: 'BHISSM@National#01',
      role: 'National',
      stateGroup: 'National',
      jurisdiction: 'Apex Authority (Stockpile Releases & Nationwide View)',
    },
    {
      label: 'National Logistics Director',
      user: 'national_director_01',
      pass: 'BHISSM@National#Dir01',
      role: 'National',
      stateGroup: 'National',
      jurisdiction: 'Central Disaster Health Coordinator',
    },

    // Puducherry UT
    {
      label: 'Puducherry UT State Admin',
      user: 'state_puducherry_admin',
      pass: 'BHISSM@State#P01',
      role: 'State',
      stateGroup: 'Puducherry',
      jurisdiction: 'Puducherry UT Health Department',
    },
    {
      label: 'JIPMER Central Hospital',
      user: 'hospital_jipmer_01',
      pass: 'BHISSM@Demo#J01',
      role: 'Hospital',
      stateGroup: 'Puducherry',
      jurisdiction: 'JIPMER Apex Medical College, Puducherry',
    },
    {
      label: 'GH Puducherry Hospital',
      user: 'hospital_puducherry_01',
      pass: 'BHISSM@Demo#P01',
      role: 'Hospital',
      stateGroup: 'Puducherry',
      jurisdiction: 'Indira Gandhi Govt General Hospital, Puducherry',
    },
    {
      label: 'PIMS (Kalapet, Puducherry)',
      user: 'hospital_pims_01',
      pass: 'BHISSM@Demo#PIMS01',
      role: 'Hospital',
      stateGroup: 'Puducherry',
      jurisdiction: 'Pondicherry Institute of Medical Sciences, Kalapet',
    },
    {
      label: 'Rajiv Gandhi Women & Children',
      user: 'hospital_rggwch_01',
      pass: 'BHISSM@Demo#RGW01',
      role: 'Hospital',
      stateGroup: 'Puducherry',
      jurisdiction: 'Rajiv Gandhi Govt Women & Children Hospital, Puducherry',
    },
    {
      label: 'East Coast Hospitals (Private)',
      user: 'hospital_eastcoast_01',
      pass: 'BHISSM@Demo#ECH01',
      role: 'Hospital',
      stateGroup: 'Puducherry',
      jurisdiction: 'East Coast Hospitals (Private Multi-Specialty), Puducherry',
    },
    {
      label: 'Auroville Health Centre',
      user: 'hospital_auroville_01',
      pass: 'BHISSM@Demo#AV01',
      role: 'Hospital',
      stateGroup: 'Puducherry',
      jurisdiction: 'Auroville Health Centre (Aspiration, Auroville Area)',
    },

    // Tamil Nadu
    {
      label: 'Tamil Nadu State Admin',
      user: 'state_tamilnadu_admin',
      pass: 'BHISSM@State#TN01',
      role: 'State',
      stateGroup: 'Tamil Nadu',
      jurisdiction: 'Tamil Nadu State Health Command, Chennai',
    },
    {
      label: 'Santigiri Hospital (Auroville Area)',
      user: 'hospital_santigiri_01',
      pass: 'BHISSM@Demo#AV02',
      role: 'Hospital',
      stateGroup: 'Tamil Nadu',
      jurisdiction: 'Santigiri & Quiet Healing Hospital, Auroville - Villupuram Border',
    },
    {
      label: 'GH Villupuram Hospital',
      user: 'hospital_villupuram_01',
      pass: 'BHISSM@Demo#V01',
      role: 'Hospital',
      stateGroup: 'Tamil Nadu',
      jurisdiction: 'Government Medical College Hospital, Villupuram (Adjacent to PY)',
    },
    {
      label: 'GH Cuddalore Hospital',
      user: 'hospital_cuddalore_01',
      pass: 'BHISSM@Demo#C01',
      role: 'Hospital',
      stateGroup: 'Tamil Nadu',
      jurisdiction: 'Government General Hospital, Cuddalore (Adjacent to PY)',
    },
    {
      label: 'Stanley Medical College',
      user: 'hospital_stanley_01',
      pass: 'BHISSM@Demo#TN01',
      role: 'Hospital',
      stateGroup: 'Tamil Nadu',
      jurisdiction: 'Government Stanley Hospital, Chennai',
    },
    {
      label: 'Rajiv Gandhi GH Chennai',
      user: 'hospital_rajivgandhi_01',
      pass: 'BHISSM@Demo#TN02',
      role: 'Hospital',
      stateGroup: 'Tamil Nadu',
      jurisdiction: 'Rajiv Gandhi Govt General Hospital, Chennai',
    },

    // Karnataka
    {
      label: 'Karnataka State Admin',
      user: 'state_karnataka_admin',
      pass: 'BHISSM@State#KA01',
      role: 'State',
      stateGroup: 'Karnataka',
      jurisdiction: 'Karnataka Health & Family Welfare, Bengaluru',
    },
    {
      label: 'Victoria Hospital Bengaluru',
      user: 'hospital_victoria_01',
      pass: 'BHISSM@Demo#KA01',
      role: 'Hospital',
      stateGroup: 'Karnataka',
      jurisdiction: 'Bangalore Medical College (BMCRI), Bengaluru',
    },
    {
      label: 'Bowring Hospital Bengaluru',
      user: 'hospital_bowring_01',
      pass: 'BHISSM@Demo#KA02',
      role: 'Hospital',
      stateGroup: 'Karnataka',
      jurisdiction: 'Bowring & Lady Curzon Hospital, Bengaluru',
    },

    // Other States
    {
      label: 'Andhra Pradesh State Admin',
      user: 'state_andhra_admin',
      pass: 'BHISSM@State#AP01',
      role: 'State',
      stateGroup: 'Other',
      jurisdiction: 'Andhra Pradesh State Health Authority, Vijayawada',
    },
    {
      label: 'Kerala State Admin',
      user: 'state_kerala_admin',
      pass: 'BHISSM@State#KL01',
      role: 'State',
      stateGroup: 'Other',
      jurisdiction: 'Kerala Health Services Directorate, Thiruvananthapuram',
    },
    {
      label: 'Maharashtra State Admin',
      user: 'state_maharashtra_admin',
      pass: 'BHISSM@State#MH01',
      role: 'State',
      stateGroup: 'Other',
      jurisdiction: 'Public Health Department, Mumbai',
    },
    {
      label: 'King George Hospital Vizag',
      user: 'hospital_kgh_01',
      pass: 'BHISSM@Demo#AP01',
      role: 'Hospital',
      stateGroup: 'Other',
      jurisdiction: 'KGH Visakhapatnam, Andhra Pradesh',
    },
    {
      label: 'GMC Thiruvananthapuram',
      user: 'hospital_gmct_01',
      pass: 'BHISSM@Demo#KL01',
      role: 'Hospital',
      stateGroup: 'Other',
      jurisdiction: 'Government Medical College, Kerala',
    },
    {
      label: 'KEM Hospital Mumbai',
      user: 'hospital_kem_01',
      pass: 'BHISSM@Demo#MH01',
      role: 'Hospital',
      stateGroup: 'Other',
      jurisdiction: 'King Edward Memorial Hospital, Mumbai',
    },
  ];

  const filteredCredentials =
    activeTab === 'All'
      ? demoCredentials
      : demoCredentials.filter((c) => c.stateGroup === activeTab);

  return (
    <div className="min-h-screen bg-bhissm-bg py-8 px-4 flex flex-col items-center justify-center font-sans antialiased text-bhissm-dark">
      {/* Flagship BHISSM Hackathon Identity Hero */}
      <div className="w-full max-w-5xl mb-6 card p-6 bg-gradient-to-r from-[#FFF9F1] via-[#FDF3E7] to-[#FAE8EB]/75 border-2 border-bhissm-border shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bhissm-emblem-box text-[#FFF9F1] flex flex-col items-center justify-center border-2 border-[#E8A7B5] shadow-md shrink-0">
              <span className="font-black text-2xl tracking-tighter leading-none">BH</span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#F4D5DC] mt-0.5 font-bold">
                INDIA
              </span>
            </div>

            <div className="text-left">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight bhissm-brand-title leading-none">
                  BHISSM
                </h1>
                <span className="text-[11px] bg-[#2D2926] text-[#FFF9F1] px-2.5 py-1 rounded-md font-mono font-bold tracking-wider border border-[#D4C8BC]">
                  NATIONAL COMMAND GRID
                </span>
                <span className="text-[11px] bg-[#F4D5DC] text-[#2D2926] px-2.5 py-1 rounded-md font-mono font-bold border border-[#E8A7B5]">
                  v2.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-bhissm-dark font-bold tracking-wide uppercase mt-1.5">
                Bharat Health Initiative for SupplyChain Sourcing &amp; Management
              </p>
              <p className="text-xs text-bhissm-secondary mt-0.5">
                Federated National &amp; Inter-State Healthcare Supply Chain, FEFO Intelligence &amp; 2-Step Disaster Mobilization Grid.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col items-end gap-1.5 shrink-0">
            <span className="demo-badge">MULTI-TIER VERIFIABLE COMMAND</span>
            <span className="text-[10px] font-mono bg-red-100 text-red-900 border border-red-300 px-2.5 py-0.5 rounded-full font-bold">
              🚨 CROSS-BORDER MUTUAL AID ACTIVE
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Direct Login Card (4 cols) */}
        <div className="lg:col-span-5 card space-y-4 shadow-sm border border-bhissm-border">
          <div className="border-b border-bhissm-border pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-bhissm-dark uppercase font-mono tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-bhissm-dark" />
              Direct Sign In
            </h2>
            <span className="text-[10px] font-mono text-bhissm-secondary">SECURE JWT</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-semibold text-bhissm-secondary mb-1 uppercase font-mono">
                Username Identifier
              </label>
              <input
                type="text"
                className="input-field font-mono"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-bhissm-secondary mb-1 uppercase font-mono">
                Access Password
              </label>
              <input
                type="password"
                className="input-field font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? 'AUTHENTICATING TELEMETRY...' : 'SIGN IN TO COMMAND DASHBOARD'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-2 border-t border-bhissm-border text-[11px] text-bhissm-secondary space-y-1 font-mono">
            <div>• Hospital: Single Facility Scope</div>
            <div>• State: Whole State / UT Inter-Hospital Scope</div>
            <div>• National: Nationwide Strategic Stockpile Scope</div>
          </div>
        </div>

        {/* Right Column: Multi-State Interactive Credentials Directory (7 cols) */}
        <div className="lg:col-span-7 card space-y-3 shadow-sm border border-bhissm-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bhissm-border pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-bhissm-dark uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-bhissm-accent" />
                Select Jurisdiction or Role
              </h2>
              <p className="text-[11px] text-bhissm-secondary">
                Click <strong>"Quick Login"</strong> to instantly enter as that role, or click the card to load credentials.
              </p>
            </div>
          </div>

          {/* State / Jurisdiction Category Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-[#F8F1E7] rounded border border-bhissm-border text-xs font-mono font-semibold">
            {(['All', 'National', 'Puducherry', 'Tamil Nadu', 'Karnataka', 'Other'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === tab
                    ? 'bg-bhissm-surface text-bhissm-dark font-bold shadow-xs border border-bhissm-border/60'
                    : 'text-bhissm-secondary hover:text-bhissm-dark hover:bg-bhissm-pink/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Credentials Cards List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredCredentials.map((c) => (
              <div
                key={c.user}
                className="p-2.5 border border-bhissm-border rounded bg-white hover:bg-[#FDF9F3] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => {
                    setUsername(c.user);
                    setPassword(c.pass);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-bhissm-dark">{c.label}</span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        c.role === 'National'
                          ? 'bg-[#2D2926] text-[#FFF9F1]'
                          : c.role === 'State'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {c.role} ({c.stateGroup})
                    </span>
                  </div>
                  <div className="text-[11px] text-bhissm-secondary mt-0.5">
                    {c.jurisdiction}
                  </div>
                  <div className="text-[10px] font-mono text-bhissm-secondary/80 mt-0.5">
                    User: <strong className="text-bhissm-dark">{c.user}</strong> • Pass: <strong className="text-bhissm-dark">{c.pass}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setUsername(c.user);
                      setPassword(c.pass);
                    }}
                    className="btn-outline text-[11px] py-1 px-2 font-mono"
                    title="Populate input form"
                  >
                    Auto-Fill
                  </button>
                  <button
                    onClick={() => handlePerformLogin(c.user, c.pass)}
                    disabled={loading}
                    className="btn-primary text-[11px] py-1 px-2.5 font-mono font-bold flex items-center gap-1"
                  >
                    Quick Login →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="mt-8 text-center text-xs text-bhissm-secondary/70 font-mono">
        BHISSM Multi-State Healthcare Command System • Developed for Mock Government Simulation
      </div>
    </div>
  );
}
