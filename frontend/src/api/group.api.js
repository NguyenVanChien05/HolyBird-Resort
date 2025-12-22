const BASE = "http://localhost:3000/api/group";

export const getMyGroupMembers = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE}/members`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
};
