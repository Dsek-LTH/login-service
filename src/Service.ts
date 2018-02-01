import * as zmq from "zeromq";
import { graphql, buildSchema } from "graphql";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";

const schema = buildSchema(`
type Query {
  token(username: String, password: String): String
}
`);

export class Service {
  private socket: zmq.Socket;
  private root: any;
  private privateKey: string;
  private publicKey: string;

  constructor(gateway: string) {
    this.root = {
      token: this.createToken.bind(this)
    };

    this.privateKey = fs.readFileSync("keys/private.key").toString("utf-8");
    this.publicKey = fs.readFileSync("keys/public.key").toString("utf-8");

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
      const token = jwt.sign({
      }, this.privateKey, {
        algorithm: "RS256",
        issuer: "login",
        subject: args.username,
        expiresIn: "5m"
      });

      console.log("token:", token);
      console.log("verify:", jwt.verify(token, this.publicKey, {
        algorithms: ["RS256"],
        issuer: "login"
      }));

      return token;
    }
    else {
      return null;
    }
  }
}
