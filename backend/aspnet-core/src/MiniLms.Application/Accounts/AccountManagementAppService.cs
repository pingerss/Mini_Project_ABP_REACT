using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using MiniLms.Accounts.Dtos;
using MiniLms.Courses;
using MiniLms.Enrollments;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;
using IdentityUser = Volo.Abp.Identity.IdentityUser;
using IdentityRole = Volo.Abp.Identity.IdentityRole;

namespace MiniLms.Accounts;

/// <summary>
/// Quản lý 2 luồng tài khoản theo thiết kế:
/// 1. Đăng ký công khai (/register) -> Mặc định tạo tài khoản Giảng viên (Instructor) có kiểm tra Mã mời.
/// 2. Giảng viên / Admin tạo tài khoản Học viên (Student) và gán thẳng vào Khóa học (Auto-Enroll).
/// </summary>
public class AccountManagementAppService : ApplicationService, IAccountManagementAppService
{
    private readonly IdentityUserManager _userManager;
    private readonly IdentityRoleManager _roleManager;
    private readonly IRepository<Course, Guid> _courseRepository;
    private readonly IRepository<Lesson, Guid> _lessonRepository;
    private readonly IRepository<Enrollment, Guid> _enrollmentRepository;
    private readonly IRepository<LessonProgress, Guid> _progressRepository;
    private readonly IConfiguration _configuration;

    public AccountManagementAppService(
        IdentityUserManager userManager,
        IdentityRoleManager roleManager,
        IRepository<Course, Guid> courseRepository,
        IRepository<Lesson, Guid> lessonRepository,
        IRepository<Enrollment, Guid> enrollmentRepository,
        IRepository<LessonProgress, Guid> progressRepository,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _courseRepository = courseRepository;
        _lessonRepository = lessonRepository;
        _enrollmentRepository = enrollmentRepository;
        _progressRepository = progressRepository;
        _configuration = configuration;
    }

    /// <summary>
    /// API: POST /api/app/account-management/register-instructor
    /// Đăng ký công khai làm Giảng viên (yêu cầu nhập đúng Mã mời trong appsettings.json).
    /// </summary>
    [AllowAnonymous]
    public async Task RegisterInstructorAsync(RegisterInstructorDto input)
    {
        var expectedCode = _configuration["App:InstructorInviteCode"] ?? "TEACHER2026";
        if (!string.Equals(input.InviteCode?.Trim(), expectedCode, StringComparison.Ordinal))
        {
            throw new UserFriendlyException("Mã mời Giảng viên không chính xác. Vui lòng kiểm tra lại!");
        }

        var userName = input.UserName.Trim();
        var email = input.Email.Trim();

        if (await _userManager.FindByNameAsync(userName) != null)
        {
            throw new UserFriendlyException($"Tên đăng nhập '{userName}' đã tồn tại.");
        }

        if (await _userManager.FindByEmailAsync(email) != null)
        {
            throw new UserFriendlyException($"Email '{email}' đã được sử dụng.");
        }

        await EnsureRoleExistsAsync("Instructor");

        var user = new IdentityUser(GuidGenerator.Create(), userName, email);
        var createResult = await _userManager.CreateAsync(user, input.Password);
        CheckIdentityResult(createResult);

        var roleResult = await _userManager.AddToRoleAsync(user, "Instructor");
        CheckIdentityResult(roleResult);
    }

    /// <summary>
    /// API: POST /api/app/account-management/student
    /// Giảng viên / Admin tạo tài khoản cho Học viên và tự động ghi danh vào các khóa học được chọn.
    /// </summary>
    [Authorize]
    public async Task<StudentAccountDto> CreateStudentAsync(CreateStudentDto input)
    {
        EnsureInstructorOrAdmin();

        var userName = input.UserName.Trim();
        var email = input.Email.Trim();

        if (await _userManager.FindByNameAsync(userName) != null)
        {
            throw new UserFriendlyException($"Tên đăng nhập '{userName}' đã tồn tại.");
        }

        if (await _userManager.FindByEmailAsync(email) != null)
        {
            throw new UserFriendlyException($"Email '{email}' đã được sử dụng.");
        }

        await EnsureRoleExistsAsync("Student");

        var student = new IdentityUser(GuidGenerator.Create(), userName, email);
        var createResult = await _userManager.CreateAsync(student, input.Password);
        CheckIdentityResult(createResult);

        var roleResult = await _userManager.AddToRoleAsync(student, "Student");
        CheckIdentityResult(roleResult);

        // Tự động ghi danh (Auto-Enroll) vào các khóa học mà Giảng viên đã tích chọn
        if (input.CourseIds != null && input.CourseIds.Count > 0)
        {
            await EnrollStudentIntoCoursesInternalAsync(student.Id, input.CourseIds);
        }

        return await BuildStudentAccountDtoAsync(student);
    }

