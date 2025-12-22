import { NavLink } from "react-router-dom";
import "./Navbar.css";

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
          <NavLink to="/services" className={({ isActive }) => isActive ? "active" : ""}>
            Dịch vụ
          </NavLink>
        </li>
        <li>
          <NavLink to="/group" className={({ isActive }) => isActive ? "active" : ""}>
            Đoàn
          </NavLink>
        </li>
        <li>
          <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""}>
            Đăng nhập
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