import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

function InvestmentDetails() {
    const testHistory = async () => {

    try {

        const session = await fetchAuthSession();

        const token =
            session.tokens.idToken.toString();

        const response = await fetch(
            "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com/history/TCS",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log("HISTORY RESPONSE:", data);

    } catch (error) {

        console.error(
            "HISTORY ERROR:",
            error
        );

    }

};
    const { investmentId } = useParams();

    const navigate = useNavigate();

    const [investment, setInvestment] =
        useState(null);

    const [currentPrice, setCurrentPrice] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    const API_URL =
        "https://d6by2lw4za.execute-api.eu-north-1.amazonaws.com";


    const loadInvestment = async () => {

        try {

            setLoading(true);
            setError("");

            const session =
                await fetchAuthSession();

            const token =
                session.tokens.idToken.toString();


            // ==============================
            // GET INVESTMENT DETAILS
            // ==============================

            const investmentResponse =
                await fetch(
                    `${API_URL}/investments/${investmentId}`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
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


            // ==============================
            // GET REAL CURRENT PRICE
            // ==============================

            const priceResponse =
                await fetch(
                    `${API_URL}/prices/${loadedInvestment.symbol}`,
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


    useEffect(() => {

        loadInvestment();

    }, [investmentId]);


    // ==============================
    // LOADING
    // ==============================

    if (loading) {

        return (
            <div>
                
                <h1>
                    Investment Details
                </h1>

                <p>
                    Loading investment...
                </p>

            </div>
        );
    }


    // ==============================
    // ERROR
    // ==============================

    if (error) {

        return (
            <div>
                
                <h1>
                    Investment Details
                </h1>

                <p>
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


    // ==============================
    // CALCULATIONS
    // ==============================

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


    return (

        <div>
            <button onClick={testHistory}>
                    Test History
                </button>
            <h1>
                {investment.symbol}
            </h1>


            {investment.companyName && (

                <h2>
                    {investment.companyName}
                </h2>

            )}


            <h2>
                Investment Details
            </h2>


            <p>
                Current Price: ₹
                {currentPrice !== null
                    ? currentPrice.toLocaleString()
                    : "Loading..."
                }
            </p>


            <p>
                Buy Price: ₹
                {Number(
                    investment.buyPrice
                ).toLocaleString()}
            </p>


            <p>
                Quantity: {" "}
                {investment.quantity}
            </p>


            <p>
                Purchase Date: {" "}
                {investment.purchaseDate}
            </p>


            <p>
                Invested: ₹
                {investedValue.toLocaleString()}
            </p>


            <p>
                Current Value: ₹
                {calculatedCurrentValue.toLocaleString()}
            </p>


            <p>
                Profit / Loss: ₹
                {profitLoss.toLocaleString()}
            </p>


            <p>
                Return: {" "}
                {returnPercentage.toFixed(2)}%
            </p>


            <hr />


            <h2>
                Price History
            </h2>


            <div>

                Graph will come here.

            </div>


            <br />


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


export default InvestmentDetails;