const express = require("express");
const app = express();
const cloudinary = require("cloudinary");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const { initializeDatabase } = require("./db/db.connect");
const { setSecureCookie } = require("./services/index.js");
const Post = require("./models/post.model");
const User = require("./models/user.model");

const cors = require("cors");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://social-media-application-taupe.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
initializeDatabase();

const JWT_SECRET = process.env.JWT_SECRET;

const verifyJWT = (req, res, next) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return res.status(401).json({ message: "Token is not provided." });
  }

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token." });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({});

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

app.post(
  "/api/user/post",
  verifyJWT,
  upload.single("media"),
  async (req, res) => {
    const userId = req.user.id;
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title, content, are required." });
      }

      const file = req.file;
      let mediaUrl = null;
      if (file) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "uploads",
        });

        mediaUrl = result.secure_url;
      }

      const post = new Post({
        title,
        content,
        media: mediaUrl,
        author: userId,
      });
      const savedPost = await post.save();
      res
        .status(201)
        .json({ message: "Post saved successfully.", post: savedPost });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

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

app.post(
  "/api/posts/edit/:postId",
  verifyJWT,
  upload.single("media"),
  async (req, res) => {
    const userId = req.user.id;
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title, content are required." });
      }

      let file = req.file;
      let mediaUrl = null;
      if (file) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "uploads",
        });

        mediaUrl = result.secure_url;
      }

      const updateData = { title, content, author: userId };
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

app.post("/api/posts/like/:postId", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
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

app.post("/api/posts/dislike/:postId", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
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

app.delete("/api/user/posts/:postId", verifyJWT, async (req, res) => {
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

//User api

app.get("/api/user/me", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/user", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existedUser = await User.findOne({ email });

    if (existedUser) {
      res.status(400).json({ message: "User already exists." });
    } else {
      //hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        avatar:
          "https://img.freepik.com/free-psd/3d-rendering-avatar_23-2150833554.jpg?size=626&ext=jpg&ga=GA1.1.1278706250.1727432548&semt=ais_hybrid",
      });

      const savedUser = await user.save();
      if (savedUser) {
        const jwtToken = jwt.sign(
          { id: savedUser._id, user: savedUser, role: "user" },
          JWT_SECRET,
          { expiresIn: "24h" }
        );
        setSecureCookie(res, jwtToken);
        res.status(201).json({
          message: "User registered successfully",
          user: savedUser,
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal server error.");
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: "user" }, JWT_SECRET, {
      expiresIn: "24h",
    });
    setSecureCookie(res, token);

    res
      .status(200)
      .json({ message: "User login successful.", token, user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
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

app.post("/api/user/update", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    } else {
      res.status(200).json(updatedUser);
    }
  } catch (error) {
    res.status(500).json("Internal server error.");
  }
});

app.post("/api/users/bookmark/:postId", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

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

app.get("/api/users/bookmark", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const user = await User.findById(userId);
    if (user) {
      res.json(user.bookmarks);
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/users/add-bookmark/:postId", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
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

app.post("/api/users/remove-bookmark/:postId", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
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

app.post("/api/users/follow/:followUserId", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
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

app.post("/api/users/unfollow/:followUserId", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
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
