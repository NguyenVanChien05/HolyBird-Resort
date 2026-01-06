import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTransactionDetail, assignGuestsToRoom } from "../api/transaction.api";
import "../styles/assignGuest.css";

export default function AssignGuests() {
  const { transactionID } = useParams();
  const navigate = useNavigate();

  const [bookingDetails, setBookingDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getTransactionDetail(transactionID);
      console.log("API response for transaction details:", res.data);
        const detailsArray = Array.isArray(res.data.details)
          ? res.data.details
          : Array.isArray(res.data)
          ? res.data
          : [];
        console.log("Fetched details for assigning guests:", detailsArray);
        // Chỉ giữ những detail chưa assign guest
        const unassignedDetails = detailsArray.filter(
          d => d.FullName == null || d.FullName === undefined
        );

        if (unassignedDetails.length === 0) {
          setBookingDetails([]); // xoá state cũ
          setMessage("Tất cả phòng đã được assign guest.");
          return;
        }

        // Reset state hoàn toàn trước khi set lại
        setBookingDetails([]);

        // Gán lại state với key mới để React remount component input
        setBookingDetails(
          unassignedDetails.map((d, idx) => ({
            ...d,
            fullName: "",
            cmnd: "",
            tempKey: `${d.DetailID}-${Date.now()}-${idx}` // key mới mỗi lần fetch
          }))
        );

        setMessage(""); // clear message nếu có
      } catch (err) {
        console.error(err);
        setMessage(
          err.response?.data?.message || err.message || "Không thể load danh sách phòng"
        );
      }
    };

    fetchDetails();
  }, [transactionID]);

  const handleChange = (index, field, value) => {
    setBookingDetails(prev =>
      prev.map((d, i) => i === index ? { ...d, [field]: value } : d)
    );
  };

  const handleSubmit = async () => {
    if (bookingDetails.length === 0) return;

    setLoading(true);
    setMessage("");

    // Kiểm tra đầy đủ tên khách
    for (const d of bookingDetails) {
      if (!d.fullName) {
        setMessage("Vui lòng nhập tên khách cho tất cả phòng");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = bookingDetails.map(d => ({
        DetailID: d.DetailID,
        fullName: d.fullName,
        cmnd: d.cmnd || null
      }));

      await assignGuestsToRoom(transactionID, payload);

      // Sau khi assign xong, xoá state để không hiện form nữa
      setBookingDetails([]);
      setMessage("Đã assign thành công!");
      navigate(`/transactions/${transactionID}`);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || err.message || "Lỗi khi assign guest"
      );
    } finally {
      setLoading(false);
    }
  };

  if (bookingDetails.length === 0 && !message) return <p>Loading...</p>;

  return (
    <div className="assign-guests-page">
      <h2>Assign Guests for Transaction #{transactionID}</h2>
      {message && <p className="error">{message}</p>}

      {bookingDetails.map((d, idx) => (
        <div className="guest-card" key={d.tempKey}>
          <div className="guest-card-header">
            Room: {d.RoomID}, Status: {d.Status || "Unknown"}
          </div>

          <div className="form-row multi">
            <div>
              <label>Full Name</label>
              <input
                type="text"
                value={d.fullName}
                onChange={e => handleChange(idx, "fullName", e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label>CMND</label>
              <input
                type="text"
                value={d.cmnd}
                onChange={e => handleChange(idx, "cmnd", e.target.value)}
                placeholder="Enter CMND"
              />
            </div>
          </div>
        </div>
      ))}

      {bookingDetails.length > 0 && (
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Assigning..." : "Assign Guests"}
          </button>
        </div>
      )}
    </div>
  );
}
