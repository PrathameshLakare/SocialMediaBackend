const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    media: [
      {
        type: String,
      },
    ],
    likes: Number,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: { type: String, required: true },
        postedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
