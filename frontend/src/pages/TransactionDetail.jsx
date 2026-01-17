import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTransactionDetail,
  checkInDetail,
  checkOutDetail,
  deleteBookingDetail,
} from "../api/transaction.api";
import { addCompensation, getCompensations } from "../api/transaction.api";

import "../styles/transactionDetail.css";
import { getUser, getRole } from "../utils/auth";

export default function TransactionDetail() {
  const { transactionID } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState([]);
  const [keyCards, setKeyCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRole = getRole();

  const [showCompensationForm, setShowCompensationForm] = useState(false);
  const [compAmount, setCompAmount] = useState("");
  const [compReason, setCompReason] = useState("");
  const user = getUser();

  const [compensations, setCompensations] = useState([]);

  const [compLoading, setCompLoading] = useState(false);
  const [compLogs, setCompLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Lấy details và KeyCards từ transaction
        const res = await getTransactionDetail(transactionID);
        // Details
        const detailsArray = Array.isArray(res.data.details)
          ? res.data.details
          : [];
        setDetails(detailsArray);

        // KeyCards từ transaction
        const transactionKeyCards = Array.isArray(res.data.keyCards)
          ? res.data.keyCards
          : [];
        setKeyCards(transactionKeyCards);

        const compRes = await getCompensations(transactionID);
        setCompensations(Array.isArray(compRes.data) ? compRes.data : []);

        setError(null);
      } catch (err) {
        console.error("Error fetching transaction detail:", err);
        setError(
          err.response?.data?.message || err.message || "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [transactionID]);

  // ======== HANDLERS =========

  const handleCheckIn = async (detailID) => {
    console.log("👉 handleCheckIn START");
    console.log("DetailID:", detailID);
    console.log("TransactionID:", transactionID);

    try {
      console.log("📤 Sending check-in request...");
      const res = await checkInDetail(detailID);

      console.log("✅ Check-in response:", res.data);

      alert("Check-in successful!");

      console.log("🔄 Reload transaction details...");
      const detailsRes = await getTransactionDetail(transactionID);

      console.log("📥 New transaction details:", detailsRes.data.details);
      setDetails(detailsRes.data.details);

      // Merge KeyCards mới
      if (res.data?.keyCards?.length > 0) {
        console.log("💳 New key cards:", res.data.keyCards);

        setKeyCards((prev) => {
          console.log("🧾 Previous key cards:", prev);

          const newCards = res.data.keyCards;
          const merged = [
            ...prev.filter(
              (kc) => !newCards.find((nc) => nc.CardID === kc.CardID)
            ),
            ...newCards,
          ];

          console.log("🧾 Merged key cards:", merged);
          return merged;
        });
      } else {
        console.log("ℹ️ No key cards returned from check-in");
      }
    } catch (err) {
      console.error("❌ Check-in failed:", err);
      alert(err.response?.data?.message || err.message);
    } finally {
      console.log("👉 handleCheckIn END");
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
        setKeyCards((prev) =>
          prev.map((kc) => {
            const updated = res.data.keyCards.find(
              (u) => u.CardID === kc.CardID
            );
            return updated ? { ...kc, ...updated } : kc;
          })
        );
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
      setDetails((prev) => prev.filter((d) => d.DetailID !== detailID));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const addCompLog = (msg) => {
    setCompLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), msg },
    ]);
  };

  const handleAddCompensation = async (e) => {
    e.preventDefault();

    setCompLoading(true);
    setCompLogs([]);
    addCompLog("T2 START: Nhân viên thêm bồi thường");

    try {
      // giả lập thao tác chậm của người dùng (để dễ demo)
      await new Promise((r) => setTimeout(r, 1500));
      addCompLog("T2 ACTION: Gửi request");

      await addCompensation(transactionID, {
        amount: Number(compAmount),
        reason: compReason,
        createdBy: user.createdBy,
      });

      addCompLog("T2 COMMIT: Thêm bồi thường thành công");

      setCompAmount("");
      setCompReason("");

      const compRes = await getCompensations(transactionID);
      setCompensations(compRes.data);
    } catch (err) {
      addCompLog("T2 ERROR");
      alert(err.response?.data?.message || err.message);
    } finally {
      setCompLoading(false);
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
                        <button
                          className="checkin-btn"
                          onClick={() => handleCheckIn(d.DetailID)}
                        >
                          Check In
                        </button>
                      )}
                      {userRole === "Staff" && status === "CheckedIn" && (
                        <button
                          className="checkout-btn"
                          onClick={() => handleCheckOut(d.DetailID)}
                        >
                          Check Out
                        </button>
                      )}
                      {userRole === "Guest" && status === "Booked" && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(d.DetailID)}
                        >
                          Delete
                        </button>
                      )}
                      {status === "CheckedOut" && (
                        <span className="status-label status-checkedout">
                          Checked Out
                        </span>
                      )}
                      {userRole === "Guest" && status === "CheckedIn" && (
                        <span className="status-label status-checkedin">
                          Checked In
                        </span>
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
                const detail =
                  details.find((d) => d.DetailID === kc.DetailID) || {};
                return (
                  <tr key={kc.CardID}>
                    <td>{i + 1}</td>
                    <td>{kc.CardID}</td>
                    <td>{detail.FullName ?? "-"}</td>
                    <td>{detail.CMND ?? "-"}</td>
                    <td>{detail.RoomID ?? "-"}</td>
                    <td>{kc.CardCode}</td>
                    <td>{kc.Status}</td>
                    <td>
                      {kc.IssueDate
                        ? new Date(kc.IssueDate).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2>Compensations</h2>

          {compensations.length === 0 ? (
            <p>No compensations found</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>Created By</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {compensations.map((c, i) => (
                    <tr key={c.CompensationID}>
                      <td>{i + 1}</td>
                      <td>{c.Reason ?? "-"}</td>
                      <td>{c.Compensation_Amount?.toLocaleString() ?? 0}</td>
                      <td>{c.CreatedByName ?? "-"}</td>
                      <td>{new Date(c.CreatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="transaction-buttons">
        <button
          className="add-detail-btn"
          onClick={() =>
            navigate(`/transactions/${transactionID}/create-detail`)
          }
        >
          Add Booking Detail
        </button>
        <button
          className="add-detail-btn"
          onClick={() => navigate(`/transactions/${transactionID}/Guests`)}
        >
          Assign Guests
        </button>

        {userRole === "Staff" && (
          <button
            className="add-detail-btn"
            onClick={() => setShowCompensationForm((prev) => !prev)}
          >
            Add Compensation
          </button>
        )}
      </div>

      {userRole === "Staff" && showCompensationForm && (
        <div className="comp-overlay">
          <div className="comp-modal">
            <h3>➕ Add Compensation (T2)</h3>

            <form onSubmit={handleAddCompensation}>
              <label>Amount</label>
              <input
                type="number"
                value={compAmount}
                onChange={(e) => setCompAmount(e.target.value)}
                required
              />

              <label>Reason</label>
              <textarea
                value={compReason}
                onChange={(e) => setCompReason(e.target.value)}
              />

              <div className="comp-actions">
                <button type="submit" disabled={compLoading}>
                  {compLoading ? "Processing..." : "Submit"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCompensationForm(false)}
                  disabled={compLoading}
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Loading */}
            {compLoading && (
              <div className="comp-loading">
                ⏳ Processing… (T1 may still be running)
                <div className="spinner" />
              </div>
            )}

            {/* Timeline */}
            {compLogs.length > 0 && (
              <>
                <h4>Timeline (T2)</h4>
                <ul className="comp-log">
                  {compLogs.map((l, i) => (
                    <li key={i}>
                      [{l.time}] {l.msg}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

<style>
  {`
.spinner {
  width: 20px;
  height: 20px;
  border: 4px solid #ddd;
  border-top: 4px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-top: 6px;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`}
</style>;
