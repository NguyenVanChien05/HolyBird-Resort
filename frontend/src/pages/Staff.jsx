import { useEffect, useState } from "react";
import { getStaffs } from "../api/staff.api";
import "../styles/staff.css";

export default function Staff() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const loadStaffs = async () => {
      try {
        const data = await getStaffs();
        setStaffs(data);
      } catch (err) {
        console.error(err);
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStaffs();
  }, []);

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
      </div>

      {/* ===== Table ===== */}
      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>STT</th>  {/* Cột số thứ tự */}
              <th>ID</th>
              <th>Tên nhân viên</th>
              <th>Username</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaffs.map((s, index) => (
              <tr key={s.StaffID}>
                <td>{index + 1}</td>  {/* STT = index + 1 */}
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
