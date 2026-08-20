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
        <div>

            <h1>Stock Portfolio Tracker</h1>

            <h2>Create Account</h2>

            <form onSubmit={handleSignup}>

                <div>
                    <label>Email</label>
                    <br />

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Password</label>
                    <br />

                    <input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <br />

                <button type="submit">
                    Create Account
                </button>

            </form>

            {error && (
                <p>{error}</p>
            )}

            <p>
                Already have an account?{" "}
                <Link to="/">
                    Login
                </Link>
            </p>

        </div>
    );
}

export default Signup;