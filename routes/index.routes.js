const router = require("express").Router();
const User = require("../models/User.model");
const Product = require("../models/Product.model")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../Middleware/jwt.middleware");
const saltRounds = 7;

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
});

//  ╦  ┌─┐┌─┐┌─┐┬┌┐┌
//  ║  │ ││ ┬│ ┬││││
//  ╩═╝└─┘└─┘└─┘┴┘└┘

router.post("/sessions", (req, res, next) => {
  const { email, password } = req.body;

  // Verification de la presence de l'email et du password dans le formulaire
  if (email === "" || password === "") {
    res.status(400).json({ message: "Please provide Both Email & Password." });
    return;
  }
  //Verification de l'utilisateur (email) dans la Db
  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        res.status(401).json({ message: "User could not be found." });
        return;
      }
      //comparaison du password recu vs celui dans la DB
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        const { _id, email } = foundUser;

        const payload = { _id, email };

        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "5h",
        });

        res.status(200).json({ authToken: authToken });
      } else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }
    })
    .catch((err) => res.status(500).json({ message: "Internal Server Error" }));
});


router.get("/session",isAuthenticated, (req,res,next) => {
    console.log(req.payload),
    res.status(200).json(req.payload)
});

/* Schema Json à envoyer pour le POST /products
{
    "name": "test1",
    "category": "test2",
    "value": 450,
    "images": ["test.png","test2.png"],
    "description": "whaaa cette telé est trop bi1",
    "details":[
        {
            "name": "name1",
            "value": "value1"
        },
                {
            "name": "name2",
            "value": "value2"
        }
    ]
}
*/
router.post("/products", (req, res, next) => {
  const {name, category, value, images, details} = req.body

  Product.create({
    name,
    category,
    price:{value},
    images,
    details
  })
  .then(()=>{
    res.status(201).json({message: "OK"})
  })
  .catch(err => {
    console.log(err); res.status(500).json({ message: "Internal Server Error" })
  })
})

module.exports = router;
