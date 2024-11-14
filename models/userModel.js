const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name:{
        type:String, 
        required : true, 
    },
    email:{
        type:String, 
        unique: true,
        required : true, 
        lowercase: true,
    },
    email_verified_at:{
        type: Date, 
        default : Date.now
    },
    password: {
        type: String,
        select: false,
        default: null,
      },
    user_photo : { type: String, default: "" }, 
    role_id : {
        type:  mongoose.Schema.Types.ObjectId, 
        ref : 'Role', 
        default:null
    }, 
    in_active :{
        type: Number,
        enum: [0, 1],
        default: 0,
        description: "0 for inactive, 1 for active" 
    }, 
    company:{
        type : String, 
        default:null
    }, 
    remember_token : {
        type : String,
        default:null 
    }
},
{
    timestamps: true
} 
)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
      next();
    }
    this.password = await bcrypt.hash(this.password, 10);
  });


  userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password) {
      return false; 
    }
    return await bcrypt.compare(enteredPassword, this.password);
  };

const userModel = mongoose.model("User", userSchema);
module.exports = userModel