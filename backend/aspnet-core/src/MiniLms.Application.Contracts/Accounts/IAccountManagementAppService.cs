using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MiniLms.Accounts.Dtos;
using Volo.Abp.Application.Services;

namespace MiniLms.Accounts;

public interface IAccountManagementAppService : IApplicationService
{
    Task RegisterInstructorAsync(RegisterInstructorDto input);
    Task<StudentAccountDto> CreateStudentAsync(CreateStudentDto input);
    Task<List<StudentAccountDto>> GetStudentsAsync();
    Task<StudentAccountDto> AssignCoursesAsync(AssignCoursesToStudentDto input);
    Task ResetStudentPasswordAsync(ResetStudentPasswordDto input);
    Task DeleteStudentAsync(Guid studentId);
    Task ChangeMyPasswordAsync(ChangeMyPasswordDto input);
}