    /// <summary>
    /// API: POST /api/app/account-management/assign-courses
    /// Gán bổ sung khóa học cho một Học viên đã có tài khoản.
    /// </summary>
    [Authorize]
    public async Task<StudentAccountDto> AssignCoursesAsync(AssignCoursesToStudentDto input)
    {
        EnsureInstructorOrAdmin();

        var isAdmin = CurrentUser.IsInRole("admin");
        var currentUserId = CurrentUser.GetId();
        var student = await _userManager.GetByIdAsync(input.StudentId);

        if (!isAdmin && student.CreatorId != currentUserId)
        {
            throw new AbpAuthorizationException("Bạn chỉ có thể quản lý các Học viên do chính mình tạo.");
        }

        if (input.CourseIds != null)
        {
            await SyncStudentCoursesInternalAsync(student.Id, input.CourseIds);
        }

        return await BuildStudentAccountDtoAsync(student);
    }

    /// <summary>
    /// API: GET /api/app/account-management/students
    /// Lấy danh sách tài khoản Học viên:
    /// - Mỗi Giảng viên chỉ nhìn thấy đúng các Học viên do chính Giảng viên đó tạo ra (CreatorId == CurrentUser.Id).
    /// - Riêng Admin nhìn thấy toàn bộ Học viên trong hệ thống.
    /// </summary>
    [Authorize]
    public async Task<List<StudentAccountDto>> GetStudentsAsync()
    {
        EnsureInstructorOrAdmin();

        var isAdmin = CurrentUser.IsInRole("admin");
        var currentUserId = CurrentUser.GetId();

        await EnsureRoleExistsAsync("Student");
        var allStudents = await _userManager.GetUsersInRoleAsync("Student");

        // Lọc Học viên theo đúng Giảng viên đã tạo ra học viên đó (Admin thấy tất cả)
        var visibleStudents = isAdmin
            ? allStudents
            : allStudents.Where(s => s.CreatorId == currentUserId).ToList();

        var courses = isAdmin
            ? await _courseRepository.GetListAsync()
            : await _courseRepository.GetListAsync(c => c.InstructorId == currentUserId);

        var visibleStudentIds = visibleStudents.Select(s => s.Id).ToList();
        var courseIds = courses.Select(c => c.Id).ToList();

        // Tối ưu truy vấn SQL: chỉ tải dữ liệu liên quan tới danh sách học viên & khóa học hiện tại
        var lessons = courseIds.Count > 0
            ? await _lessonRepository.GetListAsync(l => courseIds.Contains(l.CourseId))
            : new List<Lesson>();

        var enrollments = (visibleStudentIds.Count > 0 && courseIds.Count > 0)
            ? await _enrollmentRepository.GetListAsync(
                e => visibleStudentIds.Contains(e.StudentId) && courseIds.Contains(e.CourseId))
            : new List<Enrollment>();

        var enrollmentIds = enrollments.Select(e => e.Id).ToList();
        var progresses = enrollmentIds.Count > 0
            ? await _progressRepository.GetListAsync(p => enrollmentIds.Contains(p.EnrollmentId))
            : new List<LessonProgress>();

        return visibleStudents
            .OrderByDescending(s => s.CreationTime)
            .Select(s => MapStudentToDto(s, courses, lessons, enrollments, progresses))
            .ToList();
    }

