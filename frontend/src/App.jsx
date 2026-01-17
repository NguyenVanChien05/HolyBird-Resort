import { Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import AccountList from "./pages/AccountList";
import Group from "./pages/Group";
import MyGroup from "./pages/MyGroup";
import Login from "./pages/Login";
import Staff from "./pages/Staff";
import LoginRoute from "./components/LoginRoute";
import CreateGroup from "./pages/CreateGroup";
import MyTransaction from "./pages/MyTransaction";
import TransactionList from "./pages/TransactionList";
import TransactionDetail from "./pages/TransactionDetail";
import CreateTransDetail from "./pages/CreateTransDetail";
import AssignGuests from "./pages/AssignGuest";
import GuestBooking from "./pages/GuestBooking"


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
        <Route path="/my-transactions" element={<LoginRoute><MyTransaction /></LoginRoute>} />
        <Route path="/transactions" element={<LoginRoute><TransactionList /></LoginRoute>} />
        <Route path="/transactions/:transactionID" element={<LoginRoute><TransactionDetail /></LoginRoute>} />
        <Route path="/transactions/:transactionID/create-detail" element={<LoginRoute><CreateTransDetail /></LoginRoute>} />
        <Route path="/transactions/:transactionID/guests" element={<LoginRoute><AssignGuests /></LoginRoute>} />
        <Route path="/group" element={<LoginRoute><Group /></LoginRoute>} />
        <Route path="/my-group" element={<LoginRoute><MyGroup /></LoginRoute>} />
        <Route path="/group/:groupID" element={<LoginRoute><MyGroup /></LoginRoute>} />
        <Route path="/create-group" element={<LoginRoute><CreateGroup /></LoginRoute>} />
        <Route path="/accounts" element={<LoginRoute><AccountList /></LoginRoute>} />
        <Route path="/booking" element={<LoginRoute><GuestBooking /></LoginRoute>} />
      </Routes>
    </>
  );
}
