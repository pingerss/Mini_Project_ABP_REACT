import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsService } from '../api/lmsService';
import type { CourseDto } from '../types/lms';

export const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [progressFilter, setProgressFilter] = useState<'all' | 'learning' | 'completed'>('all');

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

  const filteredCourses = courses.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.instructorName || '').toLowerCase().includes(q);

    const percent = c.progressPercent ?? 0;
    const isCompleted = c.enrollmentStatus === 1 || (c.totalLessons > 0 && percent >= 100);
    if (progressFilter === 'completed') return matchesSearch && isCompleted;
    if (progressFilter === 'learning') return matchesSearch && !isCompleted;
    return matchesSearch;
  });

  if (isLoading) return <p style={{ padding: 24 }}>Đang tải khóa học của bạn...</p>;
  if (error) return <p style={{ padding: 24, color: '#dc2626' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 960, width: '100%', margin: '28px auto', padding: '0 20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ color: '#0f172a', margin: 0 }}>Khóa học của tôi</h1>
          <p style={{ color: '#475569', margin: '6px 0 0 0' }}>
            Danh sách các khóa học đã được Giảng viên trực tiếp cấp phát cho tài khoản của bạn.
          </p>
        </div>

        {courses.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên khóa học, giảng viên..."
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                minWidth: 230,
                fontSize: 14,
              }}
            />
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value as any)}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: 14,
              }}
            >
              <option value="all">Tất cả ({courses.length})</option>
              <option value="learning">Đang học</option>
              <option value="completed">Đã hoàn thành (100%)</option>
            </select>
          </div>
        )}
      </div>

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
      ) : filteredCourses.length === 0 ? (
        <div
          style={{
            padding: 28,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: '1px solid #cbd5e1',
            color: '#475569',
          }}
        >
          Không tìm thấy khóa học nào khớp với bộ lọc hiện tại.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
          {filteredCourses.map((course) => {
            const percent = course.progressPercent ?? 0;
            const completed = course.completedLessons ?? 0;
            const isCompleted = course.enrollmentStatus === 1 || (course.totalLessons > 0 && percent >= 100);

            return (
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
                        backgroundColor: isCompleted ? '#dcfce7' : '#e0f2fe',
                        color: isCompleted ? '#166534' : '#0369a1',
                      }}
                    >
                      {isCompleted ? 'Đã hoàn thành khóa học' : 'Đang theo học'}
                    </span>
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                      {completed}/{course.totalLessons} bài học
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
                    Giảng viên: {course.instructorName || 'Giảng viên'}
                  </div>

                  <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.55 }}>{course.description}</p>

                  {/* Thanh tiến độ khóa học ngay trên thẻ */}
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#475569',
                        marginBottom: 5,
                      }}
                    >
                      <span>Tiến độ hoàn thành</span>
                      <span style={{ color: isCompleted ? '#15803d' : '#1d4ed8' }}>{percent}%</span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        backgroundColor: '#e2e8f0',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          backgroundColor: isCompleted ? '#22c55e' : '#2563eb',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
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
                    {percent > 0 && !isCompleted ? 'Tiếp tục học →' : 'Vào học ngay →'}
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
            );
          })}
        </div>
      )}
    </div>
  );
};
