import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { lmsService } from '../api/lmsService';
import type { CourseDto, CreateUpdateLessonDto, LessonDto } from '../types/lms';

export const AdminLessonsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Thêm / Sửa bài học
  const [showForm, setShowForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUpdateLessonDto>({
    courseId: courseId || '',
    title: '',
    videoUrl: '',
    content: '',
    orderIndex: 1,
  });
  const [isSaving, setIsSaving] = useState(false);

  const loadCourseDetail = async () => {
    if (!courseId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await lmsService.getCourseById(courseId);
      setCourse(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tải thông tin khóa học.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourseDetail();
  }, [courseId]);

  const openAddForm = () => {
    const nextOrder = (course?.lessons.length || 0) + 1;
    setEditingLessonId(null);
    setFormData({
      courseId: courseId || '',
      title: '',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      content: '',
      orderIndex: nextOrder,
    });
    setShowForm(true);
  };

  const openEditForm = (lesson: LessonDto) => {
    setEditingLessonId(lesson.id);
    setFormData({
      courseId: lesson.courseId,
      title: lesson.title,
      videoUrl: lesson.videoUrl,
      content: lesson.content,
      orderIndex: lesson.orderIndex,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingLessonId) {
        await lmsService.updateLesson(editingLessonId, formData);
      } else {
        await lmsService.addLesson(formData);
      }
      setShowForm(false);
      await loadCourseDetail();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Lưu bài học thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (lesson: LessonDto) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài học "${lesson.title}"?`)) return;
    try {
      await lmsService.deleteLesson(lesson.id);
      await loadCourseDetail();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Xóa bài học thất bại.');
    }
  };

  const handleSwapOrder = async (index: number, direction: -1 | 1) => {
    if (!course) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= course.lessons.length) return;

    const current = course.lessons[index];
    const neighbor = course.lessons[targetIndex];

    try {
      await Promise.all([
        lmsService.updateLesson(current.id, {
          courseId: current.courseId,
          title: current.title,
          videoUrl: current.videoUrl,
          content: current.content,
          orderIndex: neighbor.orderIndex,
        }),
        lmsService.updateLesson(neighbor.id, {
          courseId: neighbor.courseId,
          title: neighbor.title,
          videoUrl: neighbor.videoUrl,
          content: neighbor.content,
          orderIndex: current.orderIndex,
        }),
      ]);
      await loadCourseDetail();
    } catch (err: any) {
      alert('Không thể đổi thứ tự bài học.');
    }
  };

  if (isLoading) return <p style={{ padding: 24 }}>Đang tải danh sách bài học...</p>;
  if (error || !course) return <p style={{ padding: 24, color: '#dc2626' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 960, width: '100%', margin: '28px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          ← Quay lại Quản lý Khóa học
        </Link>
      </div>

      <div
        style={{
          padding: 24,
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
            Quản lý Bài học (Lessons)
          </div>
          <h1 style={{ margin: '4px 0 6px 0' }}>{course.title}</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Hiện có <b>{course.lessons.length}</b> bài học trong khóa này.
          </p>
        </div>

        <button
          onClick={openAddForm}
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
          + Thêm bài học mới
        </button>
      </div>

      {/* Form Thêm / Sửa Bài học */}
      {showForm && (
        <form
          onSubmit={handleSave}
          style={{
            padding: 24,
            marginBottom: 24,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {editingLessonId ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                Tiêu đề bài học *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ví dụ: Bài 4: Xử lý phân quyền Role trong ABP"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                Thứ tự (Order)
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Link Video Embed (YouTube / MP4)
            </label>
            <input
              type="text"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/embed/..."
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Nội dung bài học
            </label>
            <textarea
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Nhập tóm tắt kiến thức hoặc tài liệu của bài học..."
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
            />
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
              {isSaving ? 'Đang lưu...' : editingLessonId ? 'Cập nhật bài học' : 'Thêm bài học'}
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

      {/* Danh sách bài học */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {course.lessons.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            Khóa học này chưa có bài học nào. Hãy bấm <b>"+ Thêm bài học mới"</b>.
          </div>
        ) : (
          course.lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              style={{
                padding: 18,
                backgroundColor: '#ffffff',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                <span
                  style={{
                    minWidth: 32,
                    height: 32,
                    borderRadius: 999,
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {lesson.orderIndex}
                </span>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{lesson.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{lesson.content}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => handleSwapOrder(idx, -1)}
                  disabled={idx === 0}
                  title="Đưa lên trên"
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    opacity: idx === 0 ? 0.4 : 1,
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => handleSwapOrder(idx, 1)}
                  disabled={idx === course.lessons.length - 1}
                  title="Đưa xuống dưới"
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: idx === course.lessons.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: idx === course.lessons.length - 1 ? 0.4 : 1,
                  }}
                >
                  ↓
                </button>
                <button
                  onClick={() => openEditForm(lesson)}
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
                  onClick={() => handleDelete(lesson)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
