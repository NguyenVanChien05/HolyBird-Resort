import { useEffect, useState } from "react";

const API = "http://localhost:3000/api/group";

export default function Group() {
  const [group, setRooms] = useState([]);
  return (
    <>
      <h2>👥 Thông tin đoàn</h2>
      <p>Thông tin đoàn & danh sách thành viên</p>
    </>
  );
}

