import React, { useState, useEffect } from 'react';
import { attendanceService, classService, studentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck,
  Check,
  Clock,
  XCircle,
  HelpCircle,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
  History,
  Calendar
} from 'lucide-react';

export default function Attendance() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Attendance Sheet state
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [student_id]: { status, remarks } }
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Student specific history state
  const [studentHistory, setStudentHistory] = useState(null);

  useEffect(() => {
    if (isStudent) {
      loadStudentAttendance();
    } else {
      loadClasses();
    }
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent && selectedClass && selectedDate) {
      loadAttendanceSheet();
    }
  }, [selectedClass, selectedDate]);

  const loadClasses = async () => {
    try {
      const res = await classService.getAll();
      if (res.data?.success && res.data.data.length > 0) {
        setClasses(res.data.data);
        setSelectedClass(res.data.data[0].class_id);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const loadAttendanceSheet = async () => {
    setLoadingSheet(true);
    setMessage('');
    setError('');
    try {
      // 1. Fetch students in this class
      const stuRes = await studentService.getAll({ class_id: selectedClass });
      const studentList = stuRes.data?.data || [];
      setStudents(studentList);

      // 2. Fetch existing attendance for this class and date
      const attRes = await attendanceService.get({ class_id: selectedClass, date: selectedDate });
      const existingList = attRes.data?.data || [];

      // Map existing records or default to 'Present'
      const newMap = {};
      studentList.forEach((s) => {
        const found = existingList.find((a) => a.student_id === s.student_id);
        if (found) {
          newMap[s.student_id] = { status: found.status, remarks: found.remarks || '' };
        } else {
          newMap[s.student_id] = { status: 'Present', remarks: '' };
        }
      });
      setAttendanceMap(newMap);
    } catch (err) {
      console.error('Error loading sheet:', err);
      setError('Failed to load attendance register.');
    } finally {
      setLoadingSheet(false);
    }
  };

  const loadStudentAttendance = async () => {
    setLoadingSheet(true);
    try {
      const res = await attendanceService.getStudentAttendance(user?.student_id);
      if (res.data?.success) {
        setStudentHistory(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching personal attendance:', err);
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.student_id] = {
        ...(attendanceMap[s.student_id] || {}),
        status
      };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const entries = students.map((s) => ({
        student_id: s.student_id,
        status: attendanceMap[s.student_id]?.status || 'Present',
        remarks: attendanceMap[s.student_id]?.remarks || ''
      }));

      const res = await attendanceService.recordBatch({
        class_id: selectedClass,
        date: selectedDate,
        entries
      });

      if (res.data?.success) {
        setMessage(`Attendance successfully recorded for ${entries.length} students on ${selectedDate}!`);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance register.');
    } finally {
      setSaving(false);
    }
  };

  // ================= STUDENT VIEW =================
  if (isStudent) {
    const summary = studentHistory?.summary || {};
    const history = studentHistory?.history || [];
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Attendance Record</h1>
          <p style={{ color: '#64748b' }}>Complete chronological attendance ledger and summary statistics</p>
        </div>

        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <div className="card">
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>OVERALL RATE</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: (summary.attendance_rate || 0) >= 75 ? '#10b981' : '#ef4444' }}>
              {summary.attendance_rate || 0}%
            </div>
            <span className={`badge ${(summary.attendance_rate || 0) >= 75 ? 'badge-success' : 'badge-danger'}`}>
              {(summary.attendance_rate || 0) >= 75 ? 'Satisfactory' : 'Needs Improvement'}
            </span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>CLASSES ATTENDED</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#4f46e5' }}>
              {summary.present_count || 0} / {summary.total_recorded || 0}
            </div>
            <span className="badge badge-info">{summary.late_count || 0} Late Arrivals</span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>ABSENT SESSIONS</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444' }}>
              {summary.absent_count || 0}
            </div>
            <span className="badge badge-neutral">{summary.excused_count || 0} Excused</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><History size={20} color="#6366f1" /> Attendance History</h3>
            <span className="badge badge-neutral">Last 30 Days</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class / Section</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No attendance records found.</td></tr>
                ) : (
                  history.map((a) => (
                    <tr key={a.attendance_id}>
                      <td style={{ fontWeight: 600 }}>{a.date}</td>
                      <td>{a.class_name} - {a.section}</td>
                      <td>
                        <span className={`badge ${
                          a.status === 'Present' ? 'badge-success' :
                          a.status === 'Late' ? 'badge-warning' :
                          a.status === 'Absent' ? 'badge-danger' : 'badge-info'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{a.remarks || 'Regular attendance'}</td>
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

  // ================= ADMIN / TEACHER BATCH REGISTER =================
  const presentCount = Object.values(attendanceMap).filter((v) => v.status === 'Present').length;
  const lateCount = Object.values(attendanceMap).filter((v) => v.status === 'Late').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v.status === 'Absent').length;

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Daily Attendance Register</h1>
          <p style={{ color: '#64748b' }}>Mark batch attendance for classrooms and generate daily presence rosters</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
        >
          <Save size={18} /> {saving ? 'Submitting...' : 'Save Attendance Register'}
        </button>
      </div>

      {message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
          <CheckCircle2 size={18} /> {message}
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Selector Controls Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                SELECT CLASSROOM
              </label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{ minWidth: '220px' }}
              >
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name} - Sec {c.section} ({c.student_count || 0} students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                ATTENDANCE DATE
              </label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Mark Shortcuts */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Bulk Actions:</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => markAll('Present')}
              style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5' }}
            >
              <Check size={14} /> All Present
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => markAll('Absent')}
              style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
            >
              <XCircle size={14} /> All Absent
            </button>
          </div>
        </div>

        {/* Counter Summary */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
          <span>Total Students: <strong>{students.length}</strong></span>
          <span style={{ color: '#059669' }}>Present: <strong>{presentCount}</strong></span>
          <span style={{ color: '#d97706' }}>Late: <strong>{lateCount}</strong></span>
          <span style={{ color: '#dc2626' }}>Absent: <strong>{absentCount}</strong></span>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Enrollment</th>
                <th>Student Name</th>
                <th style={{ width: '340px' }}>Attendance Status</th>
                <th>Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              {loadingSheet ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>Loading attendance sheet...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>No students enrolled in this class.</td></tr>
              ) : (
                students.map((student) => {
                  const currentStatus = attendanceMap[student.student_id]?.status || 'Present';
                  const currentRemarks = attendanceMap[student.student_id]?.remarks || '';

                  return (
                    <tr key={student.student_id}>
                      <td><span className="badge badge-info">{student.enrollment_no}</span></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{student.name}</span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>{student.email}</span>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${currentStatus === 'Present' ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => handleStatusChange(student.student_id, 'Present')}
                            style={{ minWidth: '70px', padding: '6px 10px' }}
                          >
                            <Check size={14} /> Present
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${currentStatus === 'Late' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleStatusChange(student.student_id, 'Late')}
                            style={{
                              minWidth: '65px',
                              padding: '6px 10px',
                              background: currentStatus === 'Late' ? '#f59e0b' : '#ffffff',
                              color: currentStatus === 'Late' ? '#ffffff' : '#0f172a',
                              borderColor: currentStatus === 'Late' ? '#d97706' : 'var(--border-color)'
                            }}
                          >
                            <Clock size={14} /> Late
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${currentStatus === 'Absent' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => handleStatusChange(student.student_id, 'Absent')}
                            style={{ minWidth: '70px', padding: '6px 10px' }}
                          >
                            <XCircle size={14} /> Absent
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${currentStatus === 'Excused' ? 'btn-secondary' : 'btn-secondary'}`}
                            onClick={() => handleStatusChange(student.student_id, 'Excused')}
                            style={{
                              minWidth: '75px',
                              padding: '6px 10px',
                              background: currentStatus === 'Excused' ? '#0ea5e9' : '#ffffff',
                              color: currentStatus === 'Excused' ? '#ffffff' : '#0f172a',
                              borderColor: currentStatus === 'Excused' ? '#0284c7' : 'var(--border-color)'
                            }}
                          >
                            <HelpCircle size={14} /> Excused
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Doctor's appointment / reason..."
                          value={currentRemarks}
                          onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                      </td>
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
