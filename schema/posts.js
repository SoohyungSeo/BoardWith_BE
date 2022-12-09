const mongoose = require("mongoose");

const PostsSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  img : {
    type : String,
  },
  nickName: {
    type: String,
  },
  title: {
    type: String,
  },
  content: {
    type: String,
  },
  location: {
    type: Object, String,
  },
  cafe: {
    type: String
  },
  date: {
    type: String
  },
  time: {
    type : Array
  },
  map : {
    type : String
  },
  partyMember : {
    type : Number
  },
  participant : {
    type : Array
  },
  confirmMember : {
    type : Array
  },
  memberStatus : {
    type: Number
  },
  banUser : {
    type : Array
  },
  closed : {
    type: Number,
    default: 0
  },
  userAvatar : {
    type : Object    
  },  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expireAt: {
    type: Date,
    default: Date.now,
    expires: 0
  },
});
// PostsSchema.index({title:'text',content:'text',nickName:'text'});
module.exports = mongoose.model("Posts", PostsSchema);