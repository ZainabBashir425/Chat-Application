import { useContext } from "react";
import { AuthContext } from "../context/AuthCheck";

export const useAuth = () => useContext(AuthContext);