import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

function WatchlistDetails() {

    const { symbol } = useParams();
    const navigate = useNavigate();

    const [stock, setStock] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const API_URL =
        "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com";


    // ==========================================
    // LOAD WATCHLIST STOCK
    // ==========================================

    useEffect(() => {

        const loadStock = async () => {

            try {

                setLoading(true);
                setError("");

                const session =
                    await fetchAuthSession();

                const token =
                    session.tokens.idToken.toString();


                // ==========================================
                // GET WATCHLIST
                // ==========================================

                const watchlistResponse =
                    await fetch(
                        `${API_URL}/watchlist`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );


                const watchlistData =
                    await watchlistResponse.json();


                console.log(
                    "WATCHLIST RESPONSE:",
                    watchlistData
                );


                if (!watchlistResponse.ok) {

                    throw new Error(
                        watchlistData.message ||
                        "Failed to load watchlist"
                    );

                }


                const foundStock =
                    (watchlistData.watchlist || [])
                        .find(
                            item =>
                                item.symbol ===
                                symbol.toUpperCase()
                        );


                if (!foundStock) {

                    throw new Error(
                        "Stock not found in watchlist"
                    );

                }


                setStock(foundStock);


                // ==========================================
                // GET CURRENT PRICE
                // ==========================================

                const priceResponse =
                    await fetch(
                        `${API_URL}/prices/${symbol}`,
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
                    Number(
                        priceData.currentPrice
                    )
                );


                // ==========================================
                // GET HISTORY
                // ==========================================

                const historyResponse =
                    await fetch(
                        `${API_URL}/history/${symbol}`,
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

                                // Object format

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


                                // Array format
                                // ["2026-07-27", "213.96"]

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
                    "WATCHLIST DETAILS ERROR:",
                    error
                );

                setError(
                    error.message ||
                    "Failed to load stock"
                );

            } finally {

                setLoading(false);

            }

        };


        loadStock();

    }, [symbol]);


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

            <div className="state-page">

                <h1>
                    Loading stock...
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
                    Stock Details
                </h1>


                <p className="error-text">
                    {error}
                </p>


                <button className="btn btn-secondary"
                    onClick={() =>
                        navigate("/watchlist")
                    }
                >
                    ← Back to Watchlist
                </button>

            </div>

        );

    }


    if (!stock) {
        return null;
    }


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
            chartData.minPrice ||
            1;


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
                L ${points[points.length - 1].x}
                  ${padding.top + graphHeight}
                L ${points[0].x}
                  ${padding.top + graphHeight}
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


    // ==========================================
    // UI
    // ==========================================

    return (

        <div className="page">
          <div className="page-inner">


            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <div className="detail-header">

                <div>

                    <h1 className="detail-symbol">
                        {stock.symbol}
                    </h1>


                    <p className="detail-company">
                        {stock.companyName}
                    </p>

                </div>


                <div className="status-pill">
                    ⭐ In Watchlist
                </div>

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

                        <div className={`price-change-badge ${isPositive ? "positive" : "negative"}`}>

                            {isPositive
                                ? "↑"
                                : "↓"
                            }

                            {" "}

                            {Math.abs(
                                chartData.percentage
                            ).toFixed(2)}%

                        </div>


                        <div className={`price-change-abs ${isPositive ? "positive" : "negative"}`}>

                            {chartData.difference >= 0
                                ? "+"
                                : ""
                            }

                            ₹
                            {chartData.difference.toFixed(
                                2
                            )}

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
                            className={`period-tab ${index === 2 ? "active" : ""}`}
                        >
                            {period}
                        </div>

                    )
                )}

            </div>


            {/* ================================= */}
            {/* GRAPH */}
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
                                id="watchlistChartGradient"
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
                            fill="url(#watchlistChartGradient)"
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
                                    style={{ cursor: "pointer" }}
                                    onMouseEnter={() =>
                                        setHoveredPoint(point)
                                    }
                                    onMouseLeave={() =>
                                        setHoveredPoint(null)
                                    }
                                />

                            )
                        )}


                        {/* TOOLTIP */}

                        {hoveredPoint && (

                            <g>

                                <line
                                    x1={hoveredPoint.x}
                                    x2={hoveredPoint.x}
                                    y1={padding.top}
                                    y2={
                                        padding.top +
                                        graphHeight
                                    }
                                    stroke="#656d87"
                                    strokeDasharray="4 5"
                                />

                                <circle
                                    cx={hoveredPoint.x}
                                    cy={hoveredPoint.y}
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
                                    fill="#1a2036"
                                    stroke="#262d45"
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
                                    fill="#e7e9f2"
                                >

                                    ₹
                                    {hoveredPoint.price.toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
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
                                    fill="#9aa1b8"
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

                                        fill="#9aa1b8"
                                    >
                                        {point.date}
                                    </text>

                                )
                            )}

                    </svg>

                ) : (

                    <div className="chart-empty">
                        No price history available
                    </div>

                )}

            </div>


            {/* ================================= */}
            {/* STOCK INFORMATION */}
            {/* ================================= */}

            <div className="stat-grid">

                <div>
                    <div className="stat-label">
                        Company
                    </div>
                    <div className="stat-value">
                        {stock.companyName}
                    </div>
                </div>

                <div>
                    <div className="stat-label">
                        Symbol
                    </div>
                    <div className="stat-value">
                        {stock.symbol}
                    </div>
                </div>

                <div>
                    <div className="stat-label">
                        Exchange
                    </div>
                    <div className="stat-value">
                        {stock.exchange}
                    </div>
                </div>

                <div>
                    <div className="stat-label">
                        Added On
                    </div>
                    <div className="stat-value">
                        {new Date(
                            stock.createdAt
                        ).toLocaleDateString(
                            "en-IN"
                        )}
                    </div>
                </div>

            </div>


            {/* ================================= */}
            {/* BACK BUTTON */}
            {/* ================================= */}

            <div className="back-button-row">
                <button
                    className="btn btn-secondary"
                    onClick={() =>
                        navigate("/watchlist")
                    }
                >
                    ← Back to Watchlist
                </button>
            </div>

          </div>
        </div>

    );

}

export default WatchlistDetails;
