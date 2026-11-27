import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('1q2w3E*');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const roles = await login(username, password);
      const isInstructorOrAdmin = roles.some(
        (r) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'instructor'
      );
      navigate(isInstructorOrAdmin ? '/admin' : '/');
    } catch (err: any) {
      const desc =
        err.response?.data?.error_description ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.';
      setErrorMessage(desc);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: 28, border: '1px solid #cbd5e1', borderRadius: 12 }}>
      <h2 style={{ marginTop: 0, color: '#1e3a8a' }}>Đăng nhập Mini LMS</h2>
      <p style={{ fontSize: 14, color: '#475569' }}>
        Tài khoản mẫu: <b>student</b> / <b>1q2w3E*</b> (hoặc <b>instructor</b> / <b>1q2w3E*</b>)
      </p>

      {errorMessage && (
        <div style={{ padding: 12, marginBottom: 16, backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8 }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Tên đăng nhập</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #94a3b8' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #94a3b8' }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
        </button>
      </form>

      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0', fontSize: 13.5, color: '#475569' }}>
        <div style={{ marginBottom: 6 }}>
          Bạn là Giảng viên mới?{' '}
          <Link to="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Đăng ký tài khoản Giảng viên →
          </Link>
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b' }}>
          * Học viên sử dụng tài khoản được Giảng viên cấp để đăng nhập.
        </div>
      </div>
    </div>
  );
};