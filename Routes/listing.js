const express = require("express");
const router = express.Router();
const wrapAsync = require("../util/wrapAsync.js");
const Error = require("../util/expressError.js");
const { listingSchema } = require("../schema.js");
const listing = require("../models/listing.js");
const Cart = require("../models/cart.js");
const { buildCartItem } = require("../util/booking.js");
const { isLoggedIn, isOwner, isBookingAllowed, validateBooking } = require("../middleware.js");



const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new Error(400, errMsg);
    } else {
        next();
    }
}

async function getOrCreateCart(userId) {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }
    return cart;
}

function createCartItem(listDoc, bookingInput) {
    try {
        return buildCartItem(listDoc, bookingInput);
    } catch (err) {
        throw new Error(400, err.message);
    }
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}



router.get("/", async (req, res) => {
    const { q = "", location = "", maxPrice = "" } = req.query;
    const filters = {
        q: q.trim(),
        location: location.trim(),
        maxPrice: maxPrice.trim(),
    };
    const query = {};

    if (filters.q) {
        const keywordPattern = new RegExp(escapeRegex(filters.q), "i");
        query.$or = [
            { title: keywordPattern },
            { description: keywordPattern },
            { location: keywordPattern },
            { country: keywordPattern },
        ];
    }

    if (filters.location) {
        query.location = new RegExp(escapeRegex(filters.location), "i");
    }

    if (filters.maxPrice) {
        const maxPriceValue = Number(filters.maxPrice);
        if (!Number.isNaN(maxPriceValue) && maxPriceValue >= 0) {
            query.price = { $lte: maxPriceValue };
            filters.maxPrice = String(maxPriceValue);
        } else {
            filters.maxPrice = "";
        }
    }

    let lists = await listing.find(query);
    res.render("./listings/alllist.ejs", { lists, filters })
});
//new list
router.get("/new",isLoggedIn, (req, res) => {
    res.render("./listings/new.ejs")
})

//show route
router.get("/:id",
    wrapAsync(async (req, res) => {
        let { id } = req.params;
        let list = await listing.findById(id)
            .populate({
                path: "reviews",
                populate: {
                    path: "author",
                },
            })
            .populate("owner");
        if (!list) {
            req.flash("error", "Listing you requested doe not exist");
            return res.redirect("/listing");
        };
        res.render("./listings/show.ejs", { list })
    })
);

router.post("/:id/cart",
    isLoggedIn,
    validateBooking,
    isBookingAllowed,
    wrapAsync(async (req, res) => {
        const cart = await getOrCreateCart(req.user._id);
        cart.items.push(createCartItem(req.listing, req.body.booking));
        await cart.save();
        req.flash("success", "Stay added to cart");
        res.redirect(`/listing/${req.listing._id}`);
    })
);

router.post("/:id/book",
    isLoggedIn,
    validateBooking,
    isBookingAllowed,
    wrapAsync(async (req, res) => {
        const cart = await getOrCreateCart(req.user._id);
        cart.items.push(createCartItem(req.listing, req.body.booking));
        await cart.save();
        req.flash("success", "Stay added. Complete your payment from the cart.");
        res.redirect("/cart");
    })
);

//create new list
router.post("/",
    isLoggedIn,
    validateListing,
    wrapAsync(async (req, res, next) => {

        const list = new listing(req.body.list);
        list.owner=req.user._id;
        await list.save();
        req.flash("success", "new listing  created");
        res.redirect("/listing")

    })
)
// edit form
router.get("/:id/edit",isLoggedIn, isOwner,wrapAsync(async (req, res) => {
    let { id } = req.params;
    let list = await listing.findById(id);
    res.render("./listings/edit.ejs", { list })

}))
//update route
validateListing,
    router.put("/:id", isLoggedIn, isOwner,wrapAsync(async (req, res) => {
        let { id } = req.params;
        await listing.findByIdAndUpdate(id, { ...req.body.list });
        req.flash("success", " listing is updated")
        res.redirect(`/listing/${id}`);

    }))
//DELTE ROUTE
router.delete("/:id",isLoggedIn,isOwner,wrapAsync(async (req, res) => {
    let { id } = req.params;
    let delteList = await listing.findByIdAndDelete(id);
    console.log(delteList);
    req.flash("success", " listing deleted")
    res.redirect("/listing");

}));


module.exports = router;
