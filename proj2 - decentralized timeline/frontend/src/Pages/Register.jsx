import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Utils/api";
import MessageBox from "../Components/MessageBox";
import PiuPiu from "../Components/PiuPiu";

export default function Register() {
  const navigate = useNavigate();

  const [port, setPort] = useState(3001);

  const [messages, setMessages] = useState([]);
  const pushMessage = (status, message) => {
    setMessages((messages) => [...messages, { status, message }]);
  };

  const [inputValues, setInputValue] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [validation, setValidation] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const onSubmit = (e) => {
    e.preventDefault();

    const isValid = checkValidation();
    if (!isValid) return;

    api
      .post("register/", port, {
        username: inputValues.username,
        password: inputValues.password,
      })
      .then((res) => {
        console.log("Register response:", res.data);
        navigate("/login");
      })
      .catch((err) => {
        const response = err.response;
        if (response) {
          pushMessage(0, response.data.error);
          console.log("Register error:", response.data.error);
        } else {
          pushMessage(0, "Unknwon error, try again.");
          console.log("Register error:", err);
        }
      });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInputValue({ ...inputValues, [name]: value });
  };

  const checkValidation = () => {
    const errors = { ...validation };
    let result = true;

    // username validation
    if (!inputValues.username.trim()) {
      result = false;
      errors.username = "Please enter an username.";
    } else {
      errors.username = "";
    }

    // password validation
    if (!inputValues.password.trim()) {
      result = false;
      errors.password = "Please enter a password.";
    } else {
      errors.password = "";
    }

    // confirm password validation
    if (!inputValues.confirmPassword.trim()) {
      result = false;
      errors.confirmPassword = "Please enter a password confirmation.";
    } else if (inputValues.confirmPassword !== inputValues.password) {
      result = false;
      errors.confirmPassword = "Passwords don't match.";
      errors.password = "Passwords don't match.";
    } else {
      errors.confirmPassword = "";
      errors.password = "";
    }

    setValidation(errors);
    return result;
  };

  useEffect(() => {
    const port = sessionStorage.getItem("port");
    if (port && port !== 3001) {
      api
        .post("logout/", port)
        .then((_) => {
          sessionStorage.removeItem("port");
          window.location.reload(false);
        })
        .catch((err) => {
          console.log("Erro logout:", err);
          sessionStorage.removeItem("port");
          window.location.reload(false);
        });
    }
  }, []);

  return (
    <div className="container d-flex justify-content-center align-items-center flex-column h-100">
      <PiuPiu />
      <div className="row col-md-8 col-lg-6 col-xl-5 col-10 px-4">
        <div className="col-12 mb-2">
          <h3 className="w-100">Register</h3>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group mt-3">
            <label htmlFor="username" className="mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              className={
                "form-control rounded-pill bg-secondary border border-0 text-white" +
                (validation.username ? " is-invalid" : "")
              }
              onChange={(e) => handleChange(e)}
              value={inputValues.username}
            />
            {validation.username && (
              <div className="invalid-feedback">{validation.username}</div>
            )}
          </div>
          <div className="form-group mt-3">
            <label htmlFor="password" className="mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className={
                "form-control rounded-pill bg-secondary border border-0 text-white" +
                (validation.password ? " is-invalid" : "")
              }
              onChange={(e) => handleChange(e)}
              value={inputValues.password}
            />
            {validation.password && (
              <div className="invalid-feedback">{validation.password}</div>
            )}
          </div>
          <div className="form-group mt-3">
            <label htmlFor="password" className="mb-1">
              Confirm Password
            </label>
            <input
              id="password"
              type="password"
              name="confirmPassword"
              className={
                "form-control rounded-pill bg-secondary border border-0 text-white" +
                (validation.confirmPassword ? " is-invalid" : "")
              }
              onChange={(e) => handleChange(e)}
              value={inputValues.confirmPassword}
            />
            {validation.confirmPassword && (
              <div className="invalid-feedback">
                {validation.confirmPassword}
              </div>
            )}
          </div>
          <MessageBox messages={messages} setMessages={setMessages} />
          <div className="form-group mt-4 d-flex justify-content-between align-items-center">
            <span>
              Already have an account?{" "}
              <a href="/login" style={{ color: "#1D9BF0" }}>
                Login
              </a>
            </span>
            <button
              type="submit"
              className="btn btn-primary rounded-pill px-sm-5 px-3 py-2 ms-2 ms-sm-0"
              style={{
                backgroundColor: "#1D9BF0",
                fontWeight: 500,
                fontSize: "1.1rem",
              }}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
