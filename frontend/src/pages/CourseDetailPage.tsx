import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lmsService } from '../api/lmsService';
import type { CourseDto } from '../types/lms';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadDetail = async () => {
      try {
        setIsLoading(true);
        const data = await lmsService.getCourseById(id);
        setCourse(data);
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            'Bạn không có quyền truy cập hoặc khóa học này chưa được Giảng viên gán cho bạn.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  if (isLoading) return <p style={{ padding: 24 }}>Đang tải chi tiết khóa học...</p>;
  if (error || !course) return <p style={{ padding: 24, color: '#dc2626' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 880, width: '100%', margin: '28px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 16 }}>
        <Link
          to="/"
          style={{
            color: '#2563eb',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          ← Quay lại Khóa học của tôi
        </Link>
      </div>

      <div
        style={{
          padding: 28,
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 999,
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          👨‍🏫 Giảng viên phụ trách: {course.instructorName || 'Giảng viên'}
        </div>

        <h1 style={{ marginTop: 0, color: '#0f172a' }}>{course.title}</h1>
        <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.65 }}>{course.description}</p>

        <div style={{ marginTop: 22 }}>
          <button
            onClick={() => navigate(`/learn/${course.id}`)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Vào phòng học ngay →
          </button>
        </div>
      </div>

      <h2 style={{ marginTop: 32, marginBottom: 14, color: '#1e293b' }}>
        Đề cương bài học ({course.lessons.length} bài)
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {course.lessons.map((lesson) => (
          <div
            key={lesson.id}
            style={{
              padding: '14px 18px',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                minWidth: 28,
                height: 28,
                borderRadius: 999,
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {lesson.orderIndex}
            </span>
            <span style={{ fontWeight: 500, color: '#1e293b', fontSize: 15 }}>{lesson.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