    /// <summary>
    /// API: POST /api/app/account-management/reset-student-password
    /// Giảng viên / Admin cấp lại mật khẩu mới cho Học viên khi học viên quên mật khẩu.
    /// </summary>
    [Authorize]
    public async Task ResetStudentPasswordAsync(ResetStudentPasswordDto input)
    {
        EnsureInstructorOrAdmin();

        var isAdmin = CurrentUser.IsInRole("admin");
        var currentUserId = CurrentUser.GetId();
        var student = await _userManager.GetByIdAsync(input.StudentId);

        if (!isAdmin && student.CreatorId != currentUserId)
        {
            throw new AbpAuthorizationException("Bạn chỉ có thể đặt lại mật khẩu cho Học viên do chính mình tạo.");
        }

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(student);
        var result = await _userManager.ResetPasswordAsync(student, resetToken, input.NewPassword);
        CheckIdentityResult(result);
    }

    /// <summary>
    /// API: DELETE /api/app/account-management/student/{studentId}
    /// Giảng viên / Admin xóa tài khoản Học viên và toàn bộ lượt đăng ký học của học viên đó.
    /// </summary>
    [Authorize]
    public async Task DeleteStudentAsync(Guid studentId)
    {
        EnsureInstructorOrAdmin();

        var isAdmin = CurrentUser.IsInRole("admin");
        var currentUserId = CurrentUser.GetId();
        var student = await _userManager.GetByIdAsync(studentId);

        if (!isAdmin && student.CreatorId != currentUserId)
        {
            throw new AbpAuthorizationException("Bạn chỉ có thể xóa tài khoản Học viên do chính mình tạo.");
        }

        using (DataFilter.Disable<ISoftDelete>())
        {
            var studentEnrollments = await _enrollmentRepository.GetListAsync(e => e.StudentId == studentId);
            foreach (var enrollment in studentEnrollments)
            {
                await _enrollmentRepository.HardDeleteAsync(enrollment, autoSave: true);
            }
        }

        var result = await _userManager.DeleteAsync(student);
        CheckIdentityResult(result);
    }

    /// <summary>
    /// API: POST /api/app/account-management/change-my-password
    /// Người dùng đang đăng nhập (Học viên / Giảng viên / Admin) tự đổi mật khẩu cá nhân.
    /// </summary>
    [Authorize]
    public async Task ChangeMyPasswordAsync(ChangeMyPasswordDto input)
    {
        var user = await _userManager.GetByIdAsync(CurrentUser.GetId());
        var result = await _userManager.ChangePasswordAsync(user, input.CurrentPassword, input.NewPassword);
        CheckIdentityResult(result);
    }

    private async Task SyncStudentCoursesInternalAsync(Guid studentId, List<Guid> courseIds)
    {
        var isAdmin = CurrentUser.IsInRole("admin");
        var currentUserId = CurrentUser.GetId();
        var desiredIds = courseIds.Distinct().ToList();

        // Lấy các khóa học thuộc phạm vi quản lý của Giảng viên hiện tại (hoặc tất cả nếu là Admin)
        var manageableCourses = isAdmin
            ? await _courseRepository.GetListAsync()
            : await _courseRepository.GetListAsync(c => c.InstructorId == currentUserId);
        var manageableCourseIds = manageableCourses.Select(c => c.Id).ToHashSet();

        // Xóa những Enrollment thuộc khóa của Giảng viên này mà bị bỏ tích chọn
        var existingEnrollments = await _enrollmentRepository.GetListAsync(
            e => e.StudentId == studentId && manageableCourseIds.Contains(e.CourseId));

        foreach (var existing in existingEnrollments)
        {
            if (!desiredIds.Contains(existing.CourseId))
            {
                // Dùng HardDeleteAsync để xóa hẳn bản ghi khỏi bảng Enrollments, tránh đụng Unique Index (CourseId, StudentId) khi gán lại
                await _enrollmentRepository.HardDeleteAsync(existing, autoSave: true);
            }
        }

        // Thêm các khóa học mới được tích chọn
        await EnrollStudentIntoCoursesInternalAsync(studentId, desiredIds);
    }

