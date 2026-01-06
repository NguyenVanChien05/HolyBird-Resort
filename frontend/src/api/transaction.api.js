import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/transactions",
});

// Gắn token tự động
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("[API] Token sent:", token); // DEBUG token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Transactions =====
export const getMyTransaction = () => api.get("/my-transactions");
export const getAllTransactions = () => api.get("/");
export const getTransactionDetail = (transactionID) => api.get(`/${transactionID}`);

// Tạo chi tiết transaction
export const createTransDetail = (transactionID, requests) =>
  api.post("/create-detail", { transactionID, requests });

// Gán khách vào phòng
export const assignGuestsToRoom = (transactionID, guests) =>
  api.post("/assign-rooms", { transactionID, guests });
// Xóa chi tiết booking
export const deleteEmptyBookedRooms = (transactionID) =>
  api.post("/delete-empty-booked-rooms", { transactionID });
// ===== KeyCard / Booking =====

// Check-in và cấp KeyCard
export const checkInDetail = (detailID) =>
  api.post(`/${detailID}/checkin`);

// Check-out và vô hiệu KeyCard
export const checkOutDetail = (detailID) =>
  api.post(`/${detailID}/checkout`);

// Hủy booking detail
export const deleteBookingDetail = (detailID) =>
  api.post(`/${detailID}/delete`);

export default api;
