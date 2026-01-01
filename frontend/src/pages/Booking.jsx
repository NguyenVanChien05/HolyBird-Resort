import React, { useState } from 'react';
import { createBooking } from '../api/booking.api';

const Booking = () => {
  const [formData, setFormData] = useState({
    rankId: '',
    floor: '',
    typeId: '',
    count: '',
    groupId: 1, // Nên lấy từ thông tin User sau khi Login
    staffId: 1, 
    startDate: '',
    endDate: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createBooking(formData);
      alert(result.message); // Hiển thị "Đặt phòng thành công" từ SQL
    } catch (err) {
      alert("Lỗi: " + err); // Hiển thị lỗi "Tầng X hết phòng" từ THROW SQL
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-page">
      <h1>Đặt phòng Resort</h1>
      <form onSubmit={handleSubmit} className="booking-form">
        <input type="number" placeholder="Hạng phòng" onChange={e => setFormData({...formData, rankId: e.target.value})} required />
        <input type="number" placeholder="Tầng" onChange={e => setFormData({...formData, floor: e.target.value})} required />
        <input type="number" placeholder="Loại phòng" onChange={e => setFormData({...formData, typeId: e.target.value})} required />
        <input type="number" placeholder="Số lượng phòng" onChange={e => setFormData({...formData, count: e.target.value})} required />
        
        <label>Ngày nhận phòng:</label>
        <input type="datetime-local" onChange={e => setFormData({...formData, startDate: e.target.value})} required />
        
        <label>Ngày trả phòng:</label>
        <input type="datetime-local" onChange={e => setFormData({...formData, endDate: e.target.value})} required />

        <button type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Xác nhận đặt phòng"}
        </button>
      </form>
    </div>
  );
};

export default Booking;