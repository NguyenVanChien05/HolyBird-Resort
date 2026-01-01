export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Invalid user in localStorage", err);
    return null;
  }
};

export const getRole = () => {
  const user = getUser();
  if (!user) return "Guest";

  return (user.role || "Guest");
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("/login");
};
