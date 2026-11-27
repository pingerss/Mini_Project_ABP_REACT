# 🎓 Mini LMS — Hệ thống Quản lý Khóa học Trực tuyến (Fullstack ABP Framework + React)

Dự án **Mini LMS (Learning Management System)** được xây dựng theo kiến trúc **Clean Architecture & Domain-Driven Design (DDD)** trên nền tảng **ABP Framework 8.3.4 (.NET 8)** kết hợp với **SQL Server** ở Backend và **React 19 + TypeScript + Vite** ở Frontend.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

### 1. Backend (`backend/aspnet-core`)
- **Framework:** ASP.NET Core 8.0 & **ABP Framework 8.3.4** (Layered DDD Architecture)
- **ORM & Database:** Entity Framework Core 8 + **Microsoft SQL Server**
- **Authentication & Authorization:** OpenIddict (OAuth2 / OIDC, JWT Access Token, Refresh Token, Token Revocation) & ASP.NET Core Identity Role-based Access Control (`admin`, `Instructor`, `Student`)
- **API Documentation:** Swagger / OpenAPI & ABP Auto API Controllers

### 2. Frontend (`frontend`)
- **Library & Build Tool:** React 19 + Vite 8 + TypeScript
- **Routing:** React Router DOM v7 (`ProtectedRoute` phân quyền theo Role)
- **HTTP Client:** Axios (kèm Request/Response Interceptors tự động gắn `Bearer Token` và tự động gia hạn phiên bằng `refresh_token` khi gặp lỗi `401 Unauthorized`)

---

## ✨ Các tính năng chính

### 👨‍🏫 Phân hệ Giảng viên (`Instructor`) & Quản trị viên (`admin`)
1. **Đăng ký Giảng viên có kiểm soát:**
   - Trang `/register` dành riêng cho Giảng viên với **Mã mời Giảng viên (Invite Code)** bảo mật.
2. **Quản lý Khóa học (`/admin/courses`):**
   - Tạo, chỉnh sửa, xóa khóa học, chuyển đổi trạng thái **Bản nháp (`Draft`)** / **Xuất bản (`Published`)**.
   - Tìm kiếm khóa học theo từ khóa và lọc theo trạng thái.
   - Cơ chế **Cô lập dữ liệu (Data Isolation)**: Mỗi Giảng viên chỉ quản lý khóa học và học viên do chính mình tạo (`admin` có toàn quyền).
3. **Quản lý Bài giảng (`/admin/courses/:id/lessons`):**
   - Thêm, sửa, xóa bài học, sắp xếp thứ tự bài giảng (`SortOrder` ↑/↓).
   - Hỗ trợ nhúng video bài giảng (tự động chuẩn hóa link YouTube thường/Shorts/`youtu.be` sang chuẩn `embed`) và nội dung lý thuyết.
4. **Ngân hàng Câu hỏi Trắc nghiệm — Quiz (`QuizManager`):**
   - Tạo và quản lý bộ câu hỏi trắc nghiệm 4 đáp án (`A`, `B`, `C`, `D`) ngay trong từng bài học.
5. **Tài liệu học tập & Chấm điểm Bài tập (`Tài liệu & Bài nộp`):**
   - Tải file tài liệu trực tiếp từ máy tính (`POST /api/upload` hỗ trợ `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.zip`, `.rar`, ảnh...) hoặc đính kèm link tài liệu cho từng bài học.
   - Xem danh sách bài tập học viên đã nộp, tải bài làm, chấm điểm trên thang `0 - 100` và ghi nhận xét (`Feedback`).
6. **Cấp tài khoản Học viên & Ghi danh Khóa học (`/admin/students`):**
   - Tạo tài khoản Học viên và gán/gỡ khóa học (`Auto-Enroll`).
   - Đặt lại mật khẩu (`Reset Password`) hoặc xóa tài khoản Học viên.

---

