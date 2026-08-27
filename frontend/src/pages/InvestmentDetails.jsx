import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

function InvestmentDetails() {

    const { investmentId } = useParams();
    const navigate = useNavigate();

    const [investment, setInvestment] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyMessage, setHistoryMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const API_URL =
        "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com";


    // ==========================================
    // LOAD INVESTMENT DATA
    // ==========================================

    useEffect(() => {

        let cancelled = false;

        const loadInvestment = async () => {

            try {

                setLoading(true);
                setError("");
                setHistoryData([]);
                setHistoryMessage("");

                const session =
                    await fetchAuthSession();

                const token =
                    session.tokens.idToken.toString();


                // ==========================================
                // GET INVESTMENT DETAILS
                // ==========================================

                const investmentResponse =
                    await fetch(
                        `${API_URL}/investments/${investmentId}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                const investmentData =
                    await investmentResponse.json();

                console.log(
                    "INVESTMENT RESPONSE:",
                    investmentData
                );

                if (!investmentResponse.ok) {

                    throw new Error(
                        investmentData.message ||
                        "Failed to load investment"
                    );
                }

                const loadedInvestment =
                    investmentData.investment;

                if (!loadedInvestment) {

                    throw new Error(
                        "Investment not found"
                    );
                }

                if (!cancelled) {

                    setInvestment(
                        loadedInvestment
                    );
                }


                // ==========================================
                // GET CURRENT PRICE
                // ==========================================

                try {

                    const priceResponse =
                        await fetch(
                            `${API_URL}/prices/${encodeURIComponent(
                                loadedInvestment.symbol
                            )}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );

                    const priceData =
                        await priceResponse.json();

                    console.log(
                        "PRICE RESPONSE:",
                        priceData
                    );

                    if (!priceResponse.ok) {

                        console.warn(
                            "PRICE UNAVAILABLE:",
                            priceData
                        );

                        if (!cancelled) {

                            setCurrentPrice(null);
                        }

                    } else {

                        const price =
                            Number(
                                priceData.currentPrice
                            );

                        if (
                            !Number.isNaN(price) &&
                            price > 0
                        ) {

                            if (!cancelled) {

                                setCurrentPrice(
                                    price
                                );
                            }

                        } else {

                            if (!cancelled) {

                                setCurrentPrice(
                                    null
                                );
                            }
                        }
                    }

                } catch (priceError) {

                    console.error(
                        "PRICE LOAD ERROR:",
                        priceError
                    );

                    if (!cancelled) {

                        setCurrentPrice(
                            null
                        );
                    }
                }


                // ==========================================
                // GET HISTORY
                // IMPORTANT:
                // HISTORY FAILURE MUST NOT BREAK PAGE
                // ==========================================

                try {

                    const historyResponse =
                        await fetch(
                            `${API_URL}/history/${encodeURIComponent(
                                loadedInvestment.symbol
                            )}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );

                    const historyResponseData =
                        await historyResponse.json();

                    console.log(
                        "HISTORY RESPONSE:",
                        historyResponseData
                    );


                    // ======================================
                    // API ERROR
                    // ======================================

                    if (!historyResponse.ok) {

                        console.warn(
                            "HISTORY UNAVAILABLE:",
                            historyResponseData
                        );

                        if (!cancelled) {

                            setHistoryData([]);

                            setHistoryMessage(
                                historyResponseData.message ||
                                "Historical price data is currently unavailable."
                            );
                        }

                        return;
                    }


                    // ======================================
                    // API SAYS HISTORY NOT AVAILABLE
                    // ======================================

                    if (
                        historyResponseData.available === false
                    ) {

                        if (!cancelled) {

                            setHistoryData([]);

                            setHistoryMessage(
                                historyResponseData.message ||
                                "Historical price data is currently unavailable."
                            );
                        }

                        return;
                    }


                    const rawHistory =
                        historyResponseData.historyData;


                    // ======================================
                    // NO HISTORY
                    // ======================================

                    if (!rawHistory) {

                        if (!cancelled) {

                            setHistoryData([]);

                            setHistoryMessage(
                                historyResponseData.message ||
                                "No historical price data available."
                            );
                        }

                        return;
                    }


                    let formattedHistory = [];


                    // ======================================
                    // FORMAT 1
                    // historyData.datasets
                    // ======================================

                    if (
                        rawHistory.datasets &&
                        Array.isArray(
                            rawHistory.datasets
                        )
                    ) {

                        const priceDataset =
                            rawHistory.datasets.find(
                                dataset =>
                                    dataset.metric === "Price" ||
                                    dataset.name === "Price" ||
                                    dataset.label === "Price"
                            );

                        console.log(
                            "PRICE DATASET:",
                            priceDataset
                        );

                        if (
                            priceDataset &&
                            Array.isArray(
                                priceDataset.values
                            )
                        ) {

                            formattedHistory =
                                priceDataset.values
                                    .map(
                                        item => {

                                            // Array format
                                            // [date, price]

                                            if (
                                                Array.isArray(
                                                    item
                                                )
                                            ) {

                                                return {

                                                    date:
                                                        item[0],

                                                    price:
                                                        Number(
                                                            item[1]
                                                        )

                                                };
                                            }


                                            // Object format

                                            if (
                                                item &&
                                                typeof item ===
                                                "object"
                                            ) {

                                                return {

                                                    date:
                                                        item.date ||
                                                        item.timestamp ||
                                                        item.time ||
                                                        item.x,

                                                    price:
                                                        Number(
                                                            item.price ??
                                                            item.close ??
                                                            item.value ??
                                                            item.y
                                                        )

                                                };
                                            }

                                            return null;
                                        }
                                    )
                                    .filter(
                                        item =>
                                            item &&
                                            item.date &&
                                            Number.isFinite(
                                                item.price
                                            )
                                    );
                        }
                    }


                    // ======================================
                    // FORMAT 2
                    // historyData is direct array
                    // ======================================

                    else if (
                        Array.isArray(
                            rawHistory
                        )
                    ) {

                        formattedHistory =
                            rawHistory
                                .map(
                                    item => {

                                        // Array format
                                        // [date, price]

                                        if (
                                            Array.isArray(
                                                item
                                            )
                                        ) {

                                            return {

                                                date:
                                                    item[0],

                                                price:
                                                    Number(
                                                        item[1]
                                                    )

                                            };
                                        }


                                        // Object format

                                        if (
                                            item &&
                                            typeof item ===
                                            "object"
                                        ) {

                                            return {

                                                date:
                                                    item.date ||
                                                    item.timestamp ||
                                                    item.time ||
                                                    item.x,

                                                price:
                                                    Number(
                                                        item.price ??
                                                        item.close ??
                                                        item.value ??
                                                        item.y
                                                    )

                                            };
                                        }

                                        return null;
                                    }
                                )
                                .filter(
                                    item =>
                                        item &&
                                        item.date &&
                                        Number.isFinite(
                                            item.price
                                        )
                                );
                    }


                    console.log(
                        "FORMATTED HISTORY:",
                        formattedHistory
                    );


                    if (!cancelled) {

                        setHistoryData(
                            formattedHistory
                        );

                        if (
                            formattedHistory.length === 0
                        ) {

                            setHistoryMessage(
                                historyResponseData.message ||
                                "Historical price data is currently unavailable."
                            );

                        } else {

                            setHistoryMessage("");
                        }
                    }


                } catch (historyError) {

                    console.error(
                        "HISTORY LOAD ERROR:",
                        historyError
                    );

                    if (!cancelled) {

                        setHistoryData([]);

                        setHistoryMessage(
                            "Historical price data is currently unavailable."
                        );
                    }
                }


            } catch (error) {

                console.error(
                    "INVESTMENT DETAILS ERROR:",
                    error
                );

                if (!cancelled) {

                    setError(
                        error.message ||
                        "Failed to load investment"
                    );
                }

            } finally {

                if (!cancelled) {

                    setLoading(false);
                }
            }
        };


        loadInvestment();


        return () => {

            cancelled = true;
        };

    }, [investmentId]);


    // ==========================================
    // CHART CALCULATIONS
    // ==========================================

    const chartData = useMemo(() => {

        if (!historyData.length) {

            return null;
        }

        const prices =
            historyData
                .map(
                    item =>
                        Number(item.price)
                )
                .filter(
                    price =>
                        Number.isFinite(price)
                );


        if (!prices.length) {

            return null;
        }


        const minPrice =
            Math.min(
                ...prices
            );

        const maxPrice =
            Math.max(
                ...prices
            );

        const firstPrice =
            prices[0];

        const lastPrice =
            prices[
                prices.length - 1
            ];

        const difference =
            lastPrice -
            firstPrice;

        const percentage =
            firstPrice !== 0
                ? (
                    difference /
                    firstPrice
                ) * 100
                : 0;


        return {

            minPrice,

            maxPrice,

            firstPrice,

            lastPrice,

            difference,

            percentage

        };

    }, [historyData]);


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="state-page">

                <h1>
                    Loading investment...
                </h1>

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
                    Investment Details
                </h1>

                <p className="error-text">
                    {error}
                </p>

                <button
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    Back to Dashboard
                </button>

            </div>

        );
    }


    if (!investment) {

        return null;
    }


    // ==========================================
    // INVESTMENT CALCULATIONS
    // ==========================================

    const investedValue =
        Number(investment.quantity) *
        Number(investment.buyPrice);


    const calculatedCurrentValue =
        currentPrice !== null
            ? (
                Number(
                    investment.quantity
                ) *
                Number(
                    currentPrice
                )
            )
            : null;


    const profitLoss =
        calculatedCurrentValue !== null
            ? (
                calculatedCurrentValue -
                investedValue
            )
            : null;


    const returnPercentage =
        profitLoss !== null &&
        investedValue !== 0
            ? (
                profitLoss /
                investedValue
            ) * 100
            : null;


    // ==========================================
    // SVG CHART SETTINGS
    // ==========================================

    const chartWidth = 1000;
    const chartHeight = 400;

    const padding = {

        top: 30,
        right: 30,
        bottom: 50,
        left: 80

    };


    const graphWidth =
        chartWidth -
        padding.left -
        padding.right;


    const graphHeight =
        chartHeight -
        padding.top -
        padding.bottom;


    let points = [];


    if (
        historyData.length > 0 &&
        chartData
    ) {

        const priceRange =
            (
                chartData.maxPrice -
                chartData.minPrice
            ) || 1;


        points =
            historyData.map(
                (item, index) => {

                    const x =
                        padding.left +
                        (
                            index /
                            Math.max(
                                historyData.length - 1,
                                1
                            )
                        ) *
                        graphWidth;


                    const y =
                        padding.top +
                        (
                            (
                                chartData.maxPrice -
                                item.price
                            ) /
                            priceRange
                        ) *
                        graphHeight;


                    return {

                        ...item,

                        x,

                        y

                    };
                }
            );
    }


    const linePath =
        points
            .map(
                (point, index) =>

                    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");


    const areaPath =
        points.length > 0

            ? `${linePath}
               L ${points[points.length - 1].x} ${chartHeight - padding.bottom}
               L ${points[0].x} ${chartHeight - padding.bottom}
               Z`

            : "";


    const isPositive =
        chartData
            ? chartData.difference >= 0
            : true;


    const chartColor =
        isPositive
            ? "#22c55e"
            : "#ef4444";


    // ==========================================
    // UI
    // ==========================================

    return (

        <div className="page">

            <div className="page-inner">


                {/* ================================= */}
                {/* BACK BUTTON */}
                {/* ================================= */}

                <button
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ← Back to Dashboard
                </button>


                {/* ================================= */}
                {/* STOCK HEADER */}
                {/* ================================= */}

                <div className="detail-header">

                    <div>

                        <h1 className="detail-symbol">

                            {investment.symbol}

                        </h1>


                        {investment.companyName && (

                            <p className="detail-company">

                                {investment.companyName}

                            </p>

                        )}

                    </div>


                    <button
                        className="btn btn-primary btn-pill"
                    >
                        + Follow
                    </button>

                </div>


                {/* ================================= */}
                {/* CURRENT PRICE */}
                {/* ================================= */}

                <div className="price-row">

                    <div className="price-current">

                        ₹

                        {currentPrice !== null
                            ? currentPrice.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )
                            : "--"
                        }

                    </div>


                    {chartData && (

                        <>

                            <div
                                className={
                                    `price-change-badge ${
                                        isPositive
                                            ? "positive"
                                            : "negative"
                                    }`
                                }
                            >

                                {isPositive
                                    ? "↑"
                                    : "↓"
                                }

                                {" "}

                                {Math.abs(
                                    chartData.percentage
                                ).toFixed(2)}%

                            </div>


                            <div
                                className={
                                    `price-change-abs ${
                                        isPositive
                                            ? "positive"
                                            : "negative"
                                    }`
                                }
                            >

                                {chartData.difference >= 0
                                    ? "+"
                                    : ""
                                }

                                ₹

                                {chartData.difference.toFixed(2)}

                            </div>

                        </>

                    )}

                </div>


                {/* ================================= */}
                {/* PERIOD BUTTONS */}
                {/* ================================= */}

                <div className="period-tabs">

                    {[
                        "1D",
                        "5D",
                        "1M",
                        "6M",
                        "YTD",
                        "1Y",
                        "5Y",
                        "Max"
                    ].map(
                        (period, index) => (

                            <div
                                key={period}
                                className={
                                    `period-tab ${
                                        index === 2
                                            ? "active"
                                            : ""
                                    }`
                                }
                            >

                                {period}

                            </div>

                        )
                    )}

                </div>


                {/* ================================= */}
                {/* CHART */}
                {/* ================================= */}

                <div className="chart-card">

                    {points.length > 0 ? (

                        <svg
                            viewBox={
                                `0 0 ${chartWidth} ${chartHeight}`
                            }
                            width="100%"
                        >

                            <defs>

                                <linearGradient
                                    id="chartGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >

                                    <stop
                                        offset="0%"
                                        stopColor={chartColor}
                                        stopOpacity="0.25"
                                    />

                                    <stop
                                        offset="100%"
                                        stopColor={chartColor}
                                        stopOpacity="0"
                                    />

                                </linearGradient>

                            </defs>


                            {/* GRID */}

                            {[0, 1, 2, 3, 4].map(
                                index => {

                                    const y =
                                        padding.top +
                                        (
                                            index / 4
                                        ) *
                                        graphHeight;


                                    const price =
                                        chartData.maxPrice -
                                        (
                                            index / 4
                                        ) *
                                        (
                                            chartData.maxPrice -
                                            chartData.minPrice
                                        );


                                    return (

                                        <g key={index}>

                                            <line
                                                x1={padding.left}
                                                x2={
                                                    chartWidth -
                                                    padding.right
                                                }
                                                y1={y}
                                                y2={y}
                                                stroke="#262d45"
                                            />

                                            <text
                                                x="10"
                                                y={y + 5}
                                                fontSize="15"
                                                fill="#9aa1b8"
                                            >

                                                ₹

                                                {Math.round(
                                                    price
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}

                                            </text>

                                        </g>

                                    );
                                }
                            )}


                            {/* AREA */}

                            <path
                                d={areaPath}
                                fill="url(#chartGradient)"
                            />


                            {/* LINE */}

                            <path
                                d={linePath}
                                fill="none"
                                stroke={chartColor}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />


                            {/* POINTS */}

                            {points.map(
                                (point, index) => (

                                    <circle
                                        key={index}
                                        cx={point.x}
                                        cy={point.y}
                                        r="12"
                                        fill="transparent"
                                        style={{
                                            cursor: "pointer"
                                        }}
                                        onMouseEnter={() =>
                                            setHoveredPoint(
                                                point
                                            )
                                        }
                                        onMouseLeave={() =>
                                            setHoveredPoint(
                                                null
                                            )
                                        }
                                    />

                                )
                            )}

                        </svg>

                    ) : (

                        <div
                            style={{
                                padding: "80px 20px",
                                textAlign: "center"
                            }}
                        >

                            <h3>
                                Historical data unavailable
                            </h3>

                            <p>

                                {historyMessage ||
                                    "Historical price data is currently unavailable for this stock."
                                }

                            </p>

                        </div>

                    )}

                </div>


                {/* ================================= */}
                {/* HOVER INFORMATION */}
                {/* ================================= */}

                {hoveredPoint && (

                    <div className="chart-tooltip">

                        <p>

                            {hoveredPoint.date}

                        </p>

                        <strong>

                            ₹

                            {Number(
                                hoveredPoint.price
                            ).toLocaleString(
                                "en-IN"
                            )}

                        </strong>

                    </div>

                )}


                {/* ================================= */}
                {/* INVESTMENT DETAILS */}
                {/* ================================= */}

                <div className="investment-details-card">

                    <h2>
                        Your Investment
                    </h2>


                    <div className="detail-grid">

                        <div>

                            <span>
                                Quantity
                            </span>

                            <strong>
                                {investment.quantity}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Buy Price
                            </span>

                            <strong>

                                ₹

                                {Number(
                                    investment.buyPrice
                                ).toLocaleString(
                                    "en-IN"
                                )}

                            </strong>

                        </div>


                        <div>

                            <span>
                                Invested
                            </span>

                            <strong>

                                ₹

                                {investedValue.toLocaleString(
                                    "en-IN"
                                )}

                            </strong>

                        </div>


                        <div>

                            <span>
                                Current Value
                            </span>

                            <strong>

                                {calculatedCurrentValue !== null
                                    ? (

                                        <>
                                            ₹

                                            {calculatedCurrentValue
                                                .toLocaleString(
                                                    "en-IN"
                                                )
                                            }
                                        </>

                                    )
                                    : "--"
                                }

                            </strong>

                        </div>


                        <div>

                            <span>
                                Profit / Loss
                            </span>

                            <strong
                                className={
                                    profitLoss !== null
                                        ? (
                                            profitLoss >= 0
                                                ? "positive"
                                                : "negative"
                                        )
                                        : ""
                                }
                            >

                                {profitLoss !== null
                                    ? (

                                        <>
                                            {profitLoss >= 0
                                                ? "+"
                                                : ""
                                            }

                                            ₹

                                            {profitLoss
                                                .toLocaleString(
                                                    "en-IN"
                                                )
                                            }
                                        </>

                                    )
                                    : "--"
                                }

                            </strong>

                        </div>


                        <div>

                            <span>
                                Return
                            </span>

                            <strong
                                className={
                                    returnPercentage !== null
                                        ? (
                                            returnPercentage >= 0
                                                ? "positive"
                                                : "negative"
                                        )
                                        : ""
                                }
                            >

                                {returnPercentage !== null
                                    ? (

                                        <>
                                            {returnPercentage >= 0
                                                ? "+"
                                                : ""
                                            }

                                            {returnPercentage.toFixed(2)}%
                                        </>

                                    )
                                    : "--"
                                }

                            </strong>

                        </div>

                    </div>

                </div>


            </div>

        </div>

    );
}

export default InvestmentDetails;