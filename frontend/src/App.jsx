import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import InvestmentDetails from "./pages/InvestmentDetails";
import AddInvestment from "./pages/AddInvestment";
import ConfirmSignup from "./pages/ConfirmSignup";
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
    path="/dashboard"
    element={
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    }
/>
                <Route path="/investment/:investmentId" element={<InvestmentDetails />} />
                <Route path="/add-investment" element={<AddInvestment />} />
               <Route
    path="/confirm-signup"
    element={<ConfirmSignup />}
/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;