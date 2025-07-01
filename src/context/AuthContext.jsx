import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token') || null);
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token') || null);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
    const [authContext, setAuthContext] = useState({})
    const navigate = useNavigate();

    const decodeToken = (token) => {
        try {
            const decoded = jwtDecode(token);
            return {
                email: decoded.email || '',
                first_name: decoded.first_name || '',
                last_name: decoded.last_name || '',
                is_verified: decoded.is_verified || false,
            };
        } catch (err) {
            console.error('AuthContext: Failed to decode token:', err);
            toast.error('Invalid token. Please log in again.');
            return null;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            const userData = decodeToken(token);
            if (userData) {
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                navigate('/login');
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        setAuthContext({
            accessToken,
            refreshToken,
            setAccessToken,
            logout: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setAccessToken(null);
                setRefreshToken(null);
                setUser(null);
                setIsAuthenticated(false);
                navigate('/login');
            }
        });
    }, [accessToken, refreshToken]);

    const login = async (email, password) => {
        try {
            const response = await api.post('/api/users/login/', { email, password }
            );
            const { access, refresh } = response.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            setAccessToken(access);
            setRefreshToken(refresh);
            const decodedUser = decodeToken(access);
            if (decodedUser) {
                setUser(decodedUser);
                setIsAuthenticated(true);
            } else {
                throw new Error('Invalid token received');
            }
            return true;
        } catch (err) {
            console.error('Login failed:', err);
            toast.error('Login failed. Please check your credentials.');
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    };

    const googleLogin = async (credentialResponse) => {
        try {
            const response = await api.post('/api/users/google-login/', {
                token: credentialResponse.credential
            }, { withCredentials: true });
            const { access, refresh } = response.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            setAccessToken(access);
            setRefreshToken(refresh);
            const decodedUser = decodeToken(access);
            if (decodedUser) {
                setUser(decodedUser);
                setIsAuthenticated(true);
            } else {
                throw new Error('Invalid token received');
            }
        }
        catch (err) {
            console.error('Google login failed:', err);
            toast.error('Google login failed. Please try again.');
            throw err;
        }
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                accessToken,
                refreshToken,
                login,
                logout,
                googleLogin,
                setAccessToken,
                setRefreshToken,
                authContext
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;