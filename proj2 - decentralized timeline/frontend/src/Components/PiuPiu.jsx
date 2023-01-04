import React from "react";
import Logo from "../logo.svg";

export default function PiuPiu() {
  return (
    <div className="top-0 start-0 mb-3 mb-sm-0">
      <img
        src={Logo}
        alt="PiuPiu Logo"
        style={{ width: 130, height: 130 }}
        className="img-fluid"
      ></img>
      <p className="mt-0 d-none d-sm-block" style={{ color: "#1D9BF0" }}>
        Welcome to PiuPiu
      </p>
    </div>
  );
}
