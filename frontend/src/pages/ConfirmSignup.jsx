import { useState } from "react";
import { confirmSignUp } from "aws-amplify/auth";
import { useLocation, useNavigate } from "react-router-dom";

function ConfirmSignup() {

    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = async (e) => {
        e.preventDefault();

        try {
            setError("");

            await confirmSignUp({
                username: email,
                confirmationCode: code
            });

            alert("Account verified successfully!");

            navigate("/");

        } catch (err) {
            console.log(err);
            setError(err.message);
        }
    };

    return (
        <div>

            <h1>Stock Portfolio Tracker</h1>

            <h2>Verify Your Email</h2>

            <p>
                We sent a verification code to:
            </p>

            <p>
                <strong>{email}</strong>
            </p>

            <form onSubmit={handleConfirm}>

                <div>
                    <label>Verification Code</label>
                    <br />

                    <input
                        type="text"
                        placeholder="Enter verification code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                </div>

                <br />

                <button type="submit">
                    Verify Account
                </button>

            </form>

            {error && (
                <p>{error}</p>
            )}

        </div>
    );
}

export default ConfirmSignup;