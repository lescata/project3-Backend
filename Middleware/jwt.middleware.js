const { expressjwt: jwt } = require("express-jwt");

// instantiation du middlewre de la validation du JWT
const isAuthenticated = jwt({
    secret: process.env.TOKEN_SECRET,
    algorithms: ["HS256"],
    requestProperty:'payload',
    getToken: getTokenFromHeaders
});


// fonction d'extraction du token de la requet d'authorizaton 
function getTokenFromHearders (req) {

     //verification de la presence du token dans le headers
 if(req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {

    // recuperation du token
    const token = req.headers.authorization.split(" ")[1];
    return token;
}
return null;

}

// exportation du module pour pouvoir faire des routes protégés
module.exports = {
    isAuthenticated
}