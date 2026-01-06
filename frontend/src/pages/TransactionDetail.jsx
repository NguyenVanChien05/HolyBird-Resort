import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getTransactionDetail, 
  checkInDetail, 
  checkOutDetail, 
  deleteBookingDetail 
} from "../api/transaction.api";
import "../styles/transactionDetail.css";
import { getRole } from "../utils/auth";

export default function TransactionDetail() {
  const { transactionID } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState([]);
  const [keyCards, setKeyCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRole = getRole();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Lấy details và KeyCards từ transaction
        const res = await getTransactionDetail(transactionID);
        // Details
        const detailsArray = Array.isArray(res.data.details) ? res.data.details : [];
        setDetails(detailsArray);

        // KeyCards từ transaction
        const transactionKeyCards = Array.isArray(res.data.keyCards) ? res.data.keyCards : [];
        setKeyCards(transactionKeyCards);

        setError(null);
      } catch (err) {
        console.error("Error fetching transaction detail:", err);
        setError(err.response?.data?.message || err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [transactionID]);

  // ======== HANDLERS =========
  const handleCheckIn = async (detailID) => {
    try {
      const res = await checkInDetail(detailID); // trả về KeyCard mới
      alert("Check-in successful!");

      // Cập nhật details
      const detailsRes = await getTransactionDetail(transactionID);
      setDetails(detailsRes.data.details);

      // Merge KeyCards mới
      if (res.data.keyCards?.length > 0) {
        setKeyCards(prev => {
          const newCards = res.data.keyCards;
          return [
            ...prev.filter(kc => !newCards.find(nc => nc.CardID === kc.CardID)),
            ...newCards
          ];
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCheckOut = async (detailID) => {
    try {
      const res = await checkOutDetail(detailID);
      alert("Check-out successful!");

      // Cập nhật details
      const detailsRes = await getTransactionDetail(transactionID);
      setDetails(detailsRes.data.details);

      // Merge KeyCard đã cập nhật (ExpireDate)
      if (res.data.keyCards?.length) {
        setKeyCards(prev => prev.map(kc => {
          const updated = res.data.keyCards.find(u => u.CardID === kc.CardID);
          return updated ? { ...kc, ...updated } : kc;
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (detailID) => {
    if (!window.confirm("Are you sure to delete this booking detail?")) return;
    try {
      await deleteBookingDetail(detailID);
      alert("Booking detail deleted!");
      setDetails(prev => prev.filter(d => d.DetailID !== detailID));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) return <p className="loading-text">Loading...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  return (
    <div className="transaction-detail-page">
      <h1>Transaction #{transactionID}</h1>

      <h2>Booking Details</h2>
      {details.length === 0 ? (
        <p>No booking details found</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>GroupID</th>
                <th>Full Name</th>
                <th>CMND</th>
                <th>RoomID</th>
                <th>Floor</th>
                <th>CheckIn</th>
                <th>CheckOut</th>
                <th>CurrentPrice</th>
                <th>LineTotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d, i) => {
                const status = d.Status || d.BookingStatus || "Booked";
                return (
                  <tr key={d.DetailID}>
                    <td>{i + 1}</td>
                    <td>{d.GroupID ?? "-"}</td>
                    <td>{d.FullName ?? "-"}</td>
                    <td>{d.CMND ?? "-"}</td>
                    <td>{d.RoomID ?? "-"}</td>
                    <td>{d.FloorNumber ?? "-"}</td>
                    <td>{new Date(d.CheckInDate).toLocaleDateString()}</td>
                    <td>{new Date(d.CheckOutDate).toLocaleDateString()}</td>
                    <td>{d.CurrentPrice?.toLocaleString() ?? "-"}</td>
                    <td>{d.LineTotal?.toLocaleString() ?? "-"}</td>
                    <td>
                      {userRole === "Staff" && status === "Booked" && (
                        <button className="checkin-btn" onClick={() => handleCheckIn(d.DetailID)}>Check In</button>
                      )}
                      {userRole === "Staff" && status === "CheckedIn" && (
                        <button className="checkout-btn" onClick={() => handleCheckOut(d.DetailID)}>Check Out</button>
                      )}
                      {userRole === "Guest" && status === "Booked" && (
                        <button className="delete-btn" onClick={() => handleDelete(d.DetailID)}>Delete</button>
                      )}
                      {status === "CheckedOut" && (
                        <span className="status-label status-checkedout">Checked Out</span>
                      )}
                      {userRole === "Guest" && status === "CheckedIn" && (
                        <span className="status-label status-checkedin">Checked In</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2>Key Cards</h2>
      {keyCards.length === 0 ? (
        <p>No key cards found</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>CardID</th>
                <th>Full Name</th>
                <th>CMND</th>
                <th>RoomID</th>
                <th>CardCode</th>
                <th>Status</th>
                <th>IssueDate</th>
              </tr>
            </thead>
            <tbody>
              {keyCards.map((kc, i) => {
                const detail = details.find(d => d.DetailID === kc.DetailID) || {};
                return (
                  <tr key={kc.CardID}>
                    <td>{i + 1}</td>
                    <td>{kc.CardID}</td>
                    <td>{detail.FullName ?? "-"}</td>
                    <td>{detail.CMND ?? "-"}</td>
                    <td>{detail.RoomID ?? "-"}</td>
                    <td>{kc.CardCode}</td>
                    <td>{kc.Status}</td>
                    <td>{kc.IssueDate ? new Date(kc.IssueDate).toLocaleDateString() : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="transaction-buttons">
        <button className="add-detail-btn" onClick={() => navigate(`/transactions/${transactionID}/create-detail`)}>
          Add Booking Detail
        </button>
        <button className="assign-Guests-btn" onClick={() => navigate(`/transactions/${transactionID}/Guests`)}>
          Assign Guests
        </button>
      </div>
    </div>
  );
}
