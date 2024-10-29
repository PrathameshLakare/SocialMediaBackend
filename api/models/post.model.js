const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String },
    content: { type: String },
    media: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
