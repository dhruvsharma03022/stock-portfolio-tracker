import { useState } from "react";
import { resetPassword } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleForgotPassword = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");

        try {

            const output = await resetPassword({
                username: email
            });

            console.log(
                "RESET PASSWORD RESPONSE:",
                output
            );

            setMessage(
                "Verification code sent to your email."
            );

            // Move to reset password page
            setTimeout(() => {

                navigate(
                    `/reset-password?email=${encodeURIComponent(email)}`
                );

            }, 1000);

        } catch (err) {

            console.error(
                "RESET PASSWORD ERROR:",
                err
            );

            setError(
                err.message ||
                "Failed to send verification code"
            );
        }
    };

    return (
        <div>

            <h1>Forgot Password</h1>

            <p>
                Enter your email address and we'll send you
                a verification code.
            </p>

            <form onSubmit={handleForgotPassword}>

                <div>

                    <label>Email</label>

                    <br />

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                    />

                </div>

                <br />

                <button type="submit">
                    Send Verification Code
                </button>

            </form>

            {message && (
                <p>{message}</p>
            )}

            {error && (
                <p>{error}</p>
            )}

        </div>
    );
}

export default ForgotPassword;