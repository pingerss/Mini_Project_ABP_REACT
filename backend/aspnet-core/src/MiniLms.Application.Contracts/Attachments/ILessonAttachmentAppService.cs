using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MiniLms.Attachments.Dtos;
using Volo.Abp.Application.Services;

namespace MiniLms.Attachments;

public interface ILessonAttachmentAppService : IApplicationService
{
    Task<List<LessonMaterialDto>> GetMaterialsAsync(Guid lessonId);
    Task<LessonMaterialDto> CreateMaterialAsync(CreateLessonMaterialDto input);
    Task DeleteMaterialAsync(Guid id);
    Task<LessonSubmissionDto?> GetMySubmissionAsync(Guid lessonId);
    Task<LessonSubmissionDto> SubmitAssignmentAsync(SubmitLessonAssignmentDto input);
    Task<List<LessonSubmissionDto>> GetLessonSubmissionsAsync(Guid lessonId);
    Task<LessonSubmissionDto> GradeSubmissionAsync(GradeLessonSubmissionDto input);
}
