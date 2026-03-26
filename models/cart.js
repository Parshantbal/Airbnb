const mongoose = require("mongoose");
const schema = mongoose.Schema;

const cartItemSchema = new schema(
    {
        listing: {
            type: schema.Types.ObjectId,
            ref: "listing",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            default: "",
        },
        location: {
            type: String,
            default: "",
        },
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true,
        },
        guests: {
            type: Number,
            required: true,
            min: 1,
        },
        nightlyPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        nights: {
            type: Number,
            required: true,
            min: 1,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: true }
);

const cartSchema = new schema(
    {
        user: {
            type: schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        items: [cartItemSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
