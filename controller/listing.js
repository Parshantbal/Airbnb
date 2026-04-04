const listing = require("../models/listing");

module.exports.newListing =(req, res) => {
    res.render("./listings/new.ejs")
}