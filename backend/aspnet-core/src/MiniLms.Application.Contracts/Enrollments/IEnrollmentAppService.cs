using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MiniLms.Enrollments.Dtos;
using Volo.Abp.Application.Services;

namespace MiniLms.Enrollments;

public interface IEnrollmentAppService : IApplicationService
{
    Task<EnrollmentDto> EnrollAsync(Guid courseId);
    Task<List<EnrollmentDto>> GetMyEnrollmentsAsync();
    Task<CourseLearningDto> GetLearningCourseAsync(Guid courseId);
    Task<CourseLearningDto> ToggleLessonProgressAsync(ToggleLessonProgressInput input);
}