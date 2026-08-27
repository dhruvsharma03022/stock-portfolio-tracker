import { useState } from "react";
import {
    signIn,
    fetchAuthSession
} from "aws-amplify/auth";
import { Link, useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setError("");

            const result = await signIn({
                username: email,
                password: password
            });

            console.log(result);

            if (result.isSignedIn) {

    const session = await fetchAuthSession();

    const token =
        session.tokens.idToken.toString();

    console.log("MY ID TOKEN:", token);

    navigate("/dashboard");
}

        } catch (err) {
            console.log(err);
            setError("Invalid email or password");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-brand">Stock Portfolio Tracker</div>
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Log in to view your portfolio</p>

                <form className="auth-form" onSubmit={handleLogin}>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-links-row">
                        <Link to="/forgot-password">
                            Forgot Password?
                        </Link>
                    </div>

                    {error && (
                        <p className="form-error">{error}</p>
                    )}

                    <button className="btn btn-primary btn-block" type="submit">
                        Login
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
