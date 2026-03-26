const mongoose = require("mongoose");
const schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new schema({
    email:{
        type:String,
        required:true,

    },
});


//this line automatically add hash,salt and id
userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model("User",userSchema);