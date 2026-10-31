# Trình Cà Phê — Quản Lý Kho & Nguyên Vật Liệu

Hệ thống quản lý kho hàng, danh mục nguyên vật liệu, công thức pha chế, kế hoạch nhập/xuất kho, kiểm kê và dữ liệu bán hàng cho chuỗi **Trình Cà Phê**.

---

## 1. Yêu cầu môi trường

- **Node.js**: Phiên bản 18 trở lên (khuyến nghị Node 20 LTS).
- **npm** (đi kèm Node.js) hoặc **yarn** / **pnpm**.

---

## 2. Hướng dẫn chạy trên máy cá nhân (Local)

Sau khi tải mã nguồn hoặc clone từ GitHub về máy:

```bash
# 1. Di chuyển vào thư mục dự án
cd trinh-ca-phe-kho

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Khởi chạy máy chủ phát triển (Dev server)
npm run dev
```

Sau khi chạy lệnh trên, terminal sẽ hiển thị địa chỉ:
```
  ➜  Local:   http://localhost:3000/
```
Mở trình duyệt và truy cập `http://localhost:3000` để sử dụng hệ thống.

---

## 3. Hướng dẫn đưa dự án lên GitHub

```bash
# 1. Khởi tạo Git (nếu chưa có)
git init

# 2. Thêm tất cả file vào Git
git add .

# 3. Commit mã nguồn
git commit -m "feat: he thong quan ly kho Trinh Ca Phe"

# 4. Đổi tên nhánh chính sang main
git branch -M main

# 5. Liên kết với kho lưu trữ trên GitHub của bạn
git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_REPO.git

# 6. Đẩy mã nguồn lên GitHub
git push -u origin main
```

---

## 4. Chạy trực tuyến miễn phí bằng GitHub Pages

Dự án đã được tích hợp sẵn tệp cấu hình tự động triển khai tại `.github/workflows/deploy.yml`:

1. Vào trang Repository trên GitHub của bạn.
2. Chọn **Settings** (Cài đặt) $\rightarrow$ mục **Pages** ở thanh menu bên trái.
3. Tại phần **Build and deployment**:
   - Ở mục **Source**, chọn **GitHub Actions**.
4. GitHub sẽ tự động biên dịch và tạo một trang web trực tuyến miễn phí dạng:
   `https://<ten-user>.github.io/<ten-repo>/`
5. Bạn có thể gửi liên kết này để bất kỳ ai cũng có thể mở và dùng thử web trực tiếp trên điện thoại hoặc máy tính.

---

## 5. Tài khoản trải nghiệm có sẵn

Tất cả tài khoản dùng chung mật khẩu: `123456`

| Tài khoản (`username`) | Mật khẩu | Chức vụ | Vai trò |
| :--- | :---: | :--- | :--- |
| `chucuahang` | `123456` | **Chủ cửa hàng** | Toàn quyền tất cả chức năng & Phê duyệt đề xuất |
| `quanly` | `123456` | **Quản lý cửa hàng** | Quản lý NVL, Công thức, Nhập/Xuất kho, Kiểm kê |
| `ketoan` | `123456` | **Kế toán** | Nhập dữ liệu bán hàng POS và Báo cáo tồn/hao hụt |
| `nhanvien` | `123456` | **Nhân viên** | Nhận hàng, Thực xuất và Đếm kiểm kê thực tế |
