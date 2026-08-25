import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

function InvestmentDetails() {

    const { investmentId } = useParams();
    const navigate = useNavigate();

    const [investment, setInvestment] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const API_URL =
        "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com";


    // ==========================================
    // LOAD INVESTMENT DATA
    // ==========================================

    useEffect(() => {

        const loadInvestment = async () => {

            try {

                setLoading(true);
                setError("");

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

                setInvestment(
                    loadedInvestment
                );


                // ==========================================
                // GET CURRENT PRICE
                // ==========================================

                const priceResponse =
                    await fetch(
                        `${API_URL}/prices/${loadedInvestment.symbol}`,
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

                    throw new Error(
                        priceData.message ||
                        "Failed to load current price"
                    );

                }

                setCurrentPrice(
                    Number(priceData.currentPrice)
                );


                // ==========================================
                // GET HISTORY
                // ==========================================

                const historyResponse =
                    await fetch(
                        `${API_URL}/history/${loadedInvestment.symbol}`,
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

                if (!historyResponse.ok) {

                    throw new Error(
                        historyResponseData.message ||
                        "Failed to load history"
                    );

                }


                // ==========================================
                // FIND PRICE DATASET
                // ==========================================

                const priceDataset =
                    historyResponseData
                        ?.historyData
                        ?.datasets
                        ?.find(
                            dataset =>
                                dataset.metric === "Price"
                        );

                console.log(
                    "PRICE DATASET:",
                    priceDataset
                );


                // ==========================================
                // FORMAT HISTORY
                // ==========================================

                if (priceDataset?.values) {

                    const formattedHistory =
                        priceDataset.values
                            .map(item => {

                                if (
                                    item &&
                                    typeof item === "object" &&
                                    !Array.isArray(item)
                                ) {

                                    return {
                                        date:
                                            item.date,

                                        price:
                                            Number(item.price)
                                    };

                                }

                                if (Array.isArray(item)) {

                                    return {
                                        date:
                                            item[0],

                                        price:
                                            Number(item[1])
                                    };

                                }

                                return null;

                            })
                            .filter(
                                item =>
                                    item &&
                                    item.date &&
                                    !Number.isNaN(
                                        item.price
                                    )
                            );

                    console.log(
                        "FORMATTED HISTORY:",
                        formattedHistory
                    );

                    setHistoryData(
                        formattedHistory
                    );

                }


            } catch (error) {

                console.error(
                    "INVESTMENT DETAILS ERROR:",
                    error
                );

                setError(
                    error.message ||
                    "Failed to load investment"
                );

            } finally {

                setLoading(false);

            }

        };

        loadInvestment();

    }, [investmentId]);


    // ==========================================
    // CHART CALCULATIONS
    // ==========================================

    const chartData = useMemo(() => {

        if (!historyData.length) {
            return null;
        }

        const prices =
            historyData.map(
                item => item.price
            );

        const minPrice =
            Math.min(...prices);

        const maxPrice =
            Math.max(...prices);

        const firstPrice =
            prices[0];

        const lastPrice =
            prices[prices.length - 1];

        const difference =
            lastPrice - firstPrice;

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

            <div
                style={{
                    padding: "60px",
                    textAlign: "center"
                }}
            >
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

            <div
                style={{
                    padding: "60px",
                    textAlign: "center"
                }}
            >

                <h1>
                    Investment Details
                </h1>

                <p
                    style={{
                        color: "red"
                    }}
                >
                    {error}
                </p>

                <button
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
        Number(investment.quantity) *
        Number(currentPrice);

    const profitLoss =
        calculatedCurrentValue -
        investedValue;

    const returnPercentage =
        investedValue === 0
            ? 0
            : (
                profitLoss /
                investedValue
            ) * 100;


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
            chartData.maxPrice -
            chartData.minPrice || 1;

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
            ? `
                ${linePath}
                L ${points[points.length - 1].x} ${padding.top + graphHeight}
                L ${points[0].x} ${padding.top + graphHeight}
                Z
            `
            : "";


    const isPositive =
        chartData
            ? chartData.difference >= 0
            : true;


    const chartColor =
        isPositive
            ? "#2f855a"
            : "#dc2626";


    return (

        <div
            style={{
                maxWidth: "1150px",
                margin: "30px auto",
                padding: "20px",
                fontFamily:
                    "Arial, sans-serif",
                color: "#1f2937"
            }}
        >


            {/* ================================= */}
            {/* STOCK HEADER */}
            {/* ================================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "20px"
                }}
            >

                <div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "42px",
                            fontWeight: "600"
                        }}
                    >
                        {investment.symbol}
                    </h1>

                    {investment.companyName && (

                        <p
                            style={{
                                color: "#6b7280",
                                fontSize: "17px"
                            }}
                        >
                            {investment.companyName}
                        </p>

                    )}

                </div>


                <button
                    style={{
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "13px 28px",
                        borderRadius: "28px",
                        fontSize: "17px",
                        cursor: "pointer"
                    }}
                >
                    + Follow
                </button>

            </div>


            {/* ================================= */}
            {/* CURRENT PRICE */}
            {/* ================================= */}

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                    flexWrap: "wrap",
                    marginTop: "30px"
                }}
            >

                <div
                    style={{
                        fontSize: "48px",
                        fontWeight: "500"
                    }}
                >
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
                            style={{
                                background:
                                    isPositive
                                        ? "#e7f3ec"
                                        : "#fde8e8",

                                color:
                                    chartColor,

                                padding:
                                    "10px 16px",

                                borderRadius:
                                    "12px",

                                fontSize:
                                    "21px",

                                fontWeight:
                                    "500"
                            }}
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
                            style={{
                                fontSize: "21px",
                                color: chartColor
                            }}
                        >
                            {chartData.difference >= 0
                                ? "+"
                                : ""
                            }

                            ₹
                            {chartData.difference.toFixed(2)}

                            {" today"}
                        </div>

                    </>

                )}

            </div>


            {/* ================================= */}
            {/* PERIOD BUTTONS */}
            {/* ================================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "35px",
                    borderBottom:
                        "1px solid #e5e7eb"
                }}
            >

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
                            style={{
                                padding:
                                    "14px 10px",
                                color:
                                    index === 2
                                        ? "#2563eb"
                                        : "#4b5563",
                                fontSize:
                                    "18px",
                                borderBottom:
                                    index === 2
                                        ? "4px solid #2563eb"
                                        : "4px solid transparent"
                            }}
                        >
                            {period}
                        </div>

                    )
                )}

            </div>


            {/* ================================= */}
            {/* CUSTOM SVG CHART */}
            {/* ================================= */}

            <div
                style={{
                    width: "100%",
                    marginTop: "20px",
                    overflowX: "auto",
                    background: "#ffffff"
                }}
            >

                {points.length > 0 ? (

                    <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        width="100%"
                        style={{
                            minWidth: "700px",
                            overflow: "visible"
                        }}
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


                        {/* GRID LINES */}

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
                                            stroke="#e5e7eb"
                                        />

                                        <text
                                            x="10"
                                            y={y + 5}
                                            fontSize="15"
                                            fill="#4b5563"
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


                        {/* INTERACTIVE POINTS */}

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


                        {/* TOOLTIP */}

                        {hoveredPoint && (

                            <g>

                                <line
                                    x1={
                                        hoveredPoint.x
                                    }
                                    x2={
                                        hoveredPoint.x
                                    }
                                    y1={padding.top}
                                    y2={
                                        padding.top +
                                        graphHeight
                                    }
                                    stroke="#6b7280"
                                    strokeDasharray="4 5"
                                />

                                <circle
                                    cx={
                                        hoveredPoint.x
                                    }
                                    cy={
                                        hoveredPoint.y
                                    }
                                    r="6"
                                    fill={chartColor}
                                />

                                <rect
                                    x={
                                        Math.min(
                                            hoveredPoint.x + 15,
                                            chartWidth - 190
                                        )
                                    }
                                    y={
                                        Math.max(
                                            hoveredPoint.y - 65,
                                            10
                                        )
                                    }
                                    width="175"
                                    height="55"
                                    rx="8"
                                    fill="white"
                                    stroke="#d1d5db"
                                />

                                <text
                                    x={
                                        Math.min(
                                            hoveredPoint.x + 28,
                                            chartWidth - 177
                                        )
                                    }
                                    y={
                                        Math.max(
                                            hoveredPoint.y - 40,
                                            35
                                        )
                                    }
                                    fontSize="16"
                                    fill="#111827"
                                >
                                    ₹
                                    {hoveredPoint.price.toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits: 2
                                        }
                                    )}
                                </text>

                                <text
                                    x={
                                        Math.min(
                                            hoveredPoint.x + 28,
                                            chartWidth - 177
                                        )
                                    }
                                    y={
                                        Math.max(
                                            hoveredPoint.y - 18,
                                            55
                                        )
                                    }
                                    fontSize="13"
                                    fill="#6b7280"
                                >
                                    {hoveredPoint.date}
                                </text>

                            </g>

                        )}


                        {/* X AXIS DATES */}

                        {points
                            .filter(
                                (_, index) =>
                                    index %
                                    Math.ceil(
                                        points.length / 5
                                    ) === 0
                            )
                            .map(
                                (point, index) => (

                                    <text
                                        key={index}

                                        x={point.x}

                                        y={
                                            chartHeight -
                                            15
                                        }

                                        textAnchor="middle"

                                        fontSize="14"

                                        fill="#4b5563"
                                    >
                                        {point.date}
                                    </text>

                                )
                            )}

                    </svg>

                ) : (

                    <div
                        style={{
                            height: "350px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        No price history available
                    </div>

                )}

            </div>


            {/* ================================= */}
            {/* INVESTMENT STATS */}
            {/* ================================= */}

            <div
                style={{
                    marginTop: "30px",
                    paddingTop: "25px",
                    borderTop:
                        "1px solid #e5e7eb",
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "25px"
                }}
            >

                <div>
                    <p>Buy Price</p>
                    <strong>
                        ₹
                        {Number(
                            investment.buyPrice
                        ).toLocaleString()}
                    </strong>
                </div>

                <div>
                    <p>Quantity</p>
                    <strong>
                        {investment.quantity}
                    </strong>
                </div>

                <div>
                    <p>Invested</p>
                    <strong>
                        ₹
                        {investedValue.toLocaleString()}
                    </strong>
                </div>

                <div>
                    <p>Current Value</p>
                    <strong>
                        ₹
                        {calculatedCurrentValue.toLocaleString()}
                    </strong>
                </div>

                <div>
                    <p>Profit / Loss</p>

                    <strong
                        style={{
                            color:
                                profitLoss >= 0
                                    ? "#2f855a"
                                    : "#dc2626"
                        }}
                    >
                        ₹
                        {profitLoss.toLocaleString()}
                    </strong>
                </div>

                <div>
                    <p>Return</p>

                    <strong
                        style={{
                            color:
                                returnPercentage >= 0
                                    ? "#2f855a"
                                    : "#dc2626"
                        }}
                    >
                        {returnPercentage.toFixed(2)}%
                    </strong>
                </div>

            </div>


            {/* ================================= */}
            {/* BACK */}
            {/* ================================= */}

            <button
                onClick={() =>
                    navigate("/dashboard")
                }

                style={{
                    marginTop: "40px",
                    padding: "12px 20px",
                    background: "white",
                    border:
                        "1px solid #d1d5db",
                    borderRadius: "8px",
                    cursor: "pointer"
                }}
            >
                ← Back to Dashboard
            </button>

        </div>

    );

}

export default InvestmentDetails;