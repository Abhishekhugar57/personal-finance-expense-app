import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addUser, removeUser } from "../store/userSlice";
import { clearNotifications } from "../store/notificationSlice";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.get("/profile");
        const user = res.data?.user || res.data;
        if (user) dispatch(addUser(user));
      } catch {
        dispatch(removeUser());
        dispatch(clearNotifications());
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    restoreSession();
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ loading, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
