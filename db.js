const mysql = require("mysql");
require("dotenv").config();

const mysqlDB = mysql.createPool({
  connectionLimit: 10,
  user: process.env.NODE_APP_MYSQL_USER,
  host: process.env.NODE_APP_MYSQL_HOST,
  password: process.env.NODE_APP_MYSQL_PASSWORD,
  database: process.env.NODE_APP_MYSQL_DB_NAME,
  multipleStatements: true,
});

module.exports = mysqlDB;
