import { useState } from "react";
import { signUp } from "aws-amplify/auth";
import { Link, useNavigate } from "react-router-dom";

function Signup() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignup = async (e) => {
        e.preventDefault();

        try {
            setError("");

            await signUp({
                username: email,
                password: password,
                options: {
                    userAttributes: {
                        email: email
                    }
                }
            });

            alert("Verification code sent to your email");

            navigate("/confirm-signup", {
                state: { email: email }
            });

        } catch (err) {
            console.log(err);
            setError(err.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-brand">Stock Portfolio Tracker</div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Start tracking your investments</p>

                <form className="auth-form" onSubmit={handleSignup}>

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
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p className="form-error">{error}</p>
                    )}

                    <button className="btn btn-primary btn-block" type="submit">
                        Create Account
                    </button>

                </form>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/">
                        Login
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Signup;
