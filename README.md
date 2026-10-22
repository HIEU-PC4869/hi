# SAS Enterprise - Student Attendance & Intelligence System

Giao diện Quản lý Điểm danh Sinh viên Doanh nghiệp (HTML Edition & Python Edition).

---

## 🚀 CÁCH CHẠY DỄ NHẤT TRÊN VS CODE (100% KHÔNG LỖI)

Nếu bạn không muốn cài đặt các gói đồ họa phức tạp như PySide6 hay Qt, bạn có thể chạy giao diện HTML bằng 1 trong các cách sau:

### Cách 1: Chạy trực tiếp file HTML (0 Cài Đặt)
1. Trong VS Code, nhấp chuột phải vào file **`app.html`**.
2. Chọn **Open with Live Server** (hoặc mở trực tiếp file `app.html` bằng Google Chrome, Microsoft Edge, Cốc Cốc, Safari...).
3. Giao diện chạy mượt mà ngay lập tức với đầy đủ 5 vai trò và tính năng!
*(Trên Windows, bạn cũng có thể nhấp đúp trực tiếp vào file **`run.bat`**)*.

---

### Cách 2: Chạy bằng Terminal Python có sẵn (0 cần cài pip)
Python 3 có sẵn thư viện máy chủ web nội bộ, không cần cài đặt bất kỳ package nào qua `pip`.
Mở Terminal trong VS Code và gõ:

```bash
python server.py
```

Trình duyệt sẽ tự động mở tại địa chỉ `http://localhost:8000/app.html`.

---

### Cách 3: Chạy bản React / Vite (Nếu máy có Node.js)
```bash
npm install
npm run dev
```
Truy cập `http://localhost:3000`.

---

## 🔑 DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP (Mật khẩu chung: `password123`)

| Vai trò | Email đăng nhập | Tên người dùng | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| **Sinh viên** | `a.rivera@university.edu` | Alex Rivera | Nhập mã PIN điểm danh (tự động tính <15p Có mặt, 15-45p Trễ), xem bảng % chuyên cần, nộp đơn xin phép vắng |
| **Giảng viên** | `dr.vance@university.edu` | Dr. Evelyn Vance | Mở phiên điểm danh tạo mã PIN 6 số động + đếm ngược 15 phút, chỉnh sửa trạng thái trực tiếp trên bảng, duyệt đơn xin phép vắng, xuất báo cáo CSV |
| **Cố vấn học tập** | `m.brody@university.edu` | Marcus Brody | Hệ thống Cảnh báo Sớm EWS (<80% hoặc vắng 3 buổi liên tiếp), ghi chú can thiệp và lưu lịch sử tư vấn |
| **Quản trị viên** | `sysadmin@university.edu` | Root Systems Admin | Quản lý người dùng CRUD (Thêm/Sửa/Xóa tài khoản), phân lớp, nhật ký an ninh Audit Logs, xuất báo cáo toàn trường CSV |

---

## 📂 DANH MỤC CÁC FILE CHÍNH

- **`app.html`**: Toàn bộ giao diện HTML Standalone tự chứa (chạy mọi nơi, không phụ thuộc).
- **`server.py`**: Web server siêu nhẹ dùng thư viện chuẩn của Python.
- **`run.bat`**: File nhấp đúp chạy nhanh trên Windows.
- **`run.sh`**: File chạy nhanh trên Linux / macOS.
- **`main.py`, `database.py`, `logic.py`, `main_app.ui`**: Phiên bản PySide6 MVC (dành cho người thích chạy desktop app).
