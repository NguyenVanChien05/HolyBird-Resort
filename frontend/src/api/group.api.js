import axios from "axios";

// Tạo instance axios cho API nhóm
const api = axios.create({
  baseURL: "http://localhost:3000/api/groups",
});

// Gắn token tự động
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API nhóm

// Lấy tất cả nhóm kèm thông tin khách (Staff)
export const getAllGroupsWithGuests = () => api.get("/");

// Lấy danh sách khách theo GroupID (Staff hoặc Guest)
export const getGuestsByGroup = () => api.get("/my-group");

// Tạo nhóm mới kèm giao dịch (Staff)
export const createGroupAndTransaction = (groupData) => {
  return api.post("/create-group", groupData);
};

export default api;
