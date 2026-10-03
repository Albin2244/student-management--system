import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  School,
  CalendarCheck,
  Award,
  BarChart3,
  UserCircle,
  LogOut,
  Sparkles,
  Menu,
  X,
  Bell
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = async (role) => {
    let email = 'admin@sms.com';
    let pass = 'admin123';
    if (role === 'teacher') {
      email = 'teacher@sms.com';
      pass = 'teacher123';
    } else if (role === 'student') {
      email = 'student@sms.com';
      pass = 'student123';
    }
    const res = await login(email, pass);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  // Nav Items configured by role
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student'] },
    { label: 'Students', path: '/students', icon: Users, roles: ['admin', 'teacher'] },
    { label: 'Teachers', path: '/teachers', icon: GraduationCap, roles: ['admin'] },
    { label: 'Classes', path: '/classes', icon: School, roles: ['admin', 'teacher'] },
    { label: 'Courses', path: '/courses', icon: BookOpen, roles: ['admin', 'teacher'] },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck, roles: ['admin', 'teacher', 'student'] },
    { label: 'Marks & Results', path: '/marks', icon: Award, roles: ['admin', 'teacher', 'student'] },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['admin', 'teacher'] },
    { label: 'My Profile', path: '/profile', icon: UserCircle, roles: ['admin', 'teacher', 'student'] }
  ];

  const allowedNavs = navItems.filter(item => item.roles.includes(user?.role || 'student'));

  // Get current page label
  const currentNav = navItems.find(item => location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)));
  const pageTitle = currentNav ? currentNav.label : 'Student Management';

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-badge">
            <GraduationCap size={24} />
          </div>
          <div className="brand-text">
            <h2>EduPulse</h2>
            <span>Student Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {allowedNavs.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role-badge">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-icon"
            style={{ background: 'transparent', color: '#94a3b8' }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-left">
            <button
              className="btn btn-icon btn-secondary d-md-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="page-title-badge">{pageTitle}</span>
            <span className="badge badge-info" style={{ display: 'none', md: 'inline-flex' }}>
              Academic Term 2026 • Fall
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Quick Demo Switcher */}
            <div className="demo-account-switcher no-print">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6366f1', fontWeight: 600 }}>
                <Sparkles size={14} /> Quick Role:
              </span>
              <button
                className={`demo-btn ${user?.role === 'admin' ? 'badge-info' : ''}`}
                onClick={() => handleQuickSwitch('admin')}
              >
                Admin
              </button>
              <button
                className={`demo-btn ${user?.role === 'teacher' ? 'badge-info' : ''}`}
                onClick={() => handleQuickSwitch('teacher')}
              >
                Teacher
              </button>
              <button
                className={`demo-btn ${user?.role === 'student' ? 'badge-info' : ''}`}
                onClick={() => handleQuickSwitch('student')}
              >
                Student
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm no-print"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="content-body fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
