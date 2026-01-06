import React, { useEffect, useState } from "react";
import { getGuestsByGroup } from "../api/group.api"; // tạo API mới để lấy group của user
import "../styles/group.css";

const MyGroup = () => {
  const [guests, setGuests] = useState([]);
  const [staffId, setStaffId] = useState(""); 
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
  getGuestsByGroup()
    .then(res => {
      setGuests(res.data);
        if (res.data.length > 0) {
         setStaffId(res.data[0].StaffID || "");
            setStaffName(res.data[0].StaffName || "");
        }
    })
    .catch(err => {
      console.error("Error fetching group members:", err);
      setError(err.response?.data?.message || "Failed to load group members");
    })
    .finally(() => setLoading(false));
}, []);


  // ===== FILTERED DATA =====
  const filteredGuests = guests.filter(g => {
    const s = search.toLowerCase();
    return (
        g.GuestID.toString().includes(search) ||
      (g.FullName && g.FullName.toLowerCase().includes(s)) ||
      (g.CMND && g.CMND.includes(search))

    );
  });

  return (
    <div className="my-group-page">
      <h2>My Group Members</h2>
      <p><b>Created by Staff:  </b> {staffId} - {staffName}</p>

      <div className="groups-controls">
        <input
          type="text"
          placeholder="Search by Full Name or CMND..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="group-search"
        />
      </div>

      {loading && <p>Loading members...</p>}
      {error && <p className="error">{error}</p>}

      {filteredGuests.length === 0 && !loading && !error && (
        <p>No members found in your group.</p>
      )}

      {filteredGuests.length > 0 && (
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
            {filteredGuests.map((g, idx) => (
              <tr key={g.GuestID}>
                <td>{idx + 1}</td>
                <td>{g.GuestID}</td>
                <td>{g.FullName}</td>
                <td>{g.CMND}</td>
                <td>{g.IsLeader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyGroup;
