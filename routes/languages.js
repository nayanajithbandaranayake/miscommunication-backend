const express = require("express");
const mysqlDB = require("../db");
const router = express.Router();
const uuid = require("uuid");

router.get("/:lang/info", (req, res) => {
  const { lang } = req.params;

  if (lang) {
    mysqlDB.query(
      "SELECT type, character_length, name FROM secret_codes WHERE name = ? ",
      [lang],
      (err, result) => {
        if (err) throw err;
        return res.status(200).json(result[0]);
      }
    );
  }
});

router.get("/:lang/data", (req, res) => {
  const { lang } = req.params;

  if (lang === "ascii") {
    mysqlDB.query("SELECT * FROM ascii", (err, result) => {
      if (err) throw err;
      if (result.length < 1) return res.json({ error: true });
      return res.status(200).json(result);
    });
  } else {
    mysqlDB.query(
      "SELECT * FROM single_secret_code WHERE name = ?",
      [lang],
      (err, result) => {
        if (err) throw err;
        return res.status(200).json(result);
      }
    );
  }
});

router.get("/added", (req, res) => {
  const { username } = req.query;
  if (username) {
    mysqlDB.query(
      "SELECT * FROM other_secret_codes WHERE user_id = (SELECT user_id FROM users WHERE username = ?)",
      [username],
      (err, result) => {
        if (err) throw err;
        return res.status(200).json(result);
      }
    );
  }
});
router.delete("/added", (req, res) => {
  const { username, language } = req.query;
  if (username) {
    mysqlDB.query(
      "DELETE FROM other_secret_codes WHERE name = ? AND user_id = (SELECT user_id FROM users WHERE username = ? LIMIT 1)",
      [language, username],
      (err) => {
        if (err) throw err;
        res.status(204).end();
      }
    );
  }
});
router.post("/added", async (req, res) => {
  const { key, username } = req.query;

  if (username) {
    const { name, secret_code_id, secret_key, character_length, type } =
      await getTheCodeDataByKey(key);
    const user_id = await getUserID(username);
    mysqlDB.query(
      "INSERT INTO other_secret_codes VALUES (?, ?, ?, ?, ?, ?)",
      [name, secret_code_id, user_id, secret_key, character_length, type],
      (err) => {
        if (err) throw err;
        res.status(201).end();
      }
    );
  }
});

router.get("/added/find", (req, res) => {
  const { key } = req.query;
  if (key) {
    mysqlDB.query(
      "SELECT * FROM secret_codes WHERE secret_key = ? LIMIT 1",
      [key],
      (err, result) => {
        if (err) throw err;
        res.status(200).json(result);
      }
    );
  }
});

router.get("/verify/name", (req, res) => {
  const { name } = req.query;
  mysqlDB.query("SELECT name FROM secret_codes", (err, result) => {
    if (err) throw err;
    for (let item of result) {
      if (item.name === name) {
        return res.json({
          result: true,
        });
      }
    }
    return res.json({
      result: false,
    });
  });
});

router.post("/verify/key", (req, res) => {
  const { key } = req.body;
  mysqlDB.query(
    "SELECT secret_code_id FROM secret_codes WHERE secret_key = ?",
    [key],
    (err, result) => {
      if (err) throw err;
      if (result[0]) {
        return res.json({
          error: false,
        });
      } else {
        return res.json({
          error: true,
        });
      }
    }
  );
});

router.get("/all", (req, res) => {
  const { username } = req.query;
  if (username) {
    getAddedLanguagesData(username).then((data) => {
      mysqlDB.query(
        "SELECT * FROM secret_codes WHERE user_id = (SELECT user_id FROM users WHERE username = ?)",
        [username],
        (err, result) => {
          if (err) throw err;
          return res.status(200).json([
            {
              type: "1 and 0",
              character_length: 7,
              name: "ascii",
              secret_key: "none",
            },
            ...result,
            ...data,
          ]);
        }
      );
    });
  }
});
router.get("/", (req, res) => {
  const { username } = req.query;
  mysqlDB.query(
    "SELECT * FROM secret_codes WHERE user_id = (SELECT user_id FROM users WHERE username = ?)",
    [username],
    (err, result) => {
      if (err) throw err;
      return res.status(200).json([
        {
          type: "1 and 0",
          character_length: 7,
          name: "ascii",
          secret_key: "none",
        },
        ...result,
      ]);
    }
  );
});
router.post("/", (req, res) => {
  const { language } = req.query;

  const { data } = req.body;
  let dataArray = [];
  Object.values(data).forEach((item) => {
    dataArray.push(item);
  });

  if (dataArray.length > 0) {
    getTheCodeData(language).then((data) => {
      const { secret_code_id, name } = data;

      mysqlDB.query(
        "INSERT INTO single_secret_code VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [secret_code_id, name, ...dataArray],
        (err) => {
          if (err) throw err;
          res.status(201).end();
        }
      );
    });
  }
});

router.post("/essentials", (req, res) => {
  const { username } = req.query;
  const { name, characterLength, type } = req.body;
  getUserID(username)
    .then((user_id) => {
      mysqlDB.query(
        "INSERT INTO secret_codes (name, character_length, type, user_id, secret_key) VALUES (?, ?, ?, ?, ?)",
        [name, characterLength, type, user_id, uuid.v4()],
        (err) => {
          if (err) throw err;
          res.status(201).end();
        }
      );
    })
    .catch((err) => {
      throw err;
    });
});

router.delete("/", (req, res) => {
  const { language, username } = req.query;
  if (username) {
    mysqlDB.query(
      "DELETE FROM secret_codes WHERE name = ? AND user_id = (SELECT user_id FROM users WHERE username = ?)",
      [language, username],
      (error) => {
        if (error) throw error;
        res.status(204).end();
      }
    );
  }
});

const getTheCodeData = (language) => {
  return new Promise((resolve, reject) => {
    mysqlDB.query(
      "SELECT name, secret_code_id FROM secret_codes WHERE name = ? ",
      [language],
      (err, result) => {
        if (err) return reject(err);
        return resolve(result[0]);
      }
    );
  });
};

const getUserID = (username) => {
  return new Promise((resolve, reject) => {
    mysqlDB.query(
      "SELECT user_id FROM users WHERE username = ?",
      [username],
      (err, result) => {
        if (err) return reject(err);
        return resolve(result[0].user_id);
      }
    );
  });
};
const getTheCodeDataByKey = (key) => {
  return new Promise((resolve, reject) => {
    mysqlDB.query(
      "SELECT name, user_id, secret_code_id, secret_key, character_length, type FROM secret_codes WHERE secret_key = ? ",
      [key],
      (err, result) => {
        if (err) return reject(err);
        return resolve(result[0]);
      }
    );
  });
};

const getAddedLanguagesData = (username) => {
  return new Promise((resolve, reject) => {
    mysqlDB.query(
      "SELECT * FROM other_secret_codes WHERE user_id = (SELECT user_id FROM users WHERE username = ?)",
      [username],
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      }
    );
  });
};

module.exports = router;
