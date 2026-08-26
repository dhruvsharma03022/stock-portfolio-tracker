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
        <div>

            <h1>Stock Portfolio Tracker</h1>

            <h2>Login</h2>

            <form onSubmit={handleLogin}>

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
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <br />
                <p>
    <Link to="/forgot-password">
        Forgot Password?
    </Link>
</p>
                <button type="submit">
                    Login
                </button>

            </form>

            {error && (
                <p>{error}</p>
            )}

            <p>
                Don't have an account?{" "}
                <Link to="/signup">
                    Sign up
                </Link>
            </p>

        </div>
    );
}

export default Login;