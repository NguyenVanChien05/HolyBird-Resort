import { useEffect, useState } from "react";
import {
  getRooms,
  updateRoomStatus,
  updateRoomPrice
} from "../api/room.api";
import { getRole } from "../utils/auth";
import "../styles/room.css";

export default function Rooms() {
  const role = getRole();
  const isAdmin = role === "Admin";
  const isStaff = role === "Staff";

  const [rooms, setRooms] = useState([]);
  const [floor, setFloor] = useState("all");
  const [rank, setRank] = useState("all");
  const [type, setType] = useState("all");

  const [priceForm, setPriceForm] = useState({
    RankID: "",
    TypeID: "",
    Price: ""
  });

  const loadRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Không lấy được danh sách phòng");
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const floors = [...new Set(rooms.map(r => r.FloorNumber))];
  const ranks = Array.from(new Map(rooms.map(r => [r.RankID, { id: r.RankID, name: r.RankName }])).values());
  const types = Array.from(new Map(rooms.map(r => [r.TypeID, { id: r.TypeID, name: r.TypeName }])).values());

  const filteredRooms = rooms.filter(r =>
    (floor === "all" || r.FloorNumber === Number(floor)) &&
    (rank === "all" || r.RankID === Number(rank)) &&
    (type === "all" || r.TypeID === Number(type))
  );

  const updateStatus = async (roomId, status) => {
    await updateRoomStatus(roomId, status);
    loadRooms();
  };

  const submitPrice = async () => {
    if (!priceForm.RankID || !priceForm.TypeID || !priceForm.Price) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    await updateRoomPrice({
      RankID: Number(priceForm.RankID),
      TypeID: Number(priceForm.TypeID),
      Price: Number(priceForm.Price)
    });

    setPriceForm({ RankID: "", TypeID: "", Price: "" });
    loadRooms();
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
                <td>{index + 1}</td>  {/* STT = index + 1 */}
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
                    r.StatusPhysic
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
