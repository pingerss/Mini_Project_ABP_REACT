import React from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminCoursesPage } from './pages/AdminCoursesPage';
import { AdminLessonsPage } from './pages/AdminLessonsPage';
import { AdminStudentsPage } from './pages/AdminStudentsPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { CourseListPage } from './pages/CourseListPage';
import { LessonPlayerPage } from './pages/LessonPlayerPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const Navbar: React.FC = () => {
  const { isAuthenticated, userName, isInstructorOrAdmin, logout } = useAuth();

  return (
    <header
      style={{
        backgroundColor: '#1e3a8a',
        color: '#ffffff',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            🎓 Mini LMS (ABP + React)
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 14 }}>
            {isAuthenticated && (
              <Link to="/" style={{ color: '#dbeafe', textDecoration: 'none', fontWeight: 500 }}>
                Khóa học của tôi
              </Link>
            )}
            {isInstructorOrAdmin && (
              <>
                <Link
                  to="/admin"
                  style={{
                    color: '#fef08a',
                    textDecoration: 'none',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  Quản trị Khóa học
                </Link>
                <Link
                  to="/admin/students"
                  style={{
                    color: '#a7f3d0',
                    textDecoration: 'none',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  Cấp TK Học viên
                </Link>
              </>
            )}
          </nav>
        </div>

        <div>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
              <span>
                Xin chào, <b>{userName}</b>
              </span>
              <button
                onClick={logout}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #93c5fd',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                to="/register"
                style={{
                  color: '#fef08a',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13.5,
                }}
              >
                Đăng ký Giảng viên
              </Link>
              <Link
                to="/login"
                style={{
                  color: '#ffffff',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #93c5fd',
                  fontSize: 14,
                }}
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CourseListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <CourseDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:courseId"
            element={
              <ProtectedRoute>
                <LessonPlayerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/lessons"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLessonsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute requireAdmin>
                <AdminStudentsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
