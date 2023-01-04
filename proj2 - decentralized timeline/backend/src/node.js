import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { kadDHT } from "@libp2p/kad-dht";
import { pipe } from "it-pipe";
import { CID } from "multiformats/cid";
import { mdns } from "@libp2p/mdns";
import { peerIdFromPeerId, peerIdFromString } from "@libp2p/peer-id";
import delay from "delay";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import * as json from "multiformats/codecs/json";
import { sha256 } from "multiformats/hashes/sha2";
import all from "it-all";
import { str2array, array2str, hash } from "./utils.js";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
import Router from "./router.js";
import Persistency from "./persistency.js";

export class Node {
  async init(port, username = "default") {
    this.port = await Router.createPort(this, port);
    this.username = username;
    this.timeline = Persistency.loadTimeline(username);
    this.feed = {};
    this.followers = [];
    this.following = Persistency.loadUserInfo(this.username, true);
    this.topics = [];

    await this.createNode();
  }

  createNode = async () => {
    this.node = await createLibp2p({
      addresses: {
        // add a listen address (localhost) to accept TCP connections on a random port
        listen: ["/ip4/0.0.0.0/tcp/0"],
      },
      transports: [tcp()],
      streamMuxers: [mplex()],
      connectionEncryption: [noise()],
      dht: kadDHT(),
      peerDiscovery: [
        mdns({
          interval: 10e3,
        }),
        pubsubPeerDiscovery({ interval: 5000 }),
      ],
      pubsub: gossipsub({
        allowPublishToZeroPeers: true,
        fallbackToFloodsub: true,
      }),
    });

    // Start libp2p
    await this.node.start();

    console.log("Node created!", this.node.peerId.toString());

    // Wait for onConnect handlers in the DHT
    await delay(1000);

    if (this.port !== 3001) {
      this.node.addEventListener("peer:discovery", this.sharePort);
      setTimeout(this.setInfo, 2000);
    }

    // Set route to receive follow requests<
    this.handleFollow();

    // Set route to receive unfollow requests
    this.handleUnfollow();

    // Set route to receive port request
    this.handleRequestPort();
  };

  stopNode = async () => {
    await this.node.stop();
    console.log(`${this.username} stopping`);
  };

  setInfo = async () => {
    const key = str2array(this.username);

    let data = {};
    try {
      data = await this.node.contentRouting.get(key);
      data = JSON.parse(array2str(data));
    } catch (_) {
      // Did not find peers yet
      setTimeout(this.setInfo, 1000);
      return;
    }
    data.peerId = this.node.peerId.toString();
    this.followers = data.followers;

    await this.node.contentRouting.put(key, str2array(JSON.stringify(data)));

    console.log(`User '${this.username}' set info dht`);
    this.sendPostsToFollowers();
    this.subscribeFollowing();
  };

  sharePort = async (evt) => {
    try {
      const stream = await this.node.dialProtocol(evt.detail.id, [
        `/port/${hash(this.username)}`,
      ]);
      pipe([uint8ArrayFromString(this.port.toString())], stream).finally(
        this.node.removeEventListener("peer:discovery", this.sharePort)
      );
      console.log(`User '${this.username}' sharing port`);
    } catch (err) {}
  };

  sendPostsToFollowers = async () => {
    for (const follower of this.followers) {
      const usernameArray = str2array(follower);
      try {
        let data = await this.node.contentRouting.get(usernameArray);
        data = JSON.parse(array2str(data));
        if (data.peerId) {
          const peerID = peerIdFromString(data.peerId);
          this.node.dial(peerID);
          this.sharePosts(peerID);
        }
      } catch (err) {
        console.log("User does not exist");
      }
    }
  };

