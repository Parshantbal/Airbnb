require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override")
const path = require("path");
const ejsMate = require("ejs-mate")
const Error = require("./util/expressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy=require("passport-local");
const user = require("./models/user.js")


const ListingRouter = require("./Routes/listing.js");
const reviewRouter = require("./Routes/reviews.js");
const userRouter = require("./Routes/user.js");
const cartRouter = require("./Routes/cart.js");
const checkoutRouter = require("./Routes/checkout.js");
const bookingRouter = require("./Routes/bookings.js");
const { attachCartSummary } = require("./middleware.js");




app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"))
app.engine("ejs", ejsMate);




const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wonderlust";

main().then(() => {
    console.log("DB is connect")
}).catch(err => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL)
}


const sessionOption = {
    secret: process.env.SESSION_SECRET || "mySecretCode",
    resave : false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge:  7 * 24 * 60 * 60 * 1000,
        httpOnly: true, // this is used for secuirty purpose
    },
};

// app.get("/", (req, res) => {
//     res.send("hii i am root")
// });

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(user.authenticate()));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());




app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
    res.locals.listingFilters = {
        q: req.query.q || "",
        location: req.query.location || "",
        maxPrice: req.query.maxPrice || "",
    };
    next();
})

app.use(attachCartSummary);



app.use("/listing",ListingRouter);
app.use("/listing/:id/review",reviewRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);
app.use("/bookings", bookingRouter);
app.use("/",userRouter);

app.use((req, res, next) => {
    next(new Error(500, "page not found"));

});
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err })
});




app.listen(8080, () => {
    console.log("server is connected 8080")
})
