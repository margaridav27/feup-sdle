import React, { useState, useEffect } from "react";
import UserCard from "../Components/UserCard";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../Components/LoadingSpinner";
import api from "../Utils/api";

export default function Users() {
  const navigate = useNavigate();
  const port = sessionStorage.getItem("port");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = () => {
    console.log("Fetching users...");

    setIsLoading(true);
    api
      .get("users/", port)
      .then((res) => {
        console.log("Users fetched. Response:", res.data);
        setUsers(res.data ? res.data : []);
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        console.log("Error fetching users:", err);
      });
  };

  const follow = (username) => {
    console.log(`Following ${username}...`);

    api
      .post("follow/", port, { username })
      .then((res) => {
        console.log("Response:", res.data);
        fetchUsers();
      })
      .catch((err) => {
        console.log("Error following user:", err);
      });
  };

  const unfollow = (username) => {
    console.log(`Unfollowing ${username}...`);

    api
      .post("unfollow/", port, { username })
      .then((res) => {
        console.log("Response:", res.data);
        fetchUsers();
      })
      .catch((err) => {
        console.log("Error unfollowing user:", err);
      });
  };

  const handleClick = (user) => {
    if (user.following) {
      unfollow(user.username);
      return;
    }

    follow(user.username);
  };

  useEffect(() => {
    if (!port || port === 3001) {
      navigate("/login");
      return;
    }

    fetchUsers();
  }, []);

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className="container mt-5">
        <div className="row">
          {users &&
            users.map((user) => {
              return (
                <UserCard
                  key={user.username}
                  user={user}
                  handleClick={handleClick}
                />
              );
            })}
        </div>
      </div>
    </>
  );
}