  subscribeFollowing = async () => {
    for (const username of this.following) {
      const usernameArray = str2array(username);

      let data = {};
      try {
        data = await this.node.contentRouting.get(usernameArray);
        data = JSON.parse(array2str(data));

        const bytes = json.encode(`/posts/${hash(username)}`);
        const cidHash = await sha256.digest(bytes);
        const cid = CID.create(1, json.code, cidHash);

        this.subscribe(username);
        this.handleReceivePosts(username, cid);

        if (data.peerId) {
          const peerID = peerIdFromString(data.peerId);
          this.sendFollow(peerID, username);
        } else this.requestPostsToProviders(cid, username);
      } catch (err) {
        console.log(err);
      }
    }
  };

  login = async (username, password) => {
    if (!this.node.isStarted()) {
      return { error: "Node starting" };
    }

    password = hash(password);

    let data = {};
    try {
      data = await this.node.contentRouting.get(str2array(username));
      data = JSON.parse(array2str(data));

      if (data.password !== password) {
        return { error: "Invalid password!" };
      }
    } catch (_) {
      return { error: "User does not exist!" };
    }

    const portPromise = this.handleReceivePort(username);
    let createNode = true;
    // If peer already connected try to establish connection with node
    const { peerId } = data;

    if (peerId) {
      try {
        const peerID = peerIdFromString(peerId);
        this.node.dial(peerID);
        createNode = !(await this.requestPort(peerID, username));
      } catch (_) {
        console.log("Could not contact peer", peerId);
      }
    }

    if (createNode) await new Node().init(0, username);
    const port = await portPromise;

    return { success: "Logged in!", port: port };
  };

  logout = async () => {
    if (!this.node.isStarted()) {
      return { error: "Node starting" };
    }

    const key = str2array(this.username);
    let data = await this.node.contentRouting.get(key);
    data = JSON.parse(array2str(data));
    delete data["peerId"];
    await this.node.contentRouting.put(key, str2array(JSON.stringify(data)));

    await this.stopNode();

    return { success: "User logout!" };
  };

  register = async (username, password) => {
    if (!this.node.isStarted()) {
      return { error: "Node starting" };
    }

    const usernameArray = str2array(username);
    try {
      await this.node.contentRouting.get(usernameArray);
      return { error: "User already exists!" };
    } catch (_) {
      // do nothing
    }

    // Register user + pass in DHT of user entry
    password = hash(password);
    const content = {
      password: password,
      followers: [],
    };
    await this.node.contentRouting.put(
      usernameArray,
      str2array(JSON.stringify(content))
    );

    //Register user in DHT of users list
    const key = str2array("users");
    let data = [];
    try {
      data = await this.node.contentRouting.get(key);
      data = JSON.parse(array2str(data));
    } catch (_) {
      // do nothing
    }
    data.push(username);
    await this.node.contentRouting.put(key, str2array(JSON.stringify(data)));

    Persistency.saveUser({ username, password });

    return { success: "User created!" };
  };

  post = async (message) => {
    if (!this.node.isStarted()) {
      return { error: "Node starting" };
    }

    const messageObject = {
      username: this.username,
      message: message,
      date: Date.now(),
    };

    this.timeline.push(messageObject);
    Persistency.saveTimeline(this.timeline, this.username);

    //share message with followers
    const topic = `feed/${hash(this.username)}`;

    const res = await this.node.pubsub.publish(
      topic,
      str2array(JSON.stringify(messageObject))
    );

    return { success: "Posted message!" };
  };

  follow = async (username) => {
    if (!this.node.isStarted()) {
      return { error: "Node starting" };
    }

    if (this.following.includes(username)) {
      return { error: "Already following user!" };
    }

    const usernameArray = str2array(username);
    try {
      const data = await this.node.contentRouting.get(usernameArray);
      const content = JSON.parse(array2str(data));

      this.subscribe(username);

      this.following.push(username);

      const { peerId } = content;

      const bytes = json.encode(`/posts/${hash(username)}`);
      const cidHash = await sha256.digest(bytes);
      const cid = CID.create(1, json.code, cidHash);

      this.handleReceivePosts(username, cid);

      if (peerId) {
        const peerID = peerIdFromString(peerId);
        this.node.dial(peerID);

        this.sendFollow(peerID, username);
      } else {
        console.log("User not online");
        if (!content.followers.includes(this.username)) {
          // Update DHT
          content.followers.push(this.username);
          await this.node.contentRouting.put(
            usernameArray,
            str2array(JSON.stringify(content))
          );

          // Update Persistency
          Persistency.updateFollowers(username, content.followers);
        }

        await this.requestPostsToProviders(cid, username);
      }

      Persistency.updateFollowing(this.username, this.following);

      return { message: "Follow success" };
    } catch (err) {
      return { error: "User does not exist!" };
    }
  };

