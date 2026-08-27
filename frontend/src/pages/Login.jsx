import { useState, useEffect } from "react";
import {
    signIn,
    fetchAuthSession,
    getCurrentUser
} from "aws-amplify/auth";
import { Link, useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
const [checkingAuth, setCheckingAuth] = useState(true);
const [loggingIn, setLoggingIn] = useState(false);

    // =====================================================
    // CHECK IF USER IS ALREADY LOGGED IN
    // =====================================================

    useEffect(() => {

        const checkExistingUser = async () => {

            try {

                await getCurrentUser();

                // User is already logged in
                navigate("/dashboard", {
                    replace: true
                });

            } catch (error) {

                // No authenticated user
                setCheckingAuth(false);
            }
        };

        checkExistingUser();

    }, [navigate]);


    // =====================================================
    // LOGIN
    // =====================================================

    const handleLogin = async (e) => {
    e.preventDefault();

    try {
        setError("");
        setLoggingIn(true);

        const result = await signIn({
            username: email.trim(),
            password: password
        });

        console.log("LOGIN RESULT:", result);

        if (result.isSignedIn) {
            await fetchAuthSession();

            navigate("/dashboard", {
                replace: true
            });
        }

    } catch (err) {
        console.error("LOGIN ERROR:", err);

        setError(
            err.message ||
            "Invalid email or password"
        );

        setLoggingIn(false);
    }
};


    // =====================================================
    // CHECKING AUTH
    // =====================================================

    if (checkingAuth) {

        return (
            <div className="state-page">
                <p className="loading-text">
                    Checking authentication...
                </p>
            </div>
        );
    }


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-brand">
                    Stock Portfolio Tracker
                </div>

                <h1 className="auth-title">
                    Welcome back
                </h1>

                <p className="auth-subtitle">
                    Log in to view your portfolio
                </p>


                <form
                    className="auth-form"
                    onSubmit={handleLogin}
                >

                    <div className="form-group">

                        <label className="form-label">
                            Email
                        </label>

                        <input
                            className="form-input"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label className="form-label">
                            Password
                        </label>

                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                    </div>


                    <div className="auth-links-row">

                        <Link to="/forgot-password">
                            Forgot Password?
                        </Link>

                    </div>


                    {error && (

                        <p className="form-error">
                            {error}
                        </p>

                    )}


                    <button
    className="btn btn-primary btn-block"
    type="submit"
    disabled={loggingIn}
>
    {loggingIn ? (
        <>
            <span className="login-spinner"></span>
            Logging in...
        </>
    ) : (
        "Login"
    )}
</button>

                </form>


                <p className="auth-footer">

                    Don't have an account?{" "}

                    <Link to="/signup">
                        Sign up
                    </Link>

                </p>

            </div>

        </div>
    );
}

export default Login;