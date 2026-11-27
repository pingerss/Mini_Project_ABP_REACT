using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace MiniLms.Quizzes;

/// <summary>
/// Bảng QuizQuestions: Lưu bộ câu hỏi trắc nghiệm (4 đáp án A, B, C, D) gắn với từng bài học (Lesson).
/// </summary>
public class QuizQuestion : FullAuditedEntity<Guid>
{
    public Guid LessonId { get; private set; }
    public string QuestionText { get; private set; } = string.Empty;
    public string OptionA { get; private set; } = string.Empty;
    public string OptionB { get; private set; } = string.Empty;
    public string OptionC { get; private set; } = string.Empty;
    public string OptionD { get; private set; } = string.Empty;

    /// <summary>
    /// Đáp án đúng ("A", "B", "C", hoặc "D") — Chỉ lưu và đối chiếu ở Backend, không trả về cho Học viên trước khi nộp bài.
    /// </summary>
    public string CorrectOption { get; private set; } = "A";

    public int OrderIndex { get; private set; }

    protected QuizQuestion() { }

    public QuizQuestion(
        Guid id,
        Guid lessonId,
        string questionText,
        string optionA,
        string optionB,
        string optionC,
        string optionD,
        string correctOption,
        int orderIndex = 1)
        : base(id)
    {
        LessonId = lessonId;
        Update(questionText, optionA, optionB, optionC, optionD, correctOption, orderIndex);
    }

    public void Update(
        string questionText,
        string optionA,
        string optionB,
        string optionC,
        string optionD,
        string correctOption,
        int orderIndex)
    {
        QuestionText = Check.NotNullOrWhiteSpace(questionText, nameof(questionText), maxLength: 1000);
        OptionA = Check.NotNullOrWhiteSpace(optionA, nameof(optionA), maxLength: 500);
        OptionB = Check.NotNullOrWhiteSpace(optionB, nameof(optionB), maxLength: 500);
        OptionC = Check.NotNullOrWhiteSpace(optionC, nameof(optionC), maxLength: 500);
        OptionD = Check.NotNullOrWhiteSpace(optionD, nameof(optionD), maxLength: 500);

        var normalizedCorrect = (correctOption ?? "A").Trim().ToUpperInvariant();
        if (normalizedCorrect != "A" && normalizedCorrect != "B" && normalizedCorrect != "C" && normalizedCorrect != "D")
        {
            normalizedCorrect = "A";
        }

        CorrectOption = normalizedCorrect;
        OrderIndex = orderIndex > 0 ? orderIndex : 1;
    }
}