    private async Task EnrollStudentIntoCoursesInternalAsync(Guid studentId, List<Guid> courseIds)
    {
        var isAdmin = CurrentUser.IsInRole("admin");
        var currentUserId = CurrentUser.GetId();

        foreach (var courseId in courseIds.Distinct())
        {
            var course = await _courseRepository.FindAsync(courseId);
            if (course == null) continue;

            // Giảng viên chỉ được phép gán học viên vào khóa học của mình (Admin gán được mọi khóa học)
            if (!isAdmin && course.InstructorId != currentUserId)
            {
                throw new AbpAuthorizationException($"Bạn không có quyền gán học viên vào khóa học '{course.Title}'.");
            }

            // Kiểm tra cả các bản ghi đã bị xóa mềm (IsDeleted = 1) để tránh lỗi trùng Unique Index IX_Enrollments_CourseId_StudentId
            using (DataFilter.Disable<ISoftDelete>())
            {
                var anyExisting = await _enrollmentRepository.FirstOrDefaultAsync(
                    x => x.CourseId == courseId && x.StudentId == studentId);

                if (anyExisting != null)
                {
                    if (!anyExisting.IsDeleted)
                    {
                        continue; // Đã được gán và đang hoạt động -> bỏ qua
                    }

                    // Nếu bản ghi cũ đang ở trạng thái xóa mềm (IsDeleted = 1) -> xóa cứng trước khi tạo mới
                    await _enrollmentRepository.HardDeleteAsync(anyExisting, autoSave: true);
                }
            }

            var enrollment = new Enrollment(
                GuidGenerator.Create(),
                courseId,
                studentId,
                Clock.Now
            );
            await _enrollmentRepository.InsertAsync(enrollment, autoSave: true);
        }
    }

    private async Task<StudentAccountDto> BuildStudentAccountDtoAsync(IdentityUser student)
    {
        var courses = await _courseRepository.GetListAsync();
        var lessons = await _lessonRepository.GetListAsync();
        var enrollments = await _enrollmentRepository.GetListAsync(x => x.StudentId == student.Id);
        var enrollmentIds = enrollments.Select(e => e.Id).ToList();
        var progresses = await _progressRepository.GetListAsync(x => enrollmentIds.Contains(x.EnrollmentId));

        return MapStudentToDto(student, courses, lessons, enrollments, progresses);
    }

    private static StudentAccountDto MapStudentToDto(
        IdentityUser student,
        List<Course> courses,
        List<Lesson> lessons,
        List<Enrollment> enrollments,
        List<LessonProgress> progresses)
    {
        var studentEnrollments = enrollments.Where(e => e.StudentId == student.Id).ToList();
        var enrolledCourseItems = new List<StudentEnrolledCourseItemDto>();

        foreach (var enrollment in studentEnrollments)
        {
            var course = courses.FirstOrDefault(c => c.Id == enrollment.CourseId);
            if (course == null) continue;

            var totalLessons = lessons.Count(l => l.CourseId == course.Id);
            var completedLessons = progresses.Count(p => p.EnrollmentId == enrollment.Id && p.IsCompleted);
            var percent = totalLessons > 0
                ? (int)Math.Round((double)completedLessons * 100 / totalLessons)
                : 0;

            enrolledCourseItems.Add(new StudentEnrolledCourseItemDto
            {
                CourseId = course.Id,
                CourseTitle = course.Title,
                Status = enrollment.Status,
                CompletedLessons = completedLessons,
                TotalLessons = totalLessons,
                ProgressPercent = percent
            });
        }

        return new StudentAccountDto
        {
            Id = student.Id,
            UserName = student.UserName,
            Email = student.Email,
            CreationTime = student.CreationTime,
            EnrolledCourses = enrolledCourseItems
        };
    }

    private void EnsureInstructorOrAdmin()
    {
        if (!CurrentUser.IsInRole("admin") && !CurrentUser.IsInRole("Instructor"))
        {
            throw new AbpAuthorizationException("Chỉ Giảng viên hoặc Admin mới được phép quản lý tài khoản Học viên.");
        }
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (await _roleManager.FindByNameAsync(roleName) == null)
        {
            await _roleManager.CreateAsync(new IdentityRole(GuidGenerator.Create(), roleName)
            {
                IsPublic = true
            });
        }
    }

    private static void CheckIdentityResult(IdentityResult result)
    {
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new UserFriendlyException(
                $"Không thể tạo tài khoản (Mật khẩu cần ít nhất 6 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt như 1q2w3E*): {errors}");
        }
    }
}
