import axios from "axios";

// Get request with authentication
export async function get(route, port, payload = {}) {
  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };

  return axios.get(
    `http://localhost:${port}/${route}`,
    {
      ...payload,
    },
    config
  );
}

// Post request with authentication
export async function post(route, port, payload = {}) {
  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };

  return axios.post(
    `http://localhost:${port}/${route}`,
    {
      ...payload,
    },
    config
  );
}

const api = {
  get,
  post,
};

export default api;
