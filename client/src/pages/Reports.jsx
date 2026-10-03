import React, { useState, useEffect } from 'react';
import { dashboardService, studentService, courseService } from '../services/api';
import {
  BarChart3,
  Printer,
  Download,
  Award,
  Users,
  CalendarCheck,
  TrendingUp,
  GraduationCap
} from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [dashRes, stuRes] = await Promise.all([
        dashboardService.getAdminStats(),
        studentService.getAll()
      ]);
      if (dashRes.data?.success) setData(dashRes.data.data);
      if (stuRes.data?.success) setStudents(stuRes.data.data);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Student ID', 'Enrollment No', 'Name', 'Email', 'Class', 'Attendance Rate', 'Average Score'];
    const rows = students.map(s => [
      s.student_id,
      s.enrollment_no,
      `"${s.name}"`,
      s.email,
      `"${s.class_name ? `${s.class_name} - ${s.section}` : 'N/A'}"`,
      `${s.attendance_rate || 0}%`,
      `${s.average_score || 0}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SMS_Academic_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <p>Generating institutional reports...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const grades = data?.gradeDistribution || [];
  const depts = data?.departmentDistribution || [];

  // Sort top students by average score
  const topStudents = [...students]
    .filter(s => s.average_score)
    .sort((a, b) => b.average_score - a.average_score)
    .slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Institutional Academic Reports</h1>
          <p style={{ color: '#64748b' }}>Summary analytics, student grade rankings, and official institutional export</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-info">
            <h4>Enrolled Cohort</h4>
            <div className="kpi-value">{kpis.totalStudents || 0}</div>
            <div className="kpi-subtitle">Total student headcount</div>
          </div>
          <div className="kpi-icon-wrap"><Users size={24} /></div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-info">
            <h4>Faculty Size</h4>
            <div className="kpi-value">{kpis.totalTeachers || 0}</div>
            <div className="kpi-subtitle">Academic teaching staff</div>
          </div>
          <div className="kpi-icon-wrap"><GraduationCap size={24} /></div>
        </div>

        <div className="kpi-card kpi-emerald">
          <div className="kpi-info">
            <h4>Attendance Ratio</h4>
            <div className="kpi-value">{kpis.attendanceRate ? `${kpis.attendanceRate}%` : '92%'}</div>
            <div className="kpi-subtitle">Institution attendance benchmark</div>
          </div>
          <div className="kpi-icon-wrap"><CalendarCheck size={24} /></div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-info">
            <h4>Active Courses</h4>
            <div className="kpi-value">{kpis.totalCourses || 0}</div>
            <div className="kpi-subtitle">Departments offering syllabus</div>
          </div>
          <div className="kpi-icon-wrap"><TrendingUp size={24} /></div>
        </div>
      </div>

      {/* Top Academic Achievers Leaderboard */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Award size={20} color="#f59e0b" /> Academic Honors & Top Performers
          </h3>
          <span className="badge badge-warning">Dean's Honor Roll</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Student Name</th>
                <th>Enrollment</th>
                <th>Class / Cohort</th>
                <th>Attendance</th>
                <th>Cumulative Average</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No graded students yet.</td></tr>
              ) : (
                topStudents.map((s, idx) => (
                  <tr key={s.student_id}>
                    <td>
                      <span className={`badge ${idx === 0 ? 'badge-warning' : idx === 1 ? 'badge-info' : 'badge-neutral'}`} style={{ fontWeight: 800 }}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td><span className="badge badge-info">{s.enrollment_no}</span></td>
                    <td>{s.class_name ? `${s.class_name} (${s.section})` : 'N/A'}</td>
                    <td>
                      <span className={`badge ${(s.attendance_rate || 0) >= 75 ? 'badge-success' : 'badge-warning'}`}>
                        {s.attendance_rate || 0}%
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                      {s.average_score}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade and Department Breakdowns */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><BarChart3 size={20} color="#6366f1" /> Grade Distribution Breakdown</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {grades.map(g => (
              <div key={g.grade} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontWeight: 700 }}>Grade {g.grade}</span>
                <span className="badge badge-info">{g.count} Examinations</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Users size={20} color="#059669" /> Department Enrollment</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {depts.map(d => (
              <div key={d.department} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600 }}>{d.department}</span>
                <span className="badge badge-success">{d.student_count} Students</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
