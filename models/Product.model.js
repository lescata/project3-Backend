const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    name : String,
    category: String,
    price:{
        value: Number,
        currency:{
            type: String,
            default: "EUR"
        }
    },
    stock: Number,
    Note: Number,
    images: Array,
    details:[
        {
            Name: String,
            value: String
        }
    ]
});

const Product = model("Product", userSchema);

module.exports = Product;
