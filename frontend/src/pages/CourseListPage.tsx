import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '../api/lmsService';
import type { CourseDto } from '../types/lms';

export const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const data = await lmsService.getCourses();
        setCourses(data);
      } catch {
        setError('Không thể tải danh sách khóa học. Hãy kiểm tra Backend đã chạy chưa.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (isLoading) return <p style={{ padding: 24 }}>Đang tải khóa học của bạn...</p>;
  if (error) return <p style={{ padding: 24, color: '#dc2626' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 960, width: '100%', margin: '28px auto', padding: '0 20px' }}>
      <h1 style={{ color: '#0f172a' }}>Khóa học của tôi</h1>
      <p style={{ color: '#475569', marginBottom: 24 }}>
        Danh sách các khóa học đã được Giảng viên trực tiếp cấp phát cho tài khoản của bạn.
      </p>

      {courses.length === 0 ? (
        <div
          style={{
            padding: 36,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            color: '#475569',
          }}
        >
          <h3 style={{ color: '#0f172a', marginTop: 0 }}>Chưa có khóa học nào được gán</h3>
          <p style={{ margin: 0 }}>
            Tài khoản của bạn hiện chưa được Giảng viên gán vào khóa học nào. Vui lòng liên hệ Giảng viên phụ trách để được kích hoạt khóa học.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                padding: 22,
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 999,
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                    }}
                  >
                    Đã được cấp quyền học
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                    {course.totalLessons} bài học
                  </span>
                </div>

                <h3 style={{ marginTop: 14, marginBottom: 6, color: '#1e293b' }}>{course.title}</h3>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1d4ed8',
                    marginBottom: 10,
                  }}
                >
                  👨‍🏫 Giảng viên: {course.instructorName || 'Giảng viên'}
                </div>

                <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.55 }}>{course.description}</p>
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
                <Link
                  to={`/learn/${course.id}`}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Vào học ngay →
                </Link>

                <Link
                  to={`/courses/${course.id}`}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Xem đề cương
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
