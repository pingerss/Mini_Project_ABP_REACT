import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { lmsService } from '../api/lmsService';
import type{ CourseLearningDto, LessonWithProgressDto } from '../types/lms';

export const LessonPlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [learningData, setLearningData] = useState<CourseLearningDto | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    const loadLearningData = async () => {
      try {
        setIsLoading(true);
        const data = await lmsService.getLearningCourse(courseId);
        setLearningData(data);
        if (data.lessons.length > 0) {
          setActiveLessonId(data.lessons[0].lessonId);
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            'Không thể tải dữ liệu phòng học. Hãy chắc chắn bạn đã đăng ký khóa học này.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadLearningData();
  }, [courseId]);

  const activeLesson: LessonWithProgressDto | undefined = learningData?.lessons.find(
    (l) => l.lessonId === activeLessonId
  );

  const handleToggleComplete = async (lesson: LessonWithProgressDto) => {
    if (!courseId) return;
    try {
      setIsUpdatingProgress(true);
      const updatedCourse = await lmsService.toggleLessonProgress(
        courseId,
        lesson.lessonId,
        !lesson.isCompleted
      );
      setLearningData(updatedCourse);
    } catch (err) {
      alert('Không thể cập nhật tiến độ bài học.');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (isLoading) return <p style={{ padding: 24 }}>Đang mở phòng học...</p>;
  if (error || !learningData) return <p style={{ padding: 24, color: '#dc2626' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 1140, margin: '20px auto', padding: '0 16px' }}>
      {/* Thanh tiêu đề khóa học & Thanh tiến độ (Progress Bar) */}
      <div
        style={{
          padding: 20,
          marginBottom: 20,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{learningData.courseTitle}</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: 14, color: '#cbd5e1' }}>
            Tiến độ hoàn thành: <b>{learningData.completedLessons}</b> / {learningData.totalLessons} bài học (
            {learningData.progressPercent}%)
          </p>
        </div>

        <div style={{ width: 240 }}>
          <div style={{ height: 12, backgroundColor: '#334155', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${learningData.progressPercent}%`,
                height: '100%',
                backgroundColor: '#22c55e',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {learningData.status === 1 && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#4ade80', textAlign: 'right', fontWeight: 600 }}>
              🎉 Đã hoàn thành khóa học!
            </div>
          )}
        </div>
      </div>

      {/* Bố cục 2 cột: Cột trái danh sách bài học - Cột phải nội dung bài giảng */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
        <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, backgroundColor: '#f8fafc' }}>
          <h3 style={{ marginTop: 4, marginBottom: 12, paddingLeft: 8 }}>Danh sách bài giảng</h3>
          {learningData.lessons.map((lesson) => {
            const isSelected = lesson.lessonId === activeLessonId;
            return (
              <div
                key={lesson.lessonId}
                onClick={() => setActiveLessonId(lesson.lessonId)}
                style={{
                  padding: '12px 14px',
                  marginBottom: 8,
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#dbeafe' : '#ffffff',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500 }}>
                  {lesson.orderIndex}. {lesson.title}
                </span>
                <span style={{ fontSize: 16 }}>{lesson.isCompleted ? '✅' : '⬜'}</span>
              </div>
            );
          })}
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 24, backgroundColor: '#ffffff' }}>
          {activeLesson ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ marginTop: 0, color: '#1e293b' }}>{activeLesson.title}</h2>
                <button
                  onClick={() => handleToggleComplete(activeLesson)}
                  disabled={isUpdatingProgress}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 600,
                    cursor: isUpdatingProgress ? 'not-allowed' : 'pointer',
                    backgroundColor: activeLesson.isCompleted ? '#dcfce7' : '#2563eb',
                    color: activeLesson.isCompleted ? '#166534' : '#ffffff',
                  }}
                >
                  {activeLesson.isCompleted
                    ? '✅ Đã hoàn thành (Bấm để bỏ đánh dấu)'
                    : 'Đánh dấu hoàn thành bài này'}
                </button>
              </div>

              {activeLesson.videoUrl && (
                <div style={{ margin: '16px 0' }}>
                  <iframe
                    width="100%"
                    height="380"
                    src={activeLesson.videoUrl}
                    title={activeLesson.title}
                    style={{ borderRadius: 8, border: '1px solid #cbd5e1' }}
                    allowFullScreen
                  />
                </div>
              )}

              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  lineHeight: 1.7,
                  color: '#334155',
                }}
              >
                <h4>Nội dung chi tiết bài học:</h4>
                <p>{activeLesson.content}</p>
              </div>
            </>
          ) : (
            <p>Hãy chọn một bài học ở danh sách bên trái.</p>
          )}
        </div>
      </div>
    </div>
  );
};