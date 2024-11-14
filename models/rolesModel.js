const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name:{
        type:String, 
        required : true, 
    },
    display_name:{
        type:String, 
        required : true, 
    },
    description : String, 
},
{
    timestamps: true
} 
)

const userModel = mongoose.model("Role", roleSchema);
module.exports = userModel