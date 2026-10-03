import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  School,
  TrendingUp,
  CalendarCheck,
  Award,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (user?.role === 'admin') {
        res = await dashboardService.getAdminStats();
      } else if (user?.role === 'teacher') {
        res = await dashboardService.getTeacherStats();
      } else {
        res = await dashboardService.getStudentStats();
      }
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Unable to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontWeight: 500 }}>Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: '#fecaca', background: '#fff5f5' }}>
        <p style={{ color: '#b91c1c' }}>{error}</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  // ================= ADMIN VIEW =================
  if (user?.role === 'admin') {
    const kpis = data?.kpis || {};
    const grades = data?.gradeDistribution || [];
    const trend = data?.attendanceTrend || [];
    const recentStudents = data?.recentStudents || [];

    // Calculate max grade count for relative bar scaling
    const maxGradeCount = Math.max(...grades.map(g => g.count), 1);

    return (
      <div>
        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Institutional Overview</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Welcome back, <strong>{user?.name}</strong>. Here is the latest campus status.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/students" className="btn btn-primary btn-sm">
              <Users size={16} /> Manage Students
            </Link>
            <Link to="/attendance" className="btn btn-secondary btn-sm">
              <CalendarCheck size={16} /> Take Attendance
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi-card kpi-blue">
            <div className="kpi-info">
              <h4>Total Students</h4>
              <div className="kpi-value">{kpis.totalStudents || 0}</div>
              <div className="kpi-subtitle">
                <TrendingUp size={14} color="#10b981" /> Active across all classes
              </div>
            </div>
            <div className="kpi-icon-wrap">
              <Users size={26} />
            </div>
          </div>

          <div className="kpi-card kpi-purple">
            <div className="kpi-info">
              <h4>Faculty Members</h4>
              <div className="kpi-value">{kpis.totalTeachers || 0}</div>
              <div className="kpi-subtitle">
                <CheckCircle2 size={14} color="#7c3aed" /> Active instructors
              </div>
            </div>
            <div className="kpi-icon-wrap">
              <GraduationCap size={26} />
            </div>
          </div>

          <div className="kpi-card kpi-emerald">
            <div className="kpi-info">
              <h4>Total Courses</h4>
              <div className="kpi-value">{kpis.totalCourses || 0}</div>
              <div className="kpi-subtitle">
                <BookOpen size={14} color="#059669" /> Registered curriculum
              </div>
            </div>
            <div className="kpi-icon-wrap">
              <BookOpen size={26} />
            </div>
          </div>

          <div className="kpi-card kpi-amber">
            <div className="kpi-info">
              <h4>Average Attendance</h4>
              <div className="kpi-value">{kpis.attendanceRate ? `${kpis.attendanceRate}%` : '92%'}</div>
              <div className="kpi-subtitle">
                <CalendarCheck size={14} color="#d97706" /> Campus average rate
              </div>
            </div>
            <div className="kpi-icon-wrap">
              <CalendarCheck size={26} />
            </div>
          </div>
        </div>

        {/* Analytics Section: Grade Distribution & Attendance Trends */}
        <div className="grid-2" style={{ marginBottom: '28px' }}>
          {/* Grade Distribution Bar Graph */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Award size={20} color="#6366f1" /> Grade Distribution
              </h3>
              <span className="badge badge-info">All Exams</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
              {grades.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No exam marks recorded yet.</p>
              ) : (
                grades.map(g => {
                  const pct = Math.round((g.count / maxGradeCount) * 100);
                  const colors = {
                    'A+': '#10b981',
                    'A': '#3b82f6',
                    'B': '#8b5cf6',
                    'C': '#f59e0b',
                    'D': '#f97316',
                    'F': '#ef4444'
                  };
                  const color = colors[g.grade] || '#6366f1';
                  return (
                    <div key={g.grade}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
                        <span>Grade {g.grade}</span>
                        <span style={{ color: '#64748b' }}>{g.count} records ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 7-Day Attendance Trend */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <CalendarCheck size={20} color="#10b981" /> 7-Day Attendance Trend
              </h3>
              <span className="badge badge-success">Daily Records</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '180px', paddingTop: '20px' }}>
              {trend.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No recent attendance data.</p>
              ) : (
                trend.map(t => {
                  const total = (t.present || 0) + (t.late || 0) + (t.absent || 0);
                  const presentHeight = total > 0 ? Math.round((t.present / total) * 120) : 20;
                  return (
                    <div key={t.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#10b981' }}>{t.present}P</span>
                      <div style={{ width: '28px', height: `${presentHeight}px`, background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '6px' }} />
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                        {t.date.slice(5)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Students Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={20} color="#3b82f6" /> Recently Enrolled Students
            </h3>
            <Link to="/students" className="btn btn-secondary btn-sm">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Enrollment No</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Class / Section</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No students enrolled yet.
                    </td>
                  </tr>
                ) : (
                  recentStudents.map(s => (
                    <tr key={s.student_id}>
                      <td><span className="badge badge-info">{s.enrollment_no}</span></td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: '#64748b' }}>{s.email}</td>
                      <td>{s.class_name ? `${s.class_name} - ${s.section}` : 'Unassigned'}</td>
                      <td>
                        <Link to={`/students/${s.student_id}`} className="btn btn-secondary btn-sm">
                          Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ================= TEACHER VIEW =================
  if (user?.role === 'teacher') {
    const courses = data?.assignedCourses || [];
    const classes = data?.assignedClasses || [];
    const recentMarks = data?.recentMarks || [];
    const totalStudents = data?.totalStudentsTaught || 0;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Faculty Dashboard</h1>
            <p style={{ color: '#64748b' }}>
              Welcome, <strong>{user?.name}</strong> • {user?.department || 'Academic Department'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/attendance" className="btn btn-primary btn-sm">
              <CalendarCheck size={16} /> Record Attendance
            </Link>
            <Link to="/marks" className="btn btn-secondary btn-sm">
              <Award size={16} /> Enter Marks
            </Link>
          </div>
        </div>

        {/* Teacher KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card kpi-purple">
            <div className="kpi-info">
              <h4>Assigned Classes</h4>
              <div className="kpi-value">{classes.length}</div>
              <div className="kpi-subtitle">Active cohorts</div>
            </div>
            <div className="kpi-icon-wrap">
              <School size={26} />
            </div>
          </div>

          <div className="kpi-card kpi-blue">
            <div className="kpi-info">
              <h4>My Courses</h4>
              <div className="kpi-value">{courses.length}</div>
              <div className="kpi-subtitle">Subjects instructed</div>
            </div>
            <div className="kpi-icon-wrap">
              <BookOpen size={26} />
            </div>
          </div>

          <div className="kpi-card kpi-emerald">
            <div className="kpi-info">
              <h4>Total Students Taught</h4>
              <div className="kpi-value">{totalStudents}</div>
              <div className="kpi-subtitle">Enrolled in your classes</div>
            </div>
            <div className="kpi-icon-wrap">
              <Users size={26} />
            </div>
          </div>
        </div>

        {/* Assigned Courses & Classes */}
        <div className="grid-2" style={{ marginBottom: '28px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><BookOpen size={20} color="#4f46e5" /> My Courses</h3>
              <Link to="/courses" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {courses.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No courses assigned yet.</p>
              ) : (
                courses.map(c => (
                  <div key={c.course_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div>
                      <span className="badge badge-info" style={{ marginRight: '8px' }}>{c.course_code}</span>
                      <strong style={{ fontSize: '0.95rem' }}>{c.course_name}</strong>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.credits} Credits</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><School size={20} color="#10b981" /> Supervised Classes</h3>
              <Link to="/classes" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {classes.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No classes assigned yet.</p>
              ) : (
                classes.map(cl => (
                  <div key={cl.class_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{cl.class_name} - Sec {cl.section}</strong>
                      <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Room: {cl.room_number || 'TBD'}</p>
                    </div>
                    <span className="badge badge-success">{cl.student_count || 0} Students</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Marks Submitted */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Award size={20} color="#f59e0b" /> Recent Evaluations Submitted</h3>
            <Link to="/marks" className="btn btn-secondary btn-sm">Manage Marks</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Exam Type</th>
                  <th>Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {recentMarks.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No marks submitted yet.</td></tr>
                ) : (
                  recentMarks.map(m => (
                    <tr key={m.mark_id}>
                      <td style={{ fontWeight: 600 }}>{m.student_name}</td>
                      <td>{m.course_name}</td>
                      <td><span className="badge badge-neutral">{m.exam_type}</span></td>
                      <td style={{ fontWeight: 600 }}>{m.marks_obtained} / {m.max_marks}</td>
                      <td><span className="badge badge-success">{m.grade}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ================= STUDENT VIEW =================
  const stu = data?.student || {};
  const att = data?.attendanceSummary || {};
  const recentMarks = data?.recentMarks || [];
  const attRate = att.attendance_rate || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Student Portal</h1>
          <p style={{ color: '#64748b' }}>
            Welcome back, <strong>{stu.name || user?.name}</strong> • Enrollment: <span className="badge badge-info">{stu.enrollment_no || 'N/A'}</span>
          </p>
        </div>
        <div>
          <Link to={`/students/${user?.student_id || ''}`} className="btn btn-primary btn-sm">
            <FileText size={16} /> View Full Report Card
          </Link>
        </div>
      </div>

      {/* Student Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-emerald">
          <div className="kpi-info">
            <h4>My Attendance Rate</h4>
            <div className="kpi-value">{attRate}%</div>
            <div className="kpi-subtitle">
              {attRate >= 75 ? (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Good Standing (&gt;75%)
                </span>
              ) : (
                <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} /> Attention: Below 75%
                </span>
              )}
            </div>
          </div>
          <div className="kpi-icon-wrap">
            <CalendarCheck size={26} />
          </div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-info">
            <h4>Enrolled Class</h4>
            <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{stu.class_name ? `${stu.class_name} (${stu.section})` : 'Class A'}</div>
            <div className="kpi-subtitle">Room: {stu.room_number || 'Main Building'}</div>
          </div>
          <div className="kpi-icon-wrap">
            <School size={26} />
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-info">
            <h4>Class Teacher</h4>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{stu.class_teacher || 'Assigned Faculty'}</div>
            <div className="kpi-subtitle">Academic Mentor</div>
          </div>
          <div className="kpi-icon-wrap">
            <GraduationCap size={26} />
          </div>
        </div>
      </div>

      {/* Recent Marks */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><Award size={20} color="#4f46e5" /> Recent Exam Results</h3>
          <span className="badge badge-info">Term Evaluated</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Exam</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {recentMarks.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No exam marks published yet.</td></tr>
              ) : (
                recentMarks.map(m => {
                  const pct = Math.round((m.marks_obtained / m.max_marks) * 100);
                  return (
                    <tr key={m.mark_id}>
                      <td><span className="badge badge-neutral">{m.course_code}</span></td>
                      <td style={{ fontWeight: 600 }}>{m.course_name}</td>
                      <td>{m.exam_type}</td>
                      <td>{m.marks_obtained} / {m.max_marks}</td>
                      <td style={{ fontWeight: 600 }}>{pct}%</td>
                      <td><span className={`badge ${pct >= 70 ? 'badge-success' : 'badge-warning'}`}>{m.grade}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
