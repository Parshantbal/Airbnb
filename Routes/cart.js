const express = require("express");
const router = express.Router();
const Cart = require("../models/cart.js");
const wrapAsync = require("../util/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const { calculateCartTotals } = require("../util/booking.js");

router.get("/",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const cart = await Cart.findOne({ user: req.user._id });
        const totals = calculateCartTotals(cart ? cart.items : []);
        res.render("./cart/index.ejs", { cart, totals });
    })
);

router.delete("/items/:itemId",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            req.flash("error", "Your cart is already empty");
            return res.redirect("/cart");
        }

        const cartItem = cart.items.id(req.params.itemId);
        if (!cartItem) {
            req.flash("error", "Cart item not found");
            return res.redirect("/cart");
        }

        cartItem.deleteOne();
        await cart.save();

        req.flash("success", "Item removed from cart");
        res.redirect("/cart");
    })
);

module.exports = router;
