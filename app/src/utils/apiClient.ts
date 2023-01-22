import axios from "axios";
import { getHost } from "./config";

const apiClient = axios.create({
  baseURL: getHost(),
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
