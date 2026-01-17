import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import { getRole } from "../utils/auth";
import "../styles/room.css";

export default function Rooms() {
  const role = getRole();
  const isAdmin = role === "Admin";
  const isStaff = role === "Staff";
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:3000/api";

  const [rooms, setRooms] = useState([]);
  const [floor, setFloor] = useState("all");
  const [rank, setRank] = useState("all");
  const [type, setType] = useState("all");

  const [priceForm, setPriceForm] = useState({
    RankID: "",
    TypeID: "",
    Price: ""
  });

  // Hàm load phòng dùng chung
  const loadRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      // Gọi API kèm Token
      const res = await axios.get(`${BASE_URL}/room`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        navigate("/login");
      } else {
        alert("Không lấy được danh sách phòng");
      }
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const floors = [...new Set(rooms.map(r => r.FloorNumber))];
  // Dùng Map để lọc unique Rank/Type cho dropdown
  const ranks = Array.from(new Map(rooms.map(r => [r.RankID, { id: r.RankID, name: r.RankName }])).values());
  const types = Array.from(new Map(rooms.map(r => [r.TypeID, { id: r.TypeID, name: r.TypeName }])).values());

  const filteredRooms = rooms.filter(r =>
    (floor === "all" || r.FloorNumber === Number(floor)) &&
    (rank === "all" || r.RankID === Number(rank)) &&
    (type === "all" || r.TypeID === Number(type))
  );

  const updateStatus = async (roomId, status) => {
    try {
        const token = localStorage.getItem("token");
        // Gọi API update status
        await axios.patch(`${BASE_URL}/room/${roomId}/status`, 
            { status }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        loadRooms(); // Load lại sau khi update
    } catch (err) {
        alert("Lỗi cập nhật trạng thái: " + err.message);
    }
  };

  const submitPrice = async () => {
    if (!priceForm.RankID || !priceForm.TypeID || !priceForm.Price) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
        const token = localStorage.getItem("token");
        // Gọi API update giá
        await axios.post(`${BASE_URL}/room/update-price`, {
            RankID: Number(priceForm.RankID),
            TypeID: Number(priceForm.TypeID),
            Price: Number(priceForm.Price)
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("Cập nhật giá thành công!");
        setPriceForm({ RankID: "", TypeID: "", Price: "" });
        loadRooms();
    } catch (err) {
        alert("Lỗi cập nhật giá: " + err.message);
    }
  };

  return (
    <div className="rooms-page">
      <h2>Quản lý phòng</h2>

      <div className="rooms-filters">
        <select value={floor} onChange={e => setFloor(e.target.value)}>
          <option value="all">Tất cả tầng</option>
          {floors.map(f => <option key={f} value={f}>Tầng {f}</option>)}
        </select>

        <select value={rank} onChange={e => setRank(e.target.value)}>
          <option value="all">Tất cả hạng</option>
          {ranks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="all">Tất cả loại</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {isAdmin && (
        <div className="rooms-price-form">
          <strong>Cập nhật giá theo hạng + loại</strong>

          <select
            value={priceForm.RankID}
            onChange={e => setPriceForm({ ...priceForm, RankID: e.target.value })}
          >
            <option value="">Chọn hạng</option>
            {ranks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <select
            value={priceForm.TypeID}
            onChange={e => setPriceForm({ ...priceForm, TypeID: e.target.value })}
          >
            <option value="">Chọn loại</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <input
            type="number"
            placeholder="Giá mới"
            value={priceForm.Price}
            onChange={e => setPriceForm({ ...priceForm, Price: e.target.value })}
          />

          <button onClick={submitPrice}>Cập nhật giá</button>
        </div>
      )}

      <div className="rooms-table-container">
        <table className="rooms-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tầng</th>
              <th>Phòng</th>
              <th>Hạng</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Giá</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((r, index) => (
              <tr key={r.RoomID}>
                <td>{index + 1}</td>
                <td>{r.FloorNumber}</td>
                <td>{r.RoomNumber}</td>
                <td>{r.RankName}</td>
                <td>{r.TypeName}</td>
                <td>
                  {(isAdmin || isStaff) ? (
                    <select
                      value={r.StatusPhysic}
                      onChange={e => updateStatus(r.RoomID, e.target.value)}
                    >
                      <option value="Free">Free</option>
                      <option value="Busy">Busy</option>
                    </select>
                  ) : (
                    <span className={`status-badge ${r.StatusPhysic.toLowerCase()}`}>
                        {r.StatusPhysic}
                    </span>
                  )}
                </td>
                <td>{r.Price ? `${Number(r.Price).toLocaleString()} VND` : "Chưa có"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}