import { BrowserRouter, Routes, Route } from "react-router-dom";
import Watchlist from "./pages/Watchlist";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import InvestmentDetails from "./pages/InvestmentDetails";
import AddInvestment from "./pages/AddInvestment";
import ConfirmSignup from "./pages/ConfirmSignup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Market from "./pages/Market";
import ProtectedRoute from "./components/ProtectedRoute";
import WatchlistDetails from "./pages/WatchlistDetails";
import "./App.css";
function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={<Login />}
                />
                <Route
    path="/watchlist/:symbol"
    element={
        <ProtectedRoute>
            <WatchlistDetails />
        </ProtectedRoute>
    }
/>
                <Route
                    path="/signup"
                    element={<Signup />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />
                <Route
    path="/watchlist"
    element={
        <ProtectedRoute>
            <Watchlist />
        </ProtectedRoute>
    }
/>
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/investment/:investmentId"
                    element={<InvestmentDetails />}
                />

                <Route
                    path="/add-investment"
                    element={<AddInvestment />}
                />

                <Route
                    path="/confirm-signup"
                    element={<ConfirmSignup />}
                />
                <Route
    path="/market"
    element={
        <ProtectedRoute>
            <Market />
        </ProtectedRoute>
    }
/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;