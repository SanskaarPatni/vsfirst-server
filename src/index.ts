import "reflect-metadata";
require("dotenv-safe").config();
import express from "express";
import { __prod__ } from "./constants";
import { join } from "path";
import { User } from "./entities/User";
import { Strategy as GitHubStrategy } from "passport-github";
import passport from "passport";
import jwt from "jsonwebtoken";
import cors from "cors";
import { Todo } from "./entities/Todo";
import { isAuth } from "./isAuth";
import { createConnection } from "typeorm";

const main = async () => {
  await createConnection({
    type: "mysql",
    //type: "postgres",
    url: process.env.CLEARDB_DATABASE_URL,
    synchronize: !__prod__,
    entities: [join(__dirname, "./entities/*.*")],
    logging: !__prod__,
  })
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.log(err);
    });
  const app = express();
  passport.serializeUser(function (user: any, done) {
    done(null, user.accessToken);
  });

  app.use(cors({ origin: "*" }));
  app.use(passport.initialize());
  app.use(express.json());

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        //callbackURL: "http://localhost:3002/auth/github/callback",
        callbackURL:
          "https://vstodo-mysql-server.herokuapp.com/auth/github/callback",
      },
      async (_, __, profile, cb) => {
        let user = await User.findOne({
          where: { githubId: profile.id },
        });
        if (user) {
          user.name = profile.displayName;
          await user.save();
        } else {
          user = await User.create({
            name: profile.displayName,
            githubId: profile.id,
          }).save();
        }
        cb(null, {
          accessToken: jwt.sign(
            { userId: user.id },
            process.env.ACCESS_TOKEN_SECRET,
            {
              expiresIn: "1y",
            }
          ),
        });
      }
    )
  );
  app.get("/auth/github", passport.authenticate("github", { session: false }));

  app.get(
    //should match to githubstrategy callback url mentioned above
    "/auth/github/callback",
    passport.authenticate("github", { session: false }),
    (req: any, res) => {
      // Successful authentication
      res.redirect(
        `https://vstodo-mysql-server.herokuapp.com/auth/${req.user.accessToken}`
      );
    }
  );

  app.get("/todo", isAuth, async (req: any, res) => {
    const todos = await Todo.find({
      where: { creatorId: req.userId },
      order: { id: "DESC" },
    });
    res.send({ todos });
  });

  app.post("/todo", isAuth, async (req: any, res) => {
    const todo = await Todo.create({
      text: req.body.text,
      creatorId: req.userId,
    }).save();
    res.send({ todo });
  });

  app.put("/todo", isAuth, async (req: any, res) => {
    const todo = await Todo.findOne(req.body.id);
    if (!todo) {
      res.send({ todo: null });
      return;
    }
    if (todo.creatorId !== req.userId) {
      throw new Error("not authorized");
    }
    todo.completed = !todo.completed;
    await todo.save();
    res.send({ todo });
  });

  app.delete("/todo", isAuth, async (req: any, res) => {
    const todo = await Todo.findOne(req.body.id);
    if (!todo) {
      res.send({ todo: null });
      return;
    }
    if (todo.creatorId !== req.userId) {
      throw new Error("not authorized");
    }
    await todo.remove();
    res.send({ todo });
  });

  app.get("/me", async (req, res) => {
    // Bearer 120jdklowqjed021901
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.send({ user: null });
      return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      res.send({ user: null });
      return;
    }
    let userId = "";
    try {
      const payload: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userId = payload.userId;
    } catch (err) {
      res.send({ user: null });
      return;
    }

    if (!userId) {
      res.send({ user: null });
      return;
    }
    const user = await User.findOne(userId);
    res.send({ user });
  });

  app.get("/", (_req, res) => {
    res.send("Hello");
  });

  const PORT = process.env.PORT || 3002;

  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
};

main();
