import React, { useEffect, useState } from "react";
import api from "../api/group.api";
import { useNavigate } from "react-router-dom";
import "../styles/group.css";

const Group = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  // ===== LOAD GROUPS =====
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/"); // GET /api/groups/
        setGroups(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // ===== FILTERED DATA =====
  const filteredGroups = groups.filter((g) => {
    const s = search.toLowerCase();
    // Tìm theo GroupID, Staff Username, Guest FullName, Guest CMND
    return (
      g.GroupID.toString().includes(search) ||
      (g.Username && g.Username.toLowerCase().includes(s)) ||
      (g.FullName && g.FullName.toLowerCase().includes(s)) ||
      (g.CMND && g.CMND.includes(search))
    );
  });

  // ===== GROUPS BY ID =====
  const groupedData = filteredGroups.reduce((acc, item) => {
    if (!acc[item.GroupID]) acc[item.GroupID] = { account: item.Username, guests: [] };
    if (item.GuestID) {
      acc[item.GroupID].guests.push({
        GuestID: item.GuestID,
        FullName: item.FullName,
        CMND: item.CMND,
        IsLeader: item.IsLeader,
      });
    }
    return acc;
  }, {});

  return (
    <div className="groups-page">
      <h2>Guest Groups</h2>

      {/* ===== SEARCH + CREATE ===== */}
      <div className="groups-controls">
        <input
          type="text"
          placeholder="Search by GroupID, Staff or Guest..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="group-search"
        />
        <button className="btn-primary create-group-btn" onClick={() => navigate("/create-group")}>
          + Create Group
        </button>
      </div>


      {loading && <p>Loading groups...</p>}
      {error && <p className="error">{error}</p>}

      {/* ===== GROUP LIST ===== */}
      <div className="group-list">
        {Object.keys(groupedData).length === 0 && !loading ? (
          <p>No groups found</p>
        ) : (
          Object.entries(groupedData).map(([groupID, info]) => (
            <div key={groupID} className="group-card">
              <h3>Group #{groupID}</h3>
              <p>
                <b>Created by Staff:</b> {info.account || "N/A"}
              </p>
              <table className="guest-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>GuestID</th>
                    <th>Full Name</th>
                    <th>CMND</th>
                    <th>Leader</th>
                  </tr>
                </thead>
                <tbody>
                  {info.guests.length > 0 ? (
                    info.guests.map((g, idx) => (
                      <tr key={g.GuestID}>
                        <td>{idx + 1}</td>
                        <td>{g.GuestID}</td>
                        <td>{g.FullName}</td>
                        <td>{g.CMND}</td>
                        <td>{g.IsLeader ? "Yes" : "No"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No guests in this group</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Group;
