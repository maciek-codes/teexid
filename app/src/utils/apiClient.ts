import axios from "axios";
import { getRoomToken } from "../hooks/useAuth";
import { getHost } from "./config";

export const apiClient = axios.create({
  baseURL: getHost(),
  headers: {
    "X-Game-Token": getRoomToken(),
    "Content-Type": "application/json",
  },
});
