# HƯỚNG DẪN CÀI ĐẶT, CHẠY VÀ TRIỂN KHAI TRÊN GITHUB
## Hệ Thống Quản Lý Kho & Nguyên Vật Liệu — Trình Cà Phê

Tài liệu này hướng dẫn chi tiết cách chạy ứng dụng trên máy tính cá nhân (môi trường Local), cách đưa mã nguồn lên GitHub và cách phát hành trang web chạy trực tuyến miễn phí thông qua GitHub Pages.

---

## 1. Chuẩn bị môi trường máy tính

Trước khi bắt đầu, máy tính của bạn cần có:
- **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node.js 20 LTS).
  - Tải tại: [https://nodejs.org/](https://nodejs.org/)
- **Git**: Công cụ quản lý mã nguồn (tải tại [https://git-scm.com/](https://git-scm.com/)).
- **Trình soạn thảo mã nguồn**: Khuyến nghị dùng **Visual Studio Code (VS Code)**.

---

## 2. Hướng dẫn chạy trên máy cá nhân (Local)

### Bước 1: Mở thư mục dự án
1. Giải nén tệp mã nguồn (nếu tải về dạng file ZIP) hoặc clone từ GitHub.
2. Mở thư mục dự án bằng **VS Code**.
3. Mở cửa sổ dòng lệnh Terminal trong VS Code bằng phím tắt `` Ctrl + ` `` (hoặc menu `Terminal` -> `New Terminal`).

### Bước 2: Cài đặt các thư viện phụ thuộc
Chạy lệnh sau để tải các gói thư viện (React, Vite, Tailwind CSS...):
```bash
npm install
```

### Bước 3: Khởi chạy máy chủ phát triển
Sau khi cài đặt xong, chạy lệnh:
```bash
npm run dev
```

Terminal sẽ hiển thị đường dẫn:
```text
  VITE v8.3.0  ready in 250 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Bước 4: Mở ứng dụng
Giữ phím `Ctrl` và click chuột vào liên kết `http://localhost:3000/` trên terminal, hoặc mở trình duyệt web (Google Chrome, Microsoft Edge, Safari) và gõ địa chỉ:
```
http://localhost:3000
```

---

## 3. Hướng dẫn đưa mã nguồn lên GitHub

Nếu bạn muốn tạo một kho lưu trữ mới trên tài khoản GitHub cá nhân:

### Bước 1: Tạo kho lưu trữ mới trên GitHub
1. Truy cập [https://github.com/](https://github.com/) và đăng nhập tài khoản của bạn.
2. Nhấn nút **New** (Tạo mới Repository).
3. Đặt tên kho lưu trữ (ví dụ: `trinh-ca-phe-kho`), chọn trạng thái **Public** (Công khai), sau đó nhấn **Create repository**.

### Bước 2: Đẩy mã nguồn từ máy lên GitHub
Tại cửa sổ terminal của dự án trên máy, chạy tuần tự các lệnh sau:

```bash
# 1. Khởi tạo Git cho thư mục (nếu chưa có)
git init

# 2. Thêm tất cả các tệp vào Git
git add .

# 3. Tạo bản ghi commit đầu tiên
git commit -m "feat: he thong quan ly kho Trinh Ca Phe"

# 4. Đổi tên nhánh mặc định thành main
git branch -M main

# 5. Liên kết thư mục local với repo GitHub vừa tạo
# (Thay 'TEN_GITHUB_CUA_BAN' và 'trinh-ca-phe-kho' bằng thông tin thật của bạn)
git remote add origin https://github.com/TEN_GITHUB_CUA_BAN/trinh-ca-phe-kho.git

# 6. Đẩy toàn bộ mã nguồn lên GitHub
git push -u origin main
```

---

## 4. Cách triển khai trang web trực tuyến miễn phí với GitHub Pages

Dự án đã được tích hợp sẵn luồng tự động hoá GitHub Actions tại đường dẫn `.github/workflows/deploy.yml` và cấu hình đường dẫn tương đối `base: './'` trong `vite.config.ts`.

### Các bước kích hoạt:
1. Mở trang Repository dự án của bạn trên [github.com](https://github.com).
2. Nhấp vào tab **Settings** (Cài đặt) ở thanh công cụ phía trên.
3. Ở cột menu bên trái, tìm và chọn mục **Pages**.
4. Tại phần **Build and deployment**:
   - Ở mục **Source**, nhấn vào menu thả xuống và chọn **GitHub Actions**.
5. Nhấp sang tab **Actions** ở menu chính để theo dõi quá trình xây dựng tự động:
   - Hệ thống sẽ tự động chạy công việc `Deploy Trinh Ca Phe to GitHub Pages` (mất khoảng 1–2 phút).
6. Khi hoàn tất, một liên kết trang web công khai sẽ được tạo tự động có định dạng:
   ```text
   https://<ten-tai-khoan-github>.github.io/<ten-repository>/
   ```
7. Bạn có thể sao chép liên kết này gửi cho bất kỳ ai để truy cập và thao tác demo trực tiếp trên điện thoại, máy tính bảng hoặc máy tính mà không cần cài đặt bất cứ phần mềm nào.

---

## 5. Bảng thông tin tài khoản trải nghiệm hệ thống

Tất cả các tài khoản demo đều sử dụng mật khẩu chung: **`123456`**

| Tài khoản (`username`) | Mật khẩu | Chức vụ | Vai trò & Quyền hạn |
| :--- | :---: | :--- | :--- |
| **`chucuahang`** | `123456` | **Chủ cửa hàng** *(Nguyễn Văn Trình)* | Toàn quyền toàn bộ hệ thống; xem số liệu Toàn chuỗi hoặc từng chi nhánh; phê duyệt điều chỉnh tồn, kế hoạch nhập hàng và công thức pha chế. |
| **`quanly`** | `123456` | **Quản lý cửa hàng** *(Trần Thị Mai)* | Quản lý danh mục nguyên vật liệu, công thức & định mức tồn tối thiểu; tạo kế hoạch nhập hàng và phiếu xuất kho cấp quầy. |
| **`ketoan`** | `123456` | **Kế toán** *(Phạm Minh Tuấn)* | Thực hiện quy trình 3 bước nạp dữ liệu bán hàng POS; theo dõi báo cáo tồn kho và đối chiếu hao hụt thực tế; xuất báo cáo ra file Excel. |
| **`nhanvien`** | `123456` | **Nhân viên** *(Lê Văn Kho)* | Xem phiếu nhập/xuất; ghi nhận nhận hàng thực tế (kiểm tra chất lượng); xác nhận thực xuất; thực hiện kiểm đếm kho mù (ẩn tồn sổ sách). |

---

## 6. Các lệnh thường dùng khác

- **Kiểm tra cú pháp và kiểu dữ liệu TypeScript:**
  ```bash
  npm run lint
  ```
- **Biên dịch thử bản phát hành (Production Build):**
  ```bash
  npm run build
  ```
- **Xem trước bản biên dịch Production:**
  ```bash
  npm run preview
  ```
