import { Link, useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";

function Dashboard() {

    const navigate = useNavigate();

    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL =
        "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com";


    // =====================================================
    // PRICE CACHE SETTINGS
    // =====================================================

    // Price will be refreshed after 15 minutes
    const PRICE_CACHE_TIME =
        15 * 60 * 1000;


    // =====================================================
    // GET CACHED PRICE
    // =====================================================

    const getCachedPrice = (symbol) => {

        try {

            const cached =
                localStorage.getItem(
                    `stockPrice_${symbol}`
                );

            if (!cached) {
                return null;
            }

            const data =
                JSON.parse(cached);


            const age =
                Date.now() - data.timestamp;


            // Cache still valid
            if (
                age <
                PRICE_CACHE_TIME
            ) {

                console.log(
                    `USING CACHED PRICE FOR ${symbol}:`,
                    data.price
                );

                return data.price;
            }


            // Cache expired
            console.log(
                `PRICE CACHE EXPIRED FOR ${symbol}`
            );

            return null;

        } catch (error) {

            console.error(
                "CACHE READ ERROR:",
                error
            );

            return null;
        }
    };


    // =====================================================
    // SAVE PRICE TO CACHE
    // =====================================================

    const savePriceToCache = (
        symbol,
        price
    ) => {

        try {

            localStorage.setItem(

                `stockPrice_${symbol}`,

                JSON.stringify({

                    price,

                    timestamp:
                        Date.now()

                })

            );

            console.log(
                `PRICE CACHED FOR ${symbol}:`,
                price
            );

        } catch (error) {

            console.error(
                "CACHE SAVE ERROR:",
                error
            );
        }
    };


    // =====================================================
    // GET PRICE
    // =====================================================

    const getStockPrice = async (
        symbol,
        token
    ) => {

        const cleanSymbol =
            symbol
                .toUpperCase()
                .trim();


        // -------------------------------------------------
        // STEP 1: CHECK CACHE
        // -------------------------------------------------

        const cachedPrice =
            getCachedPrice(
                cleanSymbol
            );


        if (
            cachedPrice !== null
        ) {

            return cachedPrice;
        }


        // -------------------------------------------------
        // STEP 2: CALL API ONLY IF CACHE IS EMPTY/EXPIRED
        // -------------------------------------------------

        console.log(
            `FETCHING NEW PRICE FOR ${cleanSymbol}`
        );


        const response =
            await fetch(
                `${API_URL}/prices/${encodeURIComponent(
                    cleanSymbol
                )}`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "PRICE RESPONSE:",
            cleanSymbol,
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Failed to load price for ${cleanSymbol}`
            );
        }


        const price =
            Number(
                data.currentPrice
            );


        if (
            Number.isNaN(price)
        ) {

            throw new Error(
                `Invalid price received for ${cleanSymbol}`
            );
        }


        // -------------------------------------------------
        // STEP 3: SAVE PRICE
        // -------------------------------------------------

        savePriceToCache(
            cleanSymbol,
            price
        );


        return price;
    };


    // =====================================================
    // DELETE INVESTMENT
    // =====================================================

    const deleteInvestment =
        async (investmentId) => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this investment?"
                );


            if (!confirmed) {
                return;
            }


            try {

                const session =
                    await fetchAuthSession();


                const token =
                    session.tokens
                        .idToken
                        .toString();


                const response =
                    await fetch(
                        `${API_URL}/investments/${investmentId}`,
                        {
                            method: "DELETE",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "DELETE RESPONSE:",
                    data
                );


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Failed to delete investment"
                    );
                }


                setInvestments(
                    currentInvestments =>
                        currentInvestments.filter(
                            investment =>
                                investment.investmentId !==
                                investmentId
                        )
                );


            } catch (error) {

                console.error(
                    "DELETE ERROR:",
                    error
                );


                setError(
                    error.message ||
                    "Failed to delete investment"
                );
            }
        };


    // =====================================================
    // LOAD INVESTMENTS
    // =====================================================

    const loadInvestments =
        async () => {

            try {

                setLoading(true);
                setError("");


                // -------------------------------------------------
                // AUTH
                // -------------------------------------------------

                const session =
                    await fetchAuthSession();


                const token =
                    session.tokens
                        .idToken
                        .toString();


                // -------------------------------------------------
                // STEP 1:
                // GET INVESTMENTS FROM DYNAMODB
                // -------------------------------------------------

                const response =
                    await fetch(
                        `${API_URL}/investments`,
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "INVESTMENTS:",
                    data
                );


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Failed to load investments"
                    );
                }


                const loadedInvestments =
                    data.investments || [];


                // -------------------------------------------------
                // STEP 2:
                // FIND UNIQUE STOCK SYMBOLS
                // -------------------------------------------------

                const uniqueSymbols = [
                    ...new Set(
                        loadedInvestments.map(
                            investment =>
                                investment.symbol
                                    .toUpperCase()
                                    .trim()
                        )
                    )
                ];


                console.log(
                    "UNIQUE STOCKS:",
                    uniqueSymbols
                );


                // -------------------------------------------------
                // STEP 3:
                // FETCH PRICES
                //
                // Cached prices DO NOT call API.
                // Expired prices call API.
                // -------------------------------------------------

                const priceMap = {};


                await Promise.all(

                    uniqueSymbols.map(
                        async (symbol) => {

                            try {

                                const price =
                                    await getStockPrice(
                                        symbol,
                                        token
                                    );


                                priceMap[
                                    symbol
                                ] = price;


                            } catch (error) {

                                console.error(
                                    `Failed to load price for ${symbol}`,
                                    error
                                );


                                priceMap[
                                    symbol
                                ] = null;
                            }
                        }
                    )

                );


                // -------------------------------------------------
                // STEP 4:
                // ADD PRICE TO EACH INVESTMENT
                // -------------------------------------------------

                const investmentsWithPrices =
                    loadedInvestments.map(
                        investment => {

                            const symbol =
                                investment.symbol
                                    .toUpperCase()
                                    .trim();


                            return {

                                ...investment,

                                currentPrice:
                                    priceMap[
                                        symbol
                                    ] ?? null

                            };
                        }
                    );


                // -------------------------------------------------
                // STEP 5:
                // SAVE TO STATE
                // -------------------------------------------------

                setInvestments(
                    investmentsWithPrices
                );


            } catch (error) {

                console.error(
                    "LOAD INVESTMENTS ERROR:",
                    error
                );


                setError(
                    error.message ||
                    "Failed to load investments"
                );


            } finally {

                setLoading(false);
            }
        };


    // =====================================================
    // LOAD ON DASHBOARD OPEN
    // =====================================================

    useEffect(() => {

        loadInvestments();

    }, []);


    // =====================================================
    // =====================================================
    // PORTFOLIO CALCULATIONS
    // =====================================================

    const totalInvested =
        investments.reduce(
            (sum, stock) =>

                sum +
                (
                    Number(stock.quantity) *
                    Number(stock.buyPrice)
                ),

            0
        );


    const currentValue =
        investments.reduce(
            (sum, stock) => {

                if (
                    stock.currentPrice === null ||
                    stock.currentPrice === undefined
                ) {

                    return sum;
                }


                return (
                    sum +
                    (
                        Number(stock.quantity) *
                        Number(stock.currentPrice)
                    )
                );

            },

            0
        );


    const profit =
        currentValue -
        totalInvested;


    const returnPercentage =
        totalInvested === 0

            ? 0

            : (
                profit /
                totalInvested
            ) * 100;


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="page">
          <div className="page-inner">

            <div className="topbar">
                <h1 className="topbar-title">
                    My Portfolio
                </h1>
            </div>


            {/* ==========================================
                LOADING
            ========================================== */}

            {loading && (

                <p className="loading-text">
                    Loading investments and prices...
                </p>

            )}


            {/* ==========================================
                ERROR
            ========================================== */}

            {error && (

                <p className="error-text">
                    Error: {error}
                </p>

            )}


            {/* ==========================================
                DASHBOARD
            ========================================== */}

            {!loading && (

                <>

                    {/* ==================================
                        PORTFOLIO SUMMARY
                    ================================== */}

                    <div className="summary-grid">

                        <div className="summary-card">
                            <h3 className="summary-card-label">
                                Total Invested
                            </h3>
                            <p className="summary-card-value">
                                ₹{totalInvested.toLocaleString()}
                            </p>
                        </div>

                        <div className="summary-card">
                            <h3 className="summary-card-label">
                                Current Value
                            </h3>
                            <p className="summary-card-value">
                                ₹{currentValue.toLocaleString()}
                            </p>
                        </div>

                        <div className="summary-card">
                            <h3 className="summary-card-label">
                                Profit / Loss
                            </h3>
                            <p className={`summary-card-value ${profit >= 0 ? "positive" : "negative"}`}>
                                ₹{profit.toLocaleString()}
                            </p>
                        </div>

                        <div className="summary-card">
                            <h3 className="summary-card-label">
                                Return
                            </h3>
                            <p className={`summary-card-value ${returnPercentage >= 0 ? "positive" : "negative"}`}>
                                {returnPercentage.toFixed(2)}%
                            </p>
                        </div>

                    </div>


                    {/* ==================================
                        INVESTMENTS
                    ================================== */}

                    <div className="section-header">
                        <h2>
                            My Investments
                        </h2>
                    </div>


                    {investments.length === 0 ? (

                        <p className="empty-state">
                            You haven't added any investments yet.
                        </p>

                    ) : (

                        <div className="card-list">
                        {investments.map(
                            stock => {

                                const invested =
                                    Number(
                                        stock.quantity
                                    ) *
                                    Number(
                                        stock.buyPrice
                                    );


                                const stockCurrentValue =
                                    stock.currentPrice !== null &&
                                    stock.currentPrice !== undefined

                                        ? (
                                            Number(
                                                stock.quantity
                                            ) *
                                            Number(
                                                stock.currentPrice
                                            )
                                        )

                                        : null;


                                const stockProfit =
                                    stockCurrentValue !== null

                                        ? (
                                            stockCurrentValue -
                                            invested
                                        )

                                        : null;


                                return (

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
                                                <div className="item-detail-label">Quantity</div>
                                                <div className="item-detail-value">{stock.quantity}</div>
                                            </div>

                                            <div>
                                                <div className="item-detail-label">Buy Price</div>
                                                <div className="item-detail-value">
                                                    ₹{Number(stock.buyPrice).toLocaleString()}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="item-detail-label">Current Price</div>
                                                <div className="item-detail-value">
                                                    {stock.currentPrice !== null
                                                        ? <>₹{Number(stock.currentPrice).toLocaleString()}</>
                                                        : "Unavailable"
                                                    }
                                                </div>
                                            </div>

                                            <div>
                                                <div className="item-detail-label">Invested</div>
                                                <div className="item-detail-value">
                                                    ₹{invested.toLocaleString()}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="item-detail-label">Current Value</div>
                                                <div className="item-detail-value">
                                                    {stockCurrentValue !== null
                                                        ? <>₹{stockCurrentValue.toLocaleString()}</>
                                                        : "Unavailable"
                                                    }
                                                </div>
                                            </div>

                                            <div>
                                                <div className="item-detail-label">Profit / Loss</div>
                                                <div className={`item-detail-value ${stockProfit !== null ? (stockProfit >= 0 ? "positive" : "negative") : ""}`}>
                                                    {stockProfit !== null
                                                        ? <>₹{stockProfit.toLocaleString()}</>
                                                        : "Unavailable"
                                                    }
                                                </div>
                                            </div>

                                        </div>

                                        <div className="item-card-actions">
                                            <Link
                                                to={
                                                    `/investment/${stock.investmentId}`
                                                }
                                            >
                                                <button className="btn btn-secondary btn-sm">
                                                    View Details
                                                </button>
                                            </Link>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() =>
                                                    deleteInvestment(
                                                        stock.investmentId
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>

                                    </div>

                                );

                            }
                        )}
                        </div>

                    )}


                    {/* ==================================
                        ADD INVESTMENT
                    ================================== */}

                    <div className="back-button-row">
                        <Link
                            to="/add-investment"
                        >
                            <button className="btn btn-primary">
                                + Add Investment
                            </button>
                        </Link>
                    </div>

                </>

            )}

          </div>
        </div>
    );
}

export default Dashboard;