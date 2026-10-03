import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, BookOpen, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '15%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '15%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, rgba(147, 51, 234, 0) 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '1050px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        zIndex: 10
      }}>
        {/* Left Side: Brand & Overview */}
        <div style={{
          background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(79, 70, 229, 0.4)'
              }}>
                <GraduationCap size={28} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 800 }}>EduPulse</h1>
                <p style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>Student Management System</p>
              </div>
            </div>

            <h2 style={{ fontSize: '1.9rem', color: '#ffffff', marginBottom: '16px', lineHeight: 1.3 }}>
              Transforming Academic Administration
            </h2>
            <p style={{ color: '#c7d2fe', fontSize: '0.98rem', marginBottom: '32px', lineHeight: 1.6 }}>
              A full-stack institutional platform connecting Administrators, Teachers, and Students with real-time attendance, grading workflows, and academic records.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} color="#a5b4fc" />
                </div>
                <span style={{ fontSize: '0.9rem', color: '#e0e7ff' }}>Role-Based Access Control (Admin, Teacher, Student)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} color="#a5b4fc" />
                </div>
                <span style={{ fontSize: '0.9rem', color: '#e0e7ff' }}>Automated Daily Attendance Tracking & History</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={18} color="#a5b4fc" />
                </div>
                <span style={{ fontSize: '0.9rem', color: '#e0e7ff' }}>Instant Gradebook & Printable Student Report Cards</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '20px', marginTop: '32px', fontSize: '0.8rem', color: '#818cf8' }}>
            Powered by React, Express, and Relational SQLite Schema
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Welcome Back</h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem' }}>Please enter your credentials to access your portal</p>
          </div>

          {isExpired && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              color: '#b45309',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              <AlertCircle size={18} />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="search-box">
                <Mail size={18} color="#94a3b8" />
                <input
                  type="email"
                  placeholder="name@sms.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <div className="search-box">
                <Lock size={18} color="#94a3b8" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', marginBottom: '24px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Demo Login Fill Buttons */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
              ⚡ Quick Demo Logins (Click to Autofill):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoFill('admin@sms.com', 'admin123')}
                style={{ fontSize: '0.78rem' }}
              >
                👑 Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoFill('teacher@sms.com', 'teacher123')}
                style={{ fontSize: '0.78rem' }}
              >
                👨‍🏫 Teacher
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoFill('student@sms.com', 'student123')}
                style={{ fontSize: '0.78rem' }}
              >
                🎓 Student
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
