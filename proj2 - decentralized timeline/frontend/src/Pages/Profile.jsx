import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Utils/api";
import LoadingSpinner from "../Components/LoadingSpinner";

export default function Users() {
  const navigate = useNavigate();
  const port = sessionStorage.getItem("port");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({
    username: "",
    following: [],
    followers: [],
    timeline: [],
  });

  const getTimeDiference = (currDate, date) => {
    const secondDiff = (currDate - date) / 1000;
    const minuteDiff = secondDiff / 60;
    const hourDiff = minuteDiff / 60;
    const dayDiff = hourDiff / 24;
    const monthDiff = dayDiff / 30;
    const yearDiff = monthDiff / 12;

    if (yearDiff >= 1) {
      return Math.floor(yearDiff) + " years ago";
    }
    if (monthDiff >= 1) {
      return Math.floor(monthDiff) + " months ago";
    }
    if (dayDiff >= 1) {
      return Math.floor(dayDiff) + " days ago";
    }
    if (hourDiff >= 1) {
      return Math.floor(hourDiff) + " hours ago";
    }
    if (minuteDiff >= 1) {
      return Math.floor(minuteDiff) + " minutes ago";
    }
    if (secondDiff >= 1) {
      return Math.floor(secondDiff) + " seconds ago";
    }
    return "Just now";
  };

  const fetchProfile = () => {
    api
      .get("profile/", port)
      .then((res) => {
        console.log("Response:", res.data);
        setUser(res.data.user);
        setIsLoading(false);
      })
      .catch((_) => {
        setIsLoading(false);
        sessionStorage.removeItem("port");
        navigate("/login");
      });
  };

  useEffect(() => {
    if (!port || port === 3001) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, []);

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="container d-flex flex-column align-items-center mt-5">
        <div className="row col-sm-7 col-lg-5 col-10">
          <div>
            <div
              className="rounded mt-3 pt-3 pb-3"
              style={{ background: "#E3E3E3" }}
            >
              <h5
                className="card-title me-3 ms-3"
                style={{ fontWeight: 700, color: "#15202B" }}
              >
                {user.username}
              </h5>
              <div className="d-flex flex-wrap justify-content-end me-3">
                <small className="card-subtitle text-muted ms-2">
                  <b>{user.followers.length}</b> followers
                </small>
                <small className="card-subtitle text-muted ms-2">
                  <b>{user.following.length}</b> following
                </small>
              </div>
            </div>
          </div>
        </div>
        <div className="row col-sm-7 col-lg-5 col-10 justify-content-center my-5">
          <hr
            style={{ height: "3px", backgroundColor: "white" }}
            className="border border-0"
          />
          {user.timeline &&
            user.timeline.map((post) => {
              const date = Date.now();
              return (
                <div
                  className="row"
                  key={"id " + post.username + post.date.toString()}
                >
                  <div className="card bg-transparent border-0 text-white mt-3">
                    <div className="card-body">
                      <div className="d-flex flex-direction-row align-items-center">
                        <h5
                          className="card-title me-2"
                          style={{ fontWeight: 700 }}
                        >
                          {post.username}
                        </h5>
                        <small className="card-subtitle text-muted">
                          {getTimeDiference(date, post.date)}
                        </small>
                      </div>
                      <p className="card-text mt-2">{post.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
