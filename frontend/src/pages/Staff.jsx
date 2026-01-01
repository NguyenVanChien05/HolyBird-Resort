import { useEffect, useState } from "react";
import { getStaffs } from "../api/staff.api";

export default function Staff() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaffs = async () => {
      try {
        const data = await getStaffs();
        console.log("Danh sách nhân viên:", data);
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

  if (loading) return <p>Đang tải danh sách nhân viên...</p>;

  return (
    <div>
      <h2>Danh sách nhân viên</h2>
      <table border="1" cellPadding="5" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên nhân viên</th>
            <th>Username</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {staffs.map(s => (
            <tr key={s.StaffID}>
              <td>{s.StaffID}</td>
              <td>{s.StaffName}</td>
              <td>{s.Username}</td>
              <td>{s.Role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
