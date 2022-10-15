const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    customer:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    date: Date,
    status:{
        type: String,
        enum: ["In progress", "send"],
        products:[
            {
                productId:{
                    type: Schema.Types.ObjectId,
                    ref: "Product"
                },
                quantity: Number,
                price:{
                    value: Number,
                    currency:{
                        type: String,
                        default: "EUR"
                    }
                }
            }
        ]
    }
});

const Order = model("Order", userSchema);

module.exports = Order;
