import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminSignup from './AdminSignup';
import AdminDashboard from './AdminDashboard';

function AdminApp() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdminAuth();
    }, []);

    const checkAdminAuth = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/current', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setIsLoggedIn(true);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    const handleSignupSuccess = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setShowSignup(false);
    };

    const switchToSignup = () => {
        setShowSignup(true);
    };

    const switchToLogin = () => {
        setShowSignup(false);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (isLoggedIn) {
        return <AdminDashboard onLogout={handleLogout} />;
    }

    return (
        <>
            {showSignup ? (
                <AdminSignup 
                    onSignupSuccess={handleSignupSuccess}
                    onSwitchToLogin={switchToLogin}
                />
            ) : (
                <AdminLogin 
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToSignup={switchToSignup}
                />
            )}
        </>
    );
}

export default AdminApp;


