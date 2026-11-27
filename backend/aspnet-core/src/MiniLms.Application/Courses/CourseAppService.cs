using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using MiniLms.Courses.Dtos;
using MiniLms.Enrollments;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace MiniLms.Courses;

/// <summary>
/// Quản lý Khóa học & Bài học.
/// </summary>
[Authorize]
public class CourseAppService : ApplicationService, ICourseAppService
{
    private readonly IRepository<Course, Guid> _courseRepository;
    private readonly IRepository<Lesson, Guid> _lessonRepository;
    private readonly IRepository<Enrollment, Guid> _enrollmentRepository;
    private readonly IRepository<LessonProgress, Guid> _progressRepository;
    private readonly IRepository<IdentityUser, Guid> _userRepository;

    public CourseAppService(
        IRepository<Course, Guid> courseRepository,
        IRepository<Lesson, Guid> lessonRepository,
        IRepository<Enrollment, Guid> enrollmentRepository,
        IRepository<LessonProgress, Guid> progressRepository,
        IRepository<IdentityUser, Guid> userRepository)
    {
        _courseRepository = courseRepository;
        _lessonRepository = lessonRepository;
        _enrollmentRepository = enrollmentRepository;
        _progressRepository = progressRepository;
        _userRepository = userRepository;
    }

