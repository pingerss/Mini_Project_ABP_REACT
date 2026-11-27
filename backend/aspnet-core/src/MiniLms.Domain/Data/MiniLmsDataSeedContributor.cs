using System;
using System.Threading.Tasks;
using MiniLms.Courses;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Guids;
using Volo.Abp.Identity;

namespace MiniLms.Data;

/// <summary>
/// Tự động tạo tài khoản mẫu (instructor, student) và 2 khóa học mẫu khi chạy DbMigrator.
/// </summary>
public class MiniLmsDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    private readonly IRepository<Course, Guid> _courseRepository;
    private readonly IRepository<Lesson, Guid> _lessonRepository;
    private readonly IdentityUserManager _userManager;
    private readonly IdentityRoleManager _roleManager;
    private readonly IGuidGenerator _guidGenerator;

    public MiniLmsDataSeedContributor(
        IRepository<Course, Guid> courseRepository,
        IRepository<Lesson, Guid> lessonRepository,
        IdentityUserManager userManager,
        IdentityRoleManager roleManager,
        IGuidGenerator guidGenerator)
    {
        _courseRepository = courseRepository;
        _lessonRepository = lessonRepository;
        _userManager = userManager;
        _roleManager = roleManager;
        _guidGenerator = guidGenerator;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        // 0. Tạo 2 Role cốt lõi: Instructor và Student (Role "admin" đã có sẵn của ABP)
        await EnsureRoleExistsAsync("Instructor");
        await EnsureRoleExistsAsync("Student");

        // 1. Tạo tài khoản Giảng viên mẫu vào bảng AbpUsers và gán role Instructor
        var instructor = await _userManager.FindByNameAsync("instructor");
        if (instructor == null)
        {
            instructor = new IdentityUser(_guidGenerator.Create(), "instructor", "instructor@minilms.local");
            // WHY: IdentityUserManager tự động sinh chuỗi Salt ngẫu nhiên và băm mật khẩu 1 chiều bằng PBKDF2
            await _userManager.CreateAsync(instructor, "1q2w3E*");
        }
        if (!await _userManager.IsInRoleAsync(instructor, "Instructor"))
        {
            await _userManager.AddToRoleAsync(instructor, "Instructor");
        }

        // 2. Tạo tài khoản Học viên mẫu vào bảng AbpUsers và gán role Student
        var student = await _userManager.FindByNameAsync("student");
        if (student == null)
        {
            student = new IdentityUser(_guidGenerator.Create(), "student", "student@minilms.local");
            await _userManager.CreateAsync(student, "1q2w3E*");
        }
        if (!await _userManager.IsInRoleAsync(student, "Student"))
        {
            await _userManager.AddToRoleAsync(student, "Student");
        }

        // 3. Nếu đã có khóa học rồi thì không seed lại nữa
        if (await _courseRepository.GetCountAsync() > 0)
        {
            return;
        }

        // 4. Tạo Khóa học mẫu số 1
        var course1 = await _courseRepository.InsertAsync(
            new Course(
                _guidGenerator.Create(),
                "Làm chủ ABP Framework & Clean Architecture với .NET 8",
                "Khóa học thực chiến giúp bạn nắm vững kiến trúc DDD, EF Core SQLite và Auto API Controllers.",
                instructor.Id,
                CourseStatus.Published
            ),
            autoSave: true
        );

        await _lessonRepository.InsertAsync(new Lesson(
            _guidGenerator.Create(), course1.Id,
            "Bài 1: Tổng quan kiến trúc phân tầng trong ABP Framework",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "Tìm hiểu trách nhiệm của các tầng Domain, Application, EntityFrameworkCore và HttpApi.Host.",
            orderIndex: 1
        ), autoSave: true);

        await _lessonRepository.InsertAsync(new Lesson(
            _guidGenerator.Create(), course1.Id,
            "Bài 2: Thiết kế AggregateRoot, Entity và cấu hình EF Core SQLite",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "Cách xây dựng các bảng Courses, Lessons, Enrollments, LessonProgresses và tạo Code-First Migration.",
            orderIndex: 2
        ), autoSave: true);

        await _lessonRepository.InsertAsync(new Lesson(
            _guidGenerator.Create(), course1.Id,
            "Bài 3: Xây dựng Application Service, DTO và Auto API Controllers",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "Cách ABP tự động biến các phương thức C# trong AppService thành RESTful API chuẩn.",
            orderIndex: 3
        ), autoSave: true);

        // 5. Tạo Khóa học mẫu số 2
        var course2 = await _courseRepository.InsertAsync(
            new Course(
                _guidGenerator.Create(),
                "Xây dựng SPA hiện đại với React 18, TypeScript & Axios",
                "Hướng dẫn kết nối React Frontend với hệ thống Backend ABP qua JWT Authentication và Axios Interceptor.",
                instructor.Id,
                CourseStatus.Published
            ),
            autoSave: true
        );

        await _lessonRepository.InsertAsync(new Lesson(
            _guidGenerator.Create(), course2.Id,
            "Bài 1: Cấu hình Axios Interceptor tự động đính kèm JWT Token",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "Thiết lập HTTP Client tập trung giúp mọi request gửi lên ABP đều có Header Authorization.",
            orderIndex: 1
        ), autoSave: true);

        await _lessonRepository.InsertAsync(new Lesson(
            _guidGenerator.Create(), course2.Id,
            "Bài 2: Quản lý trạng thái học tập và tiến độ bài học (LessonProgress)",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "Sử dụng React Hooks (useState, useEffect) để hiển thị bài giảng và cập nhật phần trăm hoàn thành.",
            orderIndex: 2
        ), autoSave: true);
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (await _roleManager.FindByNameAsync(roleName) == null)
        {
            await _roleManager.CreateAsync(new IdentityRole(_guidGenerator.Create(), roleName)
            {
                IsPublic = true
            });
        }
    }
}