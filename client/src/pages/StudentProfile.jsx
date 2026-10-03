import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService, marksService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Printer,
  CalendarCheck,
  Award,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const studentId = id || user?.student_id;

  const [student, setStudent] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentId) {
      loadProfile();
    }
  }, [studentId]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, reportRes] = await Promise.all([
        studentService.getById(studentId),
        marksService.getReportCard(studentId)
      ]);

      if (profileRes.data?.success) {
        setStudent(profileRes.data.data);
      }
      if (reportRes.data?.success) {
        setReport(reportRes.data.data);
      }
    } catch (err) {
      console.error('Error loading student profile:', err);
      setError('Failed to load student dossier.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <p>Loading student dossier...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="card" style={{ borderColor: '#fecaca', background: '#fff5f5' }}>
        <p style={{ color: '#b91c1c' }}>{error || 'Student not found.'}</p>
        <Link to="/students" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
          Back to Students
        </Link>
      </div>
    );
  }

  const att = student.attendanceStats || {};
  const totalDays = att.total_days || 0;
  const presentDays = att.present_count || 0;
  const lateDays = att.late_count || 0;
  const absentDays = att.absent_count || 0;
  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + (lateDays * 0.75)) / totalDays) * 100) : 100;

  const marks = student.marks || [];
  const summary = report?.summary || {};

  return (
    <div>
      {/* Top Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link to="/students" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Directory
        </Link>
        <button onClick={handlePrint} className="btn btn-primary btn-sm">
          <Printer size={16} /> Print Official Report Card
        </button>
      </div>

      {/* Student Identity Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2.2rem', boxShadow: 'var(--shadow-md)' }}>
            {student.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{student.name}</h2>
              <span className="badge badge-info">{student.enrollment_no}</span>
              <span className="badge badge-neutral">{student.gender}</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span><GraduationCap size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Class: <strong>{student.class_name ? `${student.class_name} - ${student.section}` : 'Unassigned'}</strong></span>
              <span>Room: {student.room_number || 'Main Wing'}</span>
              <span>Mentor: {student.class_teacher_name || 'Assigned Faculty'}</span>
            </p>
          </div>
          <div style={{ textAlign: 'right', minWidth: '160px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Overall Standing</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
              Grade {summary.overallGrade || 'A'}
            </div>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {summary.overallPercentage || 0}% Cumulative Score
            </span>
          </div>
        </div>

        {/* Contact & Bio Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', fontSize: '0.88rem' }}>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>EMAIL ADDRESS</span>
            <span style={{ color: '#334155', fontWeight: 500 }}><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {student.email}</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>CONTACT PHONE</span>
            <span style={{ color: '#334155', fontWeight: 500 }}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {student.phone || 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>DATE OF BIRTH</span>
            <span style={{ color: '#334155', fontWeight: 500 }}>{student.dob || 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>PARENT / GUARDIAN</span>
            <span style={{ color: '#334155', fontWeight: 500 }}>{student.guardian_name ? `${student.guardian_name} (${student.guardian_phone || 'N/A'})` : 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>RESIDENTIAL ADDRESS</span>
            <span style={{ color: '#334155', fontWeight: 500 }}><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {student.address || 'Campus Housing'}</span>
          </div>
        </div>
      </div>

      {/* Analytics: Academic Results & Attendance Summary */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Attendance Statistics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CalendarCheck size={20} color="#10b981" /> Attendance Record
            </h3>
            <span className={`badge ${attendanceRate >= 75 ? 'badge-success' : 'badge-warning'}`}>
              {attendanceRate}% Total Rate
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{totalDays}</div>
            </div>
            <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px', color: '#065f46' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>PRESENT</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{presentDays}</div>
            </div>
            <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', color: '#92400e' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>LATE</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{lateDays}</div>
            </div>
            <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', color: '#991b1b' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>ABSENT</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{absentDays}</div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px', color: '#475569' }}>
            Recent Attendance Logs
          </h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(student.recentAttendance || []).length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>No logs yet.</td></tr>
                ) : (
                  (student.recentAttendance || []).slice(0, 5).map(a => (
                    <tr key={a.attendance_id}>
                      <td>{a.date}</td>
                      <td>
                        <span className={`badge ${
                          a.status === 'Present' ? 'badge-success' :
                          a.status === 'Late' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{a.remarks || 'Regular class'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Marks Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Award size={20} color="#6366f1" /> Academic Performance
            </h3>
            <span className="badge badge-info">{marks.length} Evaluations</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Exam</th>
                  <th>Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {marks.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No exam marks recorded yet.</td></tr>
                ) : (
                  marks.map(m => {
                    const pct = Math.round((m.marks_obtained / m.max_marks) * 100);
                    return (
                      <tr key={m.mark_id}>
                        <td>
                          <span style={{ fontWeight: 600, display: 'block' }}>{m.course_name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.course_code} ({m.credits} cr)</span>
                        </td>
                        <td><span className="badge badge-neutral">{m.exam_type}</span></td>
                        <td>{m.marks_obtained} / {m.max_marks} ({pct}%)</td>
                        <td><span className="badge badge-success">{m.grade}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
