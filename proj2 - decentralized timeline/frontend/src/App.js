import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Layout from "./Components/Layout";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Feed from "./Pages/Feed";
import Profile from "./Pages/Profile";
import Users from "./Pages/Users";

function App() {
  const [port, setPort] = useState(sessionStorage.getItem("port"));

  const onChangePort = () => {
    setPort(sessionStorage.getItem("port"));
  };

  return (
    <div className="App d-flex flex-column position-relative">
      <BrowserRouter>
        <Layout port={port} onChangePort={onChangePort}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route
              path="/login"
              element={<Login onChangePort={onChangePort} />}
            />
            <Route path="/register" element={<Register />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/profile" />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
