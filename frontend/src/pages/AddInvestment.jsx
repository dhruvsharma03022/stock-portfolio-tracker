import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

function AddInvestment() {

    const navigate = useNavigate();

    const [symbol, setSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [purchasePrice, setPurchasePrice] = useState("");
    const [currentPrice, setCurrentPrice] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");

        try {

            const session = await fetchAuthSession();

            const token = session.tokens.idToken.toString();

            const response = await fetch(
                "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com/investments",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        symbol: symbol.toUpperCase(),
                        quantity: Number(quantity),
                        buyPrice: Number(purchasePrice),
                        currentPrice: Number(currentPrice),
                        purchaseDate: purchaseDate
                    })
                }
            );

            const data = await response.json();

            console.log("API RESPONSE:", data);

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to add investment"
                );
            }

            setMessage("Investment added successfully!");

            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);

        } catch (error) {

            console.error("API ERROR:", error);

            setError(
                error.message || "Something went wrong"
            );
        }
    };

    return (
        <div>

            <h1>Add Investment</h1>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Stock Symbol</label>
                    <br />
                    <input
                        type="text"
                        placeholder="Example: TCS"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Quantity</label>
                    <br />
                    <input
                        type="number"
                        placeholder="Number of shares"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Purchase Price</label>
                    <br />
                    <input
                        type="number"
                        placeholder="Price per share"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Current Price</label>
                    <br />
                    <input
                        type="number"
                        placeholder="Current price per share"
                        value={currentPrice}
                        onChange={(e) => setCurrentPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <br />

                <div>
                    <label>Purchase Date</label>
                    <br />
                    <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        required
                    />
                </div>

                <br />

                <button type="submit">
                    Add Investment
                </button>

            </form>

            <br />

            {message && <p>{message}</p>}

            {error && <p>{error}</p>}

        </div>
    );
}

export default AddInvestment;