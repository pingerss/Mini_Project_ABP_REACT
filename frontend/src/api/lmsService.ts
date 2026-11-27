import axiosClient from './axiosClient';
import type {
  AssignCoursesToStudentDto,
  CourseDto,
  CourseLearningDto,
  CreateStudentDto,
  CreateUpdateCourseDto,
  CreateUpdateLessonDto,
  EnrollmentDto,
  LessonDto,
  RegisterInstructorDto,
  StudentAccountDto,
} from '../types/lms';

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

  async enrollCourse(courseId: string): Promise<EnrollmentDto> {
    const response = await axiosClient.post<EnrollmentDto>(`/api/app/enrollment/enroll/${courseId}`);
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
    const response = await axiosClient.post<LessonDto>('/api/app/course/lesson', input);
    return response.data;
  },

  async updateLesson(lessonId: string, input: CreateUpdateLessonDto): Promise<LessonDto> {
    const response = await axiosClient.put<LessonDto>(`/api/app/course/lesson/${lessonId}`, input);
    return response.data;
  },

  async deleteLesson(lessonId: string): Promise<void> {
    await axiosClient.delete(`/api/app/course/lesson/${lessonId}`);
  },

  // === LUỒNG ĐĂNG KÝ GIẢNG VIÊN & CẤP TÀI KHOẢN HỌC VIÊN ===
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
};
