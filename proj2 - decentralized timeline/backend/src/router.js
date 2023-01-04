import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Persistency from "./persistency.js";

export default class Router {
  // REQUEST HANDLERS
  static async registerHandler(node, req, res) {
    const { username, password } = req.body;

    const response = await node.register(username, password);
    console.log("Register:", response);

    return res.status(response.error ? 400 : 200).json(response);
  }

  static async loginHandler(node, req, res) {
    const { username, password } = req.body;

    const response = await node.login(username, password);
    console.log("Login:", response);

    return res.status(response.error ? 400 : 200).json(response);
  }

  static async logoutHandler(node, _, res) {
    const response = await node.logout();
    console.log("Logout:", response);

    return res.status(response.error ? 400 : 200).json(response);
  }

  static async followHandler(node, req, res) {
    const { username } = req.body;

    const response = await node.follow(username);
    console.log("Follow:", response);

    return res.status(response.error ? 400 : 200).json(response);
  }

  static async unfollowHandler(node, req, res) {
    const { username } = req.body;

    const response = await node.unfollow(username);
    console.log("Unfollow:", response);

    return res.status(response.error ? 400 : 200).json(response);
  }

  static async feedHandler(node, _, res) {
    const feed = [].concat(node.timeline);
    Object.values(node.feed).forEach((val) => {
      feed.push(...val);
    });
    feed.sort((v1, v2) => v2.date - v1.date);

    console.log("Feed:", feed);
    return res.status(200).json({
      feed: feed,
    });
  }

  static async postHandler(node, req, res) {
    const { message } = req.body;

    const response = await node.post(message);
    console.log("Post:", response);

    return res.status(response.error ? 400 : 200).json(response);
  }

  static async usersHandler(node, _, res) {
    const users = await node.listUsers();

    console.log("Users:", users);
    return res.status(200).json(users);
  }

  static async profileHandler(node, _, res) {
    if (node.port !== 3001) {
      const user = {
        username: node.username,
        followers: node.followers,
        following: node.following,
        timeline: node.timeline.sort((v1, v2) => v2.date - v1.date),
      };

      console.log("Profile:", user);
      return res.status(200).json({
        user: user,
      });
    }
    return res.status(400).json({ error: "Invalid port" });
  }

  static async getFeedOfflineHandler(_, res) {
    const feed = Persistency.getOfflinePosts();

    return res.status(200).json({
      feed: feed.sort((v1, v2) => v2.date - v1.date),
    });
  }

  static async postOfflineHandler(req, res) {
    const { message } = req.body;

    const response = Persistency.saveOfflinePost(message);
    console.log("Post:", response);

    return res.status(200).json(response);
  }

  // ROUTES
  static setupRoutes(node, app) {
    app.post("/register", (req, res) => {
      this.registerHandler(node, req, res);
    });
    app.post("/login", (req, res) => {
      this.loginHandler(node, req, res);
    });
    app.post("/logout", async (req, res) => {
      await this.logoutHandler(node, req, res);
      node.app.close();
    });
    app.post("/follow", (req, res) => {
      this.followHandler(node, req, res);
    });
    app.post("/unfollow", (req, res) => {
      this.unfollowHandler(node, req, res);
    });
    app.get("/feed", (req, res) => {
      this.feedHandler(node, req, res);
    });
    app.post("/post", (req, res) => {
      this.postHandler(node, req, res);
    });
    app.get("/users", (req, res) => {
      this.usersHandler(node, req, res);
    });
    app.get("/profile", (req, res) => {
      this.profileHandler(node, req, res);
    });
  }

  static setupOfflineRoutes(app) {
    app.get("/offline", (req, res) => {
      this.getFeedOfflineHandler(req, res);
    });
    app.post("/offline", (req, res) => {
      this.postOfflineHandler(req, res);
    });
    app.delete("/offline", (req, res) => {
      this.deleteOfflineHandler(req, res);
    });
  }

  static createPort(node, port = 0) {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    const backend = app.listen(port, () => {
      console.log(`Backend listening on PORT: ${backend.address().port}.\n`);
    });

    node.app = backend;

    this.setupRoutes(node, app);

    if (port !== 0) this.setupOfflineRoutes(app);

    return backend.address().port;
  }
}
