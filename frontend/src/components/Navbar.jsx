import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🚗 Hoy No Circula</Link>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/">Inicio</Link>
        </li>
        <li>
          <Link to="/registro">Mis Vehículos</Link>
        </li>
        <li>
          <Link to="/login" className="login-btn">
            Login
          </Link>
        </li>
        <li>
          <Link to="/admin" style={{ color: "#fd7e14" }}>
            Panel Admin
          </Link>
        </li>{" "}
      </ul>
    </nav>
  );
};

export default Navbar;
