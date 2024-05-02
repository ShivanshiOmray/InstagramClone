const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/instagram");

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  bio: String,
  profileImage: {
    type: String,
    default: "default.jpg",
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  followings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  story: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "story",
    },
  ],
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "story",
    },
  ],
  messages: {
    type: Array,
    default: [],
  },
  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});

mongoose.plugin(plm);

module.exports = mongoose.model("user", userSchema);
