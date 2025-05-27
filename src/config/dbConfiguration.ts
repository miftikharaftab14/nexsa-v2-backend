export default () => ({
  port: process.env.POSTGRES_PORT || 5432,
  host: process.env.POSTGRES_HOST,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  secret: process.env.JWT_SECRET,
});
