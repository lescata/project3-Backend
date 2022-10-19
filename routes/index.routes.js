const router = require("express").Router();

const User = require("../models/User.model");
const Product = require("../models/Product.model")
const Order = require("../models/Order.model")

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {isAuthenticated} = require("../Middleware/jwt.middleware");
const fileUploader = require("../config/cloudinary.config")
const saltRounds = 7;

router.get("/", (req, res, next) => {
  res.json("All good in here");
});

// ╔═╗┬─┐┌─┐┌─┐┌┬┐┌─┐┌─┐  ┌─┐  ┌┐┌┌─┐┬ ┬  ┬ ┬┌─┐┌─┐┬─┐  ┬┌┐┌  ┌┬┐┬ ┬┌─┐  ┌┬┐┌─┐┌┬┐┌─┐┌┐ ┌─┐┌─┐┌─┐
// ║  ├┬┘├┤ ├─┤ │ ├┤ └─┐  ├─┤  │││├┤ │││  │ │└─┐├┤ ├┬┘  ││││   │ ├─┤├┤    ││├─┤ │ ├─┤├┴┐├─┤└─┐├┤
// ╚═╝┴└─└─┘┴ ┴ ┴ └─┘└─┘  ┴ ┴  ┘└┘└─┘└┴┘  └─┘└─┘└─┘┴└─  ┴┘└┘   ┴ ┴ ┴└─┘  ─┴┘┴ ┴ ┴ ┴ ┴└─┘┴ ┴└─┘└─┘

