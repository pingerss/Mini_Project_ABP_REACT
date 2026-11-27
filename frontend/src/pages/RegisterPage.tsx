import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { lmsService } from '../api/lmsService';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('TEACHER2026');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await lmsService.registerInstructor({
        userName,
        email,
        password,
        inviteCode,
      });

      // Tự động đăng nhập sau khi tạo tài khoản Giảng viên thành công
      await login(userName, password);
      navigate('/admin');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'Đăng ký thất bại. Vui lòng kiểm tra lại Mã mời hoặc độ mạnh mật khẩu (cần chữ hoa, chữ thường, số và ký tự đặc biệt như 1q2w3E*).';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 460,
        width: '100%',
        margin: '48px auto',
        padding: 28,
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: 999,
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        DÀNH CHO GIẢNG VIÊN (INSTRUCTOR)
      </div>

      <h2 style={{ marginTop: 0, color: '#1e3a8a' }}>Đăng ký Tài khoản Giảng viên</h2>
      <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, marginBottom: 18 }}>
        Hệ thống chỉ mở đăng ký công khai cho <b>Giảng viên</b> (cần Mã mời). Tài khoản <b>Học viên</b> sẽ do Giảng viên trực tiếp khởi tạo và cấp phát trong màn hình Quản trị.
      </p>

      {errorMessage && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderRadius: 8,
            fontSize: 13.5,
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
            Tên đăng nhập (UserName) *
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Ví dụ: teacher_nam"
            required
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #94a3b8' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher_nam@minilms.local"
            required
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #94a3b8' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
            Mật khẩu * <span style={{ fontWeight: 400, color: '#64748b', fontSize: 12 }}>(VD: 1q2w3E*)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ít nhất 6 ký tự, có chữ hoa, thường, số & ký tự đặc biệt"
            required
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #94a3b8' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
            Mã mời Giảng viên (Invite Code) *
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Nhập mã mời (Mặc định: TEACHER2026)"
            required
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #2563eb',
              backgroundColor: '#f8fafc',
              fontWeight: 600,
            }}
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
            fontSize: 15,
          }}
        >
          {isLoading ? 'Đang khởi tạo tài khoản...' : 'Đăng ký làm Giảng viên'}
        </button>
      </form>

      <div style={{ marginTop: 18, textAlign: 'center', fontSize: 14, color: '#475569' }}>
        Đã có tài khoản?{' '}
        <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
          Đăng nhập tại đây
        </Link>
      </div>
    </div>
  );
};
