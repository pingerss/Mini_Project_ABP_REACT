// WHY: Định nghĩa Interface khớp 1-1 với các DTO ở tầng Application.Contracts của ABP
// giúp TypeScript kiểm tra kiểu chặt chẽ và gợi ý code chính xác.

export interface LessonDto {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  content: string;
  orderIndex: number;
}

export interface CourseDto {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName?: string;
  status: number;
  creationTime: string;
  totalLessons: number;
  completedLessons?: number;
  progressPercent?: number;
  enrollmentStatus?: number | null;
  isEnrolled: boolean;
  enrollmentId?: string | null;
  lessons: LessonDto[];
}

export interface EnrollmentDto {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  enrolledAt: string;
  status: number; // 0 = Active, 1 = Completed
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface LessonWithProgressDto {
  lessonId: string;
  title: string;
  videoUrl: string;
  content: string;
  orderIndex: number;
  isCompleted: boolean;
  completedAt?: string | null;
  quizQuestionCount?: number;
}

export interface CourseLearningDto {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  status: number;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  lessons: LessonWithProgressDto[];
}

export interface CreateUpdateCourseDto {
  title: string;
  description: string;
  status: number; // 0 = Draft, 1 = Published, 2 = Archived
}

export interface CreateUpdateLessonDto {
  courseId: string;
  title: string;
  videoUrl: string;
  content: string;
  orderIndex: number;
}

export interface RegisterInstructorDto {
  userName: string;
  email: string;
  password: string;
  inviteCode: string;
}

export interface CreateStudentDto {
  userName: string;
  email: string;
  password: string;
  courseIds: string[];
}

export interface AssignCoursesToStudentDto {
  studentId: string;
  courseIds: string[];
}

export interface ResetStudentPasswordDto {
  studentId: string;
  newPassword: string;
}

export interface ChangeMyPasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface QuizQuestionManageDto {
  id: string;
  lessonId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D' | string;
  orderIndex: number;
}

export interface CreateUpdateQuizQuestionDto {
  lessonId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D' | string;
  orderIndex: number;
}

export interface StudentQuizQuestionItemDto {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  orderIndex: number;
}

export interface StudentQuizPaperDto {
  lessonId: string;
  passingScorePercent: number;
  totalAttempts: number;
  bestScorePercent?: number | null;
  isPassed: boolean;
  questions: StudentQuizQuestionItemDto[];
}

export interface QuizAnswerSubmissionDto {
  questionId: string;
  selectedOption: string;
}

export interface SubmitQuizInputDto {
  courseId: string;
  lessonId: string;
  answers: QuizAnswerSubmissionDto[];
}

export interface QuizQuestionFeedbackDto {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
}

export interface QuizSubmitResultDto {
  lessonId: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  passingScorePercent: number;
  isPassed: boolean;
  message: string;
  questionFeedbacks: QuizQuestionFeedbackDto[];
}

export interface StudentEnrolledCourseItemDto {
  courseId: string;
  courseTitle: string;
  status: number;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export interface StudentAccountDto {
  id: string;
  userName: string;
  email: string;
  creationTime: string;
  enrolledCourses: StudentEnrolledCourseItemDto[];
}