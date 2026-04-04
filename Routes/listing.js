const express = require("express");
const router = express.Router();
const wrapAsync = require("../util/wrapAsync.js");
const Error = require("../util/expressError.js");
const { listingSchema } = require("../schema.js");
const listing = require("../models/listing.js");
const Cart = require("../models/cart.js");
const { buildCartItem } = require("../util/booking.js");
const { isLoggedIn, isOwner, isBookingAllowed, validateBooking } = require("../middleware.js");
const { destroyStoredImage, getLocalImageUrl, removeLocalFile, upload, uploadImageToCloudinary } = require("../cloudconfig.js");
const listingController = require("../controller/listing.js");



const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        if (req.file && req.file.path) {
            removeLocalFile(req.file.path);
        }
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

function hasDisplayableListingData(listDoc) {
    return (
        listDoc &&
        typeof listDoc.title === "string" &&
        listDoc.title.trim() &&
        typeof listDoc.location === "string" &&
        listDoc.location.trim() &&
        Number.isFinite(Number(listDoc.price))
    );
}

async function resolveUploadedImage(file) {
    if (!file || !file.path) {
        return null;
    }

    const localImageUrl = getLocalImageUrl(file.path);

    try {
        const uploadedImage = await uploadImageToCloudinary(file.path);

        if (uploadedImage && uploadedImage.imageUrl) {
            await removeLocalFile(file.path);
            return {
                image: uploadedImage.imageUrl,
                imageFilename: uploadedImage.imageFilename,
            };
        }
    } catch (error) {
        console.error("Cloudinary upload failed, using local image fallback:", error.message);
    }

    return {
        image: localImageUrl,
        imageFilename: "",
    };
}



router.get("/", wrapAsync(async (req, res) => {
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
    lists = lists.filter(hasDisplayableListingData);
    res.render("./listings/alllist.ejs", { lists, filters })


}));
//new list
router.get("/new", isLoggedIn, listingController.newListing);

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
            req.flash("error", "Listing you requested does not exist");
            return res.redirect("/listing");
        };

        if (!hasDisplayableListingData(list)) {
            req.flash("error", "This listing is incomplete and cannot be displayed right now");
            return res.redirect("/listing");
        }

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
    upload.single("image"),
    validateListing,
    wrapAsync(async (req, res) => {

        const list = new listing(req.body.list);
        list.owner = req.user._id;

        if (req.file) {
            const storedImage = await resolveUploadedImage(req.file);
            if (storedImage) {
                list.image = storedImage.image;
                list.imageFilename = storedImage.imageFilename;
            }
        }

        await list.save();
        req.flash("success", "New listing created successfully");
        res.redirect("/listing");

    })
)
// edit form
router.get("/:id/edit",isLoggedIn, isOwner,wrapAsync(async (req, res) => {
    let { id } = req.params;
    let list = await listing.findById(id);
    if (!list) {
        req.flash("error", "Listing you requested does not exist");
        return res.redirect("/listing");
    }
    res.render("./listings/edit.ejs", { list })

}))
//update route
router.put("/:id",
    isLoggedIn,
    isOwner,
    upload.single("image"),
    validateListing,
    wrapAsync(async (req, res) => {
        let { id } = req.params;
        const existingListing = await listing.findById(id);
        if (!existingListing) {
            if (req.file && req.file.path) {
                await removeLocalFile(req.file.path);
            }
            req.flash("error", "Listing you requested does not exist");
            return res.redirect("/listing");
        }
        const updateData = { ...req.body.list };

        if (req.file) {
            const storedImage = await resolveUploadedImage(req.file);
            if (storedImage) {
                await destroyStoredImage(existingListing.image, existingListing.imageFilename);
                updateData.image = storedImage.image;
                updateData.imageFilename = storedImage.imageFilename;
            }
        }

        await listing.findByIdAndUpdate(id, updateData, {
            runValidators: true,
        });
        req.flash("success", "Listing updated successfully")
        res.redirect(`/listing/${id}`);

    })
);
//DELTE ROUTE
router.delete("/:id",isLoggedIn,isOwner,wrapAsync(async (req, res) => {
    let { id } = req.params;
    let delteList = await listing.findById(id);
    if (!delteList) {
        req.flash("error", "Listing you requested does not exist");
        return res.redirect("/listing");
    }
    await destroyStoredImage(delteList.image, delteList.imageFilename);
    delteList = await listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully")
    res.redirect("/listing");

}));


module.exports = router;
