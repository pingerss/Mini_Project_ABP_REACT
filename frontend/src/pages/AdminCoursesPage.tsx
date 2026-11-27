import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '../api/lmsService';
import type { CourseDto, CreateUpdateCourseDto } from '../types/lms';

const STATUS_LABELS: Record<number, { text: string; bg: string; color: string }> = {
  0: { text: 'Bản nháp (Draft)', bg: '#fef3c7', color: '#92400e' },
  1: { text: 'Đã xuất bản (Published)', bg: '#dcfce7', color: '#166534' },
  2: { text: 'Lưu trữ (Archived)', bg: '#e2e8f0', color: '#475569' },
};

export const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tìm kiếm & lọc trạng thái
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '0' | '1' | '2'>('all');

  // Form state (tạo mới hoặc chỉnh sửa)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUpdateCourseDto>({
    title: '',
    description: '',
    status: 1,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await lmsService.getManageCourses();
      setCourses(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Không thể tải danh sách quản trị khóa học. Hãy đảm bảo tài khoản có quyền Admin hoặc Instructor.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', status: 1 });
    setFeedback(null);
    setShowForm(true);
  };

  const openEditForm = (course: CourseDto) => {
    setEditingId(course.id);
    setFormData({
      title: course.title,
      description: course.description,
      status: course.status,
    });
    setFeedback(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);
      if (editingId) {
        await lmsService.updateCourse(editingId, formData);
        setFeedback({ type: 'success', text: 'Đã cập nhật khóa học thành công.' });
      } else {
        await lmsService.createCourse(formData);
        setFeedback({ type: 'success', text: 'Đã tạo khóa học mới thành công.' });
      }
      setShowForm(false);
      await loadCourses();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Lưu khóa học thất bại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (course: CourseDto) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khóa học "${course.title}"?`)) return;
    try {
      setDeletingId(course.id);
      setFeedback(null);
      await lmsService.deleteCourse(course.id);
      setFeedback({ type: 'success', text: `Đã xóa khóa học "${course.title}".` });
      await loadCourses();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Xóa khóa học thất bại.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || String(c.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const publishedCount = courses.filter((c) => c.status === 1).length;
  const draftCount = courses.filter((c) => c.status === 0).length;

  return (
    <div style={{ maxWidth: 1140, width: '100%', margin: '28px auto', padding: '0 20px' }}>
      {/* Header & Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Màn hình Quản trị & Quản lý Khóa học</h1>
          <p style={{ color: '#475569', marginTop: 4 }}>
            Tạo, chỉnh sửa, xóa khóa học và quản lý danh sách bài học bên trong từng khóa.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/admin/students"
            style={{
              padding: '10px 18px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Quản lý & Cấp tài khoản Học viên
          </Link>
          <button
            onClick={openCreateForm}
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
            + Tạo khóa học mới
          </button>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ padding: 18, backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Tổng khóa học</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{courses.length}</div>
        </div>
        <div style={{ padding: 18, backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Đã xuất bản</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#059669', marginTop: 4 }}>{publishedCount}</div>
        </div>
        <div style={{ padding: 18, backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Bản nháp</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706', marginTop: 4 }}>{draftCount}</div>
        </div>
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

      {/* Form Tạo / Sửa khóa học */}
      {showForm && (
        <form
          onSubmit={handleSave}
          style={{
            padding: 24,
            marginBottom: 24,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {editingId ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
          </h2>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Tên khóa học *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ví dụ: Lập trình ASP.NET Core & ABP Framework"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Mô tả ngắn
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả mục tiêu và nội dung chính của khóa học..."
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 240 }}
            >
              <option value={0}>Bản nháp (Draft - Học viên chưa thấy)</option>
              <option value={1}>Đã xuất bản (Published - Học viên vào học được)</option>
              <option value={2}>Lưu trữ (Archived - Tạm đóng)</option>
            </select>
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
              {isSaving ? 'Đang lưu...' : editingId ? 'Cập nhật khóa học' : 'Lưu khóa học'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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

      {/* Thanh tìm kiếm & lọc trạng thái */}
      {courses.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc mô tả khóa học..."
            style={{
              flex: 1,
              minWidth: 240,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: 14,
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: 14,
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="1">Đã xuất bản (Published)</option>
            <option value="0">Bản nháp (Draft)</option>
            <option value="2">Lưu trữ (Archived)</option>
          </select>
        </div>
      )}

      {/* Bảng danh sách khóa học */}
      {isLoading ? (
        <p>Đang tải danh sách khóa học...</p>
      ) : error ? (
        <div style={{ padding: 16, backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8 }}>
          {error}
        </div>
      ) : courses.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          Chưa có khóa học nào. Hãy bấm <b>"+ Tạo khóa học mới"</b> để bắt đầu.
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{ padding: 28, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          Không tìm thấy khóa học nào khớp với từ khóa tìm kiếm.
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>Tên khóa học</th>
                <th style={{ padding: '14px 16px', fontSize: 13, color: '#475569', width: 120 }}>Số bài học</th>
                <th style={{ padding: '14px 16px', fontSize: 13, color: '#475569', width: 190 }}>Trạng thái</th>
                <th style={{ padding: '14px 16px', fontSize: 13, color: '#475569', width: 290 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => {
                const badge = STATUS_LABELS[course.status] || STATUS_LABELS[0];
                const isDeleting = deletingId === course.id;
                return (
                  <tr key={course.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{course.title}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{course.description}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155' }}>
                      {course.totalLessons} bài
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link
                          to={`/admin/courses/${course.id}/lessons`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Quản lý bài học
                        </Link>
                        <button
                          onClick={() => openEditForm(course)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(course)}
                          disabled={isDeleting}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            opacity: isDeleting ? 0.5 : 1,
                          }}
                        >
                          {isDeleting ? 'Đang xóa...' : 'Xóa'}
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
