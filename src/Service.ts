import { ApolloServer, gql } from "apollo-server";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";

const permissions = {
    test_permission: "TEST_PERMISSION",
};

const typeDefs = gql`
enum Permission {
    TEST_PERMISSION,
    OTHER_PERMISSION
}
type User {
    userid: String!,
    permissions: [Permission!]!
}
type Mutation {
  login(username: String!, password: String!): User
}
type Query {
  publicKey: String!
}
`;

interface IUser {
    userid: string;
    permissions: string[];
}

export class Service {
  private app: ApolloServer;
  private root: any;
  private privateKey: string;
  private publicKey: string;

  constructor(port: string) {
    this.root = {
      login: this.createToken.bind(this),
      publicKey: () => this.publicKey,
    };

    this.privateKey = fs.readFileSync("keys/private.key").toString("utf-8");
    this.publicKey = fs.readFileSync("keys/public.key").toString("utf-8");

      this.app = new ApolloServer({
          context: ({req, res}) => ({req, res}),
          typeDefs,
          rootValue: this.root,
      });
    this.app.listen(port, () => console.log(`login service listening on port ${port}`));
  }

  private getUser(username: string, password: string): IUser {
        console.log("getuser");
        // temporary solution for testing
        if (username.length + password.length === 10) {
            return {userid: username, permissions: [permissions.test_permission]};
        } else {
            return null;
        }
    }

  private createToken(args: { username: string, password: string },
                      conn: any): IUser {
    const user = this.getUser(args.username, args.password);
    if (user) {
      const token = jwt.sign({
      }, this.privateKey, {
        algorithm: "RS256",
        expiresIn: "5m",
        issuer: "login",
        subject: JSON.stringify(user),
      });

      console.log("token:", token);
      console.log("verify:", jwt.verify(token, this.publicKey, {
        algorithms: ["RS256"],
        issuer: "login",
      }));
      conn.res.cookie("auth", JSON.stringify(token), {httpOnly: true, secure: process.env.NODE_ENV !== "development"});

      return user;
    } else {
      return null;
    }
  }
}
