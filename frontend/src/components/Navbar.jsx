import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";

function Navbar() {

    const navigate = useNavigate();

    const handleLogout = async () => {

        try {

            await signOut();
            navigate("/");

        } catch (error) {

            console.error("LOGOUT ERROR:", error);
        }
    };

    const navLinkClass = ({ isActive }) =>
        `navbar-link${isActive ? " active" : ""}`;

    return (

        <header className="navbar">
            <div className="navbar-inner">

                <NavLink to="/dashboard" className="navbar-brand">
                    <span className="navbar-brand-mark">📈</span>
                    <span className="navbar-brand-text">StockTracker</span>
                </NavLink>

                <nav className="navbar-links">
                    <NavLink to="/dashboard" className={navLinkClass}>
                        Portfolio
                    </NavLink>
                    <NavLink to="/market" className={navLinkClass}>
                        Market
                    </NavLink>
                    <NavLink to="/watchlist" className={navLinkClass}>
                        Watchlist
                    </NavLink>
                </nav>

                <div className="navbar-actions">
                    <NavLink to="/add-investment" className="btn btn-primary btn-sm navbar-add-btn">
                        + Add Investment
                    </NavLink>
                    <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

            </div>
        </header>

    );
}

export default Navbar;
