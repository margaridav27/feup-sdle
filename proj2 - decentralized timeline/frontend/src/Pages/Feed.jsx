import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Utils/api";
import { IoMdSend } from "react-icons/io";
import { AiFillDelete } from "react-icons/ai";

export default function Feed() {
  const navigate = useNavigate();
  const port = sessionStorage.getItem("port");
  const [feed, setFeed] = useState([]);
  const [post, setPost] = useState("");

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

  const fetchFeed = () => {
    if (!port) {
      // Read offline posts
      api
        .get("offline/", 3001)
        .then((res) => {
          console.log("Offline feed response:", res.data.feed);

          const date = Date.now();
          const newFeed = res.data.feed.map((post) => {
            post.date = getTimeDiference(date, post.date);
            return post;
          });
          setFeed(newFeed);
        })
        .catch((err) => {
          if (err.code === "ERR_NETWORK") {
            sessionStorage.removeItem("port");
            navigate("/login");
          }
          console.log("Error fetching feed:", err);
        });
      return;
    }

    api
      .get("feed/", port)
      .then((res) => {
        console.log("Feed response:", res.data.feed);

        const date = Date.now();
        const newFeed = res.data.feed.map((post) => {
          post.date = getTimeDiference(date, post.date);
          return post;
        });
        setFeed(newFeed);
      })
      .catch((err) => {
        if (err.code === "ERR_NETWORK") {
          sessionStorage.removeItem("port");
          navigate("/login");
        }
        console.log("Error fetching feed:", err);
      });
  };

  const handleDeletion = () => {
    setPost("");
  };

  const handlePost = (e) => {
    if (post.length > 200 || post.length <= 0) {
      e.preventDefault();
      return;
    }

    if (!port) {
      api
        .post("offline/", 3001, { message: post })
        .then((res) => {
          console.log("Post response", res.data);
          setPost("");
          fetchFeed();
        })
        .catch((err) => {
          console.log("Post error:", err);
        });
      return;
    }

    api
      .post("post/", port, { message: post })
      .then((res) => {
        console.log("Post response", res.data);
        setPost("");
        fetchFeed();
      })
      .catch((err) => {
        console.log("Post error:", err);
      });
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <>
      <div className="container d-flex flex-column align-items-center mt-5">
        <div className="row col-sm-7 col-lg-5 col-10">
          <div>
            <div className="form-group mt-3 position-relative">
              <textarea
                id="post"
                name="post"
                rows={4}
                className="form-control rounded bg-secondary border-0 text-white px-3"
                placeholder="What's piuing?"
                value={post}
                onChange={(e) => setPost(e.target.value)}
              />
              <div className="position-absolute d-flex end-0 bottom-0 justify-content-center align-items-center me-2 mb-1">
                <span
                  className=""
                  style={{
                    color: post.length > 200 ? "red" : "#15202B",
                  }}
                >
                  {post.length}
                </span>
                <span className="me-2" style={{ color: "#15202B" }}>
                  /200
                </span>
                <AiFillDelete
                  className="me-2"
                  style={{
                    color: "#15202B",
                    cursor: "pointer",
                  }}
                  onClick={handleDeletion}
                />
                <IoMdSend
                  style={{
                    color: "#15202B",
                    cursor: "pointer",
                  }}
                  onClick={handlePost}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row col-sm-7 col-lg-5 col-10 justify-content-center my-5">
          <hr
            style={{ height: "3px", backgroundColor: "white" }}
            className="border border-0"
          />
          {feed.map((post, idx) => {
            return (
              <div className="row" key={"id " + idx}>
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
                        {post.date}
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
