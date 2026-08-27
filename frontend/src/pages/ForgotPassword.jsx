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
        <div className="auth-page">
            <div className="auth-card">

                <h1 className="auth-title">Forgot Password</h1>
                <p className="auth-subtitle">
                    Enter your email address and we'll send you
                    a verification code.
                </p>

                <form className="auth-form" onSubmit={handleForgotPassword}>

                    <div className="form-group">
                        <label className="form-label">Email</label>
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

                    {message && (
                        <p className="form-message">{message}</p>
                    )}

                    {error && (
                        <p className="form-error">{error}</p>
                    )}

                    <button className="btn btn-primary btn-block" type="submit">
                        Send Verification Code
                    </button>

                </form>

            </div>
        </div>
    );
}

export default ForgotPassword;
