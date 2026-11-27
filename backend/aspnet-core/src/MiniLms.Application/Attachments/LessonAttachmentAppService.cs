using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using MiniLms.Attachments.Dtos;
using MiniLms.Courses;
using MiniLms.Enrollments;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace MiniLms.Attachments;

/// <summary>
/// Quản lý Tài liệu học tập đính kèm (LessonMaterials) và Bài tập nộp / Chấm điểm (LessonSubmissions).
/// </summary>
[Authorize]
public class LessonAttachmentAppService : ApplicationService, ILessonAttachmentAppService
{
    private readonly IRepository<LessonMaterial, Guid> _materialRepository;
    private readonly IRepository<LessonSubmission, Guid> _submissionRepository;
    private readonly IRepository<Lesson, Guid> _lessonRepository;
    private readonly IRepository<Course, Guid> _courseRepository;
    private readonly IRepository<Enrollment, Guid> _enrollmentRepository;
    private readonly IRepository<IdentityUser, Guid> _userRepository;

    public LessonAttachmentAppService(
        IRepository<LessonMaterial, Guid> materialRepository,
        IRepository<LessonSubmission, Guid> submissionRepository,
        IRepository<Lesson, Guid> lessonRepository,
        IRepository<Course, Guid> courseRepository,
        IRepository<Enrollment, Guid> enrollmentRepository,
        IRepository<IdentityUser, Guid> userRepository)
    {
        _materialRepository = materialRepository;
        _submissionRepository = submissionRepository;
        _lessonRepository = lessonRepository;
        _courseRepository = courseRepository;
        _enrollmentRepository = enrollmentRepository;
        _userRepository = userRepository;
    }

    // API: GET /api/app/lesson-attachment/materials/{lessonId}
    public async Task<List<LessonMaterialDto>> GetMaterialsAsync(Guid lessonId)
    {
        var materials = await _materialRepository.GetListAsync(x => x.LessonId == lessonId);
        return materials
            .OrderBy(x => x.CreationTime)
            .Select(MapMaterialToDto)
            .ToList();
    }

