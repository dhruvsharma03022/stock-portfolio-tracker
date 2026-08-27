import { useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

function Market() {

    const API_URL =
        "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com";

    const [searchQuery, setSearchQuery] =
        useState("");
    const [watchlistLoading, setWatchlistLoading] = useState(false);
const [watchlistMessage, setWatchlistMessage] = useState("");
    const [stocks, setStocks] =
        useState([]);

    const [showDropdown, setShowDropdown] =
        useState(false);

    const [selectedStock, setSelectedStock] =
        useState(null);

    const [currentPrice, setCurrentPrice] =
        useState(null);

    const [historyData, setHistoryData] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [hoveredPoint, setHoveredPoint] =
        useState(null);


    // ==========================================
    // SEARCH STOCKS
    // ==========================================

    const handleStockSearch =
        async (value) => {

            setSearchQuery(value);

            setSelectedStock(null);
            setCurrentPrice(null);
            setHistoryData([]);
            setError("");

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
                        `${API_URL}/stocks/search?q=${encodeURIComponent(value)}`,
                        {
                            headers: {
                                Authorization:
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

                setStocks(
                    data.stocks || []
                );

                setShowDropdown(true);

            } catch (error) {

                console.error(
                    "SEARCH ERROR:",
                    error
                );

                setStocks([]);
                setShowDropdown(false);

                setError(
                    error.message ||
                    "Failed to search stocks"
                );

            }
        };


    // ==========================================
    // SELECT STOCK
    // ==========================================

    const handleSelectStock =
        async (stock) => {

            setSelectedStock(stock);

            setSearchQuery(
                `${stock.name} (${stock.symbol})`
            );

            setShowDropdown(false);

            setCurrentPrice(null);
            setHistoryData([]);
            setHoveredPoint(null);
            setLoading(true);
            setError("");

            try {

                const session =
                    await fetchAuthSession();

                const token =
                    session.tokens.idToken.toString();


                // ==========================================
                // CURRENT PRICE
                // ==========================================

                const priceResponse =
                    await fetch(
                        `${API_URL}/prices/${stock.symbol}`,
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
                // 1 MONTH HISTORY
                // ==========================================

                const historyResponse =
                    await fetch(
                        `${API_URL}/history/${stock.symbol}`,
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
                                            Number(
                                                item.price
                                            )
                                    };

                                }


                                // Array format
                                if (
                                    Array.isArray(item)
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

                } else {

                    setHistoryData([]);

                }

            } catch (error) {

                console.error(
                    "MARKET ERROR:",
                    error
                );

                setError(
                    error.message ||
                    "Failed to load stock data"
                );

            } finally {

                setLoading(false);

            }
        };


    // ==========================================
    // CHART CALCULATIONS
    // ==========================================

    const chartData =
        useMemo(() => {

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


    // ==========================================
    // LINE PATH
    // ==========================================

    const linePath =
        points
            .map(
                (point, index) =>
                    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");


    // ==========================================
    // AREA PATH
    // ==========================================

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
    // RENDER
    // ==========================================
    const handleAddToWatchlist = async () => {

    if (!selectedStock) {
        return;
    }

    try {

        setWatchlistLoading(true);
        setWatchlistMessage("");
        setError("");

        const session =
            await fetchAuthSession();

        const token =
            session.tokens.idToken.toString();

        const response =
            await fetch(
                "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com/watchlist",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        symbol: selectedStock.symbol,
                        companyName: selectedStock.name,
                        exchange: selectedStock.exchange
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "WATCHLIST RESPONSE:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to add stock to watchlist"
            );
        }

        setWatchlistMessage(
            "⭐ Stock added to watchlist!"
        );

    } catch (error) {

        console.error(
            "WATCHLIST ERROR:",
            error
        );

        setWatchlistMessage(
            error.message ||
            "Failed to add stock to watchlist"
        );

    } finally {

        setWatchlistLoading(false);

    }
};
    return (

        <div className="page">
          <div className="page-inner">

            {/* =====================================
                PAGE TITLE
            ===================================== */}

            <div className="topbar">
                <h1 className="topbar-title">
                    Market Explorer
                </h1>
            </div>


            {/* =====================================
                SEARCH
            ===================================== */}

            <div className="form-group stock-search">

                <label className="form-label">
                    Search Company
                </label>

                <input
                    className="form-input"
                    type="text"
                    placeholder="Search TCS, Infosys, Reliance..."
                    value={searchQuery}
                    onChange={(e) =>
                        handleStockSearch(
                            e.target.value
                        )
                    }
                />


                {/* =================================
                    SEARCH DROPDOWN
                ================================= */}

                {showDropdown &&
                    stocks.length > 0 && (

                    <div className="stock-dropdown">

                        {stocks.map(
                            (stock) => (

                                <div
                                    className="stock-dropdown-item"
                                    key={
                                        stock.symbol
                                    }

                                    onClick={() =>
                                        handleSelectStock(
                                            stock
                                        )
                                    }
                                >

                                    <strong className="stock-dropdown-name">
                                        {stock.name}
                                    </strong>

                                    <small className="stock-dropdown-meta">
                                        {stock.symbol}
                                        {" • "}
                                        {stock.exchange}
                                    </small>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* =====================================
                ERROR
            ===================================== */}

            {error && (

                <p className="error-text">
                    {error}
                </p>

            )}


            {/* =====================================
                LOADING
            ===================================== */}

            {loading && (

                <p className="loading-text">
                    Loading stock data...
                </p>

            )}


            {/* =====================================
                STOCK DETAILS
            ===================================== */}

            {!loading &&
                selectedStock && (

                <div>


                    {/* STOCK NAME */}

                    <div className="detail-header">
                        <div>
                            <h2 className="detail-symbol">
                                {selectedStock.name}
                            </h2>

                            <p className="detail-company">
                                {selectedStock.symbol}
                                {" • "}
                                {selectedStock.exchange}
                            </p>
                        </div>
                    </div>


                    {/* =================================
                        CURRENT PRICE
                    ================================= */}

                    <div className="price-row">

                        <div className="price-current">
                            ₹
                            {currentPrice !== null
                                ? currentPrice.toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits:
                                            2,

                                        maximumFractionDigits:
                                            2
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
                                    ).toFixed(2)}

                                    %

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


                    {/* =================================
                        PERIOD
                    ================================= */}

                    <div className="period-tabs">

                        <div className="period-tab active">
                            1M
                        </div>

                    </div>


                    {/* =================================
                        CHART
                    ================================= */}

                    <h3 style={{ marginTop: "24px" }}>
                        1 Month Price History
                    </h3>


                    <div className="chart-card">

                        {points.length > 0 ? (

                            <svg
                                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                width="100%"
                            >

                                <defs>

                                    <linearGradient
                                        id="marketChartGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >

                                        <stop
                                            offset="0%"
                                            stopColor={
                                                chartColor
                                            }
                                            stopOpacity="0.25"
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor={
                                                chartColor
                                            }
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

                                            <g
                                                key={
                                                    index
                                                }
                                            >

                                                <line
                                                    x1={
                                                        padding.left
                                                    }

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
                                                    y={
                                                        y + 5
                                                    }

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
                                    fill="url(#marketChartGradient)"
                                />


                                {/* LINE */}

                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke={
                                        chartColor
                                    }
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />


                                {/* INTERACTIVE POINTS */}

                                {points.map(
                                    (
                                        point,
                                        index
                                    ) => (

                                        <circle
                                            key={
                                                index
                                            }

                                            cx={
                                                point.x
                                            }

                                            cy={
                                                point.y
                                            }

                                            r="12"

                                            fill="transparent"

                                            style={{
                                                cursor:
                                                    "pointer"
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

                                            y1={
                                                padding.top
                                            }

                                            y2={
                                                padding.top +
                                                graphHeight
                                            }

                                            stroke="#656d87"

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

                                            fill={
                                                chartColor
                                            }
                                        />


                                        <rect
                                            x={
                                                Math.min(
                                                    hoveredPoint.x +
                                                        15,
                                                    chartWidth -
                                                        190
                                                )
                                            }

                                            y={
                                                Math.max(
                                                    hoveredPoint.y -
                                                        65,
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
                                                    hoveredPoint.x +
                                                        28,
                                                    chartWidth -
                                                        177
                                                )
                                            }

                                            y={
                                                Math.max(
                                                    hoveredPoint.y -
                                                        40,
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
                                                    minimumFractionDigits:
                                                        2,

                                                    maximumFractionDigits:
                                                        2
                                                }
                                            )}

                                        </text>


                                        <text
                                            x={
                                                Math.min(
                                                    hoveredPoint.x +
                                                        28,
                                                    chartWidth -
                                                        177
                                                )
                                            }

                                            y={
                                                Math.max(
                                                    hoveredPoint.y -
                                                        18,
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
                                                    points.length /
                                                        5
                                                ) ===
                                            0
                                    )
                                    .map(
                                        (
                                            point,
                                            index
                                        ) => (

                                            <text
                                                key={
                                                    index
                                                }

                                                x={
                                                    point.x
                                                }

                                                y={
                                                    chartHeight -
                                                    15
                                                }

                                                textAnchor="middle"

                                                fontSize="14"

                                                fill="#9aa1b8"
                                            >
                                                {
                                                    point.date
                                                }
                                            </text>

                                        )
                                    )}

                            </svg>

                        ) : (

                            !loading && (

                                <div className="chart-empty">
                                    No price history available
                                </div>

                            )

                        )}

                    </div>


                    {/* =================================
                        WATCHLIST BUTTON
                    ================================= */}

                    <div className="back-button-row">

                        <button
    className="btn btn-primary"
    onClick={handleAddToWatchlist}
    disabled={watchlistLoading}
>
    {watchlistLoading
        ? "Adding..."
        : "⭐ Add to Watchlist"
    }
</button>

{watchlistMessage && (
    <p className="loading-text" style={{ marginTop: "10px" }}>
        {watchlistMessage}
    </p>
)}

                    </div>

                </div>

            )}

          </div>
        </div>

    );
}

export default Market;
