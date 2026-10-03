import React, { useState, useEffect } from 'react';
import { marksService, courseService, classService, studentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Award,
  Plus,
  Search,
  Filter,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
  X,
  Printer
} from 'lucide-react';

export default function Marks() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [marksList, setMarksList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filterCourse, setFilterCourse] = useState('');
  const [filterExam, setFilterExam] = useState('');

  // Batch entry modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchCourse, setBatchCourse] = useState('');
  const [batchClass, setBatchClass] = useState('');
  const [batchExamType, setBatchExamType] = useState('Midterm');
  const [batchMaxMarks, setBatchMaxMarks] = useState(100);
  const [batchDate, setBatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchEntries, setBatchEntries] = useState({}); // { [student_id]: { marks: '', comments: '' } }
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [batchSuccess, setBatchSuccess] = useState('');

  // Student Transcript view
  const [studentReport, setStudentReport] = useState(null);

  useEffect(() => {
    if (isStudent) {
      loadStudentTranscript();
    } else {
      loadInitialData();
    }
  }, [isStudent, filterCourse, filterExam]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCourse) params.course_id = filterCourse;
      if (filterExam) params.exam_type = filterExam;

      const [coursesRes, classesRes, marksRes] = await Promise.all([
        courseService.getAll(),
        classService.getAll(),
        marksService.getAll(params)
      ]);

      if (coursesRes.data?.success) setCourses(coursesRes.data.data);
      if (classesRes.data?.success) setClasses(classesRes.data.data);
      if (marksRes.data?.success) setMarksList(marksRes.data.data);
    } catch (err) {
      console.error('Error loading marks data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentTranscript = async () => {
    setLoading(true);
    try {
      const res = await marksService.getReportCard(user?.student_id);
      if (res.data?.success) {
        setStudentReport(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching student transcript:', err);
    } finally {
      setLoading(false);
    }
  };

  const openBatchModal = () => {
    const initialCourse = courses[0]?.course_id || '';
    const initialClass = classes[0]?.class_id || '';
    setBatchCourse(initialCourse);
    setBatchClass(initialClass);
    setBatchExamType('Midterm');
    setBatchMaxMarks(100);
    setBatchDate(new Date().toISOString().split('T')[0]);
    setBatchError('');
    setBatchSuccess('');
    setBatchModalOpen(true);
    if (initialClass) {
      loadStudentsForBatch(initialClass);
    }
  };

  const loadStudentsForBatch = async (classId) => {
    setBatchLoading(true);
    try {
      const res = await studentService.getAll({ class_id: classId });
      const list = res.data?.data || [];
      setBatchStudents(list);

      const entries = {};
      list.forEach((s) => {
        entries[s.student_id] = { marks: '', comments: '' };
      });
      setBatchEntries(entries);
    } catch (err) {
      console.error('Error loading class students:', err);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleClassChangeInBatch = (classId) => {
    setBatchClass(classId);
    loadStudentsForBatch(classId);
  };

  const handleMarkInputChange = (studentId, value) => {
    setBatchEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: value }
    }));
  };

  const handleCommentInputChange = (studentId, value) => {
    setBatchEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], comments: value }
    }));
  };

  const calculateDynamicGrade = (score, max) => {
    if (score === '' || isNaN(score)) return '-';
    const pct = (Number(score) / Number(max)) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setBatchError('');
    setBatchSuccess('');

    // Prepare entries that have marks entered
    const validEntries = [];
    for (const s of batchStudents) {
      const item = batchEntries[s.student_id];
      if (item && item.marks !== '') {
        validEntries.push({
          student_id: s.student_id,
          marks_obtained: Number(item.marks),
          comments: item.comments || null
        });
      }
    }

    if (validEntries.length === 0) {
      setBatchError('Please enter marks for at least one student.');
      return;
    }

    setBatchLoading(true);
    try {
      const res = await marksService.createBatch({
        course_id: batchCourse,
        exam_type: batchExamType,
        max_marks: Number(batchMaxMarks),
        exam_date: batchDate,
        entries: validEntries
      });

      if (res.data?.success) {
        setBatchSuccess(`Successfully submitted marks for ${validEntries.length} students!`);
        setTimeout(() => {
          setBatchModalOpen(false);
          loadInitialData();
        }, 900);
      }
    } catch (err) {
      setBatchError(err.response?.data?.message || 'Failed to submit batch marks.');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDeleteMark = async (id, studentName, courseName) => {
    if (!window.confirm(`Delete mark entry for ${studentName} in ${courseName}?`)) {
      return;
    }
    try {
      const res = await marksService.delete(id);
      if (res.data?.success) {
        loadInitialData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting mark.');
    }
  };

  // ================= STUDENT TRANSCRIPT VIEW =================
  if (isStudent) {
    const marks = studentReport?.marks || [];
    const summary = studentReport?.summary || {};
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Academic Transcript & Gradebook</h1>
            <p style={{ color: '#64748b' }}>Complete record of examinations, performance percentages, and course grades</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            <Printer size={16} /> Print Grade Transcript
          </button>
        </div>

        {/* GPA Summary Card */}
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Cumulative Academic Grade
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981' }}>
                Grade {summary.overallGrade || 'A'}
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {summary.overallPercentage || 0}% Total Aggregate across {summary.coursesEvaluated || 0} evaluations
              </p>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ padding: '16px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL MARKS</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{summary.totalMarks || 0} / {summary.totalMax || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Award size={20} color="#4f46e5" /> Course Evaluation Ledger</h3>
            <span className="badge badge-info">{marks.length} Subjects Evaluated</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Instructor</th>
                  <th>Exam Type</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Instructor Comments</th>
                </tr>
              </thead>
              <tbody>
                {marks.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No examination grades recorded yet.</td></tr>
                ) : (
                  marks.map((m) => {
                    const pct = Math.round((m.marks_obtained / m.max_marks) * 100);
                    return (
                      <tr key={m.mark_id}>
                        <td><span className="badge badge-info">{m.course_code}</span></td>
                        <td style={{ fontWeight: 600 }}>{m.course_name}</td>
                        <td style={{ color: '#64748b' }}>{m.instructor || 'Faculty'}</td>
                        <td><span className="badge badge-neutral">{m.exam_type}</span></td>
                        <td><strong>{m.marks_obtained}</strong> / {m.max_marks}</td>
                        <td style={{ fontWeight: 600 }}>{pct}%</td>
                        <td>
                          <span className={`badge ${pct >= 70 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                            {m.grade}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontStyle: m.comments ? 'normal' : 'italic' }}>
                          {m.comments || 'No remarks'}
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

  // ================= ADMIN & TEACHER GRADEBOOK =================
  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Examinations & Gradebook</h1>
          <p style={{ color: '#64748b' }}>Enter course exam marks, compute automatic grade scales, and view student transcripts</p>
        </div>
        {isAdminOrTeacher && (
          <button className="btn btn-primary" onClick={openBatchModal}>
            <Plus size={18} /> Enter Batch Examination Marks
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: '240px' }}>
            <select
              className="form-select"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
            >
              <option value="">All Exam Types</option>
              <option value="Midterm">Midterm Exam</option>
              <option value="Final">Final Examination</option>
              <option value="Quiz">Continuous Quiz</option>
              <option value="Assignment">Assignment / Project</option>
            </select>
          </div>

          {(filterCourse || filterExam) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFilterCourse('');
                setFilterExam('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Marks Records Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Enrollment</th>
                <th>Student</th>
                <th>Course</th>
                <th>Exam</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Comments</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>Loading gradebook records...</td></tr>
              ) : marksList.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>No examination marks recorded yet.</td></tr>
              ) : (
                marksList.map((m) => {
                  const pct = Math.round((m.marks_obtained / m.max_marks) * 100);
                  return (
                    <tr key={m.mark_id}>
                      <td><span className="badge badge-info">{m.enrollment_no}</span></td>
                      <td style={{ fontWeight: 600 }}>{m.student_name}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{m.course_name}</span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>{m.course_code}</span>
                      </td>
                      <td><span className="badge badge-neutral">{m.exam_type}</span></td>
                      <td><strong>{m.marks_obtained}</strong> / {m.max_marks}</td>
                      <td style={{ fontWeight: 600 }}>{pct}%</td>
                      <td>
                        <span className={`badge ${pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {m.grade}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{m.comments || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link
                            to={`/students/${m.student_id}`}
                            className="btn btn-secondary btn-icon"
                            title="View Full Report Card"
                          >
                            <FileText size={15} />
                          </Link>
                          {user?.role === 'admin' && (
                            <button
                              className="btn btn-danger-outline btn-icon"
                              onClick={() => handleDeleteMark(m.mark_id, m.student_name, m.course_name)}
                              title="Delete Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Batch Marks Entry */}
      {batchModalOpen && (
        <div className="modal-overlay" onClick={() => setBatchModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Enter Batch Examination Marks</h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setBatchModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveBatch}>
              <div className="modal-body">
                {batchError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px' }}>
                    <AlertCircle size={16} /> {batchError}
                  </div>
                )}
                {batchSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px' }}>
                    <CheckCircle2 size={16} /> {batchSuccess}
                  </div>
                )}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Subject / Course *</label>
                    <select
                      className="form-select"
                      required
                      value={batchCourse}
                      onChange={(e) => setBatchCourse(e.target.value)}
                    >
                      {courses.map((c) => (
                        <option key={c.course_id} value={c.course_id}>
                          {c.course_code} - {c.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Classroom *</label>
                    <select
                      className="form-select"
                      required
                      value={batchClass}
                      onChange={(e) => handleClassChangeInBatch(e.target.value)}
                    >
                      {classes.map((c) => (
                        <option key={c.class_id} value={c.class_id}>
                          {c.class_name} - Section {c.section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Exam Type *</label>
                    <select
                      className="form-select"
                      value={batchExamType}
                      onChange={(e) => setBatchExamType(e.target.value)}
                    >
                      <option value="Midterm">Midterm Exam</option>
                      <option value="Final">Final Examination</option>
                      <option value="Quiz">Continuous Quiz</option>
                      <option value="Assignment">Assignment</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Maximum Marks *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="10"
                      max="1000"
                      value={batchMaxMarks}
                      onChange={(e) => setBatchMaxMarks(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Exam Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={batchDate}
                      onChange={(e) => setBatchDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Students Score Entry List */}
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '16px 0 10px 0', color: '#334155' }}>
                  Student Score Entry ({batchStudents.length} Students in cohort)
                </h4>

                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Enrollment</th>
                        <th>Student Name</th>
                        <th style={{ width: '110px' }}>Score</th>
                        <th style={{ width: '80px' }}>Grade</th>
                        <th>Instructor Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchLoading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading cohort students...</td></tr>
                      ) : batchStudents.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No students enrolled in this class.</td></tr>
                      ) : (
                        batchStudents.map((s) => {
                          const score = batchEntries[s.student_id]?.marks || '';
                          const comments = batchEntries[s.student_id]?.comments || '';
                          const dynamicGrade = calculateDynamicGrade(score, batchMaxMarks);

                          return (
                            <tr key={s.student_id}>
                              <td><span className="badge badge-info">{s.enrollment_no}</span></td>
                              <td style={{ fontWeight: 600 }}>{s.name}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-input"
                                  placeholder="Marks"
                                  min="0"
                                  max={batchMaxMarks}
                                  value={score}
                                  onChange={(e) => handleMarkInputChange(s.student_id, e.target.value)}
                                  style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`badge ${dynamicGrade === 'A+' || dynamicGrade === 'A' ? 'badge-success' : dynamicGrade === '-' ? 'badge-neutral' : 'badge-warning'}`}>
                                  {dynamicGrade}
                                </span>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="e.g. Excellent work..."
                                  value={comments}
                                  onChange={(e) => handleCommentInputChange(s.student_id, e.target.value)}
                                  style={{ padding: '6px 8px', fontSize: '0.85rem' }}
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
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBatchModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={batchLoading}>
                  {batchLoading ? 'Saving Scores...' : 'Save & Publish Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
