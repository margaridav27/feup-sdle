import { Node } from "./src/node.js";
import delay from "delay";
import fs from "fs";

const PORT = 3001;

const firstNode = new Node();
await firstNode.init(PORT);
// await firstNode.loadAccounts();

const numberNodes = 25;
const nodes = [];

const POSTS = "./posts";

const removePosts = () => {
  fs.rmSync(POSTS, { recursive: true, force: true });
};

for (let i = 0; i < numberNodes; i++) {
  const id = i.toString();
  await firstNode.register(id, id);
  await delay(10000);
  console.log("Login");
  nodes.push(await firstNode.loginTest(id, id));
  await delay(20000);
  if (i !== 0) {
    console.log("Follow");
    nodes[i].follow("0");
    await delay(10000);
    console.log("Publish");
    nodes[0].post("Hello world");
    removePosts();
  }
}
