import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '../api/lmsService';
import type { CourseDto, StudentAccountDto } from '../types/lms';

function generateStrongPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Lms@${digits}aA`;
}

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentAccountDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State form tạo tài khoản học viên mới
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generateStrongPassword());
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hộp hiển thị tài khoản vừa tạo hoặc vừa reset mật khẩu để Giảng viên copy gửi cho Học viên
  const [createdCredentials, setCreatedCredentials] = useState<{
    title: string;
    userName: string;
    email: string;
    password: string;
    courses: string[];
  } | null>(null);

  // State modal gán thêm khóa học cho học viên cũ
  const [assigningStudent, setAssigningStudent] = useState<StudentAccountDto | null>(null);
  const [assignCourseIds, setAssignCourseIds] = useState<string[]>([]);

  // State modal Reset mật khẩu học viên
  const [resettingStudent, setResettingStudent] = useState<StudentAccountDto | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState(() => generateStrongPassword());

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [studentList, courseList] = await Promise.all([
        lmsService.getStudents(),
        lmsService.getManageCourses(),
      ]);
      setStudents(studentList);
      setCourses(courseList);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tải danh sách học viên.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleCourseSelection = (courseId: string, list: string[], setter: (val: string[]) => void) => {
    if (list.includes(courseId)) {
      setter(list.filter((id) => id !== courseId));
    } else {
      setter([...list, courseId]);
    }
  };

  const handleOpenCreate = () => {
    setUserName('');
    setEmail('');
    setPassword(generateStrongPassword());
    setSelectedCourseIds(courses.length > 0 ? [courses[0].id] : []);
    setFeedback(null);
    setShowCreateForm(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);
      const created = await lmsService.createStudent({
        userName,
        email,
        password,
        courseIds: selectedCourseIds,
      });

      setCreatedCredentials({
        title: 'Đã tạo tài khoản Học viên & kích hoạt khóa học thành công!',
        userName: created.userName,
        email: created.email,
        password,
        courses: created.enrolledCourses.map((c) => c.courseTitle),
      });

      setShowCreateForm(false);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Tạo tài khoản học viên thất bại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAssignModal = (student: StudentAccountDto) => {
    setResettingStudent(null);
    setAssigningStudent(student);
    setAssignCourseIds(student.enrolledCourses.map((c) => c.courseId));
    setFeedback(null);
  };

  const handleSaveAssignCourses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent) return;
    try {
      setIsSaving(true);
      setFeedback(null);
      await lmsService.assignCoursesToStudent({
        studentId: assigningStudent.id,
        courseIds: assignCourseIds,
      });
      setAssigningStudent(null);
      setFeedback({
        type: 'success',
        text: `Đã cập nhật danh sách khóa học cho học viên "${assigningStudent.userName}".`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể gán khóa học.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenResetModal = (student: StudentAccountDto) => {
    setAssigningStudent(null);
    setResettingStudent(student);
    setResetPasswordVal(generateStrongPassword());
    setFeedback(null);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingStudent) return;
    try {
      setIsSaving(true);
      setFeedback(null);
      await lmsService.resetStudentPassword({
        studentId: resettingStudent.id,
        newPassword: resetPasswordVal,
      });

      setCreatedCredentials({
        title: `Đã đặt lại mật khẩu mới cho học viên "${resettingStudent.userName}"!`,
        userName: resettingStudent.userName,
        email: resettingStudent.email,
        password: resetPasswordVal,
        courses: resettingStudent.enrolledCourses.map((c) => c.courseTitle),
      });
      setResettingStudent(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Đặt lại mật khẩu thất bại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (student: StudentAccountDto) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa tài khoản học viên "${student.userName}" cùng toàn bộ dữ liệu đăng ký học?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(student.id);
      setFeedback(null);
      await lmsService.deleteStudent(student.id);
      setFeedback({ type: 'success', text: `Đã xóa tài khoản học viên "${student.userName}".` });
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể xóa tài khoản học viên.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Thông tin tài khoản học tập Mini LMS:\n- Đăng nhập tại: ${window.location.origin}/login\n- Tên đăng nhập: ${createdCredentials.userName}\n- Mật khẩu: ${createdCredentials.password}\n- Khóa học đã kích hoạt: ${
      createdCredentials.courses.join(', ') || 'Chưa gán'
    }`;
    navigator.clipboard.writeText(text);
    setFeedback({ type: 'success', text: 'Đã copy thông tin tài khoản vào Clipboard!' });
  };

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return s.userName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: 1140, width: '100%', margin: '28px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 14 }}>
        <Link to="/admin" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          ← Quay lại Quản lý Khóa học
        </Link>
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 22,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Quản lý & Cấp tài khoản Học viên</h1>
          <p style={{ color: '#475569', marginTop: 4 }}>
            Giảng viên tạo tài khoản cho Học viên, gán khóa học, đặt lại mật khẩu và theo dõi tiến độ.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            padding: '10px 18px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Cấp tài khoản Học viên mới
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 18,
            borderRadius: 8,
            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: feedback.type === 'success' ? '#065f46' : '#dc2626',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Hộp thông báo bàn giao tài khoản vừa tạo hoặc vừa reset mật khẩu */}
      {createdCredentials && (
        <div
          style={{
            padding: 20,
            marginBottom: 24,
            backgroundColor: '#ecfdf5',
            border: '2px solid #10b981',
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, color: '#065f46' }}>{createdCredentials.title}</h3>
              <p style={{ margin: '6px 0 0 0', fontSize: 14, color: '#047857' }}>
                Hãy sao chép thông tin dưới đây và gửi cho học viên:
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopyCredentials}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Copy gửi Học viên
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#065f46',
                  border: '1px solid #10b981',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 14,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #a7f3d0',
              fontFamily: 'Consolas, monospace',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            <div>
              • <b>Tên đăng nhập:</b> {createdCredentials.userName}
            </div>
            <div>
              • <b>Email:</b> {createdCredentials.email}
            </div>
            <div>
              • <b>Mật khẩu:</b>{' '}
              <span style={{ color: '#dc2626', fontWeight: 700 }}>{createdCredentials.password}</span>
            </div>
            <div>
              • <b>Khóa học đã gán:</b> {createdCredentials.courses.join(', ') || 'Chưa gán khóa học nào'}
            </div>
          </div>
        </div>
      )}

      {/* Form Cấp tài khoản Học viên mới */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateStudent}
          style={{
            padding: 24,
            marginBottom: 24,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Cấp tài khoản Học viên mới & Gán khóa học</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                Tên đăng nhập Học viên *
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ví dụ: hv_minh01"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                Email Học viên *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hv_minh01@minilms.local"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                Mật khẩu ban đầu *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 600 }}
                />
                <button
                  type="button"
                  onClick={() => setPassword(generateStrongPassword())}
                  style={{
                    padding: '0 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Tạo mới
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
              Chọn Khóa học để gán thẳng cho Học viên này (Auto-Enroll):
            </label>
            {courses.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Bạn chưa có khóa học nào. Hãy tạo khóa học trước hoặc gán sau.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                {courses.map((course) => (
                  <label
                    key={course.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.includes(course.id)}
                      onChange={() =>
                        toggleCourseSelection(course.id, selectedCourseIds, setSelectedCourseIds)
                      }
                    />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{course.title}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>({course.totalLessons} bài học)</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '10px 20px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving ? 'Đang tạo & ghi danh...' : 'Tạo tài khoản & Gán khóa học'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              style={{
                padding: '10px 18px',
                backgroundColor: '#e2e8f0',
                color: '#334155',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Form gán thêm khóa học cho học viên đã tồn tại */}
      {assigningStudent && (
        <form
          onSubmit={handleSaveAssignCourses}
          style={{
            padding: 20,
            marginBottom: 24,
            backgroundColor: '#eff6ff',
            borderRadius: 12,
            border: '1px solid #93c5fd',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>
            Gán bổ sung khóa học cho học viên: {assigningStudent.userName}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {courses.map((course) => (
              <label key={course.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={assignCourseIds.includes(course.id)}
                  onChange={() => toggleCourseSelection(course.id, assignCourseIds, setAssignCourseIds)}
                />
                <span style={{ fontWeight: 600 }}>{course.title}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu danh sách khóa học'}
            </button>
            <button
              type="button"
              onClick={() => setAssigningStudent(null)}
              style={{
                padding: '8px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </form>
      )}

      {/* Form Reset mật khẩu học viên */}
      {resettingStudent && (
        <form
          onSubmit={handleSaveResetPassword}
          style={{
            padding: 20,
            marginBottom: 24,
            backgroundColor: '#fffbeb',
            borderRadius: 12,
            border: '1px solid #fcd34d',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#92400e' }}>
            Đặt lại mật khẩu mới cho học viên: {resettingStudent.userName}
          </h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 420, marginBottom: 14 }}>
            <input
              type="text"
              required
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 600 }}
            />
            <button
              type="button"
              onClick={() => setResetPasswordVal(generateStrongPassword())}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Tạo ngẫu nhiên
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSaving ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
            </button>
            <button
              type="button"
              onClick={() => setResettingStudent(null)}
              style={{
                padding: '8px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Ô tìm kiếm học viên */}
      {students.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm học viên theo tên đăng nhập hoặc email..."
            style={{
              width: '100%',
              maxWidth: 420,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: 14,
            }}
          />
        </div>
      )}

      {/* Bảng danh sách Học viên */}
      {isLoading ? (
        <p>Đang tải danh sách học viên...</p>
      ) : error ? (
        <div style={{ padding: 16, backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8 }}>{error}</div>
      ) : students.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          Chưa có tài khoản Học viên nào. Hãy bấm <b>"+ Cấp tài khoản Học viên mới"</b>.
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ padding: 28, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          Không tìm thấy học viên nào khớp với từ khóa.
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 16px', fontSize: 13, color: '#475569', width: 220 }}>Tài khoản Học viên</th>
                <th style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>Các khóa học đã gán & Tiến độ</th>
                <th style={{ padding: '14px 16px', fontSize: 13, color: '#475569', width: 270 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const isDeleting = deletingId === student.id;
                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{student.userName}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{student.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {student.enrolledCourses.length === 0 ? (
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Chưa được gán khóa học nào</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {student.enrolledCourses.map((c) => (
                            <div
                              key={c.courseId}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 12,
                              }}
                            >
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>
                                {c.courseTitle}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  backgroundColor: c.progressPercent === 100 ? '#dcfce7' : '#e0f2fe',
                                  color: c.progressPercent === 100 ? '#166534' : '#0369a1',
                                }}
                              >
                                {c.completedLessons}/{c.totalLessons} bài ({c.progressPercent}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleOpenAssignModal(student)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 12.5,
                            cursor: 'pointer',
                          }}
                        >
                          + Gán khóa
                        </button>
                        <button
                          onClick={() => handleOpenResetModal(student)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 12.5,
                            cursor: 'pointer',
                          }}
                        >
                          Reset MK
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          disabled={isDeleting}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 12.5,
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            opacity: isDeleting ? 0.5 : 1,
                          }}
                        >
                          {isDeleting ? '...' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
