import React, { useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { lmsService } from './api/lmsService';
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
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleOpenPwdModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setPwdStatus(null);
    setShowPwdModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsChangingPwd(true);
      setPwdStatus(null);
      await lmsService.changeMyPassword({ currentPassword, newPassword });
      setPwdStatus({ type: 'success', text: 'Đã đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdStatus({
        type: 'error',
        text:
          err.response?.data?.error?.message ||
          'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại và độ mạnh mật khẩu mới.',
      });
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <>
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
              Mini LMS (ABP + React)
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                <span>
                  Xin chào, <b>{userName}</b>
                </span>
                <button
                  onClick={handleOpenPwdModal}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.35)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  Đổi mật khẩu
                </button>
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

      {/* Modal Đổi mật khẩu cá nhân */}
      {showPwdModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <form
            onSubmit={handleChangePassword}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.2)',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Đổi mật khẩu tài khoản ({userName})</h3>

            {pwdStatus && (
              <div
                style={{
                  padding: 10,
                  marginBottom: 14,
                  borderRadius: 8,
                  fontSize: 13.5,
                  backgroundColor: pwdStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: pwdStatus.type === 'success' ? '#065f46' : '#dc2626',
                }}
              >
                {pwdStatus.text}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>
                Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>
                Mật khẩu mới * <span style={{ fontWeight: 400, color: '#64748b', fontSize: 12 }}>(VD: Lms@2026aA)</span>
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowPwdModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isChangingPwd}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  cursor: isChangingPwd ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {isChangingPwd ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
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
