const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../util/wrapAsync.js");
const Error = require("../util/expressError.js");
const {reviewSchema } = require("../schema.js");
const review = require("../models/review.js");
const listing = require("../models/listing.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware.js");



const validatereview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new Error(400, errMsg);
    } else {
        next();
    }
};




//review route
router.post("/", isLoggedIn, validatereview, wrapAsync(async (req, res) => {
    let rev = await listing.findById(req.params.id);
    if (!rev) {
        req.flash("error", "Listing you requested does not exist");
        return res.redirect("/listing");
    }
    let newReview = new review(req.body.review);
    newReview.author = req.user._id;

    rev.reviews.push(newReview);

    await newReview.save();
    await rev.save();
     req.flash("success","new review is added")

    res.redirect(`/listing/${rev._id}`);


}));


//reveiw delete route
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(async(req,res)=>{
    let {id,reviewId}=req.params;

    const listingDoc = await listing.findById(id);
    if (!listingDoc) {
        req.flash("error", "Listing you requested does not exist");
        return res.redirect("/listing");
    }

    await listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
    await review.findByIdAndDelete(reviewId);
     req.flash("success","review is deleted")

    res.redirect(`/listing/${id}`);
}));

module.exports = router;
