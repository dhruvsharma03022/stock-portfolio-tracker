import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getLoggedInUser } from "../services/auth";
import Navbar from "./Navbar";

function ProtectedRoute({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {

            const currentUser = await getLoggedInUser();

            setUser(currentUser);
            setLoading(false);
        };

        checkUser();
    }, []);

    if (loading) {
        return (
            <div className="state-page">
                <p className="loading-text">Checking authentication...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <Navbar />
            {children}
        </>
    );
}

export default ProtectedRoute;
