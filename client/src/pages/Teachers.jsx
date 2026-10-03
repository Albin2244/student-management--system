import React, { useState, useEffect } from 'react';
import { teacherService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Plus,
  Search,
  Mail,
  Phone,
  BookOpen,
  School,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Award
} from 'lucide-react';

export default function Teachers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    designation: 'Associate Professor',
    qualification: 'Ph.D.',
    password: 'teacher123'
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, [departmentFilter]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (departmentFilter) params.department = departmentFilter;
      const res = await teacherService.getAll(params);
      if (res.data?.success) {
        setTeachers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTeachers();
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      qualification: 'M.Tech / Ph.D.',
      password: 'teacher123'
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTeacher(t);
    setFormData({
      name: t.name,
      email: t.email,
      phone: t.phone || '',
      department: t.department || 'Computer Science',
      designation: t.designation || 'Lecturer',
      qualification: t.qualification || '',
      password: ''
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
      if (editingTeacher) {
        const res = await teacherService.update(editingTeacher.teacher_id, formData);
        if (res.data?.success) {
          setFormSuccess('Faculty record updated!');
          setTimeout(() => {
            setModalOpen(false);
            loadTeachers();
          }, 800);
        }
      } else {
        const res = await teacherService.create(formData);
        if (res.data?.success) {
          setFormSuccess('Faculty member registered successfully!');
          setTimeout(() => {
            setModalOpen(false);
            loadTeachers();
          }, 800);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error processing faculty record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the faculty registry?`)) {
      return;
    }
    try {
      const res = await teacherService.delete(id);
      if (res.data?.success) {
        loadTeachers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting faculty member.');
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Faculty Directory</h1>
          <p style={{ color: '#64748b' }}>Academic instructors, department heads, and course advisors</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Faculty Member
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: '1', minWidth: '240px' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search faculty by name, email, or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              className="form-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">Search</button>
          {(search || departmentFilter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setDepartmentFilter('');
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {loading ? (
          <p style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>
            Loading faculty directory...
          </p>
        ) : teachers.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>
            No faculty members found.
          </p>
        ) : (
          teachers.map((t) => (
            <div key={t.teacher_id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                    {t.name.charAt(0)}
                  </div>
                  <span className="badge badge-info">{t.employee_id}</span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{t.name}</h3>
                <span style={{ fontSize: '0.82rem', color: '#4f46e5', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  {t.designation} • {t.department}
                </span>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
                  <Award size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {t.qualification || 'Academic Faculty'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: '#475569', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                  <span><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#94a3b8' }} /> {t.email}</span>
                  <span><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#94a3b8' }} /> {t.phone || 'No phone'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-neutral" title="Assigned Courses">
                    <BookOpen size={12} style={{ marginRight: '3px' }} /> {t.course_count || 0} Courses
                  </span>
                  <span className="badge badge-neutral" title="Supervised Classes">
                    <School size={12} style={{ marginRight: '3px' }} /> {t.class_count || 0} Classes
                  </span>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => openEditModal(t)}
                      title="Edit Teacher"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="btn btn-danger-outline btn-icon"
                      onClick={() => handleDelete(t.teacher_id, t.name)}
                      title="Delete Teacher"
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

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingTeacher ? 'Edit Faculty Details' : 'Add Faculty Member'}
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
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Prof. Alan Turing"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="prof.turing@sms.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Senior Professor"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+1-555-0100"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Qualification</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ph.D. in Computer Science"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    />
                  </div>
                </div>

                {!editingTeacher && (
                  <div className="form-group">
                    <label className="form-label">Initial Password</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingTeacher ? 'Update Faculty' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
