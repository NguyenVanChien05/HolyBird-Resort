import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const API = "http://localhost:3000/api/login";

export default function Login({ setIsLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setIsLogin(true);
      navigate("/");
    } catch {
      alert("Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-welcome">
        <h1>Chào mừng đến với Holybird Resort</h1>
        <p>Hệ thống quản lý và đặt phòng nội bộ</p>
      </div>

      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>
        <input placeholder="Username" required onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" required onChange={e => setPassword(e.target.value)} />
        <button>Login</button>
      </form>
    </div>
  );
}
