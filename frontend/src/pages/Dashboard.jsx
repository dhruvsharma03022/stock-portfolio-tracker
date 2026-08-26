import { Link, useNavigate } from "react-router-dom";
import { signOut, fetchAuthSession } from "aws-amplify/auth";
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
    // LOGOUT
    // =====================================================

    const handleLogout =
        async () => {

            try {

                await signOut();

                navigate("/");

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );
            }
        };


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

        <div>

            <h1>
                My Portfolio
            </h1>


            {/* ==========================================
                NAVIGATION
            ========================================== */}

            <button
                onClick={handleLogout}
            >
                Logout
            </button>


            {" "}


            <Link to="/market">

                <button>
                    📊 Market
                </button>

            </Link>


            {" "}


            <Link to="/watchlist">

                <button>
                    ⭐ Watchlist
                </button>

            </Link>


            <hr />


            {/* ==========================================
                LOADING
            ========================================== */}

            {loading && (

                <p>
                    Loading investments and prices...
                </p>

            )}


            {/* ==========================================
                ERROR
            ========================================== */}

            {error && (

                <p>
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

                    <div>

                        <h3>
                            Total Invested
                        </h3>

                        <p>
                            ₹
                            {totalInvested.toLocaleString()}
                        </p>

                    </div>


                    <div>

                        <h3>
                            Current Value
                        </h3>

                        <p>
                            ₹
                            {currentValue.toLocaleString()}
                        </p>

                    </div>


                    <div>

                        <h3>
                            Profit / Loss
                        </h3>

                        <p>
                            ₹
                            {profit.toLocaleString()}
                        </p>

                    </div>


                    <div>

                        <h3>
                            Return
                        </h3>

                        <p>
                            {returnPercentage.toFixed(2)}%
                        </p>

                    </div>


                    <hr />


                    {/* ==================================
                        INVESTMENTS
                    ================================== */}

                    <h2>
                        My Investments
                    </h2>


                    {investments.length === 0 ? (

                        <p>
                            You haven't added any investments yet.
                        </p>

                    ) : (

                        investments.map(
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
                                        key={
                                            stock.investmentId
                                        }
                                    >

                                        <h3>
                                            {stock.symbol}
                                        </h3>


                                        <p>
                                            {stock.companyName}
                                        </p>


                                        <p>
                                            Quantity:{" "}
                                            {stock.quantity}
                                        </p>


                                        <p>
                                            Buy Price: ₹
                                            {Number(
                                                stock.buyPrice
                                            ).toLocaleString()}
                                        </p>


                                        <p>

                                            Current Price:{" "}

                                            {stock.currentPrice !== null

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


                                        <p>
                                            Invested: ₹
                                            {invested.toLocaleString()}
                                        </p>


                                        <p>

                                            Current Value:{" "}

                                            {stockCurrentValue !== null

                                                ? (
                                                    <>
                                                        ₹
                                                        {stockCurrentValue.toLocaleString()}
                                                    </>
                                                )

                                                : (
                                                    "Unavailable"
                                                )
                                            }

                                        </p>


                                        <p>

                                            Profit / Loss:{" "}

                                            {stockProfit !== null

                                                ? (
                                                    <>
                                                        ₹
                                                        {stockProfit.toLocaleString()}
                                                    </>
                                                )

                                                : (
                                                    "Unavailable"
                                                )
                                            }

                                        </p>


                                        <Link
                                            to={
                                                `/investment/${stock.investmentId}`
                                            }
                                        >
                                            View Details
                                        </Link>


                                        <br />
                                        <br />


                                        <button
                                            onClick={() =>
                                                deleteInvestment(
                                                    stock.investmentId
                                                )
                                            }
                                        >
                                            Delete
                                        </button>


                                        <hr />

                                    </div>

                                );

                            }
                        )

                    )}


                    {/* ==================================
                        ADD INVESTMENT
                    ================================== */}

                    <Link
                        to="/add-investment"
                    >

                        <button>
                            + Add Investment
                        </button>

                    </Link>

                </>

            )}

        </div>
    );
}

export default Dashboard;