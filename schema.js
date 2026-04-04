const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    list: Joi.object({
        title: Joi.string().trim().required(),
        description: Joi.string().trim().required(),
        price: Joi.number().required().min(0),
        location: Joi.string().trim().required(),
        country: Joi.string().trim().required(),
    }).required(),
});

module.exports.reviewSchema = Joi.object({


    review:Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment:Joi.string().trim().required(),
    }).required()
});

module.exports.bookingSchema = Joi.object({
    booking: Joi.object({
        checkIn: Joi.date().iso().required(),
        checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required(),
        guests: Joi.number().integer().min(1).required(),
    }).required(),
});

module.exports.paymentVerificationSchema = Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
});
