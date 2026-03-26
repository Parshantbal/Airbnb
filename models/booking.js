const mongoose = require("mongoose");
const schema = mongoose.Schema;

const bookingSchema = new schema(
    {
        user: {
            type: schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
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
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "failed"],
            default: "confirmed",
        },
        paymentProvider: {
            type: String,
            default: "razorpay",
        },
        razorpayOrderId: {
            type: String,
            required: true,
        },
        razorpayPaymentId: {
            type: String,
            required: true,
        },
        razorpaySignature: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
