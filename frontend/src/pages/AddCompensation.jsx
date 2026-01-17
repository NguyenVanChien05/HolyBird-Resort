import { useState } from "react";
import "../styles/CompensationForm.css";

export default function CompensationForm({ transactionId, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await onSubmit({
      transactionId,
      amount,
      reason,
    });

    setLoading(false);
    setAmount("");
    setReason("");
  };

  return (
    <div className="overlay">
      <form className="comp-form" onSubmit={handleSubmit}>
        <h2>➕ Thêm bồi thường</h2>

        <label>Số tiền bồi thường</label>
        <input
          type="number"
          value={amount}
          required
          onChange={(e) => setAmount(e.target.value)}
        />

        <label>Lý do</label>
        <textarea
          value={reason}
          required
          onChange={(e) => setReason(e.target.value)}
        />

        <button disabled={loading}>
          {loading ? "⏳ Đang xử lý..." : "Xác nhận"}
        </button>
      </form>
    </div>
  );
}
