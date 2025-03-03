declare module "bun" {
  interface Env {
    DEV_DATABASE_URL: string;
    MYSQL_URL: string;
  }
}
