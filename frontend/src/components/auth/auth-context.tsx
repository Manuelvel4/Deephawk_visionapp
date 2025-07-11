import { createContext } from "react";

export interface AuthContextType {
    isAuthenticated: boolean;
    loading: boolean;
    setIsAuthenticated: (value: boolean) => void;
    user: { id: string; user: string } | null;
    setUser: (user: { id: string; user: string } | null) => void;
    projects: { project_id: string; project_name: string } | null;
    setProjects: (projects: { project_id: string; project_name: string } | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    loading: true,
    setIsAuthenticated: () => { },
    user: null,
    setUser: () => { },
    projects: null,
    setProjects: () => { },
});
