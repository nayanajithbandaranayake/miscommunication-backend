const express = require("express");
const mysqlDB = require("../db");
const router = express.Router();

router.get("/codes/:username", (req, res) => {
  const { username } = req.params;
  mysqlDB.query(
    "SELECT name, secret_code_id, character_length, type FROM secret_codes WHERE user_id = (SELECT user_id FROM users WHERE username = ?);",
    [username],
    (err, result) => {
      if (err) throw err;
      res.json(result);
    }
  );
});

router.get("/", (req, res) => {
  mysqlDB.query("SELECT username, email FROM users;", (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});

router.put("/", (req, res) => {
  const { email, password } = req.body;
  mysqlDB.query(
    "UPDATE users SET password = sha1(?) WHERE email = ?",
    [password, email],
    (err) => {
      if (err) throw err;
      res.status(200).end();
    }
  );
});
router.post("/signup", (req, res) => {
  console.log("hi");
  const { username, email, password } = req.body;
  if (username && email && password) {
    mysqlDB.query(
      "INSERT INTO users(username, email, password) VALUES (?, ? , sha1(?));",
      [username, email, password],
      (err) => {
        if (err) throw err;
        res.status(201).end();
      }
    );
  } else {
    return res.status(403).end();
  }
});

router.get("/login", (req, res) => {
  const { email, password } = req.query;
  mysqlDB.query(
    "SELECT email, username FROM users WHERE email = ? AND password = sha1(?) LIMIT 1;",
    [email, password],
    (err, result) => {
      if (err) throw err;
      res.status(200).json(result);
    }
  );
});

router.get("/verify/email", (req, res) => {
  const { email } = req.query;
  mysqlDB.query("SELECT email FROM users", (err, result) => {
    if (err) throw err;
    for (let item of result) {
      if (item.email === email)
        return res.json({
          error: false,
        });
    }
    return res.json({
      error: true,
    });
  });
});

router.get("/login/verify", (req, res) => {
  const { email, password } = req.query;
  mysqlDB.query(
    "SELECT email, username FROM users WHERE email = ? AND password = sha1(?) LIMIT 1;",
    [email, password],
    (err, result) => {
      if (err) throw err;
      if (result.length < 1) {
        return res.json({
          error: true,
        });
      } else {
        return res.json({
          error: false,
        });
      }
    }
  );
});

module.exports = router;
