import axios from "axios";

const API = axios.create({
  baseURL: "https://digital-sign-backend.onrender.com/api", // change if deployed
});

export default API;

