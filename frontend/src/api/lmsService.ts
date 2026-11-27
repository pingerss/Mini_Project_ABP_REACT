import axiosClient from './axiosClient';
import type {
  AssignCoursesToStudentDto,
  ChangeMyPasswordDto,
  CourseDto,
  CourseLearningDto,
  CreateStudentDto,
  CreateUpdateCourseDto,
  CreateUpdateLessonDto,
  CreateUpdateQuizQuestionDto,
  LessonDto,
  QuizQuestionManageDto,
  QuizSubmitResultDto,
  RegisterInstructorDto,
  ResetStudentPasswordDto,
  StudentAccountDto,
  StudentQuizPaperDto,
  SubmitQuizInputDto,
} from '../types/lms';

/**
 * Tự động chuyển đổi mọi dạng link YouTube (watch?v=..., youtu.be/..., shorts/...)
 * sang chuẩn https://www.youtube.com/embed/... để thẻ <iframe> không bị lỗi Refused to connect.
 */
export function toEmbedVideoUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtube.com')) {
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      if (url.pathname.startsWith('/shorts/')) {
        const shortId = url.pathname.replace('/shorts/', '').split('/')[0];
        if (shortId) return `https://www.youtube.com/embed/${shortId}`;
      }
    }
    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1).split('/')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // Nếu không phải URL tuyệt đối thì giữ nguyên
  }
  return trimmed;
}

export const lmsService = {
  // === LUỒNG HỌC VIÊN ===
  async getCourses(): Promise<CourseDto[]> {
    const response = await axiosClient.get<CourseDto[]>('/api/app/course');
    return response.data;
  },

  async getCourseById(courseId: string): Promise<CourseDto> {
    const response = await axiosClient.get<CourseDto>(`/api/app/course/${courseId}`);
    return response.data;
  },

  async getLearningCourse(courseId: string): Promise<CourseLearningDto> {
    const response = await axiosClient.get<CourseLearningDto>(
      `/api/app/enrollment/learning-course/${courseId}`
    );
    return response.data;
  },

  async toggleLessonProgress(
    courseId: string,
    lessonId: string,
    isCompleted: boolean
  ): Promise<CourseLearningDto> {
    const response = await axiosClient.post<CourseLearningDto>(
      '/api/app/enrollment/toggle-lesson-progress',
      { courseId, lessonId, isCompleted }
    );
    return response.data;
  },

  // === LUỒNG QUẢN TRỊ / GIẢNG VIÊN ===
  async getManageCourses(): Promise<CourseDto[]> {
    const response = await axiosClient.get<CourseDto[]>('/api/app/course/manage-list');
    return response.data;
  },

  async createCourse(input: CreateUpdateCourseDto): Promise<CourseDto> {
    const response = await axiosClient.post<CourseDto>('/api/app/course', input);
    return response.data;
  },

  async updateCourse(id: string, input: CreateUpdateCourseDto): Promise<CourseDto> {
    const response = await axiosClient.put<CourseDto>(`/api/app/course/${id}`, input);
    return response.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await axiosClient.delete(`/api/app/course/${id}`);
  },

  async addLesson(input: CreateUpdateLessonDto): Promise<LessonDto> {
    const payload = { ...input, videoUrl: toEmbedVideoUrl(input.videoUrl) };
    const response = await axiosClient.post<LessonDto>('/api/app/course/lesson', payload);
    return response.data;
  },

  async updateLesson(lessonId: string, input: CreateUpdateLessonDto): Promise<LessonDto> {
    const payload = { ...input, videoUrl: toEmbedVideoUrl(input.videoUrl) };
    const response = await axiosClient.put<LessonDto>(`/api/app/course/lesson/${lessonId}`, payload);
    return response.data;
  },

  async deleteLesson(lessonId: string): Promise<void> {
    await axiosClient.delete(`/api/app/course/lesson/${lessonId}`);
  },

  // === LUỒNG ĐĂNG KÝ GIẢNG VIÊN, QUẢN LÝ HỌC VIÊN & ĐỔI MẬT KHẨU ===
  async registerInstructor(input: RegisterInstructorDto): Promise<void> {
    await axiosClient.post('/api/app/account-management/register-instructor', input);
  },

  async createStudent(input: CreateStudentDto): Promise<StudentAccountDto> {
    const response = await axiosClient.post<StudentAccountDto>(
      '/api/app/account-management/student',
      input
    );
    return response.data;
  },

  async getStudents(): Promise<StudentAccountDto[]> {
    const response = await axiosClient.get<StudentAccountDto[]>(
      '/api/app/account-management/students'
    );
    return response.data;
  },

  async assignCoursesToStudent(input: AssignCoursesToStudentDto): Promise<StudentAccountDto> {
    const response = await axiosClient.post<StudentAccountDto>(
      '/api/app/account-management/assign-courses',
      input
    );
    return response.data;
  },

  async resetStudentPassword(input: ResetStudentPasswordDto): Promise<void> {
    await axiosClient.post('/api/app/account-management/reset-student-password', input);
  },

  async deleteStudent(studentId: string): Promise<void> {
    await axiosClient.delete(`/api/app/account-management/student/${studentId}`);
  },

  async changeMyPassword(input: ChangeMyPasswordDto): Promise<void> {
    await axiosClient.post('/api/app/account-management/change-my-password', input);
  },

  // === LUỒNG BÀI KIỂM TRA TRẮC NGHIỆM (QUIZ & ASSESSMENT) ===
  async getManageQuizQuestions(lessonId: string): Promise<QuizQuestionManageDto[]> {
    const response = await axiosClient.get<QuizQuestionManageDto[]>(
      `/api/app/quiz/manage-questions/${lessonId}`
    );
    return response.data;
  },

  async createQuizQuestion(input: CreateUpdateQuizQuestionDto): Promise<QuizQuestionManageDto> {
    const response = await axiosClient.post<QuizQuestionManageDto>('/api/app/quiz/question', input);
    return response.data;
  },

  async updateQuizQuestion(
    id: string,
    input: CreateUpdateQuizQuestionDto
  ): Promise<QuizQuestionManageDto> {
    const response = await axiosClient.put<QuizQuestionManageDto>(
      `/api/app/quiz/question/${id}`,
      input
    );
    return response.data;
  },

  async deleteQuizQuestion(id: string): Promise<void> {
    await axiosClient.delete(`/api/app/quiz/question/${id}`);
  },

  async getStudentQuiz(lessonId: string): Promise<StudentQuizPaperDto> {
    const response = await axiosClient.get<StudentQuizPaperDto>(
      `/api/app/quiz/student-quiz/${lessonId}`
    );
    return response.data;
  },

  async submitQuiz(input: SubmitQuizInputDto): Promise<QuizSubmitResultDto> {
    const response = await axiosClient.post<QuizSubmitResultDto>('/api/app/quiz/submit-quiz', input);
    return response.data;
  },
};
