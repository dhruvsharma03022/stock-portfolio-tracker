import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getLoggedInUser } from "../services/auth";

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
        return <p>Checking authentication...</p>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;