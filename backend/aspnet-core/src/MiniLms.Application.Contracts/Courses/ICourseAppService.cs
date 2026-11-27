using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MiniLms.Courses.Dtos;
using Volo.Abp.Application.Services;

namespace MiniLms.Courses;

public interface ICourseAppService : IApplicationService
{
    Task<List<CourseDto>> GetListAsync();
    Task<List<CourseDto>> GetManageListAsync();
    Task<CourseDto> GetAsync(Guid id);
    Task<CourseDto> CreateAsync(CreateUpdateCourseDto input);
    Task<CourseDto> UpdateAsync(Guid id, CreateUpdateCourseDto input);
    Task DeleteAsync(Guid id);
    Task<LessonDto> AddLessonAsync(CreateUpdateLessonDto input);
    Task<LessonDto> UpdateLessonAsync(Guid lessonId, CreateUpdateLessonDto input);
    Task DeleteLessonAsync(Guid lessonId);
}