const express = require("express");
const mysqlDB = require("../db");
const router = express.Router();
const chkchars = require("chkchars");

const numbers = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  0: "zero",
};
const num_array = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "zero",
];
router.get("/encode/:lang", (req, res) => {
  const { phrase } = req.query;
  const { lang } = req.params;
  let purified_array = [];
  let converted_array = [];
  let converted = "";
  for (let char of phrase.toLowerCase()) {
    if (chkchars.allNums(char)) {
      purified_array.push(numbers[char]);
    } else if (char === "_") {
      purified_array.push("under_score");
    } else {
      purified_array.push(char);
    }
  }
  if (lang === "ascii") {
    mysqlDB.query("SELECT * FROM ascii", (err, result) => {
      if (err) throw err;
      purified_array.forEach((item) => {
        converted_array.push(result[0][item]);
      });
      converted = converted_array.join("");
      return res.status(200).json({ phrase: converted });
    });
  } else {
    mysqlDB.query(
      "SELECT * FROM single_secret_code WHERE secret_code_id = (SELECT secret_code_id FROM secret_codes WHERE name = ?)",
      [lang],
      (err, result) => {
        if (err) throw err;
        purified_array.forEach((item) => {
          if (result[0]) {
            converted_array.push(result[0][item]);
          }
        });
        return res
          .status(200)
          .json({ phrase: converted_array.join(""), error: false });
      }
    );
  }
});

router.get("/decode/:lang", async (req, res) => {
  const { phrase } = req.body;
  const { lang } = req.params;
  const length = await getLength(lang);
  let purified_array = [];
  let converted_array = [];
  let double_purified_array = [];
  if (lang === "ascii") {
    purified_array = chkchars.sliceToChunks(phrase, 7);
    mysqlDB.query("SELECT * FROM ascii", (err, result) => {
      if (err) throw err;
      purified_array.forEach((item) => {
        if (!getKeyValue(result[0], item)) {
          return res.json({ phrase: "", error: true });
        }
        converted_array.push(getKeyValue(result[0], item));
      });

      converted_array.forEach((item) => {
        if (num_array.includes(item)) {
          double_purified_array.push(getKeyValue(numbers, item));
        } else if (item === "under_score") {
          double_purified_array.push("_");
        } else {
          double_purified_array.push(item);
        }
      });
      return res
        .status(200)
        .json({ phrase: double_purified_array.join(""), error: false });
    });
  } else {
    purified_array = chkchars.sliceToChunks(phrase, parseInt(length));

    mysqlDB.query(
      "SELECT * FROM single_secret_code WHERE name = ? LIMIT 1",
      [lang],
      (err, result) => {
        if (err) throw err;
        purified_array.forEach((item) => {
          if (!getKeyValue(result[0], item)) {
            return res.json({ phrase: "", error: true });
          }
          converted_array.push(getKeyValue(result[0], item));
        });

        converted_array.forEach((item) => {
          if (num_array.includes(item)) {
            double_purified_array.push(getKeyValue(numbers, item));
          } else if (item === "under_score") {
            double_purified_array.push("_");
          } else {
            double_purified_array.push(item);
          }
        });
        return res.status(200).json({
          phrase: double_purified_array.join(""),
          error: false,
        });
      }
    );
  }
});

function getKeyValue(object, value) {
  return Object.keys(object).find((key) => {
    return object[key] === value;
  });
}
const getLength = (language) => {
  return new Promise((resolve, reject) => {
    if (language === "ascii") {
      return resolve(7);
    } else {
      mysqlDB.query(
        "SELECT character_length FROM secret_codes WHERE name = ?",
        [language],
        (err, result) => {
          if (err) return reject(err);
          return resolve(result[0].character_length);
        }
      );
    }
  });
};
module.exports = router;