// Creation utilisateur
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

  // Verifie l'email
  User.findOne({ email })
    .then((foundUser) => {
      if (foundUser) {
        res.status(400).json({ message: "User already exists." });
        return;
      }

      // L'email n'existe pas -> creation de l'utilisateur
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

// Creation du token
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

// Retourne les infos utilisateurs
router.get("/session",isAuthenticated, (req,res,next) => {
    res.status(200).json(req.payload)
});

router.post("/upload", isAuthenticated, fileUploader.single("image"), (req,res,next) => {
  if (!req.file){
    next(new Error("No file uploaded!"));
    return;
  }
  res.json({image: req.file.path});
})
/* Schema Json à envoyer pour le POST /products
{
    "name": "test1",
    "category": "test2",
    "value": 450,
    "images": ["test.png","test2.png"],
    "description": "whaaa cette telé est trop bi1",
    "stock": 10,
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

// Creation d'un produit
router.post("/products", isAuthenticated, (req, res, next) => {
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
    console.log(err); res.status(500).json({ message: "Internal Server Error: Product NOT created" })
  })
})

// Recuperation des infos de produits pour la barre de recherche
router.get("/products", (req, res, next) => {
  const {q} = req.query
  const regex = new RegExp(q, "i") // soit la regex: /Sam/i

  Product.find({name: regex}) // tous les produits contenant "Sam" (case-insensitive)
  .limit(5)
  .then(productsFromDB => {
    res.status(200).json(productsFromDB)
  })
  .catch(err => {
    console.log(err); res.status(500).json({ message: "Internal Server Error, Could not find/reach the Product" })
  })
})

// Recuperation des informations d'un produit
router.get("/product/:_id", (req, res, next) => {
  const {_id} = req.params

  if (_id){
    Product.findById(_id)
    .then(productFromDB => res.status(200).json(productFromDB))
    .catch(err => {console.log(err); res.status(404).send("Nothing")})
  }

})

// Recuperation d'une liste de categorie contenant tous leurs produits
router.get("/products/:category", (req, res, next) => {
  const category = req.params.category

  Product.find({category})
  .then(productsFromDB => {
    res.status(200).json(productsFromDB)
  })
  .catch(err => {
    console.log(err); res.status(500).json({ message: "Internal Server Error, Could not find/reach the category" })
  })
})

// Suppression total du panier
router.delete("/cart", (req, res, next) => { req.session.cart = []; res.send("Delete OK")})

// Suppression d'un produit dans le panier
router.delete("/cart/:_id", (req, res, next) => { 
  const result = req.session.cart.findIndex((product, index) => {
    if(product._id === req.params._id){
      return true
    }
  })

  if(result !== -1){
    let copy = [...req.session.cart]
    copy.splice(result,1)
    req.session.cart = copy
    
    return res.status(202).json(copy)
  }
  res.status(204).send()
})

// Ajout du produit dans le panier
router.post("/cart", (req, res, next) => {
  const _id = req.query._id

  // Va rechercher l'index du produit s'il existe deja dans le req.session.cart
  const result = req.session.cart.findIndex((product, index) => {
    if(product._id === _id){
      return true
    }
  })

  // S'il trouve un resultat, ajout 1 dans le stock du produit selectionné
  if (result !== -1){
    req.session.cart[result].stock = req.session.cart[result].stock + 1
    res.status(200).send(req.session.cart)
    return
  }

  // Creation du produit dans le req.session.cart
  Product.findById(_id)
  .then(productFromDB =>{
    const productCart = {
      _id: productFromDB._id,
      name: productFromDB.name,
      image: productFromDB.images[0],
      price: productFromDB.price.value,
      quantity: 1
    }
    req.session.cart.push(productCart)
    res.status(201).send(req.session.cart)
  })
  .catch(err => { console.log(err); res.status(500).json({ message: "Internal Server Error, Could not add product to cart :",err }) })
})

// Modificaction de la quantité du produit dans le panier
router.put("/cart", (req, res, next) => {
  const arr = []
  req.body.forEach(el => {
    let quantity = -1
    if(el.quantity < 1){quantity = 1} else {quantity = el.quantity}

    const object = {
      _id: el._id,
      name: el.name,
      image: el.image,
      price : el.price,
      quantity
    }
    arr.push(object)
  })

  req.session.cart = arr
  res.status(200).json(arr)
})

// Recuperation des informations de panier
router.get("/cart", (req, res, next) => {
  res.status(200).json(req.session.cart)
})

// Recuperation des informations de commandes
router.get("/orders", isAuthenticated, (req, res, next) => {
  const { _id } = req.payload
  Order.find({customer: _id})
  .then(ordersFromDB=> {
    res.status(200).json(ordersFromDB)
  })
  .catch(err=> {console.log(err); res.status(500).json({message: "Server error"})})
})

// Recuperation des informations de profile
router.get("/profile", isAuthenticated, (req, res, next) => {
  User.findById(req.payload._id)
  .then(userFromDB=>{
    console.log(userFromDB)
    res.status(200).json(userFromDB)
  })
  .catch(err=> {console.log(err); res.status(500).json({message: "Server error"})})
})

// Mise à jour du profil
router.put("/profile", isAuthenticated, (req, res, next) => {
  const {firstName, lastName, email, number, street, city, country, password } = req.body

  User.findByIdAndUpdate(req.payload._id,{
    firstName,
    lastName,
    email,
    address:{
      number,
      street,
      city,
      country
    }

  })
  .then(()=> {
    if (password){
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);
      User.findByIdAndUpdate(req.payload._id,{
        password: hashedPassword
      })
      .then(res.status(201).json({message: "Password changed with success"}))
      .catch(err=> {console.log(err); res.status(500).json({message: "Server error"})})
    }else { res.status(201).json({message: "Profile changed with success"}) }
  })
  .catch(err=> {console.log(err); res.status(500).json({message: "Server error"})})
})


router.post("/payment", isAuthenticated,(req, res, next) => {
  const { pan, name, cvv, expiry } = req.body;

  
  console.log("LLlllllllllllllaaaaaaaaaa",req.payload)
  if (pan === "" || name === "" || cvv === "" || expiry === "") {
    res.status(400).json({ message: "Provide full page details" });
  }

  const passwordRegex = /(?=.*[0-9]).{16,}/;
  if (!passwordRegex.test(pan)) {
    res.status(400).json({
      message:
        "Please Provide a Valide Credit Card Number",
    });
    return;
  }

  let cart = []
  req.session.cart.forEach(el=>{
    let object = {
      productId: el._id,
      quantity: el.quantity,
      price:{
        value: el.price
      }
    }
    cart.push(object)
  })

     Order.create({
      customer: req.payload._id,
      date: new Date(),
      products: cart
     })

    .then((reponse) => {
      res.status(201).json({message: "success"});
      req.session.cart=[];
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});


module.exports = router;
