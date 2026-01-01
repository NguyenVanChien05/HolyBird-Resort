import axios from 'axios';

const API_URL = 'http://localhost:3000/api/booking'; // Đảm bảo khớp với cổng backend

export const createBooking = async (bookingData) => {
    try {
        const response = await axios.post(`${API_URL}/create`, bookingData);
        return response.data;
    } catch (error) {
        // Ném lỗi về để UI hiển thị cho người dùng
        throw error.response?.data?.message || "Lỗi kết nối server";
    }
};