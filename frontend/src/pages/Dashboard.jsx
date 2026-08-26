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


    // ==========================================
    // DELETE INVESTMENT
    // ==========================================

    const deleteInvestment = async (investmentId) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this investment?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const session = await fetchAuthSession();

            const token =
                session.tokens.idToken.toString();

            const response = await fetch(
                `${API_URL}/investments/${investmentId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
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
                (currentInvestments) =>
                    currentInvestments.filter(
                        (investment) =>
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
                error.message
            );
        }
    };


    // ==========================================
    // LOAD INVESTMENTS + LIVE PRICES
    // ==========================================

    const loadInvestments = async () => {

        try {

            setLoading(true);
            setError("");

            const session =
                await fetchAuthSession();

            const token =
                session.tokens.idToken.toString();


            // ----------------------------------
            // STEP 1: GET ALL INVESTMENTS
            // ----------------------------------

            const response = await fetch(
                `${API_URL}/investments`,
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


            // ----------------------------------
            // STEP 2: GET LIVE PRICE
            // FOR EACH INVESTMENT
            // ----------------------------------

            const investmentsWithPrices =
                await Promise.all(

                    loadedInvestments.map(
                        async (investment) => {

                            try {

                                const priceResponse =
                                    await fetch(
                                        `${API_URL}/prices/${investment.symbol}`,
                                        {
                                            method: "GET",

                                            headers: {
                                                "Authorization":
                                                    `Bearer ${token}`
                                            }
                                        }
                                    );

                                const priceData =
                                    await priceResponse.json();

                                console.log(
                                    "PRICE RESPONSE:",
                                    investment.symbol,
                                    priceData
                                );

                                if (
                                    !priceResponse.ok
                                ) {

                                    throw new Error(
                                        priceData.message ||
                                        "Failed to load price"
                                    );
                                }

                                return {
                                    ...investment,

                                    currentPrice:
                                        Number(
                                            priceData.currentPrice
                                        )
                                };

                            } catch (error) {

                                console.error(
                                    `Failed to load price for ${investment.symbol}`,
                                    error
                                );

                                return {
                                    ...investment,

                                    currentPrice:
                                        null
                                };
                            }
                        }
                    )
                );


            // ----------------------------------
            // STEP 3: SAVE INVESTMENTS
            // WITH LIVE PRICES
            // ----------------------------------

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


    useEffect(() => {

        loadInvestments();

    }, []);


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = async () => {

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


    // ==========================================
    // PORTFOLIO CALCULATIONS
    // ==========================================

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


    // ==========================================
    // UI
    // ==========================================

    return (

        <div>

            <h1>
                My Portfolio
            </h1>


            {/* ================================
                NAVIGATION BUTTONS
            ================================= */}

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


            {loading && (

                <p>
                    Loading investments and live prices...
                </p>

            )}


            {error && (

                <p>
                    {error}
                </p>

            )}


            {!loading && !error && (

                <>

                    {/* =====================
                        PORTFOLIO SUMMARY
                    ===================== */}

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


                    {/* =====================
                        INVESTMENTS
                    ===================== */}

                    <h2>
                        My Investments
                    </h2>


                    {investments.length === 0 ? (

                        <p>
                            You haven't added any investments yet.
                        </p>

                    ) : (

                        investments.map(
                            (stock) => {

                                const invested =
                                    Number(stock.quantity) *
                                    Number(stock.buyPrice);


                                const stockCurrentValue =
                                    stock.currentPrice !== null
                                        ? (
                                            Number(stock.quantity) *
                                            Number(stock.currentPrice)
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
                                            Quantity: {" "}
                                            {stock.quantity}
                                        </p>


                                        <p>
                                            Buy Price: ₹
                                            {Number(
                                                stock.buyPrice
                                            ).toLocaleString()}
                                        </p>


                                        <p>
                                            Current Price: {" "}

                                            {stock.currentPrice !== null
                                                ? (
                                                    <>
                                                        ₹
                                                        {stock.currentPrice
                                                            .toLocaleString()}
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
                                            Current Value: {" "}

                                            {stockCurrentValue !== null
                                                ? (
                                                    <>
                                                        ₹
                                                        {stockCurrentValue
                                                            .toLocaleString()}
                                                    </>
                                                )
                                                : (
                                                    "Unavailable"
                                                )
                                            }

                                        </p>


                                        <p>
                                            Profit / Loss: {" "}

                                            {stockProfit !== null
                                                ? (
                                                    <>
                                                        ₹
                                                        {stockProfit
                                                            .toLocaleString()}
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