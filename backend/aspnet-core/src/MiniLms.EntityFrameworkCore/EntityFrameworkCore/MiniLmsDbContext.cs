using Microsoft.EntityFrameworkCore;
using MiniLms.Courses;
using MiniLms.Enrollments;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.TenantManagement;
using Volo.Abp.TenantManagement.EntityFrameworkCore;
using MiniLms.Attachments;
using MiniLms.Quizzes;
using Volo.Abp.EntityFrameworkCore.Modeling;

namespace MiniLms.EntityFrameworkCore;

[ReplaceDbContext(typeof(IIdentityDbContext))]
[ReplaceDbContext(typeof(ITenantManagementDbContext))]
[ConnectionStringName("Default")]
public class MiniLmsDbContext :
    AbpDbContext<MiniLmsDbContext>,
    IIdentityDbContext,
    ITenantManagementDbContext
{
    /* Add DbSet properties for your Aggregate Roots / Entities here. */

    // 1. Khai báo các bảng nghiệp vụ của Mini LMS
    public DbSet<Course> Courses { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<Enrollment> Enrollments { get; set; }
    public DbSet<LessonProgress> LessonProgresses { get; set; }
    public DbSet<QuizQuestion> QuizQuestions { get; set; }
    public DbSet<QuizAttempt> QuizAttempts { get; set; }
    public DbSet<LessonMaterial> LessonMaterials { get; set; }
    public DbSet<LessonSubmission> LessonSubmissions { get; set; }

    #region Entities from the modules

    /* Notice: We only implemented IIdentityDbContext and ITenantManagementDbContext
     * and replaced them for this DbContext. This allows you to perform JOIN
     * queries for the entities of these modules over the repositories easily. You
     * typically don't need that for other modules. But, if you need, you can
     * implement the DbContext interface of the needed module and use ReplaceDbContext
     * attribute just like IIdentityDbContext and ITenantManagementDbContext.
     *
     * More info: Replacing a DbContext of a module ensures that the related module
     * uses this DbContext on runtime. Otherwise, it will use its own DbContext class.
     */

    //Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }
    // Tenant Management
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<TenantConnectionString> TenantConnectionStrings { get; set; }

    #endregion

    public MiniLmsDbContext(DbContextOptions<MiniLmsDbContext> options)
        : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        /* Include modules to your migration db context */

        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureFeatureManagement();
        builder.ConfigureTenantManagement();

        /* Configure your own tables/entities inside here */

        //builder.Entity<YourEntity>(b =>
        //{
        //    b.ToTable(MiniLmsConsts.DbTablePrefix + "YourEntities", MiniLmsConsts.DbSchema);
        //    b.ConfigureByConvention(); //auto configure for the base class props
        //    //...
        //});



          builder.Entity<Course>(b =>
        {
            b.ToTable("Courses");
            b.ConfigureByConvention(); // WHY: Tự động cấu hình các cột chuẩn của ABP (Id, CreationTime, IsDeleted...)

            b.Property(x => x.Title).IsRequired().HasMaxLength(200);
            b.Property(x => x.Description).HasMaxLength(2000);

            // Khóa ngoại: Courses.InstructorId -> AbpUsers.Id
            b.HasOne<IdentityUser>()
                .WithMany()
                .HasForeignKey(x => x.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Quan hệ 1-N: Course -> Lessons
            b.HasMany(x => x.Lessons)
                .WithOne()
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. Bảng Lessons
        builder.Entity<Lesson>(b =>
        {
            b.ToTable("Lessons");
            b.ConfigureByConvention();

            b.Property(x => x.Title).IsRequired().HasMaxLength(200);
            b.Property(x => x.VideoUrl).HasMaxLength(500);
            b.HasIndex(x => new { x.CourseId, x.OrderIndex });
        });

        // 3. Bảng Enrollments
        builder.Entity<Enrollment>(b =>
        {
            b.ToTable("Enrollments");
            b.ConfigureByConvention();

            // Khóa ngoại: Enrollments.CourseId -> Courses.Id
            b.HasOne<Course>()
                .WithMany()
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            // Khóa ngoại: Enrollments.StudentId -> AbpUsers.Id
            b.HasOne<IdentityUser>()
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // WHY: Unique Index đảm bảo 1 học viên không bao giờ đăng ký trùng 2 lần vào cùng 1 khóa học
            b.HasIndex(x => new { x.CourseId, x.StudentId }).IsUnique();

            // Quan hệ 1-N: Enrollment -> LessonProgresses
            b.HasMany(x => x.LessonProgresses)
                .WithOne()
                .HasForeignKey(x => x.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 4. Bảng LessonProgresses
        builder.Entity<LessonProgress>(b =>
        {
            b.ToTable("LessonProgresses");
            b.ConfigureByConvention();

            // Khóa ngoại: LessonProgresses.LessonId -> Lessons.Id
            // Dùng Restrict để tránh lỗi multiple cascade paths trên SQL Server (Course -> Lessons -> LessonProgresses)
            b.HasOne<Lesson>()
                .WithMany()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Restrict);

            // Mỗi bài học trong 1 lượt đăng ký chỉ có duy nhất 1 bản ghi tiến độ
            b.HasIndex(x => new { x.EnrollmentId, x.LessonId }).IsUnique();
        });

        // 5. Bảng QuizQuestions (Câu hỏi trắc nghiệm gắn với từng bài học)
        builder.Entity<QuizQuestion>(b =>
        {
            b.ToTable("QuizQuestions");
            b.ConfigureByConvention();

            b.Property(x => x.QuestionText).IsRequired().HasMaxLength(1000);
            b.Property(x => x.OptionA).IsRequired().HasMaxLength(500);
            b.Property(x => x.OptionB).IsRequired().HasMaxLength(500);
            b.Property(x => x.OptionC).IsRequired().HasMaxLength(500);
            b.Property(x => x.OptionD).IsRequired().HasMaxLength(500);
            b.Property(x => x.CorrectOption).IsRequired().HasMaxLength(2);

            b.HasOne<Lesson>()
                .WithMany()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.LessonId, x.OrderIndex });
        });

        // 6. Bảng QuizAttempts (Lịch sử nộp bài trắc nghiệm của Học viên)
        builder.Entity<QuizAttempt>(b =>
        {
            b.ToTable("QuizAttempts");
            b.ConfigureByConvention();

            b.HasOne<Enrollment>()
                .WithMany()
                .HasForeignKey(x => x.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Dùng Restrict để tránh lỗi multiple cascade paths trên SQL Server
            b.HasOne<Lesson>()
                .WithMany()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(x => new { x.EnrollmentId, x.LessonId });
        });

        // 7. Bảng LessonMaterials (Tài liệu học tập do Giảng viên đính kèm vào từng bài học)
        builder.Entity<LessonMaterial>(b =>
        {
            b.ToTable("LessonMaterials");
            b.ConfigureByConvention();

            b.Property(x => x.Title).IsRequired().HasMaxLength(200);
            b.Property(x => x.FileUrl).IsRequired().HasMaxLength(1000);
            b.Property(x => x.FileType).IsRequired().HasMaxLength(50);

            b.HasOne<Lesson>()
                .WithMany()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => x.LessonId);
        });

        // 8. Bảng LessonSubmissions (Bài tập thực hành do Học viên nộp & Giảng viên chấm điểm)
        builder.Entity<LessonSubmission>(b =>
        {
            b.ToTable("LessonSubmissions");
            b.ConfigureByConvention();

            b.Property(x => x.SubmissionUrl).IsRequired().HasMaxLength(1000);
            b.Property(x => x.Note).HasMaxLength(1000);
            b.Property(x => x.InstructorFeedback).HasMaxLength(1000);

            b.HasOne<Enrollment>()
                .WithMany()
                .HasForeignKey(x => x.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Dùng Restrict để tránh lỗi multiple cascade paths trên SQL Server
            b.HasOne<Lesson>()
                .WithMany()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne<IdentityUser>()
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(x => new { x.EnrollmentId, x.LessonId });
        });
    }
}
