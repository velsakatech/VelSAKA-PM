import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import socket from "../socket/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // =========================================================
  // RESTORE SESSION
  // =========================================================

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("user");

      const storedToken =
        localStorage.getItem("token");

      if (
        storedUser &&
        storedUser !== "undefined"
      ) {
        setUser(JSON.parse(storedUser));
      }

      if (
        storedToken &&
        storedToken !== "undefined"
      ) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error(
        "Auth restore failed:",
        error
      );

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // =========================================================
  // CONNECT SOCKET AFTER USER RESTORED
  // =========================================================

  useEffect(() => {
    const mongoUserId =
      user?._id || user?.id;

    if (!mongoUserId) {
      return;
    }

    console.log(
      "Connecting socket for user:",
      mongoUserId
    );

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit(
        "join_user",
        String(mongoUserId)
      );
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on(
      "connect",
      handleConnect
    );

    return () => {
      socket.off(
        "connect",
        handleConnect
      );
    };
  }, [user]);

  // =========================================================
  // LOGIN
  // =========================================================

  const login = (
    userData,
    authToken
  ) => {
    setUser(userData);
    setToken(authToken);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    localStorage.setItem(
      "token",
      authToken
    );
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    socket.disconnect();

    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        isAuthenticated: !!user,
        login,
        logout,
        socket,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
};

export default AuthContext;