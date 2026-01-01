import React, { useState } from 'react';
import { createBooking } from '../api/booking.api';
import '../styles/booking.css';
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
  <div className="booking-container">
    <div className="booking-card">
      <div className="booking-header">
        <h1>Đặt phòng Resort</h1>
        <p>Tận hưởng kỳ nghỉ dưỡng tuyệt vời tại thiên đường của chúng tôi</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group-grid">
          <div className="form-item">
            <label>Hạng phòng</label>
            <select onChange={e => setFormData({...formData, rankId: e.target.value})} required>
              <option value="">Chọn hạng phòng</option>
              <option value="1">Thường</option>
              <option value="2">Trung bình</option>
              <option value="3">Sang</option>
              <option value="4">Rất sang</option>
              <option value="5">VIP</option>
            </select>
          </div>

          <div className="form-item">
            <label>Loại phòng</label>
            <select onChange={e => setFormData({...formData, typeId: e.target.value})} required>
              <option value="">Chọn loại phòng</option>
              <option value="1">1 giường đơn</option>
              <option value="2">1 giường đôi</option>
              <option value="3">2 giường đơn</option>
              <option value="4">2 giường đôi</option>
            </select>
          </div>

          <div className="form-item">
            <label>Tầng</label>
            <input type="number" min="1" placeholder="Ví dụ: 5" onChange={e => setFormData({...formData, floor: e.target.value})} required />
          </div>

          <div className="form-item">
            <label>Số lượng phòng</label>
            <input type="number" min="1" placeholder="Số lượng" onChange={e => setFormData({...formData, count: e.target.value})} required />
          </div>
        </div>

        <div className="form-group-grid">
          <div className="form-item">
            <label>Ngày nhận phòng</label>
            <input type="datetime-local" onChange={e => setFormData({...formData, startDate: e.target.value})} required />
          </div>

          <div className="form-item">
            <label>Ngày trả phòng</label>
            <input type="datetime-local" onChange={e => setFormData({...formData, endDate: e.target.value})} required />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <span className="loader">Đang xử lý...</span>
          ) : (
            "Xác nhận đặt phòng ngay"
          )}
        </button>
      </form>
    </div>
  </div>
  );
};

export default Booking;