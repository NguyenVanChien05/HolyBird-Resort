const BASE = "http://localhost:3000/api/room";

export const getRooms = async () => {
  const res = await fetch(API_URL);
  return res.json();
};

export const getRanks = async () =>
  (await fetch(`${BASE}/meta/rank`)).json();

export const getTypes = async () =>
  (await fetch(`${BASE}/meta/type`)).json();

export const updateStatus = (id, status) =>
  fetch(`/api/rooms/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ StatusPhysic: status }),
  });

export const updatePrice = (data) =>
  fetch("/api/rooms/price", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

