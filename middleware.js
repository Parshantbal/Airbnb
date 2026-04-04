const listing = require("./models/listing.js");
const Cart = require("./models/cart.js");
const Review = require("./models/review.js");
const expressError = require("./util/expressError.js");
const { bookingSchema, paymentVerificationSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
   // console.log(req.path,"..", req.originalUrl);
   if (!req.isAuthenticated()) {
      const redirectUrl =
         req.method === "GET" ? req.originalUrl : req.get("referer") || "/listing";
      req.session.redirectUrl = redirectUrl;
      req.flash("error", "you must be logged in first");
      return res.redirect("/login");
   }
   next();
};


module.exports.saveUrlRedirect = (req, res, next) => {
   if (req.session.redirectUrl) {
      res.locals.redirectUrl = req.session.redirectUrl;
      delete req.session.redirectUrl;
   }
   next();
}

module.exports.isOwner = async (req, res, next) => {
   let { id } = req.params;
   let list = await listing.findById(id);
   if (!list) {
      req.flash("error", "Listing you requested does not exist");
      return res.redirect("/listing");
   }

   if (!res.locals.currUser || !list.owner || !list.owner.equals(res.locals.currUser._id)) {

      req.flash("error", "you are not the owner of this listing");
      return res.redirect(`/listing/${id}`)
   }

   next();

};

module.exports.validateBooking = (req, res, next) => {
   const { error } = bookingSchema.validate(req.body);
   if (error) {
      const errMsg = error.details.map((el) => el.message).join(", ");
      throw new expressError(400, errMsg);
   }
   next();
};

module.exports.validatePaymentVerification = (req, res, next) => {
   const { error } = paymentVerificationSchema.validate(req.body);
   if (error) {
      const errMsg = error.details.map((el) => el.message).join(", ");
      throw new expressError(400, errMsg);
   }
   next();
};

module.exports.isBookingAllowed = async (req, res, next) => {
   const { id } = req.params;
   const list = await listing.findById(id);

   if (!list) {
      req.flash("error", "Listing you requested does not exist");
      return res.redirect("/listing");
   }

   if (list.owner && list.owner.equals(res.locals.currUser._id)) {
      req.flash("error", "You cannot book your own listing");
      return res.redirect(`/listing/${id}`);
   }

   req.listing = list;
   next();
};

module.exports.attachCartSummary = async (req, res, next) => {
   res.locals.cartItemCount = 0;

   if (!req.isAuthenticated || !req.isAuthenticated()) {
      return next();
   }

   const cart = await Cart.findOne({ user: req.user._id }).select("items");
   res.locals.cartItemCount = cart ? cart.items.length : 0;
   next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
   const reviewDoc = await Review.findById(req.params.reviewId);

   if (!reviewDoc) {
      req.flash("error", "Review not found");
      return res.redirect(`/listing/${req.params.id}`);
   }

   if (!reviewDoc.author || !reviewDoc.author.equals(res.locals.currUser._id)) {
      req.flash("error", "You can only delete your own review");
      return res.redirect(`/listing/${req.params.id}`);
   }

   next();
};
