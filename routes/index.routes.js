const router = require("express").Router();
const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/", (req, res, next) => {
  res.json("All good in here");
});

// ╔═╗┬─┐┌─┐┌─┐┌┬┐┌─┐┌─┐  ┌─┐  ┌┐┌┌─┐┬ ┬  ┬ ┬┌─┐┌─┐┬─┐  ┬┌┐┌  ┌┬┐┬ ┬┌─┐  ┌┬┐┌─┐┌┬┐┌─┐┌┐ ┌─┐┌─┐┌─┐
// ║  ├┬┘├┤ ├─┤ │ ├┤ └─┐  ├─┤  │││├┤ │││  │ │└─┐├┤ ├┬┘  ││││   │ ├─┤├┤    ││├─┤ │ ├─┤├┴┐├─┤└─┐├┤
// ╚═╝┴└─└─┘┴ ┴ ┴ └─┘└─┘  ┴ ┴  ┘└┘└─┘└┴┘  └─┘└─┘└─┘┴└─  ┴┘└┘   ┴ ┴ ┴└─┘  ─┴┘┴ ┴ ┴ ┴ ┴└─┘┴ ┴└─┘└─┘

router.post("/users", (req, res, next) => {
  const { email, password, lastName, firstName } = req.body;

  // si email - password - nom sont vides
  // il m'envoie une reponse avec un .status (400) en .json avec un message qui me demande de
  // fournir les elements demandées

  if (email === "" || password === "" || firstName === "" || lastName === "") {
    res.status(400).json({ message: "Provide email, password and name" });
  }
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
if (!emailRegex.test(email)) {
  res.status(400).json({ message: "Provide a valid email address." });
  return;
}
const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
if (!passwordRegex.test(password)) {
  res.status(400).json({
    message:
      "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
  });
  return;
}

User.findOne({ email })
  .then((foundUser) => {
    if (foundUser) {
      res.status(400).json({ message: "User already exists." });
      return;
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    return User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });
  })
  .then((createdUser) => {
    const { email, name, _id } = createdUser;

    const user = { email, firstName, lastName, _id };

    res.status(201).json({ user: user });
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  });

//  ╦  ┌─┐┌─┐┌─┐┬┌┐┌
//  ║  │ ││ ┬│ ┬││││
//  ╩═╝└─┘└─┘└─┘┴┘└┘

module.exports = router;
