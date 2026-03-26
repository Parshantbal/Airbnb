const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const router = express.Router();
const Cart = require("../models/cart.js");
const Booking = require("../models/booking.js");
const expressError = require("../util/expressError.js");
const { calculateCartTotals } = require("../util/booking.js");
const { isLoggedIn, validatePaymentVerification } = require("../middleware.js");

function getRazorpayInstance() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new expressError(500, "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

async function getUserCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items.length) {
        throw new expressError(400, "Your cart is empty.");
    }

    return cart;
}

function sendJsonError(res, error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || "Something went wrong" });
}

router.post("/create-order", isLoggedIn, async (req, res, next) => {
    try {
        const cart = await getUserCart(req.user._id);
        const totals = calculateCartTotals(cart.items);
        const razorpay = getRazorpayInstance();

        const order = await razorpay.orders.create({
            amount: Math.round(totals.subtotal * 100),
            currency: "INR",
            receipt: `cart_${req.user._id}_${Date.now()}`,
            notes: {
                userId: String(req.user._id),
                itemCount: String(totals.itemCount),
            },
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            name: "Wonderlust",
            description: `Booking payment for ${totals.itemCount} stay(s)`,
            user: {
                name: req.user.username,
                email: req.user.email,
            },
        });
    } catch (error) {
        if (error instanceof expressError) {
            return sendJsonError(res, error);
        }
        next(error);
    }
});

router.post("/verify", isLoggedIn, validatePaymentVerification, async (req, res, next) => {
    try {
        const cart = await getUserCart(req.user._id);
        const totals = calculateCartTotals(cart.items);
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const razorpay = getRazorpayInstance();

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            throw new expressError(400, "Payment verification failed.");
        }

        const order = await razorpay.orders.fetch(razorpay_order_id);
        if (order.amount !== Math.round(totals.subtotal * 100)) {
            throw new expressError(400, "Payment amount does not match the cart total.");
        }

        const bookings = cart.items.map((item) => ({
            user: req.user._id,
            listing: item.listing,
            title: item.title,
            image: item.image,
            location: item.location,
            checkIn: item.checkIn,
            checkOut: item.checkOut,
            guests: item.guests,
            nightlyPrice: item.nightlyPrice,
            nights: item.nights,
            totalAmount: item.subtotal,
            status: "confirmed",
            paymentProvider: "razorpay",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
        }));

        await Booking.insertMany(bookings);
        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            redirectUrl: "/bookings",
        });
    } catch (error) {
        if (error instanceof expressError) {
            return sendJsonError(res, error);
        }
        next(error);
    }
});

module.exports = router;
