import "source-map-support/register";

import * as zmq from "zeromq";
import { graphql, buildSchema } from "graphql";


const schema = buildSchema(`
type Query {
  token(username: String, password: String): String
}
`);

const root = {
  token: (args: { username: string, password: string }): string => {
    console.log(args.username);
    console.log(args.password);
    if (args.username.length + args.password.length === 10) {
      return "this-is-a-fake-webtoken";
    }
    else {
      return null;
    }
  }
};


let socket = zmq.socket("rep");
socket.connect("tcp://localhost:1338");
socket.on("message", async q => {
  const query = q.toString("utf-8");
  console.log(query);
  const result = await graphql(schema, query, root);
  console.log(result);
  socket.send(JSON.stringify(result.data));
});
