import React, { useState, useEffect } from 'react';
import { courseService, teacherService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Search,
  GraduationCap,
  Users,
  Award,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function Courses() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    credits: 3,
    department: 'Computer Science',
    teacher_id: '',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [deptFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (deptFilter) params.department = deptFilter;
      const [coursesRes, teachersRes] = await Promise.all([
        courseService.getAll(params),
        teacherService.getAll()
      ]);
      if (coursesRes.data?.success) setCourses(coursesRes.data.data);
      if (teachersRes.data?.success) setTeachers(teachersRes.data.data);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({
      course_code: '',
      course_name: '',
      credits: 4,
      department: 'Computer Science',
      teacher_id: teachers[0]?.teacher_id || '',
      description: ''
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCourse(c);
    setFormData({
      course_code: c.course_code,
      course_name: c.course_name,
      credits: c.credits || 3,
      department: c.department || 'Computer Science',
      teacher_id: c.teacher_id || '',
      description: c.description || ''
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingCourse) {
        const res = await courseService.update(editingCourse.course_id, formData);
        if (res.data?.success) {
          setFormSuccess('Course updated successfully!');
          setTimeout(() => {
            setModalOpen(false);
            loadData();
          }, 700);
        }
      } else {
        const res = await courseService.create(formData);
        if (res.data?.success) {
          setFormSuccess('Course registered successfully!');
          setTimeout(() => {
            setModalOpen(false);
            loadData();
          }, 700);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error processing course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete course ${name}? All associated exam marks will also be deleted.`)) {
      return;
    }
    try {
      const res = await courseService.delete(id);
      if (res.data?.success) {
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting course.');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Academic Curriculum & Courses</h1>
          <p style={{ color: '#64748b' }}>Manage registered syllabus, credit ratings, and assigned faculty instructors</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Register New Course
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>Filter Department:</span>
          <div style={{ minWidth: '220px' }}>
            <select
              className="form-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {loading ? (
          <p style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>No courses found.</p>
        ) : (
          courses.map((c) => (
            <div key={c.course_id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>{c.course_code}</span>
                  <span className="badge badge-success">{c.credits} Credits</span>
                </div>

                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '6px' }}>{c.course_name}</h3>
                <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  {c.department || 'General'}
                </span>

                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                  {c.description || 'Comprehensive foundational module.'}
                </p>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', fontSize: '0.85rem', color: '#475569' }}>
                  <GraduationCap size={15} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#94a3b8' }} />
                  Instructor: <strong>{c.teacher_name || 'Unassigned'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '16px' }}>
                <span className="badge badge-neutral">
                  <Users size={12} style={{ marginRight: '4px' }} />
                  {c.enrolled_students_count || 0} Evaluated
                </span>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => openEditModal(c)}
                      title="Edit Course"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="btn btn-danger-outline btn-icon"
                      onClick={() => handleDelete(c.course_id, c.course_name)}
                      title="Delete Course"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Course */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingCourse ? 'Edit Course Details' : 'Register New Course'}
              </h3>
              <button className="btn btn-icon btn-secondary" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px' }}>
                    <AlertCircle size={16} /> {formError}
                  </div>
                )}
                {formSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px' }}>
                    <CheckCircle2 size={16} /> {formSuccess}
                  </div>
                )}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Course Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. CS401"
                      value={formData.course_code}
                      onChange={(e) => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits *</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max="10"
                      required
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Artificial Intelligence & Machine Learning"
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned Instructor</label>
                    <select
                      className="form-select"
                      value={formData.teacher_id}
                      onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {teachers.map((t) => (
                        <option key={t.teacher_id} value={t.teacher_id}>
                          {t.name} ({t.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Course Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Syllabus overview and learning objectives..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
