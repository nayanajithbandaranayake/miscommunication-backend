const express = require("express");
const cors = require("cors");
const users = require("./routes/users");
const convert = require("./routes/convert");
const languages = require("./routes/languages");

const PORT = process.env.PORT || 5000;

const app = express();
app.use(
  cors({
    origin: "https://miscommunication.netlify.app",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use(express.json());

app.use("/users", users);
app.use("/convert", convert);
app.use("/languages", languages);

app.listen(PORT, () => {
  console.log(`server is listening in ${PORT}`);
});
