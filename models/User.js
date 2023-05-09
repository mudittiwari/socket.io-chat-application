
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username:{type:String,required:true,unique:true},
  password: { type: String, required: true },
  profilepicture: { type: String, default: "" },
  posts:[],
  friends:[],
  friendrequests:[],
  messages:[],
  orders:[{type:Object}],
  role:{type : String , default : 'user'}  
});
let autoIncrement = 1;

userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.id = autoIncrement++;
  }
  next();
});

 module.exports = mongoose.model('User', userSchema);