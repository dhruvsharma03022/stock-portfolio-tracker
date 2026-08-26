import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

function AddInvestment() {

    const navigate = useNavigate();

    const [symbol, setSymbol] = useState("");
    const [companyName, setCompanyName] = useState("");

const [searchQuery, setSearchQuery] = useState("");
const [stocks, setStocks] = useState([]);
const [showDropdown, setShowDropdown] = useState(false);
    const [quantity, setQuantity] = useState("");
    const [purchasePrice, setPurchasePrice] = useState("");
    const [currentPrice, setCurrentPrice] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [priceLoading, setPriceLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const handleStockSearch = async (value) => {

    setSearchQuery(value);

    // Reset selected stock if user starts typing again
    setSymbol("");
    setCompanyName("");
    setCurrentPrice("");
    if (value.trim().length < 2) {
        setStocks([]);
        setShowDropdown(false);
        return;
    }

    try {

        const session =
            await fetchAuthSession();

        const token =
            session.tokens.idToken.toString();

        const response =
            await fetch(
                `https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com/stocks/search?q=${encodeURIComponent(value)}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        console.log(
            "STOCK SEARCH RESPONSE:",
            data
        );

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to search stocks"
            );
        }

        setStocks(data.stocks || []);
        setShowDropdown(true);

    } catch (error) {

        console.error(
            "STOCK SEARCH ERROR:",
            error
        );

        setStocks([]);
        setShowDropdown(false);
    }
};
   const handleSelectStock = async (stock) => {

    setSymbol(stock.symbol);

    setCompanyName(stock.name);

    setSearchQuery(
        `${stock.name} (${stock.symbol})`
    );

    setShowDropdown(false);

    setPriceLoading(true);
    setCurrentPrice("");

    try {

        const session =
            await fetchAuthSession();

        const token =
            session.tokens.idToken.toString();

        const response =
            await fetch(
                `https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com/prices/${stock.symbol}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        console.log(
            "PRICE RESPONSE:",
            data
        );

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to fetch stock price"
            );
        }

        setCurrentPrice(data.currentPrice);

    } catch (error) {

        console.error(
            "PRICE FETCH ERROR:",
            error
        );

        setError(
            error.message ||
            "Failed to fetch current price"
        );

    } finally {

        setPriceLoading(false);

    }
};
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
    companyName: companyName,
    quantity: Number(quantity),
    buyPrice: Number(purchasePrice),
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

    <label>Search Company</label>

    <br />

    <input
        type="text"
        placeholder="Search Tata, Infosys, Reliance..."
        value={searchQuery}
        onChange={(e) =>
            handleStockSearch(e.target.value)
        }
        required
    />

    {showDropdown && stocks.length > 0 && (

        <div
            style={{
                border: "1px solid #ccc",
                maxHeight: "250px",
                overflowY: "auto",
                width: "300px"
            }}
        >

            {stocks.map((stock) => (

                <div
                    key={stock.symbol}
                    onClick={() =>
                        handleSelectStock(stock)
                    }
                    style={{
                        padding: "10px",
                        cursor: "pointer",
                        borderBottom:
                            "1px solid #eee"
                    }}
                >

                    <strong>
                        {stock.name}
                    </strong>

                    <br />

                    <small>
                        {stock.symbol} • {stock.exchange}
                    </small>

                </div>

            ))}

        </div>

    )}

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

    <label>Current Market Price</label>

    <br />

    {priceLoading ? (

        <p>
            Fetching latest price...
        </p>

    ) : currentPrice ? (

        <p>
            ₹ {Number(currentPrice).toLocaleString("en-IN")}
        </p>

    ) : (

        <p>
            Select a stock to see current price
        </p>

    )}

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