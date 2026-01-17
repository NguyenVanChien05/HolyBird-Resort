import { NavLink, useNavigate, Link } from "react-router-dom"; // Import Link
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

  // Style cho nút Demo
  const demoButtonStyle = {
    backgroundColor: "#e76f51",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
    textDecoration: "none",
    border: "2px solid #f4a261",
    marginLeft: "10px"
  };

  return (
    <nav className="navbar">
      <div className="logo">Holybird Resort</div>

      <ul className="nav-links">
        <li><NavLink to="/" end className={linkClass}>Trang chủ</NavLink></li>

        {/* Guest Menu */}
        {user?.role === "Guest" && <>
          <li><NavLink to="/rooms" className={linkClass}>Danh sách phòng</NavLink></li>
          <li><NavLink to="/my-transactions" className={linkClass}>Giao dịch của tôi</NavLink></li>
          <li><NavLink to="/my-group" className={linkClass}>Đoàn của tôi</NavLink></li>
          
          {/* NÚT THANH TOÁN (DEMO LỖI) */}
          <li>
            <Link to="/booking" style={demoButtonStyle}>
              💳 Đặt Phòng & Thanh Toán
            </Link>
          </li>
        </>}

        {/* Staff Menu */}
        {user?.role === "Staff" && <>
          <li><NavLink to="/rooms" className={linkClass}>Quản lý phòng</NavLink></li>
          <li><NavLink to="/group" className={linkClass}>Danh sách đoàn</NavLink></li>
          <li><NavLink to="/accounts" className={linkClass}>Tài khoản</NavLink></li>
          <li><NavLink to="/transactions" className={linkClass}>Giao dịch</NavLink></li>
        </>}

        {/* Admin Menu */}
        {user?.role === "Admin" && <>
          <li><NavLink to="/rooms" className={linkClass}>Quản lý phòng</NavLink></li>
          <li><NavLink to="/staff" className={linkClass}>QL Nhân viên</NavLink></li>
          <li><NavLink to="/transactions" className={linkClass}>Giao dịch</NavLink></li>
          <li><NavLink to="/accounts" className={linkClass}>Tài khoản</NavLink></li>
          <li><NavLink to="/group" className={linkClass}>Đoàn khách</NavLink></li>
        </>}

        <li><button onClick={logout} className="logout-btn">Đăng xuất</button></li>
        
        {user && <span className="role">{user.role}</span>}
      </ul>
    </nav>
  );
}