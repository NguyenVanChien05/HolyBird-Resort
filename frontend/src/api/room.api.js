import { getToken, getRole } from "../utils/auth";

const API = "http://localhost:3000/api/room";

const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`
});


/* ===== RankRoom ===== */
export const getRoomRanks = async () => {
  const res = await fetch(`${API}/ranks`, { headers: authHeader() });
  if (!res.ok) throw new Error("Không thể lấy danh sách hạng phòng");
  return res.json();
};

/* ===== RoomType ===== */
export const getRoomTypes = async () => {
  const res = await fetch(`${API}/types`, { headers: authHeader() });
  if (!res.ok) throw new Error("Không thể lấy danh sách loại phòng");
  return res.json();
};

/* ===== Floors ===== */
export const getFloors = async () => {
  const res = await fetch(`${API}/floors`, { headers: authHeader() });
  if (!res.ok) throw new Error("Không thể lấy danh sách tầng");
  return res.json(); // [1,2,3,...]
};

/* ===== Price lookup ===== */
export const getPrice = async (rankID, typeID) => {
  const res = await fetch(`${API}/price?rankID=${rankID}&typeID=${typeID}`, {
    headers: authHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Không lấy được giá" }));
    throw new Error(err.message || "Không lấy được giá");
  }
  return res.json(); // { price: 1200000 }
};

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
