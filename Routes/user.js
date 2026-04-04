const express = require("express");
const router = express.Router();
const user = require("../models/user");
const Booking = require("../models/booking.js");
const Cart = require("../models/cart.js");
const Listing = require("../models/listing.js");
const wrapAsync = require("../util/wrapAsync");
const passport = require("passport");
const { saveUrlRedirect, isLoggedIn } = require("../middleware.js");


router.get("/signup", (req, res) => {
    res.render("user/signup.ejs");

});

router.post(
    "/signup"
    , wrapAsync(async (req, res, next) => {

        try {
            let { username, email, password } = req.body;
            const newUser = new user({ email, username });
            const registerUser = await user.register(newUser, password);

            req.login(registerUser, (err) => {
                if (err) {
                    return next(err);
                }
                req.flash("success", "User registered successfully")
                res.redirect("/listing");
            })



        } catch (e) {
            req.flash("error", e.message)
            res.redirect("/signup");
        }



    })
)

router.get("/login", (req, res) => {
    res.render("user/login.ejs")
});

router.post("/login", 
    saveUrlRedirect,
    passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async (req, res) => {
    req.flash("success", "welcome back to wanderlust");

    let redirectUrl = res.locals.redirectUrl||"/listing";
    res.redirect(redirectUrl);
});

router.get("/profile", isLoggedIn, wrapAsync(async (req, res) => {
    const [confirmedBookings, userCart, hostedListings, recentBookings] = await Promise.all([
        Booking.countDocuments({ user: req.user._id, status: "confirmed" }),
        Cart.findOne({ user: req.user._id }).select("items"),
        Listing.countDocuments({ owner: req.user._id }),
        Booking.find({ user: req.user._id, status: "confirmed" })
            .sort({ createdAt: -1 })
            .limit(3),
    ]);

    res.render("user/profile.ejs", {
        profileStats: {
            confirmedBookings,
            cartItems: userCart ? userCart.items.length : 0,
            hostedListings,
        },
        recentBookings,
    });
}));

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "user logout successfully");
        res.redirect("/listing");
    });
});




module.exports = router;