  subscribe = (username) => {
    this.feed[username] = [];

    // Subscribe to user's posts
    this.node.pubsub.addEventListener("message", (evt) => {
      if (this.topics.includes(evt.detail.topic)) {
        const msg = JSON.parse(array2str(evt.detail.data));
        this.feed[username].push(msg);
      }
    });

    const topic = `feed/${hash(username)}`;
    this.node.pubsub.subscribe(topic);
    if (!this.topics.includes(topic)) {
      this.topics.push(topic);
    }
  };

  requestPostsToProviders = async (cid, username) => {
    try {
      // No need to send more if one already done
      const providers = await all(
        this.node.contentRouting.findProviders(cid, {
          timeout: 3000,
        })
      );

      if (providers.length > 0) {
        providers.forEach(async (peer) => {
          console.log("Send Request Posts");
          if (peer.id !== this.node.peerId) {
            this.sendRequestPosts(peer.id, username);
          }
        });
      }
    } catch (_) {
      console.log("No peers found!");
    }
  };

  unfollow = async (username) => {
    if (!this.node.isStarted()) {
      return { error: "Node starting" };
    }

    if (!this.following.includes(username)) {
      return { error: "Not following user!" };
    }

    const usernameArray = str2array(username);
    try {
      const data = await this.node.contentRouting.get(usernameArray);
      const content = JSON.parse(array2str(data));

      const topic = `feed/${hash(username)}`;
      this.node.pubsub.unsubscribe(topic);
      let index = this.topics.indexOf(topic);
      if (index !== -1) {
        this.topics.splice(index, 1);
      }

      index = this.following.indexOf(username);
      if (index == -1) return { error: `Not subscribed to ${username}` };
      this.following.splice(index, 1);

      // remove user posts from feed
      delete this.feed[username];
      this.node.unhandle([`/request_posts/${hash(username)}`]);

      const { peerId } = content;
      if (peerId) {
        const peerID = peerIdFromString(peerId);
        this.node.dial(peerID);

        this.sendUnfollow(peerID, username);
      } else {
        // Update DHT
        index = content.followers.indexOf(this.username);
        if (index != -1) content.followers.splice(index, 1);
        await this.node.contentRouting.put(
          usernameArray,
          str2array(JSON.stringify(content))
        );

        // Update Persistency
        Persistency.updateFollowers(username, content.followers);
      }

      Persistency.updateFollowing(this.username, this.following);
      this.node.unhandle([`/posts/${hash(username)}`]);

      return { success: "Unfollow successful." };
    } catch (err) {
      console.log(err);

      return { error: "User does not exist!" };
    }
  };

  handleReceivePort = async (username) => {
    return new Promise((resolve) => {
      this.node.handle([`/port/${hash(username)}`], ({ stream }) => {
        pipe(stream, async function (source) {
          for await (const msg of source) {
            const str = uint8ArrayToString(msg.subarray());
            console.log(`Received port: ${str}`);
            resolve(parseInt(str));
          }
        }).finally(() => {
          // clean up resources
          stream.close();
          this.node.unhandle([`/port/${hash(username)}`]);
        });
      });
    });
  };

  requestPort = async (peerId, username) => {
    try {
      const stream = await this.node.dialProtocol(peerId, ["/req_port"]);
      pipe([uint8ArrayFromString(username)], stream);
    } catch (err) {
      console.log("Could not request port: ", err);
      return false;
    }
    return true;
  };

