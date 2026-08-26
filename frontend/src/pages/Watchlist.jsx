import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

function Watchlist() {

    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL =
        "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com";


    // ==========================================
    // LOAD WATCHLIST
    // ==========================================

    const loadWatchlist = async () => {

        try {

            setLoading(true);
            setError("");

            const session =
                await fetchAuthSession();

            const token =
                session.tokens.idToken.toString();


            const response =
                await fetch(
                    `${API_URL}/watchlist`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            console.log(
                "WATCHLIST:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load watchlist"
                );
            }


            // ==================================
            // IMPORTANT
            //
            // DO NOT FETCH PRICES HERE.
            //
            // currentPrice will come from
            // DynamoDB.
            // ==================================

            const stocks =
                data.watchlist || [];


            setWatchlist(
                stocks
            );


        } catch (error) {

            console.error(
                "WATCHLIST ERROR:",
                error
            );

            setError(
                error.message ||
                "Failed to load watchlist"
            );


        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // LOAD ON PAGE OPEN
    // ==========================================

    useEffect(() => {

        loadWatchlist();

    }, []);


    // ==========================================
    // REMOVE FROM WATCHLIST
    // ==========================================

    const removeFromWatchlist = async (symbol) => {

        const confirmed =
            window.confirm(
                `Remove ${symbol} from your watchlist?`
            );


        if (!confirmed) {
            return;
        }


        try {

            const session =
                await fetchAuthSession();

            const token =
                session.tokens.idToken.toString();


            console.log(
                "Deleting:",
                symbol
            );


            const response =
                await fetch(
                    `${API_URL}/watchlist/${encodeURIComponent(
                        symbol
                    )}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            // ==================================
            // SAFELY HANDLE RESPONSE
            // ==================================

            const text =
                await response.text();

            let data = {};

            try {

                data =
                    text
                        ? JSON.parse(text)
                        : {};

            } catch {

                data = {
                    message:
                        text ||
                        "Unknown server response"
                };
            }


            console.log(
                "DELETE WATCHLIST RESPONSE:",
                response.status,
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to remove stock"
                );
            }


            // ==================================
            // REMOVE FROM UI IMMEDIATELY
            // ==================================

            setWatchlist(
                (current) =>
                    current.filter(
                        (stock) =>
                            stock.symbol !== symbol
                    )
            );


        } catch (error) {

            console.error(
                "DELETE WATCHLIST ERROR:",
                error
            );

            setError(
                error.message ||
                "Failed to remove stock"
            );
        }
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div>

                <h1>
                    My Watchlist
                </h1>

                <p>
                    Loading watchlist...
                </p>

            </div>

        );
    }


    // ==========================================
    // ERROR
    // ==========================================

    if (error) {

        return (

            <div>

                <h1>
                    My Watchlist
                </h1>

                <p>
                    Error: {error}
                </p>


                <button
                    onClick={() => {

                        setError("");
                        loadWatchlist();

                    }}
                >
                    Try Again
                </button>


                <br />
                <br />


                <Link to="/dashboard">

                    <button>
                        ← Back to Dashboard
                    </button>

                </Link>

            </div>

        );
    }


    // ==========================================
    // UI
    // ==========================================

    return (

        <div>

            <h1>
                My Watchlist
            </h1>


            <Link to="/dashboard">

                <button>
                    ← Back to Dashboard
                </button>

            </Link>


            <br />
            <br />


            {watchlist.length === 0 ? (

                <p>
                    Your watchlist is empty.
                </p>

            ) : (

                watchlist.map(
                    (stock) => (

                        <div
                            key={
                                stock.investmentId
                            }
                        >

                            <h2>
                                {stock.symbol}
                            </h2>


                            <p>
                                {stock.companyName}
                            </p>


                            <p>
                                Exchange: {" "}
                                {stock.exchange}
                            </p>


                            {/* ==========================
                                CURRENT PRICE
                            =========================== */}

                            <p>

                                Current Price: {" "}

                                {stock.currentPrice !== null &&
                                stock.currentPrice !== undefined
                                    ? (
                                        <>
                                            ₹
                                            {Number(
                                                stock.currentPrice
                                            ).toLocaleString()}
                                        </>
                                    )
                                    : (
                                        "Unavailable"
                                    )
                                }

                            </p>


                            {/* ==========================
                                PRICE UPDATED TIME
                            =========================== */}

                            {stock.priceUpdatedAt && (

                                <p>

                                    Price updated: {" "}

                                    {new Date(
                                        stock.priceUpdatedAt
                                    ).toLocaleString()}

                                </p>

                            )}


                            <Link
                                to={
                                    `/watchlist/${stock.symbol}`
                                }
                            >

                                <button>
                                    View Details
                                </button>

                            </Link>


                            {" "}


                            <button
                                onClick={() =>
                                    removeFromWatchlist(
                                        stock.symbol
                                    )
                                }
                            >
                                Remove
                            </button>


                            <hr />

                        </div>

                    )
                )

            )}

        </div>

    );
}

export default Watchlist;