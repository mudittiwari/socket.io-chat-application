
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
    title: { type: String, required: true },
    image: { type: String, required: true },
    likes: [],
    comments:[],
    user:{type:Number,required:true}
},{timestamps:true});

let autoIncrement = 1;

postSchema.pre('save', function(next) {
  if (this.isNew) {
    this.id = autoIncrement++;
  }
  next();
});

 module.exports = mongoose.model('post', postSchema);