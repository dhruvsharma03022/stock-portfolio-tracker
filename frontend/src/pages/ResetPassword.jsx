import { useState } from "react";
import { confirmResetPassword } from "aws-amplify/auth";
import {
    useNavigate,
    useSearchParams
} from "react-router-dom";

function ResetPassword() {

    const navigate = useNavigate();

    const [searchParams] =
        useSearchParams();

    const email =
        searchParams.get("email") || "";

    const [code, setCode] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");


    const handleResetPassword =
        async (e) => {

            e.preventDefault();

            setError("");
            setMessage("");


            if (
                newPassword !== confirmPassword
            ) {

                setError(
                    "Passwords do not match"
                );

                return;
            }


            try {

                await confirmResetPassword({

                    username: email,

                    confirmationCode: code,

                    newPassword: newPassword

                });


                setMessage(
                    "Password reset successfully!"
                );


                setTimeout(() => {

                    navigate("/");

                }, 1500);


            } catch (err) {

                console.error(
                    "CONFIRM RESET ERROR:",
                    err
                );

                setError(
                    err.message ||
                    "Failed to reset password"
                );

            }

        };


    return (

        <div className="auth-page">
            <div className="auth-card">

                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-subtitle">
                    Enter the verification code sent to:
                    <br />
                    <strong>{email}</strong>
                </p>

                <form className="auth-form" onSubmit={handleResetPassword}>

                    <div className="form-group">
                        <label className="form-label">
                            Verification Code
                        </label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Enter code"
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            New Password
                        </label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(
                                    e.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Confirm New Password
                        </label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
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
                        Reset Password
                    </button>

                </form>

            </div>
        </div>
    );
}

export default ResetPassword;
