const express = require("express");
const router = express.Router();
const Booking = require("../models/booking.js");
const wrapAsync = require("../util/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");

router.get("/",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const bookings = await Booking.find({
            user: req.user._id,
            status: "confirmed",
        }).sort({ createdAt: -1 });

        res.render("./bookings/index.ejs", { bookings });
    })
);

module.exports = router;
