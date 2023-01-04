import fs from "fs";
import { hash } from "./utils.js";

export default class Persistency {
  static loadAccounts() {
    console.log("Loading accounts");

    const dir = "./users";
    if (!fs.existsSync(dir)) return [];

    const usersFile = `${dir}/accounts.txt`;
    if (!fs.existsSync(usersFile)) return [];

    return JSON.parse(fs.readFileSync(usersFile));
  }

  static loadTimeline(username) {
    if (username === "default") return;

    console.log("Loading timeline");

    const posts = [];
    const dir = "./posts";
    if (!fs.existsSync(dir)) return posts;

    let postsFile = `${dir}/${hash(username)}.txt`;
    if (fs.existsSync(postsFile))
      posts.push(...JSON.parse(fs.readFileSync(postsFile)));

    postsFile = `${dir}/offline.txt`;
    if (fs.existsSync(postsFile)) {
      const offlinePosts = JSON.parse(fs.readFileSync(postsFile)).map(
        (post) => {
          post.username = username;
          return post;
        }
      );
      posts.push(...offlinePosts);
      this.removeOfflinePosts();
    }

    this.saveTimeline(posts, username);
    return posts;
  }

  static loadUserInfo(username, following) {
    console.log("Loading user info");

    const type = following ? "following" : "followers";

    let dir = "./users";
    if (!fs.existsSync(dir)) return [];

    dir += `/${username}`;
    if (!fs.existsSync(dir)) return [];

    const infoFile = `${dir}/${type}.txt`;
    if (!fs.existsSync(infoFile)) return [];

    return JSON.parse(fs.readFileSync(infoFile));
  }

  static saveUser(user) {
    console.log("Saving user");

    let dir = "./users";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const usersFile = `${dir}/accounts.txt`;
    let users = [];
    if (fs.existsSync(usersFile))
      users = JSON.parse(fs.readFileSync(usersFile));
    users.push(user);
    fs.writeFileSync(usersFile, JSON.stringify(users));

    dir += `/${user.username}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const followingFile = `${dir}/following.txt`;
    const followersFile = `${dir}/followers.txt`;

    if (fs.existsSync(followingFile))
      fs.writeFileSync(followingFile, JSON.stringify("[]"));

    if (fs.existsSync(followersFile))
      fs.writeFileSync(followersFile, JSON.stringify("[]"));
  }

  static updateFollowing(username, following) {
    console.log("Update followings");

    let dir = "./users";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    dir += `/${username}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const followingFile = `${dir}/following.txt`;
    fs.writeFileSync(followingFile, JSON.stringify(following));
  }

  static updateFollowers(username, followers) {
    console.log("Update followers");

    let dir = "./users";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    dir += `/${username}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const followersFile = `${dir}/followers.txt`;
    fs.writeFileSync(followersFile, JSON.stringify(followers));
  }

  static saveTimeline(timeline, username) {
    console.log("Save timeline");

    const dir = "./posts";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    fs.writeFileSync(`./posts/${hash(username)}.txt`, JSON.stringify(timeline));
  }

  static getOfflinePosts() {
    let dir = "./posts";
    if (!fs.existsSync(dir)) return [];

    const offlinePostsFile = `${dir}/offline.txt`;
    if (fs.existsSync(offlinePostsFile))
      return JSON.parse(fs.readFileSync(offlinePostsFile));

    return [];
  }

  static saveOfflinePost(post) {
    let dir = "./posts";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const offlinePostsFile = `${dir}/offline.txt`;
    let offlinePosts = [];
    if (fs.existsSync(offlinePostsFile))
      offlinePosts = JSON.parse(fs.readFileSync(offlinePostsFile));

    const offlinePost = {
      username: "Guest",
      message: post,
      date: Date.now(),
    };

    offlinePosts.push(offlinePost);
    fs.writeFileSync(offlinePostsFile, JSON.stringify(offlinePosts));
    return { success: "Posted message!" };
  }

  static removeOfflinePosts() {
    const offlinePostsFile = "./posts/offline.txt";
    fs.unlinkSync(offlinePostsFile);
  }

  static appendTestFile = async (file, data) => {
    let dir = "./tests";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    dir = dir + "/" + file;

    fs.appendFileSync(dir, data.toString() + "\n");
  };
}
