const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    name : String,
    category: {
        type: String,
        enum: ["televisions", "laptops", "consoles"]
    },
    price:{
        value: Number,
        currency:{
            type: String,
            default: "EUR"
        }
    },
    description: String,
    stock: Number,
    Note: Number,
    images: Array,
    details: [
        {
            name: String,
            value: String
        }
    ]
});

const Product = model("Product", userSchema);

module.exports = Product;
