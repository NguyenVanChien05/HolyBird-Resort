import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRooms } from "../api/room.api";
import { createTransDetail } from "../api/transaction.api";
import "../styles/createTransDetail.css";

export default function CreateTransDetail() {
  const { transactionID } = useParams();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([
    {
      rankID: "",
      typeID: "",
      floor: "",
      roomCount: 1,
      peopleCount: 1,
      fromDate: "",
      toDate: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load all rooms once
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getRooms();
        setRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setMessage("Không thể load dữ liệu phòng từ server");
      }
    };
    fetchRooms();
  }, []);

  // Extract floors, ranks, types, capacity map
  const floors = [...new Set(rooms.map((r) => r.FloorNumber))];
  const roomRanks = Array.from(
    new Map(
      rooms.map((r) => [r.RankID, { id: r.RankID, name: r.RankName }])
    ).values()
  );
  const roomTypes = Array.from(
    new Map(
      rooms.map((r) => [r.TypeID, { id: r.TypeID, name: r.TypeName }])
    ).values()
  );
  const capacityMap = new Map(rooms.map((r) => [r.TypeID, r.Capacity]));

  const addRequest = () =>
    setBookingRequests([
      ...bookingRequests,
      {
        rankID: "",
        typeID: "",
        floor: "",
        roomCount: 1,
        peopleCount: 1,
        fromDate: "",
        toDate: "",
      },
    ]);

  const removeRequest = (index) =>
    setBookingRequests(bookingRequests.filter((_, i) => i !== index));

  const handleChange = (index, field, value) => {
    const updated = [...bookingRequests];
    updated[index][field] = value;
    setBookingRequests(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!transactionID) {
      setMessage("TransactionID is missing!");
      setLoading(false);
      return;
    }

    for (const r of bookingRequests) {
      if (!r.rankID || !r.typeID || !r.fromDate || !r.toDate) {
        setMessage("Vui lòng nhập đầy đủ thông tin yêu cầu phòng.");
        setLoading(false);
        return;
      }
      if (r.fromDate >= r.toDate) {
        setMessage("Ngày check-out phải sau check-in.");
        setLoading(false);
        return;
      }
      if (r.peopleCount <= 0) {
        setMessage("Số người phải lớn hơn 0.");
        setLoading(false);
        return;
      }

      // Lấy capacity đúng
      const typeIDNum = parseInt(r.typeID);
      const roomCountNum = parseInt(r.roomCount);
      const peopleCountNum = parseInt(r.peopleCount);

      const capacityPerRoom = capacityMap.get(typeIDNum);

      const maxCapacity = roomCountNum * capacityPerRoom;

      if (peopleCountNum > maxCapacity) {
        const typeName =
          roomTypes.find((t) => t.id === typeIDNum)?.name || "unknown";
        setMessage(
          `Số người tối đa cho ${roomCountNum} phòng "${typeName}" là ${maxCapacity}. Vui lòng nhập lại.`
        );
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true); // Đảm bảo bật loading để tránh double-click

      const payload = bookingRequests.map((r) => ({
        rankID: parseInt(r.rankID),
        typeID: parseInt(r.typeID),
        floor: r.floor ? parseInt(r.floor) : null,
        roomCount: parseInt(r.roomCount),
        peopleCount: parseInt(r.peopleCount),
        fromDate: r.fromDate,
        toDate: r.toDate,
      }));

      await createTransDetail(transactionID, payload);

      // Nếu thành công
      navigate(`/transactions/${transactionID}/guests`);
    } catch (err) {
      console.error("Lỗi khi gán phòng:", err);

      // 1. Kiểm tra nếu backend trả về object lỗi có chứa message nghiệp vụ
      // Thông thường mssql/tedious trả về lỗi qua response.data hoặc trực tiếp trong err.message
      const serverErrorMessage = err.response?.data?.message || err.message;

      if (serverErrorMessage.includes("Không đủ phòng trống")) {
        setMessage(
          "⚠️ Xin lỗi: Số lượng phòng trống vừa thay đổi (có thể đã bị đặt bởi người khác). Vui lòng chọn tầng hoặc loại phòng khác."
        );

      } else if (serverErrorMessage.includes("Deadlock")) {
        setMessage(
          "🔄 Hệ thống đang xử lý nhiều yêu cầu cùng lúc. Vui lòng thử lại sau giây lát."
        );
      } else {
        setMessage(
          serverErrorMessage || "Đã có lỗi xảy ra khi tạo chi tiết đặt phòng."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-trans-page">
      <h2>Create Booking Detail for Transaction #{transactionID}</h2>
      {message && <p className="error">{message}</p>}

      <form onSubmit={handleSubmit}>
        {bookingRequests.map((req, idx) => (
          <div className="request-card" key={idx}>
            <div className="request-header">
              <h4>Request #{idx + 1}</h4>
              <button
                type="button"
                className="btn-remove"
                disabled={bookingRequests.length === 1}
                onClick={() => removeRequest(idx)}
              >
                Remove
              </button>
            </div>

            <div className="form-row multi">
              <div>
                <label>Hạng phòng:</label>
                <select
                  value={req.rankID}
                  onChange={(e) => handleChange(idx, "rankID", e.target.value)}
                >
                  <option value="">-- Chọn hạng phòng --</option>
                  {roomRanks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Loại phòng:</label>
                <select
                  value={req.typeID}
                  onChange={(e) => handleChange(idx, "typeID", e.target.value)}
                >
                  <option value="">-- Chọn loại phòng --</option>
                  {roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Tầng</label>
                <select
                  value={req.floor}
                  onChange={(e) => handleChange(idx, "floor", e.target.value)}
                >
                  <option value="">-- Bất kỳ --</option>
                  {floors.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row multi">
              <div>
                <label>Số lượng phòng:</label>
                <input
                  type="number"
                  min={1}
                  value={req.roomCount}
                  onChange={(e) =>
                    handleChange(idx, "roomCount", e.target.value)
                  }
                />
              </div>
              <div>
                <label>Số lượng thành viên:</label>
                <input
                  type="number"
                  min={1}
                  value={req.peopleCount}
                  onChange={(e) =>
                    handleChange(idx, "peopleCount", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="form-row multi">
              <div>
                <label>From:</label>
                <input
                  type="date"
                  value={req.fromDate}
                  onChange={(e) =>
                    handleChange(idx, "fromDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label>To:</label>
                <input
                  type="date"
                  value={req.toDate}
                  onChange={(e) => handleChange(idx, "toDate", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={addRequest}>
            + Add Request
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Processing..." : "Confirm & Assign Rooms"}
          </button>
        </div>
      </form>
    </div>
  );
}
