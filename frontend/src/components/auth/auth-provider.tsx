import { useState, useEffect } from "react";
import { AuthContext } from "./auth-context";
import axios from "axios";
import { setCookie, removeCookie, getCookie } from 'typescript-cookie'

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; user: string } | null>(null);
    const [projects, setProjects] = useState<{ project_id: string; project_name: string } | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const url = `${apiUrl}/auth`;
                const response = await axios.post(url, {}, {
                    withCredentials: true
                });

                if (response.status === 200) {
                    const data = response.data;
                    setIsAuthenticated(true);
                    console.log('User authenticated:', data);
                    setUser(data.user);
                    if (!getCookie('user')) {
                        setCookie('user', JSON.stringify(data.user));
                    }
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (error) {
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, loading, setIsAuthenticated, user, setUser, projects, setProjects }}>
            {children}
        </AuthContext.Provider>
    );
}
