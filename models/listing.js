const mongoose = require("mongoose");
const review = require("./review");

const schema = mongoose.Schema;

const listingSchema = new schema({
    title:{
        type:String,
        
    },
    description:String,
    image:{
        type:String,
        default:"https://unsplash.com/photos/yellow-flowers-bloom-amidst-green-grass-99WR9gZrvdY",
        set:(v)=>v===" "?"https://unsplash.com/photos/yellow-flowers-bloom-amidst-green-grass-99WR9gZrvdY":v,
    },
    price:Number,
    location:{
        type:String,
        
    },
    country:{
        type:String,
        
    },

    reviews:[
        {
            type: schema.Types.ObjectId,
            ref:"Review"
        },
    ],
    owner:{
        type: schema.Types.ObjectId,
        ref:"User"
    }
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await review.deleteMany({id:{$in:listing.reviews}});
    }
})

module.exports= mongoose.model("listing",listingSchema);


