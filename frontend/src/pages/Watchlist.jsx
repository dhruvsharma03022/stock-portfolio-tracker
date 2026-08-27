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

            <div className="state-page">

                <h1>
                    My Watchlist
                </h1>

                <p className="loading-text">
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

            <div className="state-page">

                <h1>
                    My Watchlist
                </h1>

                <p className="error-text">
                    Error: {error}
                </p>

                <div className="item-card-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {

                            setError("");
                            loadWatchlist();

                        }}
                    >
                        Try Again
                    </button>
                </div>

            </div>

        );
    }


    // ==========================================
    // UI
    // ==========================================

    return (

        <div className="page">
          <div className="page-inner">

            <div className="topbar">
                <h1 className="topbar-title">
                    My Watchlist
                </h1>
            </div>


            {watchlist.length === 0 ? (

                <p className="empty-state">
                    Your watchlist is empty.
                </p>

            ) : (

                <div className="card-list">
                {watchlist.map(
                    (stock) => (

                        <div
                            className="item-card"
                            key={
                                stock.investmentId
                            }
                        >

                            <div className="item-card-header">
                                <span className="item-symbol">
                                    {stock.symbol}
                                </span>
                            </div>

                            <p className="item-company">
                                {stock.companyName}
                            </p>

                            <div className="item-detail-grid">

                                <div>
                                    <div className="item-detail-label">Exchange</div>
                                    <div className="item-detail-value">{stock.exchange}</div>
                                </div>

                                <div>
                                    <div className="item-detail-label">Current Price</div>
                                    <div className="item-detail-value">
                                        {stock.currentPrice !== null &&
                                        stock.currentPrice !== undefined
                                            ? <>₹{Number(stock.currentPrice).toLocaleString()}</>
                                            : "Unavailable"
                                        }
                                    </div>
                                </div>

                                {stock.priceUpdatedAt && (
                                    <div>
                                        <div className="item-detail-label">Price Updated</div>
                                        <div className="item-detail-value">
                                            {new Date(stock.priceUpdatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                )}

                            </div>

                            <div className="item-card-actions">
                                <Link
                                    to={
                                        `/watchlist/${stock.symbol}`
                                    }
                                >
                                    <button className="btn btn-secondary btn-sm">
                                        View Details
                                    </button>
                                </Link>

                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                        removeFromWatchlist(
                                            stock.symbol
                                        )
                                    }
                                >
                                    Remove
                                </button>
                            </div>

                        </div>

                    )
                )}
                </div>

            )}

          </div>
        </div>

    );
}

export default Watchlist;