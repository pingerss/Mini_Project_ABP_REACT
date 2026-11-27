import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { lmsService, toEmbedVideoUrl } from '../api/lmsService';
import type {
  CourseDto,
  CreateUpdateLessonDto,
  CreateUpdateQuizQuestionDto,
  LessonDto,
  LessonMaterialDto,
  LessonSubmissionDto,
  QuizQuestionManageDto,
} from '../types/lms';

export const AdminLessonsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const [isReordering, setIsReordering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // State Quản lý Quiz cho một bài học đang mở
  const [activeQuizLesson, setActiveQuizLesson] = useState<LessonDto | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionManageDto[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<CreateUpdateQuizQuestionDto>({
    lessonId: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    orderIndex: 1,
  });
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // State Quản lý Tài liệu đính kèm & Bài nộp của Học viên
  const [activeAttachLesson, setActiveAttachLesson] = useState<LessonDto | null>(null);
  const [materials, setMaterials] = useState<LessonMaterialDto[]>([]);
  const [submissions, setSubmissions] = useState<LessonSubmissionDto[]>([]);
  const [isLoadingAttach, setIsLoadingAttach] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialType, setMaterialType] = useState('LINK');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { grade: number; feedback: string }>>({});
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);

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
    setFeedback(null);
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
    setFeedback(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);
      const normalizedPayload = {
        ...formData,
        videoUrl: toEmbedVideoUrl(formData.videoUrl),
      };
      if (editingLessonId) {
        await lmsService.updateLesson(editingLessonId, normalizedPayload);
        setFeedback({ type: 'success', text: 'Đã cập nhật bài học thành công.' });
      } else {
        await lmsService.addLesson(normalizedPayload);
        setFeedback({ type: 'success', text: 'Đã thêm bài học mới thành công.' });
      }
      setShowForm(false);
      await loadCourseDetail();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Lưu bài học thất bại.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (lesson: LessonDto) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài học "${lesson.title}"?`)) return;
    try {
      setDeletingId(lesson.id);
      setFeedback(null);
      await lmsService.deleteLesson(lesson.id);
      if (activeQuizLesson?.id === lesson.id) setActiveQuizLesson(null);
      if (activeAttachLesson?.id === lesson.id) setActiveAttachLesson(null);
      setFeedback({ type: 'success', text: `Đã xóa bài học "${lesson.title}".` });
      await loadCourseDetail();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Xóa bài học thất bại.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSwapOrder = async (index: number, direction: -1 | 1) => {
    if (!course || isReordering) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= course.lessons.length) return;

    const current = course.lessons[index];
    const neighbor = course.lessons[targetIndex];

    try {
      setIsReordering(true);
      setFeedback(null);
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
    } catch {
      setFeedback({ type: 'error', text: 'Không thể đổi thứ tự bài học.' });
    } finally {
      setIsReordering(false);
    }
  };

  // === QUẢN LÝ CÂU HỎI TRẮC NGHIỆM (QUIZ) ===
  const loadQuizQuestions = async (lesson: LessonDto) => {
    try {
      setIsLoadingQuiz(true);
      const data = await lmsService.getManageQuizQuestions(lesson.id);
      setQuizQuestions(data);
      resetQuestionForm(lesson.id, data.length + 1);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể tải danh sách câu hỏi Quiz.',
      });
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const resetQuestionForm = (lessonId: string, nextOrder: number) => {
    setEditingQuestionId(null);
    setQuestionForm({
      lessonId,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      orderIndex: nextOrder,
    });
  };

  const handleToggleQuizManager = async (lesson: LessonDto) => {
    setActiveAttachLesson(null);
    if (activeQuizLesson?.id === lesson.id) {
      setActiveQuizLesson(null);
      return;
    }
    setActiveQuizLesson(lesson);
    await loadQuizQuestions(lesson);
  };

  const handleEditQuestion = (q: QuizQuestionManageDto) => {
    setEditingQuestionId(q.id);
    setQuestionForm({
      lessonId: q.lessonId,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      orderIndex: q.orderIndex,
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizLesson) return;
    try {
      setIsSavingQuestion(true);
      setFeedback(null);
      if (editingQuestionId) {
        await lmsService.updateQuizQuestion(editingQuestionId, questionForm);
        setFeedback({ type: 'success', text: 'Đã cập nhật câu hỏi trắc nghiệm.' });
      } else {
        await lmsService.createQuizQuestion(questionForm);
        setFeedback({ type: 'success', text: 'Đã thêm câu hỏi trắc nghiệm mới.' });
      }
      await loadQuizQuestions(activeQuizLesson);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Lưu câu hỏi trắc nghiệm thất bại.',
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (q: QuizQuestionManageDto) => {
    if (!activeQuizLesson) return;
    if (!window.confirm(`Xóa câu hỏi "${q.questionText}"?`)) return;
    try {
      await lmsService.deleteQuizQuestion(q.id);
      setFeedback({ type: 'success', text: 'Đã xóa câu hỏi trắc nghiệm.' });
      await loadQuizQuestions(activeQuizLesson);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể xóa câu hỏi.',
      });
    }
  };

  // === QUẢN LÝ TÀI LIỆU ĐÍNH KÈM & CHẤM BÀI TẬP HỌC VIÊN ===
  const loadAttachmentsAndSubmissions = async (lesson: LessonDto) => {
    try {
      setIsLoadingAttach(true);
      const [matList, subList] = await Promise.all([
        lmsService.getLessonMaterials(lesson.id),
        lmsService.getLessonSubmissions(lesson.id),
      ]);
      setMaterials(matList);
      setSubmissions(subList);

      const initialGrades: Record<string, { grade: number; feedback: string }> = {};
      subList.forEach((s) => {
        initialGrades[s.id] = {
          grade: s.grade ?? 100,
          feedback: s.instructorFeedback || '',
        };
      });
      setGradeInputs(initialGrades);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể tải tài liệu và bài nộp.',
      });
    } finally {
      setIsLoadingAttach(false);
    }
  };

  const handleToggleAttachManager = async (lesson: LessonDto) => {
    setActiveQuizLesson(null);
    if (activeAttachLesson?.id === lesson.id) {
      setActiveAttachLesson(null);
      return;
    }
    setActiveAttachLesson(lesson);
    setMaterialTitle('');
    setMaterialUrl('');
    setMaterialType('LINK');
    await loadAttachmentsAndSubmissions(lesson);
  };

  const handleFileUploadForMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingFile(true);
      setFeedback(null);
      const uploaded = await lmsService.uploadFile(file);
      setMaterialUrl(uploaded.fileUrl);
      setMaterialType(uploaded.fileType || 'FILE');
      if (!materialTitle.trim()) {
        setMaterialTitle(uploaded.fileName);
      }
      setFeedback({ type: 'success', text: `Đã tải file "${uploaded.fileName}" lên máy chủ.` });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Tải file lên thất bại.',
      });
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAttachLesson) return;
    try {
      setIsSavingMaterial(true);
      setFeedback(null);
      await lmsService.createLessonMaterial({
        lessonId: activeAttachLesson.id,
        title: materialTitle,
        fileUrl: materialUrl,
        fileType: materialType,
      });
      setMaterialTitle('');
      setMaterialUrl('');
      setMaterialType('LINK');
      setFeedback({ type: 'success', text: 'Đã đính kèm tài liệu học tập vào bài giảng.' });
      await loadAttachmentsAndSubmissions(activeAttachLesson);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể lưu tài liệu đính kèm.',
      });
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (m: LessonMaterialDto) => {
    if (!activeAttachLesson) return;
    if (!window.confirm(`Xóa tài liệu "${m.title}"?`)) return;
    try {
      await lmsService.deleteLessonMaterial(m.id);
      setFeedback({ type: 'success', text: 'Đã xóa tài liệu đính kèm.' });
      await loadAttachmentsAndSubmissions(activeAttachLesson);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Không thể xóa tài liệu.',
      });
    }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    if (!activeAttachLesson) return;
    const input = gradeInputs[submissionId];
    if (!input) return;
    try {
      setGradingSubmissionId(submissionId);
      setFeedback(null);
      await lmsService.gradeSubmission({
        submissionId,
        grade: Number(input.grade),
        instructorFeedback: input.feedback,
      });
      setFeedback({ type: 'success', text: 'Đã lưu điểm và nhận xét cho bài nộp của Học viên!' });
      await loadAttachmentsAndSubmissions(activeAttachLesson);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Chấm điểm thất bại.',
      });
    } finally {
      setGradingSubmissionId(null);
    }
  };

  if (isLoading) return <p style={{ padding: 24 }}>Đang tải danh sách bài học...</p>;
  if (error || !course) return <p style={{ padding: 24, color: '#dc2626' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 980, width: '100%', margin: '28px auto', padding: '0 20px' }}>
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
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
            Quản lý Bài học, Tài liệu & Quiz trắc nghiệm
          </div>
          <h1 style={{ margin: '4px 0 6px 0' }}>{course.title}</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Hiện có <b>{course.lessons.length}</b> bài học. Bấm <b>"Tài liệu & Bài nộp"</b> hoặc <b>"Quản lý Quiz"</b> ở từng bài để cấu hình.
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
              Link Video YouTube (Có thể dán link YouTube thường hoặc link Embed)
            </label>
            <input
              type="text"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... hoặc https://www.youtube.com/embed/..."
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
          course.lessons.map((lesson, idx) => {
            const isDeleting = deletingId === lesson.id;
            const isQuizOpen = activeQuizLesson?.id === lesson.id;
            const isAttachOpen = activeAttachLesson?.id === lesson.id;

            return (
              <div
                key={lesson.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 10,
                  border:
                    isQuizOpen || isAttachOpen ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: 18,
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

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleToggleAttachManager(lesson)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: isAttachOpen ? '#047857' : '#ecfdf5',
                        color: isAttachOpen ? '#ffffff' : '#047857',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {isAttachOpen ? 'Đóng Tài liệu & Bài nộp' : 'Tài liệu & Bài nộp'}
                    </button>
                    <button
                      onClick={() => handleToggleQuizManager(lesson)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: isQuizOpen ? '#1e40af' : '#eff6ff',
                        color: isQuizOpen ? '#ffffff' : '#1d4ed8',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {isQuizOpen ? 'Đóng Quản lý Quiz' : 'Quản lý Quiz'}
                    </button>
                    <button
                      onClick={() => handleSwapOrder(idx, -1)}
                      disabled={idx === 0 || isReordering}
                      title="Đưa lên trên"
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        cursor: idx === 0 || isReordering ? 'not-allowed' : 'pointer',
                        opacity: idx === 0 || isReordering ? 0.4 : 1,
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleSwapOrder(idx, 1)}
                      disabled={idx === course.lessons.length - 1 || isReordering}
                      title="Đưa xuống dưới"
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        cursor: idx === course.lessons.length - 1 || isReordering ? 'not-allowed' : 'pointer',
                        opacity: idx === course.lessons.length - 1 || isReordering ? 0.4 : 1,
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
                </div>

                {/* KHUNG QUẢN LÝ TÀI LIỆU ĐÍNH KÈM & BÀI TẬP NỘP CỦA HỌC VIÊN */}
                {isAttachOpen && (
                  <div
                    style={{
                      padding: 20,
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #cbd5e1',
                    }}
                  >
                    {/* PHẦN 1: TÀI LIỆU ĐÍNH KÈM */}
                    <h3 style={{ marginTop: 0, color: '#065f46' }}>
                      1. Tài liệu học tập đính kèm — {lesson.title} ({materials.length} tài liệu)
                    </h3>

                    <form
                      onSubmit={handleAddMaterial}
                      style={{
                        padding: 16,
                        backgroundColor: '#ffffff',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Tên tài liệu hiển thị *
                          </label>
                          <input
                            type="text"
                            required
                            value={materialTitle}
                            onChange={(e) => setMaterialTitle(e.target.value)}
                            placeholder="Ví dụ: Slide bài giảng Chương 1 (PDF)"
                            style={{ width: '100%', padding: 9, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Tải file từ máy tính (PDF, DOCX, ZIP, PPTX, Ảnh...)
                          </label>
                          <input
                            type="file"
                            onChange={handleFileUploadForMaterial}
                            disabled={isUploadingFile}
                            style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, alignItems: 'end' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Đường dẫn File (tự điền khi chọn file) hoặc dán Link Google Drive / GitHub *
                          </label>
                          <input
                            type="text"
                            required
                            value={materialUrl}
                            onChange={(e) => setMaterialUrl(e.target.value)}
                            placeholder="https://... hoặc tải file ở ô bên trên"
                            style={{ width: '100%', padding: 9, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Loại
                          </label>
                          <select
                            value={materialType}
                            onChange={(e) => setMaterialType(e.target.value)}
                            style={{ width: '100%', padding: 9, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          >
                            <option value="LINK">LINK</option>
                            <option value="PDF">PDF</option>
                            <option value="DOCX">DOCX</option>
                            <option value="ZIP">ZIP</option>
                            <option value="FILE">FILE</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingMaterial || isUploadingFile}
                          style={{
                            padding: '9px 18px',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 600,
                            cursor: isSavingMaterial || isUploadingFile ? 'not-allowed' : 'pointer',
                            height: 38,
                          }}
                        >
                          {isUploadingFile ? 'Đang tải file...' : isSavingMaterial ? 'Đang lưu...' : '+ Đính kèm'}
                        </button>
                      </div>
                    </form>

                    {isLoadingAttach ? (
                      <p style={{ fontSize: 13.5 }}>Đang tải dữ liệu...</p>
                    ) : materials.length === 0 ? (
                      <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>
                        Chưa có tài liệu đính kèm nào cho bài học này.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                        {materials.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              padding: '10px 14px',
                              backgroundColor: '#ffffff',
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 12,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  backgroundColor: '#e0f2fe',
                                  color: '#0369a1',
                                  fontWeight: 700,
                                  fontSize: 11.5,
                                }}
                              >
                                {m.fileType}
                              </span>
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontWeight: 600, color: '#1d4ed8', textDecoration: 'none', fontSize: 14 }}
                              >
                                {m.title} ↗
                              </a>
                            </div>

                            <button
                              onClick={() => handleDeleteMaterial(m)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: 'none',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                fontSize: 12.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PHẦN 2: DANH SÁCH BÀI TẬP HỌC VIÊN ĐÃ NỘP & CHẤM ĐIỂM */}
                    <h3 style={{ marginTop: 16, color: '#1e3a8a', borderTop: '1px solid #cbd5e1', paddingTop: 16 }}>
                      2. Danh sách Bài tập Học viên đã nộp ({submissions.length} bài nộp)
                    </h3>

                    {submissions.length === 0 ? (
                      <div style={{ fontSize: 13.5, color: '#64748b' }}>
                        Chưa có học viên nào nộp bài tập ở bài học này.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {submissions.map((sub) => {
                          const gInput = gradeInputs[sub.id] || { grade: sub.grade ?? 100, feedback: sub.instructorFeedback || '' };
                          const isGrading = gradingSubmissionId === sub.id;

                          return (
                            <div
                              key={sub.id}
                              style={{
                                padding: 16,
                                backgroundColor: '#ffffff',
                                borderRadius: 10,
                                border: '1px solid #cbd5e1',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <div>
                                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14.5 }}>
                                    Học viên: {sub.studentUserName}
                                  </span>{' '}
                                  <span style={{ fontSize: 13, color: '#64748b' }}>({sub.studentEmail})</span>
                                </div>
                                <a
                                  href={sub.submissionUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    backgroundColor: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontWeight: 600,
                                    fontSize: 13,
                                    textDecoration: 'none',
                                  }}
                                >
                                  Mở / Tải bài nộp của Học viên ↗
                                </a>
                              </div>

                              {sub.note && (
                                <div style={{ marginTop: 8, fontSize: 13.5, color: '#334155', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: 6 }}>
                                  <b>Ghi chú của học viên:</b> {sub.note}
                                </div>
                              )}

                              <div
                                style={{
                                  marginTop: 12,
                                  display: 'grid',
                                  gridTemplateColumns: '130px 1fr auto',
                                  gap: 10,
                                  alignItems: 'end',
                                }}
                              >
                                <div>
                                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                                    Điểm số (0 - 100)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={gInput.grade}
                                    onChange={(e) =>
                                      setGradeInputs({
                                        ...gradeInputs,
                                        [sub.id]: { ...gInput, grade: Number(e.target.value) },
                                      })
                                    }
                                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700 }}
                                  />
                                </div>

                                <div>
                                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                                    Nhận xét của Giảng viên
                                  </label>
                                  <input
                                    type="text"
                                    value={gInput.feedback}
                                    onChange={(e) =>
                                      setGradeInputs({
                                        ...gradeInputs,
                                        [sub.id]: { ...gInput, feedback: e.target.value },
                                      })
                                    }
                                    placeholder="Nhập nhận xét hoặc góp ý cho bài làm..."
                                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleGradeSubmission(sub.id)}
                                  disabled={isGrading}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: 6,
                                    border: 'none',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: 13,
                                    cursor: isGrading ? 'not-allowed' : 'pointer',
                                    height: 36,
                                  }}
                                >
                                  {isGrading ? 'Đang lưu...' : sub.grade !== null && sub.grade !== undefined ? 'Cập nhật điểm' : 'Lưu chấm điểm'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* KHUNG QUẢN LÝ CÂU HỎI TRẮC NGHIỆM CỦA BÀI HỌC NÀY */}
                {isQuizOpen && (
                  <div
                    style={{
                      padding: 20,
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #cbd5e1',
                    }}
                  >
                    <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>
                      Bộ câu hỏi trắc nghiệm — {lesson.title} ({quizQuestions.length} câu)
                    </h3>
                    <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
                      Khi bài học có câu hỏi trắc nghiệm, Học viên phải nộp bài đạt từ <b>70%</b> trở lên mới tự động hoàn thành bài học.
                    </p>

                    {/* Form Thêm / Sửa câu hỏi */}
                    <form
                      onSubmit={handleSaveQuestion}
                      style={{
                        padding: 18,
                        backgroundColor: '#ffffff',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        marginBottom: 18,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>
                        {editingQuestionId ? 'Chỉnh sửa câu hỏi' : '+ Thêm câu hỏi trắc nghiệm mới'}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 150px', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Nội dung câu hỏi *
                          </label>
                          <input
                            type="text"
                            required
                            value={questionForm.questionText}
                            onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                            placeholder="Ví dụ: Trong ABP Framework, tầng nào chứa AggregateRoot?"
                            style={{ width: '100%', padding: 9, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Thứ tự câu
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={questionForm.orderIndex}
                            onChange={(e) => setQuestionForm({ ...questionForm, orderIndex: Number(e.target.value) })}
                            style={{ width: '100%', padding: 9, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            Đáp án đúng *
                          </label>
                          <select
                            value={questionForm.correctOption}
                            onChange={(e) => setQuestionForm({ ...questionForm, correctOption: e.target.value })}
                            style={{
                              width: '100%',
                              padding: 9,
                              borderRadius: 6,
                              border: '1px solid #16a34a',
                              backgroundColor: '#f0fdf4',
                              fontWeight: 700,
                              color: '#166534',
                            }}
                          >
                            <option value="A">Đáp án A</option>
                            <option value="B">Đáp án B</option>
                            <option value="C">Đáp án C</option>
                            <option value="D">Đáp án D</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                            Lựa chọn A *
                          </label>
                          <input
                            type="text"
                            required
                            value={questionForm.optionA}
                            onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                            placeholder="Nhập đáp án A"
                            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                            Lựa chọn B *
                          </label>
                          <input
                            type="text"
                            required
                            value={questionForm.optionB}
                            onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                            placeholder="Nhập đáp án B"
                            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                            Lựa chọn C *
                          </label>
                          <input
                            type="text"
                            required
                            value={questionForm.optionC}
                            onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                            placeholder="Nhập đáp án C"
                            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                            Lựa chọn D *
                          </label>
                          <input
                            type="text"
                            required
                            value={questionForm.optionD}
                            onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                            placeholder="Nhập đáp án D"
                            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="submit"
                          disabled={isSavingQuestion}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 600,
                            cursor: isSavingQuestion ? 'not-allowed' : 'pointer',
                            fontSize: 13.5,
                          }}
                        >
                          {isSavingQuestion
                            ? 'Đang lưu...'
                            : editingQuestionId
                            ? 'Cập nhật câu hỏi'
                            : 'Lưu câu hỏi'}
                        </button>
                        {editingQuestionId && (
                          <button
                            type="button"
                            onClick={() => resetQuestionForm(lesson.id, quizQuestions.length + 1)}
                            style={{
                              padding: '8px 14px',
                              backgroundColor: '#e2e8f0',
                              color: '#334155',
                              border: 'none',
                              borderRadius: 6,
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: 13.5,
                            }}
                          >
                            Hủy sửa
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Danh sách câu hỏi đã tạo */}
                    {isLoadingQuiz ? (
                      <p style={{ fontSize: 13.5 }}>Đang tải câu hỏi...</p>
                    ) : quizQuestions.length === 0 ? (
                      <div style={{ fontSize: 13.5, color: '#64748b' }}>
                        Chưa có câu hỏi nào cho bài học này.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {quizQuestions.map((q) => (
                          <div
                            key={q.id}
                            style={{
                              padding: 14,
                              backgroundColor: '#ffffff',
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 12,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                                Câu {q.orderIndex}: {q.questionText}
                              </div>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '4px 18px',
                                  marginTop: 6,
                                  fontSize: 13,
                                  color: '#334155',
                                }}
                              >
                                <span style={{ fontWeight: q.correctOption === 'A' ? 700 : 400, color: q.correctOption === 'A' ? '#15803d' : undefined }}>
                                  A. {q.optionA} {q.correctOption === 'A' && '(Đúng)'}
                                </span>
                                <span style={{ fontWeight: q.correctOption === 'B' ? 700 : 400, color: q.correctOption === 'B' ? '#15803d' : undefined }}>
                                  B. {q.optionB} {q.correctOption === 'B' && '(Đúng)'}
                                </span>
                                <span style={{ fontWeight: q.correctOption === 'C' ? 700 : 400, color: q.correctOption === 'C' ? '#15803d' : undefined }}>
                                  C. {q.optionC} {q.correctOption === 'C' && '(Đúng)'}
                                </span>
                                <span style={{ fontWeight: q.correctOption === 'D' ? 700 : 400, color: q.correctOption === 'D' ? '#15803d' : undefined }}>
                                  D. {q.optionD} {q.correctOption === 'D' && '(Đúng)'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => handleEditQuestion(q)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  border: 'none',
                                  backgroundColor: '#fee2e2',
                                  color: '#b91c1c',
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
