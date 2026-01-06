import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTransactions } from "../api/transaction.api";
import "../styles/transactionList.css";

export default function TransactionList() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllTransactions().then(res => setData(Array.isArray(res.data) ? res.data : []));
  }, []);

  return (
    <div className="transaction-list-page">
      <h2>Transaction List</h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>ID</th>
              <th>Group</th>
              <th>Staff</th>
              <th>Start</th>
              <th>End</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((t, index) => (
              <tr
                key={t.TransactionID}
                className="clickable"
                onClick={() => navigate(`/transactions/${t.TransactionID}`)}
              >
                <td>{index + 1}</td>
                <td>{t.TransactionID}</td>
                <td>{t.GroupID ?? "-"}</td>
                <td>{t.StaffName ?? "-"}</td>
                <td>{new Date(t.StartDate).toLocaleDateString()}</td>
                <td>{new Date(t.EndDate).toLocaleDateString()}</td>
                <td>{t.TotalPrice ? `${t.TotalPrice.toLocaleString()} VND` : "-"}</td>
                <td>
                  <span className={`badge ${t.Status.toLowerCase()}`}>
                    {t.Status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
