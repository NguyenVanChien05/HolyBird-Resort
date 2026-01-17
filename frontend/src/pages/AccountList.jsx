import React, { useEffect, useState } from "react";
import api from "../api/account.api";
import { useNavigate } from "react-router-dom";
import "../styles/accountList.css";

const AccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const navigate = useNavigate();

  // ===== LOAD ACCOUNTS =====
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await api.get("/");
        setAccounts(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load accounts");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // ===== ROLE OPTIONS =====
  const roles = ["all", "Admin", "Staff", "Guest"];

  // ===== FILTERED DATA =====
  const filteredAccounts = accounts.filter((acc) => {
    const matchesRole = roleFilter === "all" || acc.Role === roleFilter;
    const matchesSearch =
      acc.Username.toLowerCase().includes(search.toLowerCase()) ||
      acc.AccountID.toString().includes(search);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="accounts-page">
      <h2>All Accounts</h2>

      {/* ===== FILTER + SEARCH + BUTTON ===== */}
      <div className="accounts-controls">
        <input
          type="text"
          placeholder="Search by Username or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All Roles" : r}
            </option>
          ))}
        </select>

        <button className="btn-primary" onClick={() => navigate("/create-group")}>
          + Create Account
        </button>
      </div>

      {loading && <p>Loading accounts...</p>}
      {error && <p className="error">{error}</p>}

      {/* ===== TABLE ===== */}
      <div className="account-table-container">
        <table className="account-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>AccountID</th>
              <th>Username</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc, index) => (
                <tr
                  key={acc.AccountID}
                  className="clickable"
                  onClick={() => navigate(`/accounts/${acc.AccountID}`)}
                >
                  <td>{index + 1}</td>
                  <td>{acc.AccountID}</td>
                  <td>{acc.Username}</td>
                  <td>
                    <span className={`badge ${acc.Role}`}>{acc.Role}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No accounts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountList;
