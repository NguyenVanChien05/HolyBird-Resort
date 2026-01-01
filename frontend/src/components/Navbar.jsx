import { NavLink, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { getUser } from "../utils/auth";

export default function Navbar() {
  const user = getUser();
  const nav = useNavigate();

  const logout = () => {
    localStorage.clear();
    nav("/login");
  };

  const linkClass = ({ isActive }) => isActive ? "active" : "";

  return (
    <nav className="navbar">
      <div className="logo">Holybird Resort</div>

      <ul className="nav-links">
        <li><NavLink to="/" end className={linkClass}>Trang chủ</NavLink></li>

        {user?.role === "Guest" && <>
          <li><NavLink to="/rooms" className={linkClass}>Danh sách phòng</NavLink></li>
          <li><NavLink to="/booking" className={linkClass}>Đặt phòng</NavLink></li>
          <li><NavLink to="/group" className={linkClass}>Đoàn của tôi</NavLink></li>
        </>}

        {user?.role === "Staff" && <>
          <li><NavLink to="/rooms" className={linkClass}>Quản lý phòng</NavLink></li>
          <li><NavLink to="/group" className={linkClass}>Danh sách đoàn</NavLink></li>
          <li><NavLink to="/booking" className={linkClass}>Quản lý đặt phòng</NavLink></li>
        </>}

        {user?.role === "Admin" && <>
          <li><NavLink to="/rooms" className={linkClass}>Quản lý phòng</NavLink></li>
          <li><NavLink to="/staff" className={linkClass}>Quản lý nhân viên</NavLink></li>
          <li><NavLink to="/group" className={linkClass}>Danh sách đoàn</NavLink></li>
          <li><NavLink to="/booking" className={linkClass}>Danh sách đặt phòng</NavLink></li>
        </>}

        <li><button onClick={logout} className="logout-btn">Đăng xuất</button></li>
        <span className="role">{user?.role}</span>
      </ul>
    </nav>
  );
}
