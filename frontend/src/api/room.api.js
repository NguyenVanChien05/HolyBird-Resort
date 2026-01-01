import { getToken, getRole } from "../utils/auth";

const API = "http://localhost:3000/api/room";

const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`
});

/* ===================== GET ROOMS ===================== */
export const getRooms = async () => {
  const res = await fetch(API, { headers: authHeader() });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
};

/* ===================== UPDATE STATUS ===================== */
export async function updateRoomStatus(roomId, status) {
  const role = getRole();
console.log("Role:", role);

  if (!role || (role !== "Admin" && role !== "Staff")) {
    throw new Error("Bạn không có quyền cập nhật trạng thái");
  }

  const res = await fetch(`${API}/${roomId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader()
    },
    body: JSON.stringify({ StatusPhysic: status })
  });

  if (!res.ok) {
    const errMsg = await res.json().then(r => r.message).catch(() => "Cập nhật trạng thái thất bại");
    throw new Error(errMsg);
  }

  return await res.json();
}

/* ===================== UPDATE PRICE ===================== */
export async function updateRoomPrice(data) {
  const role = getRole();
  if (!role || role !== "Admin") {
    throw new Error("Bạn không có quyền cập nhật giá");
  }

  const res = await fetch(`${API}/price`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader()
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errMsg = await res.json().then(r => r.message).catch(() => "Cập nhật giá thất bại");
    throw new Error(errMsg);
  }

  return await res.json();
}
