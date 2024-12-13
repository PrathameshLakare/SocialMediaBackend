const express = require("express");
const app = express();
require("dotenv").config();

const cloudinary = require("cloudinary").v2;
let streamifier = require("streamifier");

const multer = require("multer");

const { initializeDatabase } = require("./db/db.connect");
const Post = require("./models/post.model");
const User = require("./models/user.model");

const cors = require("cors");
app.use(cors());

app.use(express.json());
initializeDatabase();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({ storage });

app.get("/api/post", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "-password");
    if (posts) {
      res.json(posts);
    } else {
      res.status(404).json({ error: "Failed to find post." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/user/post", upload.single("media"), async (req, res) => {
  try {
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
      return res
        .status(400)
        .json({ error: "Title, content, and author are required." });
    }

    let mediaUrl = null;
    if (req.file) {
      const mediaData = req.file.buffer;

      try {
        let uploadFromBuffer = (req) => {
          return new Promise((resolve, reject) => {
            let cld_upload_stream = cloudinary.uploader.upload_stream(
              {
                folder: "foo",
              },
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              }
            );

            streamifier
              .createReadStream(req.file.buffer)
              .pipe(cld_upload_stream);
          });
        };
        let result = await uploadFromBuffer(req);
        mediaUrl = result.secure_url;
      } catch (error) {
        console.error("Error uploading media to cloudinary:", error);
        return res.status(500).json({ error: "Internal server error." });
      }
    }

    const post = new Post({ title, content, media: mediaUrl, author });
    const savedPost = await post.save();
    res
      .status(201)
      .json({ message: "Post saved successfully.", post: savedPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/post/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// app.post("/api/posts/edit/:postId", async (req, res) => {
//   try {
//     const updatedPost = await Post.findByIdAndUpdate(
//       req.params.postId,
//       req.body,
//       { new: true }
//     );
//     if (updatedPost) {
//       res.status(200).json(updatedPost);
//     } else {
//       res.status(404).json("Post not found");
//     }
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

app.post(
  "/api/posts/edit/:postId",
  upload.single("media"),
  async (req, res) => {
    try {
      const { title, content, author } = req.body;

      if (!title || !content || !author) {
        return res
          .status(400)
          .json({ error: "Title, content, and author are required." });
      }

      let mediaUrl = null;
      if (req.file) {
        try {
          const uploadFromBuffer = (req) => {
            return new Promise((resolve, reject) => {
              const cld_upload_stream = cloudinary.uploader.upload_stream(
                {
                  folder: "foo",
                },
                (error, result) => {
                  if (result) {
                    resolve(result);
                  } else {
                    reject(error);
                  }
                }
              );

              streamifier
                .createReadStream(req.file.buffer)
                .pipe(cld_upload_stream);
            });
          };
          const result = await uploadFromBuffer(req);
          mediaUrl = result.secure_url;
        } catch (error) {
          console.error("Error uploading media to cloudinary:", error);
          return res.status(500).json({ error: "Internal server error." });
        }
      }

      const updateData = { title, content, author };
      if (mediaUrl) {
        updateData.media = mediaUrl;
      }

      const updatedPost = await Post.findByIdAndUpdate(
        req.params.postId,
        updateData,
        { new: true }
      );

      if (updatedPost) {
        res
          .status(200)
          .json({ message: "Post updated successfully.", post: updatedPost });
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

app.post("/api/posts/like/:postId", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    const post = await Post.findById(req.params.postId);

    if (!post || !user) {
      return res.status(404).json("Post or user not found.");
    }

    if (!post.likes.includes(user._id)) {
      post.likes.push(user._id);
      await post.save();
      const updatedPost = await Post.findById(post._id).populate("author");
      return res.status(200).json(updatedPost);
    } else {
      return res.status(400).json("User has already liked this post.");
    }
  } catch (error) {
    res.status(500).json("Internal server error.");
  }
});

app.post("/api/posts/dislike/:postId", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    const post = await Post.findById(req.params.postId);

    if (!post || !user) {
      return res.status(404).json("Post or user not found.");
    }

    if (post.likes.includes(user._id)) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== user._id.toString()
      );
      await post.save();
      const updatedPost = await Post.findById(post._id).populate("author");
      return res.status(200).json(updatedPost);
    } else {
      return res.status(400).json("User has not liked this post.");
    }
  } catch (error) {
    res.status(500).json("Internal server error.");
  }
});

app.delete("/api/user/posts/:postId", async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.postId);

    if (deletedPost) {
      res.status(200).json({ message: "Post deleted successfully." });
    } else {
      res.status(404).json({ error: "Post not found." });
    }
  } catch (error) {
    res.status(500).json("Internal server error.");
  }
});

app.post("/api/user", async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    if (savedUser) {
      res
        .status(201)
        .json({ message: "User saved successfully.", user: savedUser });
    }
  } catch (error) {
    res.status(500).json("Internal server error.");
  }
});

app.get("/api/user", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (users.length > 0) {
      res.json(users);
    } else {
      res.status(404).json({ error: "Failed to find users." });
    }
  } catch (error) {
    res.status(500).json("Internal server error.");
  }
});

app.post("/api/user/update/:userId", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    } else {
      res.status(200).json(updatedUser);
    }
  } catch (error) {
    res.status(500).json("Internal server error.");
  }
});

app.post("/api/users/bookmark/:postId", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);

    if (user) {
      user.bookmarks.push(req.params.postId);
      const saveToBookmark = await user.save();
      res
        .status(200)
        .json({ message: "Post bookmarked.", bookmark: saveToBookmark });
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/users/bookmark/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (user) {
      res.json(user.bookmarks);
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/users/add-bookmark/:postId", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (user && !user.bookmarks.includes(req.params.postId)) {
      user.bookmarks.push(req.params.postId);
      await user.save();
      res.status(200).json(user.bookmarks);
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/users/remove-bookmark/:postId", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (user) {
      user.bookmarks = user.bookmarks.filter(
        (postId) => postId.toString() !== req.params.postId
      );
      await user.save();
      res.status(200).json(user.bookmarks);
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/users/follow/:followUserId", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    const followUser = await User.findById(req.params.followUserId);
    if (user && followUser) {
      user.following.push(followUser._id);
      await user.save();
      res.status(200).json({ user });
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/users/unfollow/:followUserId", async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    const followUser = await User.findById(req.params.followUserId);
    if (user && followUser) {
      user.following = user.following.filter(
        (id) => id.toString() !== followUser._id.toString()
      );
      await user.save();
      res.status(200).json({ user });
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
