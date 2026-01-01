import { Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Booking from "./pages/Booking";
import Services from "./pages/Services";
import Group from "./pages/Group";
import Login from "./pages/Login";
import Staff from "./pages/Staff";
import LoginRoute from "./components/LoginRoute";

export default function App() {
  const [isLogin, setIsLogin] = useState(!!localStorage.getItem("token"));
  const { pathname } = useLocation();
  return (
    <>
      {isLogin && pathname !== "/login" && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login setIsLogin={setIsLogin} />} />
        <Route path="/" element={<LoginRoute><Home /></LoginRoute>} />
        <Route path="/rooms" element={<LoginRoute><Rooms /></LoginRoute>} />
        <Route path="/staff" element={<LoginRoute><Staff /></LoginRoute>} />
        <Route path="/booking" element={<LoginRoute><Booking /></LoginRoute>} />
        <Route path="/services" element={<LoginRoute><Services /></LoginRoute>} />
        <Route path="/group" element={<LoginRoute><Group /></LoginRoute>} />
      </Routes>
    </>
  );
}