### 👨‍🎓 Phân hệ Học viên (`Student`)
1. **Không gian Khóa học Cá nhân hóa (`/`):**
   - Hiển thị danh sách các khóa học đã được Giảng viên ghi danh kèm tên Giảng viên phụ trách.
   - Hiển thị **Thanh tiến độ học tập (`% Hoàn thành`)** trực quan trên từng thẻ khóa học.
2. **Trình học tập Bài giảng (`/learn/:courseId`):**
   - Xem Video bài giảng, đọc nội dung lý thuyết và điều hướng nhanh **`← Bài trước` / `Bài tiếp theo →`**.
   - Đánh dấu hoàn thành từng bài học và cập nhật tiến độ khóa học theo thời gian thực.
3. **Làm bài Kiểm tra Trắc nghiệm (Lesson Quiz & Auto-Grading):**
   - Làm bài trắc nghiệm cuối bài học, hệ thống tự động chấm điểm và hiển thị lịch sử các lần làm bài.
   - **Quy tắc vượt qua bài học:** Với bài học có Quiz, học viên phải đạt từ **`70%` trở lên** hệ thống mới tự động đánh dấu hoàn thành bài học (`IsCompleted = true`).
4. **Tải Tài liệu & Nộp Bài tập Thực hành:**
   - Xem và tải các tài liệu đính kèm của Giảng viên ngay dưới bài giảng.
   - Nộp bài tập về nhà (tải file từ máy tính hoặc dán link bài làm + ghi chú), cho phép nộp lại/cập nhật bài làm khi Giảng viên chưa chấm điểm.
   - Xem điểm số (`.../100`) và lời phê của Giảng viên sau khi được chấm.
5. **Quản lý Tài khoản Cá nhân:**
   - Tự đổi mật khẩu cá nhân ngay trên thanh điều hướng (`Navbar`).

---

## 🗄️ Kiến trúc Cơ sở dữ liệu (Database Schema)

Ngoài các bảng hệ thống chuẩn của **ABP Framework** (`AbpUsers`, `AbpRoles`, `OpenIddictApplications`...), hệ thống gồm **8 bảng nghiệp vụ cốt lõi**:

| STT | Tên bảng | Thực thể (Entity) | Mô tả chức năng |
| :-: | :--- | :--- | :--- |
| 1 | `Courses` | `Course` (`FullAuditedAggregateRoot`) | Thông tin khóa học (`Title`, `Description`, `Status`, `CreatorId`) |
| 2 | `Lessons` | `Lesson` (`FullAuditedEntity`) | Bài giảng thuộc khóa học (`CourseId`, `Title`, `Content`, `VideoUrl`, `SortOrder`) |
| 3 | `Enrollments` | `Enrollment` (`CreationAuditedAggregateRoot`) | Ghi danh học viên vào khóa học (`CourseId`, `StudentId` — Unique Index) |
| 4 | `LessonProgresses` | `LessonProgress` (`CreationAuditedEntity`) | Tiến độ hoàn thành từng bài học của học viên (`EnrollmentId`, `LessonId`, `IsCompleted`) |
| 5 | `QuizQuestions` | `QuizQuestion` (`FullAuditedEntity`) | Câu hỏi trắc nghiệm 4 lựa chọn A/B/C/D của bài học (`LessonId`, `CorrectOption`) |
| 6 | `QuizAttempts` | `QuizAttempt` (`CreationAuditedEntity`) | Lịch sử làm bài trắc nghiệm (`EnrollmentId`, `LessonId`, `ScorePercent`, `IsPassed`) |
| 7 | `LessonMaterials` | `LessonMaterial` (`FullAuditedEntity`) | Tài liệu học tập do Giảng viên đính kèm cho bài học (`LessonId`, `Title`, `FileUrl`, `FileType`) |
| 8 | `LessonSubmissions` | `LessonSubmission` (`FullAuditedEntity`) | Bài tập thực hành của Học viên & điểm/nhận xét của Giảng viên (`EnrollmentId`, `LessonId`, `Grade`, `Feedback`) |

