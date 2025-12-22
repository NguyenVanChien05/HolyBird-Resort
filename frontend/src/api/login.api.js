const BASE = "http://localhost:3000/api/login";

export const login = async (username, password) => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error();
  return res.json();
};
