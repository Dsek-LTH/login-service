import * as zmq from "zeromq";
import { graphql, buildSchema } from "graphql";

const schema = buildSchema(`
type Query {
  token(username: String, password: String): String
}
`);

export class Service {
  private socket: zmq.Socket;
  private root: any;

  constructor(gateway: string) {
    this.root = {
      token: this.createToken.bind(this)
    };

    this.socket = zmq.socket("rep");
    this.socket.on("message", this.onRequest.bind(this));
    this.socket.connect(gateway);
  }

  private async onRequest(q: Buffer) {
    const query = q.toString("utf-8");
    const result = await graphql(schema, query, this.root);
    this.socket.send(JSON.stringify(result));
  }

  private createToken(args: { username: string, password: string }): string {
    if (args.username.length + args.password.length === 10) {
      return "this-is-a-fake-webtoken";
    }
    else {
      return null;
    }
  }
}
