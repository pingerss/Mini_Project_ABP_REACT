using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using MiniLms.Courses.Dtos;
using MiniLms.Enrollments;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace MiniLms.Courses;

/// <summary>
/// Quản lý Khóa học & Bài học.
/// WHY: Khi kế thừa ApplicationService, ABP tự động biến các hàm public trong class này thành RESTful API!
/// </summary>
[Authorize]
public class CourseAppService : ApplicationService, ICourseAppService
{
    private readonly IRepository<Course, Guid> _courseRepository;
    private readonly IRepository<Lesson, Guid> _lessonRepository;
    private readonly IRepository<Enrollment, Guid> _enrollmentRepository;
    private readonly IRepository<IdentityUser, Guid> _userRepository;

    public CourseAppService(
        IRepository<Course, Guid> courseRepository,
        IRepository<Lesson, Guid> lessonRepository,
        IRepository<Enrollment, Guid> enrollmentRepository,
        IRepository<IdentityUser, Guid> userRepository)
    {
        _courseRepository = courseRepository;
        _lessonRepository = lessonRepository;
        _enrollmentRepository = enrollmentRepository;
        _userRepository = userRepository;
    }

    // Tự động sinh API: GET /api/app/course
    // - Học viên: CHỈ thấy các khóa học mà Giảng viên đã gán (Enroll) cho học viên đó + Tên Giảng viên.
    // - Giảng viên: chỉ thấy các khóa học do chính mình tạo.
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
            courses = enrolledCourseIds.Count > 0
                ? await _courseRepository.GetListAsync(x => enrolledCourseIds.Contains(x.Id))
                : new List<Course>();
        }

        var lessons = await _lessonRepository.GetListAsync();
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
                return new CourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    InstructorId = c.InstructorId,
                    InstructorName = instructor?.UserName ?? "Giảng viên",
                    Status = c.Status,
                    CreationTime = c.CreationTime,
                    TotalLessons = lessons.Count(l => l.CourseId == c.Id),
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
            if (!isInstructor && enrollment == null)
            {
                throw new AbpAuthorizationException("Bạn chưa được Giảng viên gán vào khóa học này.");
            }
        }

        var lessons = await _lessonRepository.GetListAsync(x => x.CourseId == id);
        var instructor = await _userRepository.FindAsync(course.InstructorId);

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
            IsEnrolled = enrollment != null,
            EnrollmentId = enrollment?.Id,
            Lessons = lessons
                .OrderBy(l => l.OrderIndex)
                .Select(l => new LessonDto
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Title = l.Title,
                    VideoUrl = l.VideoUrl,
                    Content = l.Content,
                    OrderIndex = l.OrderIndex
                })
                .ToList()
        };
    }

    // Tự động sinh API: GET /api/app/course/manage-list
    // Trả toàn bộ khóa học (kể cả Draft / Archived) cho màn hình Quản trị của Admin / Giảng viên
    [Authorize]
    public async Task<List<CourseDto>> GetManageListAsync()
    {
        EnsureInstructorOrAdmin();

        var isAdmin = CurrentUser.IsInRole("admin");
        var currentUserId = CurrentUser.GetId();

        var courses = isAdmin
            ? await _courseRepository.GetListAsync()
            : await _courseRepository.GetListAsync(x => x.InstructorId == currentUserId);

        var lessons = await _lessonRepository.GetListAsync();

        return courses
            .OrderByDescending(c => c.CreationTime)
            .Select(c => new CourseDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                InstructorId = c.InstructorId,
                Status = c.Status,
                CreationTime = c.CreationTime,
                TotalLessons = lessons.Count(l => l.CourseId == c.Id)
            })
            .ToList();
    }

    // Tự động sinh API: POST /api/app/course
    [Authorize]
    public async Task<CourseDto> CreateAsync(CreateUpdateCourseDto input)
    {
        EnsureInstructorOrAdmin();

        // WHY: Lấy Id của người đang đăng nhập từ JWT Token qua CurrentUser.GetId()
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

        await _lessonRepository.DeleteAsync(lesson, autoSave: true);
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