---

## 📂 Cấu trúc Thư mục Dự án

```text
Mini_Project_LMS/
├── backend/aspnet-core/
│   └── src/
│       ├── MiniLms.Domain.Shared/          # Constants, Enums (CourseStatus, ...)
│       ├── MiniLms.Domain/                 # Entities, Data Seeders (Roles, OpenIddict Client)
│       ├── MiniLms.EntityFrameworkCore/    # DbContext, Fluent API Mappings, Migrations
│       ├── MiniLms.Application.Contracts/  # DTOs & Application Service Interfaces
│       ├── MiniLms.Application/            # Business Logic (AppServices)
│       ├── MiniLms.HttpApi/                # Custom API Controllers
│       ├── MiniLms.HttpApi.Host/           # Startup Host, FileUploadController, wwwroot/uploads
│       └── MiniLms.DbMigrator/             # Công cụ chạy Migration & Data Seeding tự động
└── frontend/
    └── src/
        ├── api/                            # axiosClient (Auto-Refresh Token), authService, lmsService
        ├── components/                     # Navbar, ProtectedRoute, ChangePasswordModal
        ├── context/                        # AuthContext (Quản lý JWT & Role toàn cục)
        ├── pages/                          # LoginPage, RegisterPage, CourseListPage, LessonPlayerPage,
        │                                   # AdminCoursesPage, AdminLessonsPage, AdminStudentsPage
        └── types/                          # TypeScript Interfaces (DTOs)
```

---

## ⚙️ Hướng dẫn Cài đặt & Chạy Dự án

### 1. Yêu cầu môi trường (Prerequisites)
- **.NET 8.0 SDK**
- **SQL Server** (SQL Server Express / Developer Edition & SSMS)
- **Node.js** (v18+ hoặc v20+)

### 2. Cấu hình Chuỗi kết nối SQL Server
Kiểm tra `ConnectionStrings:Default` trong 2 file cấu hình sau cho khớp với tên SQL Server Instance trên máy của bạn:
- `backend/aspnet-core/src/MiniLms.DbMigrator/appsettings.json`
- `backend/aspnet-core/src/MiniLms.HttpApi.Host/appsettings.json`

```json
"ConnectionStrings": {
  "Default": "Server=LOCALHOST\\SQLEXPRESS;Database=MiniLmsDb;Trusted_Connection=True;TrustServerCertificate=True"
}
```

### 3. Khởi tạo Database & Chạy Backend (`.NET 8 / ABP`)
Mở terminal (Git Bash / PowerShell) và chạy lần lượt:

```bash
# Bước 1: Chạy DbMigrator để khởi tạo Database và Seed Roles / OpenIddict Client (MiniLms_App)
cd backend/aspnet-core/src/MiniLms.DbMigrator
dotnet run

# Bước 2: Khởi động Backend API Host (chạy tại https://localhost:44350)
cd ../MiniLms.HttpApi.Host
dotnet run
```
> **Giao diện Swagger UI:** Truy cập `https://localhost:44350/swagger`

### 4. Khởi động Frontend (`React + Vite`)
Mở một terminal thứ 2:

```bash
cd frontend
npm install
npm run dev
```
> **Giao diện Web App:** Truy cập `http://localhost:5173`

---

## 🔑 Thông tin Tài khoản & Mã mời Mặc định

| Vai trò | Tài khoản / Mã | Thông tin | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (`admin`)** | Username: `admin` | Password: `1q2w3E*` | Được ABP tự động seed khi chạy `DbMigrator` |
| **Đăng ký Giảng viên (`Instructor`)** | Mã mời: `TEACHER2026` | Đăng ký tại `/register` | Cấu hình tại `App:InstructorInviteCode` trong `appsettings.json` |
| **Học viên (`Student`)** | Do Giảng viên cấp | Tạo tại `/admin/students` | Giảng viên tạo tài khoản và gán khóa học trực tiếp |
