import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTransaction } from "../api/transaction.api";
import "../styles/transactionList.css";

export default function MyTransaction() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyTransaction()
      .then(res => setTransactions(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="transaction-list-page">
      <h2>My Transactions</h2>

      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>ID</th>
              <th>Start</th>
              <th>End</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t, index) => (
              <tr
                key={t.TransactionID}
                className="clickable"
                onClick={() => navigate(`/transactions/${t.TransactionID}`)}
              >
                <td>{index + 1}</td>
                <td>{t.TransactionID}</td>
                <td>{new Date(t.StartDate).toLocaleDateString()}</td>
                <td>{new Date(t.EndDate).toLocaleDateString()}</td>
                <td>${t.TotalPrice}</td>
                <td>
                  <span className={`badge ${t.Status.toLowerCase()}`}>
                    {t.Status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
