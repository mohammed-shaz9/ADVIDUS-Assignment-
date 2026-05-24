import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../contexts/AuthContext';

interface DemoUser {
  name: string;
  email: string;
  role: string;
  password: string;
  department?: string;
}

const AuthPage: React.FC = () => {
  const { login, register, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await fetch(`${API_URL}/auth/ensure-demo`, { method: 'POST' });
        const res = await fetch(`${API_URL}/auth/credentials`);
        const json = await res.json();
        if (json.success) setDemoUsers(json.data);
      } catch {}
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (activeTab === 'login') {
      const res = await login(email, password);
      if (!res.success) setErrorMsg(res.error || 'Invalid credentials.');
    } else {
      if (!name) { setErrorMsg('Name is required.'); return; }
      if (password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
      const res = await register(name, email, password);
      if (!res.success) setErrorMsg(res.error || 'Failed to register.');
    }
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: '#0D0D12',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Left brand panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', background: '#13131A',
        borderRight: '0.5px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-120px', left: '-80px', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)', pointerEvents: 'none',
        }}></div>
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-60px', width: '350px', height: '350px',
          background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)', pointerEvents: 'none',
        }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
            {/* ADVIDUS Logo and Title */}
            <div style={{
              fontSize: '48px', fontWeight: 900, fontStyle: 'italic',
              background: 'linear-gradient(135deg, #6C63FF 0%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em', marginBottom: '8px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              ADVIDUS
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.5)', fontSize: '13px',
              letterSpacing: '1px', fontWeight: 600, margin: 0,
              textTransform: 'uppercase',
            }}>
              Interactive RBAC Enterprise Platform
            </p>
          </div>

          <h1 style={{
            fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1.15,
            fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em', marginBottom: '16px',
          }}>
            Secure Operations.<br />
            <span style={{ color: '#6C63FF' }}>Intelligent</span> Control.
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.7,
            marginBottom: '40px', maxWidth: '400px',
          }}>
            Enterprise-grade RBAC with AI-powered task delegation, real-time audit trails, and autonomous agent orchestration.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { icon: 'ti-shield-lock', color: '#6C63FF', bg: 'rgba(108,99,255,0.12)', title: 'Role-Based Access Control', desc: 'Fine-grained permissions with admin/user isolation and live session governance.' },
              { icon: 'ti-cpu', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', title: 'AI Agent Delegation', desc: 'Provision autonomous agents with custom prompts to execute tasks automatically.' },
              { icon: 'ti-activity', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', title: 'Immutable Audit Trails', desc: 'Every login, action, and state change logged with tamper-proof timestamps.' },
            ].map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '8px', background: feat.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className={`ti ${feat.icon}`} style={{ fontSize: '16px', color: feat.color }}></i>
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '3px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{feat.title}</h4>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
            {['React', 'Node.js', 'MongoDB', 'JWT', 'REST API'].map(tech => (
              <span key={tech} style={{
                fontSize: '10px', padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.3)', fontWeight: 500, letterSpacing: '0.3px',
              }}>{tech}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex', padding: '12px', background: 'rgba(108,99,255,0.1)',
              border: '0.5px solid rgba(108,99,255,0.2)', borderRadius: '12px', marginBottom: '18px',
            }}>
              <i className="ti ti-fingerprint" style={{ fontSize: '24px', color: '#6C63FF' }}></i>
            </div>
            <h2 style={{
              fontSize: '20px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: 'rgba(255,255,255,0.92)', marginBottom: '6px',
            }}>
              {activeTab === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              {activeTab === 'login' ? 'Sign in to access your dashboard' : 'Register to join the workspace'}
            </p>
          </div>

          <div style={{
            display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)',
            borderRadius: '10px', padding: '3px', border: '0.5px solid rgba(255,255,255,0.06)',
          }}>
            {(['login', 'register'] as const).map(tab => (
              <button
                key={tab} onClick={() => { setActiveTab(tab); setErrorMsg(''); }}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px', fontSize: '12px',
                  fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
                  background: activeTab === tab ? 'rgba(108,99,255,0.18)' : 'transparent',
                  color: activeTab === tab ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <i className={tab === 'login' ? 'ti ti-login' : 'ti ti-user-plus'} style={{ fontSize: '14px' }}></i>
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '18px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '15px', color: '#EF4444', flexShrink: 0 }}></i>
              <span style={{ fontSize: '12px', color: '#fca5a5' }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '10px 0', marginTop: '8px', background: '#6C63FF', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(108,99,255,0.25)',
            }}>
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                    animation: 'spin 1s linear infinite',
                  }}></span>
                  Processing...
                </>
              ) : (
                <><i className={activeTab === 'login' ? 'ti ti-login' : 'ti ti-user-plus'} style={{ fontSize: '15px' }}></i>
                  {activeTab === 'login' ? 'Sign In' : 'Create Account'}</>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '28px', padding: '14px', background: 'rgba(255,255,255,0.02)',
            border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '10px',
            maxHeight: '260px', overflowY: 'auto',
          }}>
            <div style={{
              fontSize: '9px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
              letterSpacing: '0.8px', fontWeight: 600, marginBottom: '8px',
            }}>Real Employee Credentials (+ Admin)</div>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ display: 'flex', padding: '4px 6px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, gap: '6px' }}>
                <span style={{ flex: 1 }}>Name</span>
                <span style={{ flex: 1.2 }}>Email</span>
                <span style={{ width: '90px', textAlign: 'center' }}>Password</span>
              </div>
              {[
                { name: 'Admin', email: 'admin@example.com', password: 'Admin@123', role: 'Admin' },
                ...demoUsers.map(u => ({ name: u.name, email: u.email, password: u.password, role: 'Employee' })),
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', padding: '6px 6px', borderRadius: '4px', gap: '6px',
                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  color: 'rgba(255,255,255,0.5)', alignItems: 'center',
                }}>
                  <span style={{ flex: 1, color: item.role === 'Admin' ? '#6C63FF' : '#22C55E', fontSize: '9px' }}>{item.name.slice(0, 20)}</span>
                  <span style={{ flex: 1.2, fontSize: '9px', wordBreak: 'break-all' }}>{item.email}</span>
                  <span style={{ width: '90px', textAlign: 'center', color: item.role === 'Admin' ? '#6C63FF' : '#22C55E', fontWeight: 600 }}>{item.password}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', marginTop: '8px', margin: '8px 0 0 0' }}>
              💡 Copy any email + password above to test the dashboard
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.15)' }}>
            <i>Advidus</i> Interactive · RBAC Assignment · 2026
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .auth-left-panel { display: none !important; } }
      `}</style>
    </div>
  );
};

export default AuthPage;
