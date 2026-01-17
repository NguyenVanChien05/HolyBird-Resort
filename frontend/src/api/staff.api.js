import { getToken } from "../utils/auth";

const API = "http://localhost:3000/api/staff";

export const getStaffs = async () => {
  const res = await fetch(API, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  
  if (!res.ok) {
    throw new Error(`Lỗi khi lấy danh sách nhân viên: ${res.status}`);
  }

  return res.json();
};
