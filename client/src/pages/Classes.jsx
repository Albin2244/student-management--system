import React, { useState, useEffect } from 'react';
import { classService, teacherService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  School,
  Plus,
  Users,
  DoorOpen,
  GraduationCap,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function Classes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected class for viewing students roster
  const [selectedClassDetail, setSelectedClassDetail] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    section: 'A',
    room_number: '',
    teacher_id: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes] = await Promise.all([
        classService.getAll(),
        teacherService.getAll()
      ]);
      if (classRes.data?.success) setClasses(classRes.data.data);
      if (teacherRes.data?.success) setTeachers(teacherRes.data.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewClassRoster = async (classItem) => {
    setRosterLoading(true);
    try {
      const res = await classService.getById(classItem.class_id);
      if (res.data?.success) {
        setSelectedClassDetail(res.data.data);
      }
    } catch (err) {
      console.error('Error loading roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingClass(null);
    setFormData({
      class_name: '',
      section: 'A',
      room_number: '',
      teacher_id: teachers[0]?.teacher_id || ''
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingClass(c);
    setFormData({
      class_name: c.class_name,
      section: c.section,
      room_number: c.room_number || '',
      teacher_id: c.teacher_id || ''
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
      if (editingClass) {
        const res = await classService.update(editingClass.class_id, formData);
        if (res.data?.success) {
          setFormSuccess('Class updated successfully!');
          setTimeout(() => {
            setModalOpen(false);
            loadData();
          }, 700);
        }
      } else {
        const res = await classService.create(formData);
        if (res.data?.success) {
          setFormSuccess('Class created successfully!');
          setTimeout(() => {
            setModalOpen(false);
            loadData();
          }, 700);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name, section) => {
    if (!window.confirm(`Delete ${name} - Sec ${section}? Students will be unassigned.`)) {
      return;
    }
    try {
      const res = await classService.delete(id);
      if (res.data?.success) {
        loadData();
        if (selectedClassDetail?.class_id === id) {
          setSelectedClassDetail(null);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting class');
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Classrooms & Batches</h1>
          <p style={{ color: '#64748b' }}>Configure student batches, sections, rooms, and assigned class mentors</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Create New Class
          </button>
        )}
      </div>

      {/* Classes Grid */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {loading ? (
          <p style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>Loading classes...</p>
        ) : classes.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>No classes configured yet.</p>
        ) : (
          classes.map((c) => {
            const isSelected = selectedClassDetail?.class_id === c.class_id;
            return (
              <div
                key={c.class_id}
                className="card"
                style={{
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                  cursor: 'pointer'
                }}
                onClick={() => viewClassRoster(c)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{c.class_name}</h3>
                    <span className="badge badge-info" style={{ marginTop: '4px' }}>Section {c.section}</span>
                  </div>
                  <span className="badge badge-success">
                    <Users size={12} style={{ marginRight: '4px' }} />
                    {c.student_count || 0} Students
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569', marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                  <span>
                    <DoorOpen size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#94a3b8' }} />
                    Room: <strong>{c.room_number || 'TBD'}</strong>
                  </span>
                  <span>
                    <GraduationCap size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#94a3b8' }} />
                    Mentor: <strong>{c.teacher_name || 'Unassigned'}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Click to view roster &rarr;
                  </span>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => openEditModal(c)}
                        title="Edit Class"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn btn-danger-outline btn-icon"
                        onClick={() => handleDelete(c.class_id, c.class_name, c.section)}
                        title="Delete Class"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Class Student Roster */}
      {selectedClassDetail && (
        <div className="card fade-in">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <School size={20} color="#4f46e5" />
                {selectedClassDetail.class_name} (Section {selectedClassDetail.section}) — Student Roster
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Class Mentor: {selectedClassDetail.teacher_name || 'Unassigned'} • Room: {selectedClassDetail.room_number || 'TBD'}
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedClassDetail(null)}>
              Close Roster
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Enrollment</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {rosterLoading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading roster...</td></tr>
                ) : (selectedClassDetail.students || []).length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No students enrolled in this class.</td></tr>
                ) : (
                  (selectedClassDetail.students || []).map((s) => (
                    <tr key={s.student_id}>
                      <td><span className="badge badge-info">{s.enrollment_no}</span></td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.gender}</td>
                      <td>
                        <span className={`badge ${(s.attendance_rate || 0) >= 75 ? 'badge-success' : 'badge-warning'}`}>
                          {s.attendance_rate || 0}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingClass ? 'Edit Class Details' : 'Create New Class'}
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
                    <label className="form-label">Class / Cohort Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Computer Science - Year 4"
                      value={formData.class_name}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. A, B, or C"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Room Number / Lab</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Hall 301 / Lab 2"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class Mentor / Teacher</label>
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
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
