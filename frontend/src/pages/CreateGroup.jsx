import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/group.api";
import "../styles/CreateGroup.css";

const CreateGroup = () => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Pending");
  const [guests, setGuests] = useState([{ fullName: "", cmnd: "", isLeader: "Yes" }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const addGuest = () => setGuests([...guests, { fullName: "", cmnd: "", isLeader: "No" }]);
  const updateGuest = (index, field, value) => {
    const copy = [...guests];
    copy[index][field] = value;
    setGuests(copy);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.post("/create-group", { startDate, endDate, status, guests });
      if (res.data.data) setResult(res.data.data);
      else setError("Group created nhưng không có account info trả về");
    } catch (err) {
      setError(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Create Guest Group & Booking</h2>

      <form className="form" onSubmit={submitForm}>
        <div className="grid-4">
        <button className="btn-primary" onClick={() => navigate("/accounts")}>Quay lại</button>
        </div> 
        <div className="grid-2">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
          </select>
        </div>

        <h3>Guest List</h3>
        {guests.map((g, i) => (
          <div className="guest-card" key={i}>
            <input placeholder="Full Name" value={g.fullName} onChange={e => updateGuest(i, "fullName", e.target.value)} required />
            <input placeholder="CMND" value={g.cmnd} onChange={e => updateGuest(i, "cmnd", e.target.value)} />
            <select value={g.isLeader} onChange={e => updateGuest(i, "isLeader", e.target.value)}>
              <option value="Yes">Leader</option>
              <option value="No">Member</option>
            </select>
          </div>
        ))}

        <button type="button" className="btn-secondary" onClick={addGuest}>+ Add Guest</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Group"}</button>
      </form>

      {result && (
        <div className="result">
          <h3>Account Created</h3>
          <p><b>Username:</b> {result.Username}</p>
          <p><b>Password:</b> {result.Password}</p>
          <p><b>GroupID:</b> {result.GroupID}</p>
          <button className="btn-primary" onClick={() => navigate("/accounts")}>Xong</button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default CreateGroup;