    // Tự động sinh API: GET /api/app/course
    // - Học viên: CHỈ thấy các khóa học Published mà Giảng viên đã gán cho học viên đó + % Tiến độ + Tên Giảng viên.
    // - Giảng viên: thấy các khóa học do chính mình tạo.
    // - Admin: thấy tất cả khóa học.
    public async Task<List<CourseDto>> GetListAsync()
    {
        var currentUserId = CurrentUser.GetId();
        var isAdmin = CurrentUser.IsInRole("admin");
        var isInstructor = CurrentUser.IsInRole("Instructor");

        var myEnrollments = await _enrollmentRepository.GetListAsync(x => x.StudentId == currentUserId);
        List<Course> courses;

        if (isAdmin)
        {
            courses = await _courseRepository.GetListAsync();
        }
        else if (isInstructor)
        {
            courses = await _courseRepository.GetListAsync(x => x.InstructorId == currentUserId);
        }
        else
        {
            var enrolledCourseIds = myEnrollments.Select(e => e.CourseId).Distinct().ToList();
            // Học viên chỉ nhìn thấy khóa học đã được gán VÀ đang ở trạng thái Published
            courses = enrolledCourseIds.Count > 0
                ? await _courseRepository.GetListAsync(
                    x => enrolledCourseIds.Contains(x.Id) && x.Status == CourseStatus.Published)
                : new List<Course>();
        }

        var courseIds = courses.Select(c => c.Id).ToList();
        var lessons = courseIds.Count > 0
            ? await _lessonRepository.GetListAsync(l => courseIds.Contains(l.CourseId))
            : new List<Lesson>();

        var myEnrollmentIds = myEnrollments.Select(e => e.Id).ToList();
        var myProgresses = myEnrollmentIds.Count > 0
            ? await _progressRepository.GetListAsync(p => myEnrollmentIds.Contains(p.EnrollmentId) && p.IsCompleted)
            : new List<LessonProgress>();

        var instructorIds = courses.Select(c => c.InstructorId).Distinct().ToList();
        var instructors = instructorIds.Count > 0
            ? await _userRepository.GetListAsync(u => instructorIds.Contains(u.Id))
            : new List<IdentityUser>();

        return courses
            .OrderByDescending(c => c.CreationTime)
            .Select(c =>
            {
                var enrollment = myEnrollments.FirstOrDefault(e => e.CourseId == c.Id);
                var instructor = instructors.FirstOrDefault(u => u.Id == c.InstructorId);
                var totalLessons = lessons.Count(l => l.CourseId == c.Id);
                var completedLessons = enrollment != null
                    ? myProgresses.Count(p => p.EnrollmentId == enrollment.Id)
                    : 0;
                var percent = totalLessons > 0
                    ? (int)Math.Round((double)completedLessons * 100 / totalLessons)
                    : 0;

                return new CourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    InstructorId = c.InstructorId,
                    InstructorName = instructor?.UserName ?? "Giảng viên",
                    Status = c.Status,
                    CreationTime = c.CreationTime,
                    TotalLessons = totalLessons,
                    CompletedLessons = completedLessons,
                    ProgressPercent = percent,
                    EnrollmentStatus = enrollment?.Status,
                    IsEnrolled = enrollment != null,
                    EnrollmentId = enrollment?.Id
                };
            })
            .ToList();
    }

    // Tự động sinh API: GET /api/app/course/{id}
    public async Task<CourseDto> GetAsync(Guid id)
    {
        var currentUserId = CurrentUser.GetId();
        var isAdmin = CurrentUser.IsInRole("admin");
        var isInstructor = CurrentUser.IsInRole("Instructor");

        var course = await _courseRepository.GetAsync(id);
        var enrollment = await _enrollmentRepository.FirstOrDefaultAsync(
            x => x.CourseId == id && x.StudentId == currentUserId);

        if (!isAdmin)
        {
            if (isInstructor && course.InstructorId != currentUserId)
            {
                throw new AbpAuthorizationException("Bạn chỉ được xem khóa học do chính mình quản lý.");
            }
            if (!isInstructor)
            {
                if (enrollment == null)
                {
                    throw new AbpAuthorizationException("Bạn chưa được Giảng viên gán vào khóa học này.");
                }
                if (course.Status != CourseStatus.Published)
                {
                    throw new UserFriendlyException("Khóa học này hiện đang ở trạng thái Bản nháp hoặc Đã đóng.");
                }
            }
        }

        var lessons = await _lessonRepository.GetListAsync(x => x.CourseId == id);
        var instructor = await _userRepository.FindAsync(course.InstructorId);
        var completedLessons = enrollment != null
            ? await _progressRepository.CountAsync(p => p.EnrollmentId == enrollment.Id && p.IsCompleted)
            : 0;
        var percent = lessons.Count > 0
            ? (int)Math.Round((double)completedLessons * 100 / lessons.Count)
            : 0;

        return new CourseDto
        {
            Id = course.Id,
            Title = course.Title,
            Description = course.Description,
            InstructorId = course.InstructorId,
            InstructorName = instructor?.UserName ?? "Giảng viên",
            Status = course.Status,
            CreationTime = course.CreationTime,
            TotalLessons = lessons.Count,
            CompletedLessons = completedLessons,
            ProgressPercent = percent,
            EnrollmentStatus = enrollment?.Status,
            IsEnrolled = enrollment != null,
            EnrollmentId = enrollment?.Id,
            Lessons = lessons
                .OrderBy(l => l.OrderIndex)
                .Select(MapLessonToDto)
                .ToList()
        };
    }

    // Tự động sinh API: GET /api/app/course/manage-list
    [Authorize]
    public async Task<List<CourseDto>> GetManageListAsync()
    {
        EnsureInstructorOrAdmin();

        var isAdmin = CurrentUser.IsInRole("admin");
        var currentUserId = CurrentUser.GetId();

        var courses = isAdmin
            ? await _courseRepository.GetListAsync()
            : await _courseRepository.GetListAsync(x => x.InstructorId == currentUserId);

        var courseIds = courses.Select(c => c.Id).ToList();
        var lessons = courseIds.Count > 0
            ? await _lessonRepository.GetListAsync(l => courseIds.Contains(l.CourseId))
            : new List<Lesson>();

        var instructorIds = courses.Select(c => c.InstructorId).Distinct().ToList();
        var instructors = instructorIds.Count > 0
            ? await _userRepository.GetListAsync(u => instructorIds.Contains(u.Id))
            : new List<IdentityUser>();

        return courses
            .OrderByDescending(c => c.CreationTime)
            .Select(c =>
            {
                var instructor = instructors.FirstOrDefault(u => u.Id == c.InstructorId);
                return new CourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    InstructorId = c.InstructorId,
                    InstructorName = instructor?.UserName ?? "Giảng viên",
                    Status = c.Status,
                    CreationTime = c.CreationTime,
                    TotalLessons = lessons.Count(l => l.CourseId == c.Id)
                };
            })
            .ToList();
    }

    // Tự động sinh API: POST /api/app/course
    [Authorize]
    public async Task<CourseDto> CreateAsync(CreateUpdateCourseDto input)
    {
        EnsureInstructorOrAdmin();

        var instructorId = CurrentUser.GetId();

        var course = new Course(
            GuidGenerator.Create(),
            input.Title,
            input.Description,
            instructorId,
            input.Status
        );

        await _courseRepository.InsertAsync(course, autoSave: true);
        return await GetAsync(course.Id);
    }

    // Tự động sinh API: PUT /api/app/course/{id}
    [Authorize]
    public async Task<CourseDto> UpdateAsync(Guid id, CreateUpdateCourseDto input)
    {
        var course = await _courseRepository.GetAsync(id);
        EnsureInstructorOrAdmin(course.InstructorId);

        course.UpdateInfo(input.Title, input.Description, input.Status);
        await _courseRepository.UpdateAsync(course, autoSave: true);

        return await GetAsync(course.Id);
    }

    // Tự động sinh API: DELETE /api/app/course/{id}
    [Authorize]
    public async Task DeleteAsync(Guid id)
    {
        var course = await _courseRepository.GetAsync(id);
        EnsureInstructorOrAdmin(course.InstructorId);

        await _courseRepository.DeleteAsync(course, autoSave: true);
    }

    // Tự động sinh API: POST /api/app/course/lesson
    [Authorize]
    public async Task<LessonDto> AddLessonAsync(CreateUpdateLessonDto input)
    {
        var course = await _courseRepository.GetAsync(input.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        var lesson = new Lesson(
            GuidGenerator.Create(),
            input.CourseId,
            input.Title,
            input.VideoUrl,
            input.Content,
            input.OrderIndex
        );

        await _lessonRepository.InsertAsync(lesson, autoSave: true);
        await RecalculateCourseEnrollmentsStatusAsync(course.Id);

        return MapLessonToDto(lesson);
    }

    // Tự động sinh API: PUT /api/app/course/lesson/{lessonId}
    [Authorize]
    public async Task<LessonDto> UpdateLessonAsync(Guid lessonId, CreateUpdateLessonDto input)
    {
        var lesson = await _lessonRepository.GetAsync(lessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        lesson.Update(input.Title, input.VideoUrl, input.Content, input.OrderIndex);
        await _lessonRepository.UpdateAsync(lesson, autoSave: true);

        return MapLessonToDto(lesson);
    }

    // Tự động sinh API: DELETE /api/app/course/lesson/{lessonId}
    [Authorize]
    public async Task DeleteLessonAsync(Guid lessonId)
    {
        var lesson = await _lessonRepository.GetAsync(lessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        // Xóa tiến độ của bài học này trước rồi xóa bài học
        var lessonProgresses = await _progressRepository.GetListAsync(p => p.LessonId == lessonId);
        foreach (var prog in lessonProgresses)
        {
            await _progressRepository.DeleteAsync(prog, autoSave: true);
        }

        await _lessonRepository.DeleteAsync(lesson, autoSave: true);
        await RecalculateCourseEnrollmentsStatusAsync(course.Id);
    }

    /// <summary>
    /// Khi Giảng viên Thêm hoặc Xóa bài học, tính toán lại trạng thái Completed/Active cho các học viên đang học khóa này.
    /// </summary>
    private async Task RecalculateCourseEnrollmentsStatusAsync(Guid courseId)
    {
        var totalLessons = await _lessonRepository.CountAsync(x => x.CourseId == courseId);
        var enrollments = await _enrollmentRepository.GetListAsync(x => x.CourseId == courseId);

        foreach (var enrollment in enrollments)
        {
            await _enrollmentRepository.EnsureCollectionLoadedAsync(enrollment, x => x.LessonProgresses);
            enrollment.RecalculateCompletionStatus(totalLessons);
            await _enrollmentRepository.UpdateAsync(enrollment, autoSave: true);
        }
    }

    private void EnsureInstructorOrAdmin(Guid? ownerInstructorId = null)
    {
        var isAdmin = CurrentUser.IsInRole("admin");
        var isInstructor = CurrentUser.IsInRole("Instructor");

        if (!isAdmin && !isInstructor)
        {
            throw new AbpAuthorizationException("Chỉ Admin hoặc Giảng viên mới có quyền thực hiện thao tác này.");
        }

        if (ownerInstructorId.HasValue && !isAdmin && ownerInstructorId.Value != CurrentUser.GetId())
        {
            throw new AbpAuthorizationException("Bạn chỉ có thể chỉnh sửa khóa học do chính mình tạo.");
        }
    }

    private static LessonDto MapLessonToDto(Lesson lesson)
    {
        return new LessonDto
        {
            Id = lesson.Id,
            CourseId = lesson.CourseId,
            Title = lesson.Title,
            VideoUrl = lesson.VideoUrl,
            Content = lesson.Content,
            OrderIndex = lesson.OrderIndex
        };
    }
}
