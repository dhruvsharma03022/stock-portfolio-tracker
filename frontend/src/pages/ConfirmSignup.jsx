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
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-brand">Stock Portfolio Tracker</div>
                <h1 className="auth-title">Verify Your Email</h1>
                <p className="auth-subtitle">
                    We sent a verification code to <strong>{email}</strong>
                </p>

                <form className="auth-form" onSubmit={handleConfirm}>

                    <div className="form-group">
                        <label className="form-label">Verification Code</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Enter verification code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p className="form-error">{error}</p>
                    )}

                    <button className="btn btn-primary btn-block" type="submit">
                        Verify Account
                    </button>

                </form>

            </div>
        </div>
    );
}

export default ConfirmSignup;
