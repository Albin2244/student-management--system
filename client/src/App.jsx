import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside DashboardLayout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Students */}
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route path="/students/:id" element={<StudentProfile />} />

            {/* Faculty & Staff */}
            <Route
              path="/teachers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Teachers />
                </ProtectedRoute>
              }
            />

            {/* Classes & Batches */}
            <Route
              path="/classes"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <Classes />
                </ProtectedRoute>
              }
            />

            {/* Courses */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <Courses />
                </ProtectedRoute>
              }
            />

            {/* Attendance */}
            <Route path="/attendance" element={<Attendance />} />

            {/* Marks & Gradebook */}
            <Route path="/marks" element={<Marks />} />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Profile & Settings */}
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Default fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
