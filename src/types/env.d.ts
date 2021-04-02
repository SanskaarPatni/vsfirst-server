//generated using Steps
//1 Make types folder in src then
//2 npx gen-env-types .env -o src/types/env.d.ts -e  .
declare namespace NodeJS {
  interface ProcessEnv {
    GITHUB_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    ACCESS_TOKEN_SECRET: string;
    DATABASE_URL: string;
    DATABASE_URL_PROD: string;
  }
}
