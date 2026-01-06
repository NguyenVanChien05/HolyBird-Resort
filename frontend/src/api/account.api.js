import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/accounts",
  headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`
}

});

export default api;
