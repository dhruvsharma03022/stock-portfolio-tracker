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

        <div>

            <h1>Reset Password</h1>

            <p>
                Enter the verification code sent to:
                <br />
                <strong>{email}</strong>
            </p>


            <form
                onSubmit={handleResetPassword}
            >

                <div>

                    <label>
                        Verification Code
                    </label>

                    <br />

                    <input
                        type="text"
                        placeholder="Enter code"
                        value={code}
                        onChange={(e) =>
                            setCode(e.target.value)
                        }
                        required
                    />

                </div>


                <br />


                <div>

                    <label>
                        New Password
                    </label>

                    <br />

                    <input
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


                <br />


                <div>

                    <label>
                        Confirm New Password
                    </label>

                    <br />

                    <input
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


                <br />


                <button type="submit">

                    Reset Password

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

export default ResetPassword;