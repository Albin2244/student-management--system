import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentService, classService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';

export default function Students() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    class_id: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    password: 'student123'
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, [selectedClass, selectedGender]);

  const loadClasses = async () => {
    try {
      const res = await classService.getAll();
      if (res.data?.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedClass) params.class_id = selectedClass;
      if (selectedGender) params.gender = selectedGender;

      const res = await studentService.getAll(params);
      if (res.data?.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: 'Male',
      dob: '2005-01-01',
      class_id: classes[0]?.class_id || '',
      address: '',
      guardian_name: '',
      guardian_phone: '',
      password: 'student123'
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      gender: student.gender || 'Male',
      dob: student.dob || '',
      class_id: student.class_id || '',
      address: student.address || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
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
      if (editingStudent) {
        const res = await studentService.update(editingStudent.student_id, formData);
        if (res.data?.success) {
          setFormSuccess('Student updated successfully!');
          setTimeout(() => {
            setModalOpen(false);
            loadStudents();
          }, 800);
        }
      } else {
        const res = await studentService.create(formData);
        if (res.data?.success) {
          setFormSuccess('Student enrolled successfully!');
          setTimeout(() => {
            setModalOpen(false);
            loadStudents();
          }, 800);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}? All related attendance and marks will also be removed.`)) {
      return;
    }

    try {
      const res = await studentService.delete(studentId);
      if (res.data?.success) {
        loadStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting student');
    }
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Student Directory</h1>
          <p style={{ color: '#64748b' }}>Manage student admissions, profiles, and classroom allocations</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Enroll New Student
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: '1', minWidth: '240px' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by name, email, or enrollment no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name} - Sec {c.section}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '140px' }}>
            <select
              className="form-select"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Apply Filters
          </button>
          {(search || selectedClass || selectedGender) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setSelectedClass('');
                setSelectedGender('');
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Student List Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Enrollment</th>
                <th>Student Name</th>
                <th>Contact</th>
                <th>Class / Sec</th>
                <th>Attendance</th>
                <th>Avg Score</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const att = student.attendance_rate || 0;
                  return (
                    <tr key={student.student_id}>
                      <td>
                        <span className="badge badge-info">{student.enrollment_no}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, display: 'block' }}>{student.name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{student.gender}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ display: 'block', color: '#475569' }}>{student.email}</span>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{student.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {student.class_name ? `${student.class_name} (${student.section})` : 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${att >= 75 ? 'badge-success' : 'badge-warning'}`}>
                          {att}%
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: student.average_score ? '#0f172a' : '#94a3b8' }}>
                          {student.average_score ? `${student.average_score}%` : 'N/A'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link
                            to={`/students/${student.student_id}`}
                            className="btn btn-secondary btn-icon"
                            title="View Full Profile & Report"
                          >
                            <Eye size={16} />
                          </Link>
                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-secondary btn-icon"
                                onClick={() => openEditModal(student)}
                                title="Edit Student"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="btn btn-danger-outline btn-icon"
                                onClick={() => handleDelete(student.student_id, student.name)}
                                title="Delete Student"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
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

      {/* Modal: Enroll / Edit Student */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingStudent ? 'Edit Student Details' : 'Enroll New Student'}
              </h3>
              <button
                className="btn btn-icon btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
                    <AlertCircle size={16} /> {formError}
                  </div>
                )}
                {formSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
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
                      placeholder="e.g. Albin Antony"
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
                      placeholder="student@sms.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+1-555-0100"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Class Allocation</label>
                  <select
                    className="form-select"
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.class_id} value={c.class_id}>
                        {c.class_name} - Section {c.section} (Room: {c.room_number || 'TBD'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Guardian Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Parent / Guardian"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Guardian Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+1-555-0200"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Residential Address</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Residential street, city, country"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {!editingStudent && (
                  <div className="form-group">
                    <label className="form-label">Default Login Password</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.78rem' }}>
                      Student will log in with this password initially.
                    </small>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Save & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
