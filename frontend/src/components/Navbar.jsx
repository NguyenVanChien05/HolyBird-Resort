import { NavLink } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">Holybird Resort</div>

      <ul className="nav-links">
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            Trang chủ
          </NavLink>
        </li>
        <li>
          <NavLink to="/rooms" className={({ isActive }) => isActive ? "active" : ""}>
            Phòng
          </NavLink>
        </li>
        <li>
          <NavLink to="/booking" className={({ isActive }) => isActive ? "active" : ""}>
            Đặt phòng
          </NavLink>
        </li>
        <li>
          <NavLink to="/group" className={({ isActive }) => isActive ? "active" : ""}>
            Đoàn
          </NavLink>
        </li>
        <li>
          <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""}>
            Đăng xuất
          </NavLink>
        </li>
        <li>
          <NavLink to="/register" className={({ isActive }) => isActive ? "active" : ""}>
            Đăng ký
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}