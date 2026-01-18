import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Gắn token tự động (Interceptor)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// HÀM GỌI ĐẶT PHÒNG
export const guestBookRoom = async (payload) => {
  return api.post("/booking", payload); 
};

export default api;