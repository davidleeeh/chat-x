import { createContext, useReducer, useEffect, type ReactNode } from "react";
import type { User } from "@chat-x/shared";
import { login as apiLogin, logout as apiLogout, getMe, getStoredToken } from "../api/client.js";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: "LOGIN"; user: User; token: string }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; loading: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return { user: action.user, token: action.token, loading: false };
    case "LOGOUT":
      return { user: null, token: null, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
  }
}

export interface AuthContextValue extends AuthState {
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      dispatch({ type: "SET_LOADING", loading: false });
      return;
    }

    getMe()
      .then((data) => dispatch({ type: "LOGIN", user: data.user, token }))
      .catch(() => dispatch({ type: "LOGOUT" }));
  }, []);

  const login = async (username: string) => {
    const data = await apiLogin(username);
    dispatch({ type: "LOGIN", user: data.user, token: data.token });
  };

  const logout = async () => {
    await apiLogout();
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
  );
}

