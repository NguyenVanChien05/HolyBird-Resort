# HƯỚNG DẪN ĐÓNG GÓP (CONTRIBUTING)

Dự án **Holybird Resort Management System**.
Tài liệu này hướng dẫn cách cấu hình môi trường, kết nối cơ sở dữ liệu SQL Server và quy ước khi làm việc với source code.

---
## 1. Cấu hình & kết nối SQL Server

Phần này hướng dẫn **tạo user**, **bật TCP/IP**, và **kiểm tra kết nối SQL Server** để backend Node.js có thể làm việc với cơ sở dữ liệu.

---
### Yêu cầu

* SQL Server (Express / Developer)
* SQL Server Management Studio (SSMS)
* Node.js >= 18
* npm >= 9

---
### 1.1 Tạo User đăng nhập SQL Server

#### 1.1.1 Mở SQL Server Management Studio (SSMS)
- Đăng nhập bằng **Windows Authentication** hoặc tài khoản `sa`

#### 1.1.2 Tạo Login mới
- Chuột phải **Security → Logins → New Login…**

Cấu hình:
- **Login name:** `your_username`
- **Authentication:** SQL Server Authentication
- **Password:** `your_password`
- Bỏ chọn `Enforce password policy`

Tab **Server Roles**:
- Chọn `public`
- (Có thể chọn `sysadmin` nếu chạy demo nhanh)

#### 1.1.3 Gán quyền cho Database
- Tab **User Mapping**
- Chọn database: `HolybirdResort`
- Database role: `db_owner`

Nhấn **OK**

---

### 1.2 Bật TCP/IP cho SQL Server

#### 1.2.1 Mở SQL Server Configuration Manager
- Start → tìm **SQL Server Configuration Manager**

#### 1.2.2 Enable TCP/IP
- SQL Server Network Configuration  
- Protocols for `MSSQLSERVER`  
- Chuột phải **TCP/IP → Enable**

#### 1.2.3 Cấu hình cổng 1433
- Chuột phải **TCP/IP → Properties**
- Tab **IP Addresses**
- Kéo xuống **IPAll**

Thiết lập:
```text
TCP Dynamic Ports: (để trống)
TCP Port: 1433
```
#### 1.2.4 Restart SQL Server
- SQL Server Services
- Chuột phải **SQL Server (MSSQLSERVER)** → Restart
---


## 2. Chạy Backend

```bash
cd backend
npm install
node app.js
```

Backend mặc định chạy tại:

```
http://localhost:1000
```

Test nhanh:

```
GET http://localhost:1000/api/health
```

---

## 3. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại:

```
http://localhost:5171
```

Frontend gọi API backend thông qua proxy hoặc URL trực tiếp.

---

## 4. Quy ước code

### Backend

* Mỗi bảng CSDL tương ứng 1 route
* API tuân theo RESTful
* Truy vấn SQL viết rõ ràng, dễ đọc

### Frontend

* Sử dụng React Function Component
* Một màn hình chính = 1 file JSX
* Không xử lý logic database ở frontend

---

## 5. Quy trình đóng góp

1. Fork repository
2. Tạo branch mới

   ```bash
   git checkout -b feature/ten-chuc-nang
   ```
1. Commit rõ ràng
4. Tạo Pull Request

---

## 6. Lưu ý quan trọng

* Không thay đổi schema database khi chưa thống nhất
* Không hard-code mật khẩu
* Giữ đúng ràng buộc toàn vẹn dữ liệu

---

**Môn học:** Hệ Quản Trị Cơ Sở Dữ Liệu
