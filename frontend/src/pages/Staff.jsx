import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Thêm để chuyển trang nếu lỗi
import axios from "axios"; // Dùng axios trực tiếp
import "../styles/staff.css";

export default function Staff() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:3000/api"; // URL Backend

  useEffect(() => {
    const loadStaffs = async () => {
      try {
        const token = localStorage.getItem("token");
        // Gọi API trực tiếp kèm Token
        const res = await axios.get(`${BASE_URL}/staff`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStaffs(res.data);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
            alert("Phiên đăng nhập hết hạn.");
            navigate("/login");
        } else {
            // alert(err.message); // Có thể tắt alert nếu ko cần thiết
        }
      } finally {
        setLoading(false);
      }
    };
    loadStaffs();
  }, [navigate]);

  const roles = ["all", "Admin", "Staff", "Guest"];

  const filteredStaffs = staffs.filter((s) => {
    const matchesRole = roleFilter === "all" || s.Role === roleFilter;
    const matchesSearch =
      s.StaffName.toLowerCase().includes(search.toLowerCase()) ||
      s.Username.toLowerCase().includes(search.toLowerCase()) ||
      s.StaffID.toString().includes(search);
    return matchesRole && matchesSearch;
  });

  if (loading) return <p className="loading-text">Đang tải danh sách nhân viên...</p>;

  return (
    <div className="staff-page">
      <h2>Danh sách nhân viên</h2>

      {/* ===== Search & Filter ===== */}
      <div className="staff-controls">
        <input
          type="text"
          placeholder="Tìm theo tên, username, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        {/* Thêm bộ lọc Role nếu cần */}
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{marginLeft: "10px", padding: "8px"}}>
            {roles.map(r => <option key={r} value={r}>{r === 'all' ? 'Tất cả vai trò' : r}</option>)}
        </select>
      </div>

      {/* ===== Table ===== */}
      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>ID</th>
              <th>Tên nhân viên</th>
              <th>Username</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaffs.map((s, index) => (
              <tr key={s.StaffID}>
                <td>{index + 1}</td>
                <td>{s.StaffID}</td>
                <td>{s.StaffName}</td>
                <td>{s.Username}</td>
                <td>{s.Role}</td>
              </tr>
            ))}
            {filteredStaffs.length === 0 && (
              <tr>
                <td colSpan="5" className="no-data">
                  Không tìm thấy nhân viên
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}