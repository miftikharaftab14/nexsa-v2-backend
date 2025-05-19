export default () => ({
  port: process.env.DB_PORT || 5432,
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  secret: process.env.JWT_SECRET,
});
