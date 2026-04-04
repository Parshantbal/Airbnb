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
        default:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    },
    imageFilename:String,
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
        await review.deleteMany({ _id: { $in: listing.reviews } });
    }
})

module.exports= mongoose.model("listing",listingSchema);


