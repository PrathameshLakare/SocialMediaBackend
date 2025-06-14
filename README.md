# Social Media Backend

This is the backend server for a social media web application built with **Node.js**, **Express.js**, and **MongoDB**. It provides RESTful APIs for managing users, posts, likes, bookmarks, and following relationships.

---

## 🧰 Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Cloudinary (media uploads)
- Multer (file uploads)
- CORS
- dotenv
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- cookie-parser

---

## Quick Start

### 🚀 Running the Server

```bash
# Clone project
git clone https://github.com/PrathameshLakare/SocialMediaBackend.git

# Install dependencies
npm install

# Start the server
node api/index.js
```

### 🔑 Environment Variables

Create a `.env` file in the root and add:

```
MONGODB=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## API Reference

### **Authentication**

#### **POST /api/user**

Register a new user  
Sample Request Body:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Sample Response:

```json
{
  "_id": "60f1b2c3d4e5f6a7b8c9d0e1",
  "username": "john_doe",
  "email": "john@example.com",
  "createdAt": "2025-06-14T12:00:00.000Z"
}
```

---

#### **POST /auth/login**

Login user  
Sample Request Body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Sample Response:

```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "60f1b2c3d4e5f6a7b8c9d0e1",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

#### **POST /api/logout**

Logout user  
Sample Response:

```json
{
  "message": "Logout successful"
}
```

---

### **User**

#### **GET /api/user/me**

Get current user profile  
Sample Response:

```json
{
  "_id": "60f1b2c3d4e5f6a7b8c9d0e1",
  "username": "john_doe",
  "email": "john@example.com",
  "bio": "Hello, I'm John!",
  "profilePic": "https://cloudinary.com/profile.jpg",
  "followers": [],
  "following": []
}
```

---

#### **GET /api/user**

List all users  
Sample Response:

```json
[
  {
    "_id": "60f1b2c3d4e5f6a7b8c9d0e1",
    "username": "john_doe",
    "profilePic": "https://cloudinary.com/profile.jpg"
  },
  {
    "_id": "60f1b2c3d4e5f6a7b8c9d0e2",
    "username": "jane_doe",
    "profilePic": "https://cloudinary.com/profile2.jpg"
  }
]
```

---

#### **POST /api/user/update**

Update current user profile  
Sample Request Body:

```json
{
  "bio": "Updated bio",
  "profilePic": "https://cloudinary.com/newpic.jpg"
}
```

Sample Response:

```json
{
  "_id": "60f1b2c3d4e5f6a7b8c9d0e1",
  "username": "john_doe",
  "bio": "Updated bio",
  "profilePic": "https://cloudinary.com/newpic.jpg"
}
```

---

### **Posts**

#### **GET /api/post**

List all posts  
Sample Response:

```json
[
  {
    "_id": "70f1b2c3d4e5f6a7b8c9d0e1",
    "content": "Hello world!",
    "mediaUrl": "https://cloudinary.com/post.jpg",
    "author": {
      "_id": "60f1b2c3d4e5f6a7b8c9d0e1",
      "username": "john_doe"
    },
    "likes": 5,
    "createdAt": "2025-06-14T12:00:00.000Z"
  }
]
```

---

#### **GET /api/post/:postId**

Get details for one post  
Sample Response:

```json
{
  "_id": "70f1b2c3d4e5f6a7b8c9d0e1",
  "content": "Hello world!",
  "mediaUrl": "https://cloudinary.com/post.jpg",
  "author": {
    "_id": "60f1b2c3d4e5f6a7b8c9d0e1",
    "username": "john_doe"
  },
  "likes": 5,
  "createdAt": "2025-06-14T12:00:00.000Z"
}
```

---

#### **POST /api/user/post**

Create a new post  
Sample Request Body:

```json
{
  "content": "My first post!",
  "mediaUrl": "https://cloudinary.com/newpost.jpg"
}
```

Sample Response:

```json
{
  "_id": "70f1b2c3d4e5f6a7b8c9d0e2",
  "content": "My first post!",
  "mediaUrl": "https://cloudinary.com/newpost.jpg",
  "author": {
    "_id": "60f1b2c3d4e5f6a7b8c9d0e1",
    "username": "john_doe"
  },
  "likes": 0,
  "createdAt": "2025-06-14T12:10:00.000Z"
}
```

---

#### **POST /api/posts/edit/:postId**

Edit a post  
Sample Request Body:

```json
{
  "content": "Edited post content"
}
```

Sample Response:

```json
{
  "_id": "70f1b2c3d4e5f6a7b8c9d0e2",
  "content": "Edited post content",
  "mediaUrl": "https://cloudinary.com/newpost.jpg"
}
```

---

#### **DELETE /api/user/posts/:postId**

Delete a post  
Sample Response:

```json
{
  "message": "Post deleted successfully"
}
```

---

### **Likes**

#### **POST /api/posts/like/:postId**

Like a post  
Sample Response:

```json
{
  "message": "Post liked",
  "likes": 6
}
```

---

#### **POST /api/posts/dislike/:postId**

Dislike (remove like) from a post  
Sample Response:

```json
{
  "message": "Like removed",
  "likes": 5
}
```

---

### **Bookmarks**

#### **POST /api/users/bookmark/:postId**

Bookmark a post  
Sample Response:

```json
{
  "message": "Post bookmarked"
}
```

---

#### **GET /api/users/bookmark**

List all bookmarked posts  
Sample Response:

```json
[
  {
    "_id": "70f1b2c3d4e5f6a7b8c9d0e2",
    "content": "My first post!",
    "mediaUrl": "https://cloudinary.com/newpost.jpg"
  }
]
```

---

#### **POST /api/users/add-bookmark/:postId**

Add a post to bookmarks  
Sample Response:

```json
{
  "message": "Bookmark added"
}
```

---

#### **POST /api/users/remove-bookmark/:postId**

Remove a post from bookmarks  
Sample Response:

```json
{
  "message": "Bookmark removed"
}
```

---

### **Following**

#### **POST /api/users/follow/:followUserId**

Follow a user  
Sample Response:

```json
{
  "message": "Now following user",
  "following": ["60f1b2c3d4e5f6a7b8c9d0e2"]
}
```

---

#### **POST /api/users/unfollow/:followUserId**

Unfollow a user  
Sample Response:

```json
{
  "message": "Unfollowed user",
  "following": []
}
```

---

## Contact

For bugs or feature requests, please reach out to [prathameshlakare001@gmail.com]
