using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MiniLms.Quizzes.Dtos;
using Volo.Abp.Application.Services;

namespace MiniLms.Quizzes;

public interface IQuizAppService : IApplicationService
{
    Task<List<QuizQuestionManageDto>> GetManageQuestionsAsync(Guid lessonId);
    Task<QuizQuestionManageDto> CreateQuestionAsync(CreateUpdateQuizQuestionDto input);
    Task<QuizQuestionManageDto> UpdateQuestionAsync(Guid id, CreateUpdateQuizQuestionDto input);
    Task DeleteQuestionAsync(Guid id);
    Task<StudentQuizPaperDto> GetStudentQuizAsync(Guid lessonId);
    Task<QuizSubmitResultDto> SubmitQuizAsync(SubmitQuizInputDto input);
}
