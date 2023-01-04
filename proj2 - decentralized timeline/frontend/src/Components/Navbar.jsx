import React from "react";
import { useLocation, Link, NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineLogout,
} from "react-icons/hi";
import Logo from "../logo.svg";
import api from "../Utils/api";

export default function Navbar({ onChangePort }) {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    console.log("logout");
    api
      .post("logout/", sessionStorage.getItem("port"))
      .then((_) => {
        sessionStorage.removeItem("port");
        onChangePort();
        navigate("/login");
      })
      .catch((err) => {
        console.log("Erro logout:", err);
        sessionStorage.removeItem("port");
        navigate("/login");
      });
  };

  return location.pathname === "/login" ||
    location.pathname === "/register" ? null : (
    <nav className="navbar navbar-expand-sm" style={{ background: "#E3E3E3" }}>
      <div className="container-fluid d-flex justify-content-between">
        <img
          src={Logo}
          alt="PiuPiu Logo"
          style={{ width: 75, height: 75 }}
        ></img>
        <ul className="navbar-nav d-flex flex-row">
          <>
            {location.pathname === "/profile" ? (
              <li className="nav-item ms-3">
                <Link className="nav-link" to="/feed">
                  <HiOutlineHome size={30} color="#15202B" />
                </Link>
              </li>
            ) : (
              <li className="nav-item ms-3">
                <Link className="nav-link" to="/profile">
                  <HiOutlineUser size={30} color="#15202B" />
                </Link>
              </li>
            )}
            {location.pathname === "/users" ? (
              <li className="nav-item ms-3">
                <Link className="nav-link" to="/feed">
                  <HiOutlineHome size={30} color="#15202B" />
                </Link>
              </li>
            ) : (
              <li className="nav-item ms-3">
                <Link className="nav-link" to="/users">
                  <HiOutlineUsers size={30} color="#15202B" />
                </Link>
              </li>
            )}
            <li className="nav-item ms-3">
              <NavLink className="nav-link" onClick={logout}>
                <HiOutlineLogout size={30} color="#15202B" />
              </NavLink>
            </li>
          </>
        </ul>
      </div>
    </nav>
  );
}