  handleRequestPort = async () => {
    this.node.handle(["/req_port"], (data) => {
      pipe(data.stream, async (source) => {
        for await (const msg of source) {
          const str = uint8ArrayToString(msg.subarray());

          if (str === this.username) {
            this.sharePort({
              detail: { id: data.connection.remotePeer },
            });
            console.log(
              `User: '${this.username}' sending port to login request`
            );
          }
        }
      });
    });
  };

  handleReceivePosts = async (username, cid) => {
    this.node
      .handle([`/posts/${hash(username)}`], (data) => {
        pipe(data.stream, async (source) => {
          for await (const msg of source) {
            const posts = JSON.parse(uint8ArrayToString(msg.subarray()));

            console.log(`${username} received posts:`, posts);
            this.feed[username] = posts;

            this.providePosts(cid);
            this.handleProvideFollowingPosts(username);
          }
        }).finally(() => {
          data.stream.close();
        });
      })
      .catch((_) => {
        /* Do nothing */
      });
  };

  sendRequestPosts = async (peerId, username) => {
    try {
      const stream = await this.node.dialProtocol(peerId, [
        `/request_posts/${hash(username)}`,
      ]);
      const content = {
        data: Date.now().toString(),
      };
      pipe([uint8ArrayFromString(JSON.stringify(content))], stream);
      console.log(`'${this.username}' requesting '${username}' posts`);
    } catch (err) {
      console.log(`Unable to get posts from '${username}'`, err);
    }
  };

  handleProvideFollowingPosts = async (username) => {
    this.node
      .handle([`/request_posts/${hash(username)}`], (data) => {
        pipe(data.stream, async (source) => {
          for await (const msg of source) {
            const content = JSON.parse(uint8ArrayToString(msg.subarray()));
            await this.shareFollowingPosts(
              data.connection.remotePeer,
              username
            );
            console.log(`${this.username} sending ${username} posts`);
          }
        }).finally(() => {
          data.stream.close();
        });
      })
      .catch((_) => {
        /* Do nothing */
      });
  };

  sendFollow = async (peerId, username) => {
    try {
      const stream = await this.node.dialProtocol(peerId, ["/follow"]);
      const content = {
        data: Date.now().toString(),
        username: this.username,
      };
      pipe([uint8ArrayFromString(JSON.stringify(content))], stream);
    } catch (err) {
      console.log(`Error following ${username}. Unable to get posts.`, err);
    }
  };

  sendUnfollow = async (peerId, username) => {
    try {
      const stream = await this.node.dialProtocol(peerId, [`/unfollow`]);
      const content = {
        data: Date.now().toString(),
        username: this.username,
      };
      pipe([uint8ArrayFromString(JSON.stringify(content))], stream);
    } catch (err) {
      console.log(`Error unfollowing ${username}.`, err);
    }
  };

  handleUnfollow = async () => {
    this.node.handle(["/unfollow"], (data) => {
      pipe(data.stream, async (source) => {
        for await (const msg of source) {
          const str = JSON.parse(uint8ArrayToString(msg.subarray()));
          let index = this.followers.indexOf(str.username);
          this.followers.splice(index, 1);

          console.log(
            `${this.username} received unfollow from ${str.username}`
          );

          // Update DHT
          const usernameArray = str2array(this.username);
          const data = await this.node.contentRouting.get(usernameArray);
          const content = JSON.parse(array2str(data));
          index = content.followers.indexOf(str.username);
          if (index != -1) content.followers.splice(index, 1);
          await this.node.contentRouting.put(
            usernameArray,
            str2array(JSON.stringify(content))
          );

          // Update Persistency
          Persistency.updateFollowers(str.username, content.followers);
        }
      }).finally(() => {
        // clean up resources
        data.stream.close();
      });
    });
  };

