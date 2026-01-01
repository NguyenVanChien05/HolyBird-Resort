import { Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Booking from './pages/Booking';
import Services from "./pages/Services";
import Group from "./pages/Group";
import Login from "./pages/Login";
import LoginRoute from "./components/LoginRoute";



export default function App() {
  // Lấy trạng thái đăng nhập từ localStorage
  const [isLogin, setIsLogin] = useState(!!localStorage.getItem("token"));
  
  // useLocation dùng để ẩn/hiện Navbar tùy trang
  const { pathname } = useLocation();

  return (
    <>
      {/* Navbar chỉ hiện khi đã đăng nhập và không nằm ở trang login */}
      {isLogin && pathname !== "/login" && <Navbar />}
      
      <Routes>
        {/* Trang đăng nhập công khai */}
        <Route path="/login" element={<Login setIsLogin={setIsLogin} />} />
        
        {/* Các trang bảo mật cần qua LoginRoute */}
        <Route path="/" element={<LoginRoute><Home /></LoginRoute>} />
        <Route path="/rooms" element={<LoginRoute><Rooms /></LoginRoute>} />
        
        <Route path="/booking" element={<Booking />} />
        
        <Route path="/services" element={<LoginRoute><Services /></LoginRoute>} />
        <Route path="/group" element={<LoginRoute><Group /></LoginRoute>} />
      </Routes>
    </>
  );
}