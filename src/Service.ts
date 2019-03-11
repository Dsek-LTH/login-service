import * as express from "express";
import * as graphqlHTTP from "express-graphql";
import * as fs from "fs";
import { buildSchema, graphql } from "graphql";
import * as jwt from "jsonwebtoken";

const schema = buildSchema(`
type Query {
  token(username: String, password: String): String
}
`);

export class Service {
  private app: express.Express;
  private root: any;
  private privateKey: string;
  private publicKey: string;

  constructor(port: string) {
    this.root = {
      token: this.createToken.bind(this),
    };

    this.privateKey = fs.readFileSync("keys/private.key").toString("utf-8");
    this.publicKey = fs.readFileSync("keys/public.key").toString("utf-8");

    this.app = express();
    this.app.use("/graphql", graphqlHTTP({
            graphiql: true,
            rootValue: this.root,
            schema,
      }));
    this.app.listen(port, () => console.log(`login service listening on port ${port}`));
  }

  private createToken(args: { username: string, password: string }): string {
    if (args.username.length + args.password.length === 10) {
      const token = jwt.sign({
      }, this.privateKey, {
        algorithm: "RS256",
        expiresIn: "5m",
        issuer: "login",
        subject: args.username,
      });

      console.log("token:", token);
      console.log("verify:", jwt.verify(token, this.publicKey, {
        algorithms: ["RS256"],
        issuer: "login",
      }));

      return token;
    } else {
      return null;
    }
  }
}
