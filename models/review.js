const mongoose = require("mongoose");
const schema = mongoose.Schema;

const reviewSchema = new schema({
    comment:String,
    rating:{
        type:Number,
        min:1,
        max:5
    },
    author:{
        type: schema.Types.ObjectId,
        ref:"User"
    },
    createdAt:{
        type:Date,
        default:Date.now(),
    }
})

module.exports = mongoose.model("Review",reviewSchema)