  handleFollow = async () => {
    this.node.handle(["/follow"], (data) => {
      const peerId = data.connection.remotePeer;
      pipe(data.stream, async (source) => {
        for await (const msg of source) {
          const str = JSON.parse(uint8ArrayToString(msg.subarray()));

          this.sharePosts(peerId);

          console.log(
            `'${this.username}' received follow from '${str.username}'`
          );

          // Update DHT
          const usernameArray = str2array(this.username);
          const data = await this.node.contentRouting.get(usernameArray);
          const content = JSON.parse(array2str(data));

          if (!content.followers.includes(str.username)) {
            this.followers.push(str.username);
            content.followers = this.followers;
            await this.node.contentRouting.put(
              usernameArray,
              str2array(JSON.stringify(content))
            );

            // Update Persistency
            Persistency.updateFollowers(this.username, content.followers);
          }
        }
      }).finally(() => {
        // clean up resources
        data.stream.close();
      });
    });
  };

  sharePosts = async (peerInfo) => {
    try {
      const stream = await this.node.dialProtocol(peerInfo, [
        `/posts/${hash(this.username)}`,
      ]);
      pipe([uint8ArrayFromString(JSON.stringify(this.timeline))], stream);
      console.log(`User: '${this.username}' sharing posts`);
    } catch (err) {
      console.log("Error sharing posts.", err);
    }
  };

  shareFollowingPosts = async (peerInfo, username) => {
    try {
      const stream = await this.node.dialProtocol(peerInfo, [
        `/posts/${hash(username)}`,
      ]);
      const content = this.feed[username] ? this.feed[username] : [];
      pipe([uint8ArrayFromString(JSON.stringify(content))], stream);
      console.log(`${this.username} sharing ${username} following posts`);
    } catch (err) {
      console.log("Error sharing posts.", err);
    }
  };

  providePosts = (cid) => {
    this.node.contentRouting.provide(cid);
  };

  listUsers = async () => {

    const key = str2array("users");
    let usernames = [];
    try {
      usernames = await this.node.contentRouting.get(key);
      usernames = JSON.parse(array2str(usernames));
    } catch (err) {
      console.log("Error listing users", err);
      return { error: "Could not list users!" };
    }

    const idx = usernames.indexOf(this.username);
    if (idx > -1) usernames.splice(idx, 1);

    let response = [];
    for (let username of usernames) {
      response.push({
        username: username,
        following: this.following.includes(username),
      });
    }

    return response;
  };

  loadAccounts = async () => {
    const accounts = Persistency.loadAccounts(this);
    const accountsList = [];

    for (const account of accounts) {
      const usernameArray = str2array(account.username);
      // Register user + pass in DHT of user entry
      const content = {
        password: account.password,
        followers: Persistency.loadUserInfo(account.username, false),
      };
      await this.node.contentRouting.put(
        usernameArray,
        str2array(JSON.stringify(content))
      );
      accountsList.push(account.username);
    }

    //Register user in DHT of users list
    const key = str2array("users");
    await this.node.contentRouting.put(
      key,
      str2array(JSON.stringify(accountsList))
    );
  };

  loginTest = async (username, password) => {
    if (!this.node.isStarted()) {
      return { error: "Node starting" };
    }

    password = hash(password);

    let data = {};
    try {
      data = await this.node.contentRouting.get(str2array(username));
      data = JSON.parse(array2str(data));

      if (data.password !== password) {
        return { error: "Invalid password!" };
      }
    } catch (_) {
      return { error: "User does not exist!" };
    }

    const portPromise = this.handleReceivePort(username);
    let createNode = true;
    // If peer already connected try to establish connection with node
    const { peerId } = data;

    if (peerId) {
      try {
        const peerID = peerIdFromString(peerId);
        this.node.dial(peerID);
        createNode = !(await this.requestPort(peerID, username));
      } catch (_) {
        console.log("Could not contact peer", peerId);
      }
    }

    const node = new Node();
    node.init(0, username);
    return node;
  };
}
