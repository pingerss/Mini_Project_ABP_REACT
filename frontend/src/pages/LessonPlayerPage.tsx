import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { lmsService, toEmbedVideoUrl } from '../api/lmsService';
import type {
  CourseLearningDto,
  LessonWithProgressDto,
  QuizSubmitResultDto,
  StudentQuizPaperDto,
} from '../types/lms';

export const LessonPlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [learningData, setLearningData] = useState<CourseLearningDto | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // State bài kiểm tra trắc nghiệm (Quiz) của bài học đang chọn
  const [quizPaper, setQuizPaper] = useState<StudentQuizPaperDto | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizSubmitResultDto | null>(null);

  const loadLearningData = async (preserveActiveId?: string | null) => {
    if (!courseId) return;
    try {
      setIsLoading(true);
      const data = await lmsService.getLearningCourse(courseId);
      setLearningData(data);
      if (preserveActiveId && data.lessons.some((l) => l.lessonId === preserveActiveId)) {
        setActiveLessonId(preserveActiveId);
      } else if (data.lessons.length > 0) {
        setActiveLessonId(data.lessons[0].lessonId);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Không thể tải dữ liệu phòng học. Hãy chắc chắn bạn đã được gán khóa học này.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, [courseId]);

  // Mỗi khi chuyển sang bài học khác, tự động tải đề Quiz của bài học đó
  useEffect(() => {
    if (!activeLessonId) return;
    const fetchQuiz = async () => {
      try {
        setIsLoadingQuiz(true);
        setQuizResult(null);
        setSelectedAnswers({});
        setFeedbackMsg(null);
        const paper = await lmsService.getStudentQuiz(activeLessonId);
        setQuizPaper(paper);
      } catch {
        setQuizPaper(null);
      } finally {
        setIsLoadingQuiz(false);
      }
    };
    fetchQuiz();
  }, [activeLessonId]);

  const lessons = learningData?.lessons || [];
  const activeIndex = lessons.findIndex((l) => l.lessonId === activeLessonId);
  const activeLesson: LessonWithProgressDto | undefined =
    activeIndex >= 0 ? lessons[activeIndex] : undefined;

  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  const hasQuiz = (quizPaper?.questions.length || 0) > 0;

  const handleToggleComplete = async (lesson: LessonWithProgressDto) => {
    if (!courseId) return;
    try {
      setIsUpdatingProgress(true);
      setFeedbackMsg(null);
      const updatedCourse = await lmsService.toggleLessonProgress(
        courseId,
        lesson.lessonId,
        !lesson.isCompleted
      );
      setLearningData(updatedCourse);
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.error?.message || 'Không thể cập nhật tiến độ bài học.');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !activeLessonId || !quizPaper) return;

    const unansweredCount = quizPaper.questions.filter((q) => !selectedAnswers[q.id]).length;
    if (unansweredCount > 0) {
      setFeedbackMsg(`Vui lòng chọn đáp án cho tất cả các câu hỏi (còn ${unansweredCount} câu chưa chọn).`);
      return;
    }

    try {
      setIsSubmittingQuiz(true);
      setFeedbackMsg(null);
      const result = await lmsService.submitQuiz({
        courseId,
        lessonId: activeLessonId,
        answers: quizPaper.questions.map((q) => ({
          questionId: q.id,
          selectedOption: selectedAnswers[q.id],
        })),
      });
      setQuizResult(result);

      // Tải lại thông tin đề Quiz & tiến độ khóa học nếu đã vượt qua bài kiểm tra
      const [updatedPaper, updatedCourse] = await Promise.all([
        lmsService.getStudentQuiz(activeLessonId),
        lmsService.getLearningCourse(courseId),
      ]);
      setQuizPaper(updatedPaper);
      setLearningData(updatedCourse);
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.error?.message || 'Không thể nộp bài kiểm tra.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleRetryQuiz = () => {
    setQuizResult(null);
    setSelectedAnswers({});
    setFeedbackMsg(null);
  };

  if (isLoading) return <p style={{ padding: 24 }}>Đang mở phòng học...</p>;
  if (error || !learningData) return <p style={{ padding: 24, color: '#dc2626' }}>{error}</p>;

  const embedUrl = activeLesson ? toEmbedVideoUrl(activeLesson.videoUrl) : '';

  return (
    <div style={{ maxWidth: 1140, width: '100%', margin: '20px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          ← Quay lại Khóa học của tôi
        </Link>
      </div>

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
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#ffffff' }}>{learningData.courseTitle}</h2>
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
              Đã hoàn thành khóa học!
            </div>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* Bố cục 2 cột: Cột trái danh sách bài học - Cột phải nội dung bài giảng */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
        <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, backgroundColor: '#f8fafc', alignSelf: 'start' }}>
          <h3 style={{ marginTop: 4, marginBottom: 12, paddingLeft: 8 }}>Danh sách bài giảng</h3>
          {lessons.map((lesson) => {
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
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500 }}>
                    {lesson.orderIndex}. {lesson.title}
                  </div>
                  {(lesson.quizQuestionCount ?? 0) > 0 && (
                    <div style={{ fontSize: 11.5, color: '#1d4ed8', fontWeight: 600, marginTop: 2 }}>
                      Có bài Quiz ({lesson.quizQuestionCount} câu)
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: lesson.isCompleted ? '#dcfce7' : '#e2e8f0',
                    color: lesson.isCompleted ? '#166534' : '#475569',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lesson.isCompleted ? 'Hoàn thành' : 'Chưa học'}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 24, backgroundColor: '#ffffff' }}>
          {activeLesson ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <h2 style={{ marginTop: 0, color: '#1e293b' }}>{activeLesson.title}</h2>
                {hasQuiz ? (
                  <span
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      backgroundColor: activeLesson.isCompleted ? '#dcfce7' : '#eff6ff',
                      color: activeLesson.isCompleted ? '#166534' : '#1d4ed8',
                    }}
                  >
                    {activeLesson.isCompleted
                      ? 'Đã vượt qua bài Quiz & Hoàn thành bài học'
                      : 'Hoàn thành bài Quiz bên dưới (>= 70%) để qua bài'}
                  </span>
                ) : (
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
                      ? 'Đã hoàn thành (Bấm để bỏ đánh dấu)'
                      : 'Đánh dấu hoàn thành bài này'}
                  </button>
                )}
              </div>

              {embedUrl && (
                <div style={{ margin: '16px 0' }}>
                  <iframe
                    width="100%"
                    height="380"
                    src={embedUrl}
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
                <h4 style={{ marginTop: 0 }}>Nội dung chi tiết bài học:</h4>
                <p style={{ marginBottom: 0, whiteSpace: 'pre-line' }}>{activeLesson.content}</p>
              </div>

              {/* KHU VỰC BÀI KIỂM TRA TRẮC NGHIỆM CUỐI BÀI (QUIZ) */}
              {!isLoadingQuiz && hasQuiz && quizPaper && (
                <div
                  style={{
                    marginTop: 24,
                    padding: 22,
                    borderRadius: 12,
                    border: '2px solid #bfdbfe',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, color: '#1e3a8a' }}>
                        Bài kiểm tra trắc nghiệm cuối bài ({quizPaper.questions.length} câu)
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#475569' }}>
                        Yêu cầu đạt tối thiểu <b>{quizPaper.passingScorePercent}%</b> để tự động hoàn thành bài học này.
                      </p>
                    </div>

                    {quizPaper.bestScorePercent !== null && quizPaper.bestScorePercent !== undefined && (
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          fontSize: 12.5,
                          fontWeight: 700,
                          backgroundColor: quizPaper.isPassed ? '#dcfce7' : '#fef3c7',
                          color: quizPaper.isPassed ? '#166534' : '#92400e',
                        }}
                      >
                        Điểm cao nhất: {quizPaper.bestScorePercent}% ({quizPaper.totalAttempts} lần nộp)
                      </span>
                    )}
                  </div>

                  {/* Thông báo kết quả ngay sau khi nộp bài */}
                  {quizResult && (
                    <div
                      style={{
                        padding: 16,
                        marginBottom: 18,
                        borderRadius: 10,
                        backgroundColor: quizResult.isPassed ? '#ecfdf5' : '#fffbeb',
                        border: `1px solid ${quizResult.isPassed ? '#10b981' : '#f59e0b'}`,
                        color: quizResult.isPassed ? '#065f46' : '#92400e',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{quizResult.message}</div>
                      <button
                        type="button"
                        onClick={handleRetryQuiz}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: quizResult.isPassed ? '#059669' : '#d97706',
                          color: '#ffffff',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >
                        Làm lại bài kiểm tra
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmitQuiz}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {quizPaper.questions.map((q) => {
                        const chosen = selectedAnswers[q.id];
                        const feedbackItem = quizResult?.questionFeedbacks.find((f) => f.questionId === q.id);

                        return (
                          <div
                            key={q.id}
                            style={{
                              padding: 16,
                              backgroundColor: '#ffffff',
                              borderRadius: 10,
                              border: feedbackItem
                                ? feedbackItem.isCorrect
                                  ? '2px solid #22c55e'
                                  : '2px solid #ef4444'
                                : '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14.5 }}>
                                Câu {q.orderIndex}: {q.questionText}
                              </div>
                              {feedbackItem && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    backgroundColor: feedbackItem.isCorrect ? '#dcfce7' : '#fee2e2',
                                    color: feedbackItem.isCorrect ? '#166534' : '#b91c1c',
                                  }}
                                >
                                  {feedbackItem.isCorrect ? 'Chính xác' : 'Chưa đúng'}
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 10,
                                marginTop: 12,
                              }}
                            >
                              {(
                                [
                                  { key: 'A', label: q.optionA },
                                  { key: 'B', label: q.optionB },
                                  { key: 'C', label: q.optionC },
                                  { key: 'D', label: q.optionD },
                                ] as const
                              ).map((opt) => {
                                const isChecked = chosen === opt.key;
                                return (
                                  <label
                                    key={opt.key}
                                    style={{
                                      padding: '10px 12px',
                                      borderRadius: 8,
                                      border: isChecked ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                      backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                                      cursor: quizResult ? 'default' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      fontSize: 13.5,
                                      fontWeight: isChecked ? 600 : 400,
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`quiz-q-${q.id}`}
                                      value={opt.key}
                                      checked={isChecked}
                                      disabled={Boolean(quizResult)}
                                      onChange={() => handleSelectOption(q.id, opt.key)}
                                    />
                                    <span>
                                      <b>{opt.key}.</b> {opt.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!quizResult && (
                      <div style={{ marginTop: 16 }}>
                        <button
                          type="submit"
                          disabled={isSubmittingQuiz}
                          style={{
                            padding: '11px 22px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 14.5,
                            cursor: isSubmittingQuiz ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isSubmittingQuiz ? 'Đang chấm điểm...' : 'Nộp bài kiểm tra'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Thanh điều hướng Bài trước / Bài tiếp theo */}
              <div
                style={{
                  marginTop: 22,
                  paddingTop: 16,
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => prevLesson && setActiveLessonId(prevLesson.lessonId)}
                  disabled={!prevLesson}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontWeight: 600,
                    cursor: prevLesson ? 'pointer' : 'not-allowed',
                    opacity: prevLesson ? 1 : 0.4,
                  }}
                >
                  ← Bài trước
                </button>

                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                  Bài {activeIndex + 1} / {lessons.length}
                </span>

                <button
                  onClick={() => nextLesson && setActiveLessonId(nextLesson.lessonId)}
                  disabled={!nextLesson}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#1e40af',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: nextLesson ? 'pointer' : 'not-allowed',
                    opacity: nextLesson ? 1 : 0.4,
                  }}
                >
                  Bài tiếp theo →
                </button>
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
