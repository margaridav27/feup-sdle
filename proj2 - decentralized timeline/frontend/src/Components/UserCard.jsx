import React from "react";
import PropTypes from "prop-types";

UserCard.propTypes = {
  user: PropTypes.object.isRequired,
  handleClick: PropTypes.func.isRequired,
};

export default function UserCard(props) {
  const mouseOver = (e) => {
    if (e.target.innerText === "Follow") {
      e.target.style.color = "white";
      e.target.style.borderColor = "#15202B";
      e.target.style.backgroundColor = "#15202B";
      return;
    }

    e.target.style.color = "red";
    e.target.style.borderColor = "#f5c2c7";
    e.target.style.backgroundColor = "#f8d7da";

    e.target.innerText = "Unfollow";
  };

  const mouseLeave = (e) => {
    e.target.style.color = "#15202B";
    e.target.style.borderColor = "#15202B";
    e.target.style.background = "white";
    if (e.target.innerText === "Follow") return;

    e.target.innerText = "Following";
  };
  return (
    <div className="col-md-3 col-sm-4 mb-4 px-lg-4 px-sm-2 px-5">
      <div
        className="card text-end mx-2 mx-sm-0"
        style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
      >
        <div className="card-body">
          <p
            className="card-title mb-2 text-start"
            style={{ color: "#15202B", fontSize: "1.3rem", fontWeight: 600 }}
          >
            {props.user.username}
          </p>
          <button
            className="btn rounded"
            style={{
              backgroundColor: "white",
              fontWeight: 500,
              color: "#15202B",
              borderColor: "#15202B",
            }}
            onClick={() => props.handleClick(props.user)}
            onMouseOver={mouseOver}
            onMouseLeave={mouseLeave}
          >
            {props.user.following ? "Following" : "Follow"}
          </button>
        </div>
      </div>
    </div>
  );
}