    // API: POST /api/app/lesson-attachment/material
    public async Task<LessonMaterialDto> CreateMaterialAsync(CreateLessonMaterialDto input)
    {
        var lesson = await _lessonRepository.GetAsync(input.LessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        var material = new LessonMaterial(
            GuidGenerator.Create(),
            input.LessonId,
            input.Title,
            input.FileUrl,
            input.FileType
        );

        await _materialRepository.InsertAsync(material, autoSave: true);
        return MapMaterialToDto(material);
    }

    // API: DELETE /api/app/lesson-attachment/material/{id}
    public async Task DeleteMaterialAsync(Guid id)
    {
        var material = await _materialRepository.GetAsync(id);
        var lesson = await _lessonRepository.GetAsync(material.LessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        await _materialRepository.DeleteAsync(material, autoSave: true);
    }

    // API: GET /api/app/lesson-attachment/my-submission/{lessonId}
    public async Task<LessonSubmissionDto?> GetMySubmissionAsync(Guid lessonId)
    {
        var studentId = CurrentUser.GetId();
        var submission = await _submissionRepository.FirstOrDefaultAsync(
            x => x.LessonId == lessonId && x.StudentId == studentId);

        if (submission == null) return null;

        return MapSubmissionToDto(submission, CurrentUser.UserName ?? "Học viên", CurrentUser.Email ?? string.Empty);
    }

    // API: POST /api/app/lesson-attachment/submit-assignment
    public async Task<LessonSubmissionDto> SubmitAssignmentAsync(SubmitLessonAssignmentDto input)
    {
        var studentId = CurrentUser.GetId();
        var enrollment = await _enrollmentRepository.FirstOrDefaultAsync(
            x => x.CourseId == input.CourseId && x.StudentId == studentId);

        if (enrollment == null)
        {
            throw new UserFriendlyException("Không tìm thấy thông tin đăng ký khóa học của bạn.");
        }

        var existing = await _submissionRepository.FirstOrDefaultAsync(
            x => x.EnrollmentId == enrollment.Id && x.LessonId == input.LessonId);

        if (existing == null)
        {
            existing = new LessonSubmission(
                GuidGenerator.Create(),
                enrollment.Id,
                input.LessonId,
                studentId,
                input.SubmissionUrl,
                input.Note,
                Clock.Now
            );
            await _submissionRepository.InsertAsync(existing, autoSave: true);
        }
        else
        {
            existing.UpdateSubmission(input.SubmissionUrl, input.Note, Clock.Now);
            await _submissionRepository.UpdateAsync(existing, autoSave: true);
        }

        return MapSubmissionToDto(existing, CurrentUser.UserName ?? "Học viên", CurrentUser.Email ?? string.Empty);
    }

    // API: GET /api/app/lesson-attachment/lesson-submissions/{lessonId}
    public async Task<List<LessonSubmissionDto>> GetLessonSubmissionsAsync(Guid lessonId)
    {
        var lesson = await _lessonRepository.GetAsync(lessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        var submissions = await _submissionRepository.GetListAsync(x => x.LessonId == lessonId);
        var studentIds = submissions.Select(s => s.StudentId).Distinct().ToList();
        var students = studentIds.Count > 0
            ? await _userRepository.GetListAsync(u => studentIds.Contains(u.Id))
            : new List<IdentityUser>();

        return submissions
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s =>
            {
                var student = students.FirstOrDefault(u => u.Id == s.StudentId);
                return MapSubmissionToDto(s, student?.UserName ?? "Học viên", student?.Email ?? string.Empty);
            })
            .ToList();
    }

    // API: POST /api/app/lesson-attachment/grade-submission
    public async Task<LessonSubmissionDto> GradeSubmissionAsync(GradeLessonSubmissionDto input)
    {
        var submission = await _submissionRepository.GetAsync(input.SubmissionId);
        var lesson = await _lessonRepository.GetAsync(submission.LessonId);
        var course = await _courseRepository.GetAsync(lesson.CourseId);
        EnsureInstructorOrAdmin(course.InstructorId);

        submission.SetGrade(input.Grade, input.InstructorFeedback, Clock.Now);
        await _submissionRepository.UpdateAsync(submission, autoSave: true);

        var student = await _userRepository.FindAsync(submission.StudentId);
        return MapSubmissionToDto(submission, student?.UserName ?? "Học viên", student?.Email ?? string.Empty);
    }

    private void EnsureInstructorOrAdmin(Guid ownerInstructorId)
    {
        var isAdmin = CurrentUser.IsInRole("admin");
        var isInstructor = CurrentUser.IsInRole("Instructor");

        if (!isAdmin && !isInstructor)
        {
            throw new AbpAuthorizationException("Chỉ Giảng viên hoặc Admin mới được phép thực hiện thao tác này.");
        }

        if (!isAdmin && ownerInstructorId != CurrentUser.GetId())
        {
            throw new AbpAuthorizationException("Bạn chỉ có thể quản lý tài liệu và bài nộp thuộc khóa học của mình.");
        }
    }

    private static LessonMaterialDto MapMaterialToDto(LessonMaterial m)
    {
        return new LessonMaterialDto
        {
            Id = m.Id,
            LessonId = m.LessonId,
            Title = m.Title,
            FileUrl = m.FileUrl,
            FileType = m.FileType,
            CreationTime = m.CreationTime
        };
    }

    private static LessonSubmissionDto MapSubmissionToDto(
        LessonSubmission s,
        string studentUserName,
        string studentEmail)
    {
        return new LessonSubmissionDto
        {
            Id = s.Id,
            EnrollmentId = s.EnrollmentId,
            LessonId = s.LessonId,
            StudentId = s.StudentId,
            StudentUserName = studentUserName,
            StudentEmail = studentEmail,
            SubmissionUrl = s.SubmissionUrl,
            Note = s.Note,
            Grade = s.Grade,
            InstructorFeedback = s.InstructorFeedback,
            SubmittedAt = s.SubmittedAt,
            GradedAt = s.GradedAt
        };
    }
}
