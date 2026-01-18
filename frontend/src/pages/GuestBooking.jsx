import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Dùng axios trực tiếp
import "../styles/createTransDetail.css"; 

// --- Helper Functions ---
const getTodayString = () => new Date().toISOString().split('T')[0];
const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

const GuestBooking = () => {
  const navigate = useNavigate();
  
  // URL Backend (Quan trọng: kiểm tra port 3000)
  const BASE_URL = "http://localhost:3000/api"; 

  const [ranks, setRanks] = useState([]);
  const [types, setTypes] = useState([]);
  
  const [selectedRank, setSelectedRank] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [checkIn, setCheckIn] = useState(getTodayString());
  const [checkOut, setCheckOut] = useState(getTomorrowString());
  
  const [currentPrice, setCurrentPrice] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // 1. Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Gọi trực tiếp API
        const rankRes = await axios.get(`${BASE_URL}/room/ranks`, config);
        const typeRes = await axios.get(`${BASE_URL}/room/types`, config);
        
        setRanks(rankRes.data);
        setTypes(typeRes.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        if (err.response?.status === 401) navigate("/login");
      }
    };
    fetchData();
  }, [navigate]);

  // Handle Date Change
  const handleDateChange = (field, value) => {
    setMessage({ text: "", type: "" });
    if (field === "checkIn") {
        if (value < getTodayString()) return alert("Ngày nhận không được ở quá khứ");
        setCheckIn(value);
        if (value >= checkOut) {
            const d = new Date(value);
            d.setDate(d.getDate() + 1);
            setCheckOut(d.toISOString().split('T')[0]);
        }
    } else {
        if (value <= checkIn) return alert("Ngày trả phải sau ngày nhận");
        setCheckOut(value);
    }
    setCurrentPrice(null);
  };

  // 2. Xem Giá
  const handleCheckPrice = async () => {
    if (!selectedRank || !selectedType) return alert("Vui lòng chọn Hạng và Loại phòng");
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Gọi trực tiếp API lấy giá
      const res = await axios.get(`${BASE_URL}/room/price`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { rankID: selectedRank, typeID: selectedType }
      });
      
      setCurrentPrice(res.data.price); 
      setMessage({ text: "Đã cập nhật giá. Vui lòng thanh toán.", type: "success" });
    } catch (err) {
      setMessage({ text: "Lỗi lấy giá: " + (err.response?.data?.message || err.message), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Thanh Toán (Demo Lỗi)
  const handleBooking = async () => {
    if (!currentPrice) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        rankID: selectedRank,
        typeID: selectedType,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        clientPrice: currentPrice // Gửi giá cũ
      };

      // Gọi trực tiếp API Booking
      const res = await axios.post(`${BASE_URL}/booking`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(` Thành công! Mã đơn: ${res.data.data.TransactionID}`);
      navigate("/my-transactions");

    } catch (err) {
      console.error("Booking Error:", err);
      
      // BẮT LỖI 409 (Unrepeatable Read)
      if (err.response && err.response.status === 409) {
        const msg = err.response.data.message;
        alert("⚠️ CẢNH BÁO GIÁ: " + msg); // Hiện popup
        setMessage({ text: msg, type: "error" });
        setCurrentPrice(null); // Reset giá
      } else {
        setMessage({ text: "Lỗi: " + (err.response?.data?.message || err.message), type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-trans-page" style={{maxWidth: "600px", margin: "0 auto"}}>
      <h2>Đặt Phòng & Thanh Toán</h2>
      
      {message.text && (
        <p className={message.type === "error" ? "error" : "success"} 
           style={{padding: "10px", background: message.type==="error"?"#ffe6e6":"#e6fffa", borderRadius:"5px"}}>
          {message.text}
        </p>
      )}

      <div className="request-card">
        {/* Chọn Phòng */}
        <div className="form-row multi">
          <div>
            <label>Hạng phòng:</label>
            <select value={selectedRank} onChange={e => {setSelectedRank(e.target.value); setCurrentPrice(null)}}>
              <option value="">-- Chọn --</option>
              {ranks.map(r => <option key={r.RankID} value={r.RankID}>{r.RankName}</option>)}
            </select>
          </div>
          <div>
            <label>Loại phòng:</label>
            <select value={selectedType} onChange={e => {setSelectedType(e.target.value); setCurrentPrice(null)}}>
              <option value="">-- Chọn --</option>
              {types.map(t => <option key={t.TypeID} value={t.TypeID}>{t.TypeName}</option>)}
            </select>
          </div>
        </div>

        {/* Chọn Ngày */}
        <div className="form-row multi">
          <div>
            <label>Check-in:</label>
            <input type="date" value={checkIn} min={getTodayString()} onChange={e => handleDateChange("checkIn", e.target.value)} />
          </div>
          <div>
            <label>Check-out:</label>
            <input type="date" value={checkOut} min={checkIn} onChange={e => handleDateChange("checkOut", e.target.value)} />
          </div>
        </div>

        {/* Nút Xem Giá & Hiển thị */}
        <div style={{textAlign: "center", margin: "20px 0", padding: "15px", border: "1px dashed #ccc"}}>
          {!currentPrice ? (
            <button className="btn-secondary" onClick={handleCheckPrice} disabled={loading}>
              🔍 Xem Giá Phòng
            </button>
          ) : (
            <div>
              <h3 style={{color: "green"}}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
              </h3>
              <p style={{fontSize: "0.8rem", color: "#666"}}>* Giá tạm tính tại thời điểm này</p>
            </div>
          )}
        </div>

        {/* Nút Thanh Toán */}
        <div className="form-actions">
           <button 
             className="btn-primary" 
             onClick={handleBooking} 
             disabled={loading || !currentPrice} 
             style={{width: "100%", opacity: currentPrice ? 1 : 0.5}}
           >
            {loading ? "Đang xử lý..." : "💳 Xác Nhận & Thanh Toán"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestBooking;