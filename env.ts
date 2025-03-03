declare module "bun" {
  interface Env {
    DATABASE_URL: string;
    DEV_DATABASE_URL: string;
    MYSQL_URL: string;
  }
}
