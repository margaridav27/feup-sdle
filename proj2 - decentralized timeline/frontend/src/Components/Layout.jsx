import React from "react";
import PropTypes from "prop-types";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ port, onChangePort, children }) {
  return (
    <>
      <Navbar onChangePort={onChangePort} />
      {children}
      <Footer port={port} />
    </>
  );
}

Layout.propTypes = {
  children: PropTypes.object,
};
