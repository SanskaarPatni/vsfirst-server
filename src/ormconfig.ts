import { ConnectionOptions } from "typeorm";
import path from "path";
import { User } from "./entities/User";
import { Todo } from "./entities/Todo";

const isCompiled = path.extname(__filename).includes("js");

export default {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME || "sanskaar",
  password: process.env.DB_PASSWORD || "sanskaar",
  database: process.env.DB_NAME || "vsfirst",
  synchronize: !process.env.DB_NO_SYNC,
  logging: !process.env.DB_NO_LOGS,
  autoReconnect: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 2000,
  entities: [User, Todo],
  migrations: [`src/migration/*.${isCompiled ? "js" : "ts"}`],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/migration",
  },
} as ConnectionOptions;
