const express = require("express");
const app = express();
// import db
const db = require("./database.js");
// hash password
const md5 = require("md5");
// parses body content and stores it in req.body obj
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// server port
const HTTP_PORT = 8000;

// start server
app.listen(HTTP_PORT, () =>
  console.log("Server running on port %PORT%".replace("%PORT%", HTTP_PORT))
);

// root endpoint
app.get("/", (req, res, next) => res.json({ message: "Ok" }));

// insert here other api endpoints

// index all users
app.get("/api/users", (req, res, next) => {
  let sql = "SELECT * FROM user";
  let params = [];
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "success", data: rows });
  });
});

// get user by id
app.get("/api/user/:id", (req, res, next) => {
  let sql = "select * from user where id = ?";
  let params = [req.params.id];
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    // if user does not exist
    if (!row) {
      res
        .status(404)
        .json({ error: `user with an id of ${req.params.id} not found` });
      return;
    }
    res.json({
      message: "success",
      data: row,
    });
  });
});

// create new user
app.post("/api/user", (req, res, next) => {
  let errors = [];
  if (!req.body.password) errors.push("No password specified");
  if (!req.body.email) errors.push("No email specified");
  if (errors.length) {
    res.status(400).json({ error: errors.join(",") });
  }
  let data = {
    name: req.body.name,
    email: req.body.email,
    password: md5(req.body.password),
  };
  let sql = "INSERT INTO user(name, email, password) VALUES (?, ?, ?)";
  let params = [data.name, data.email, data.password];
  db.run(sql, params, function (err, result) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "success", data: data, id: this.lastID });
  });
});

// update an user

app.patch("/api/user/:id", (req, res, next) => {
  const data = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password ? md5(req.body.password) : null,
  };
  db.run(
    `UPDATE user set
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      password = COALESCE(?, password)
      WHERE id = ?
    `,
    [data.name, data.email, data.password, req.params.id],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        message: "success",
        data: data,
        changes: this.changes,
      });
    }
  );
});

// delete an user
app.delete("/api/user/:id", (req, res, next) => {
  db.run(
    "DELETE FROM user WHERE id = ?",
    req.params.id,
    function (err, result) {
      if (err) {
        res.status(400).json({ error: res.message });
        return;
      }
      res.json({ message: "deleted", changes: this.changes });
    }
  );
});
