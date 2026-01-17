# 🏨 RESORT MANAGEMENT SYSTEM

Hệ thống quản lý resort được xây dựng theo mô hình **Client – Server**, sử dụng **React (Frontend)**, **Node.js + Express (Backend)** và **SQL Server (Database)**.

---

## 1. Tổng quan

* Dự án phục vụ **môn Hệ Quản Trị Cơ Sở Dữ Liệu**
* Mục tiêu: học cách thiết kế CSDL, xây dựng API backend và frontend
* Không hướng tới môi trường production
---

## 2. Kiến trúc hệ thống

```
React Frontend
      │  (REST API / JSON)
      ▼
Node.js + Express Backend
      │  (SQL Query)
      ▼
SQL Server Database
```

---

## 3. Công nghệ sử dụng

### Frontend

* React 18
* Vite
* React Router DOM
* Fetch API
* CSS

### Backend

* Node.js
* Express
* MSSQL (`mssql`)
* CORS
* dotenv

### Database

* Microsoft SQL Server

---

## 4. Cấu trúc thư mục

```
Resort_test/
│   .gitignore
│   contributing.md
│   readme.md
│   
├───backend
│   │   .env
│   │   .env.example
│   │   .gitignore
│   │   app.js
│   │   package-lock.json
│   │   package.json
│   │   
│   ├───config
│   │       db.js
│   │       
│   ├───controllers
│   │       accountController.js
│   │       groupController.js
│   │       guestController.js
│   │       roomController.js
│   │       staffController.js
│   │       
│   ├───routes
│   │       account.js
│   │       group.js
│   │       guest.js
│   │       room.js
│   │       staff.js
│   │
│   ├───static
│   │   └───css
│   │           base.css
│   │
│   └───views
│           index.html
│
├───databases
│       db.sql
│       login.sql
│
└───frontend
    │   .gitignore
    │   eslint.config.js
    │   index.html
    │   package-lock.json
    │   package.json
    │   README.md
    │   vite.config.js
    │
    ├───public
    │       vite.svg
    │
    └───src
        │   App.css
        │   App.jsx
        │   index.css
        │   main.jsx
        │
        ├───api
        │       group.api.js
        │       room.api.js
        │
        ├───assets
        │       react.svg
        │
        ├───components
        │       Navbar.css
        │       Navbar.jsx
        │
        └───pages
                Contact.jsx
                Group.jsx
                Home.jsx
                Login.jsx
                Rooms.jsx
                Services.jsx
```
---

## 5 Kết nối database

* Sử dụng `ConnectionPool`
* Chia sẻ pool cho toàn bộ hệ thống

---

## 6. Kết nối Frontend – Backend

Frontend gọi API thông qua **Vite Proxy**:

---

## 7. Nguyên tắc thiết kế

* Frontend **không truy cập DB trực tiếp**
* Backend xử lý toàn bộ nghiệp vụ
* Database đảm bảo toàn vẹn dữ liệu
* Dễ mở rộng cho Booking / Payment

---