import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import cors from "cors";
import path from "path";

import multer from "multer";
//google
import { getAuth } from "firebase-admin/auth";
import serviceAccountKey from "./blog-app-2de5c-firebase-adminsdk-axh0x-4675b40ffe.json" assert { type: "json" };
import admin from "firebase-admin";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

const formatDatatoSend = (user) => {
  const access_token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);
  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};

const generateUsername = async (email) => {
  let username = email.split("@")[0];
  let usernameExists = await User.exists({
    "personal_info.username": username,
  }).then((result) => result);

  usernameExists ? (username += nanoid().substring(0, 5)) : "";
  return username;
};

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ error: "No access token" });
  }
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access token is invalid" });
    }
    req.user = user.id;
    next();
  });
};

mongoose
  .connect(process.env.MONGO_URI, {
    autoIndex: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
}).single("image");

app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send("Error uploading file.");
    } else {
      const imageUrl = "http://localhost:3000/uploads/" + req.file.filename;
      res.status(200).json({ imageUrl: imageUrl });
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

app.use("/uploads", express.static("uploads"));
app.use("/", userRoutes);

app.post("/signin", async (req, res) => {
  let { email, password } = req.body;
  User.findOne({ "personal_info.email": email })
    .then((user) => {
      if (!user) {
        return res.status(403).json({ error: "Email not found" });
      }
      if (!user.google_auth) {
        bcrypt.compare(password, user.personal_info.password, (err, result) => {
          if (err) {
            return res
              .status(403)
              .json({ error: "Error occured while login please try again" });
          }
          if (!result) {
            return res.status(403).json({ error: "Incorrect password" });
          } else {
            return res.status(200).json(formatDatatoSend(user));
          }
        });
      } else {
        return res.status(403).json({
          error: "Account was created using google, Try logging in with google",
        });
      }
    })
    .catch((error) => {
      console.log(error.message);
      return res.status(500).json({ error: error.message });
    });
});
app.post("/google-auth", async (req, res) => {
  let { access_token } = req.body;
  getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
      let { email, name, picture } = decodedUser;
      picture = picture.replace("s96-c", "s384-c");
      let user = await User.findOne({ "personal_info.email": email })
        .select(
          "personal_info.fullname personal_info.username personal_info.profile_img google_auth"
        )
        .then((u) => {
          console.log(u);
          return u || null;
        })
        .catch((err) => {
          return res.status(500).json({ error: err.message });
        });

      if (user) {
        //login
        if (!user.google_auth) {
          return res.status(403).json({
            error:
              "This email was signed up without google. Please log in with password to access the account",
          });
        }
      } else {
        //sign up
        let username = await generateUsername(email);
        user = new User({
          personal_info: {
            fullname: name,
            email,
            profile_ing: picture,
            username,
          },
          google_auth: true,
        });
        await user
          .save()
          .then((u) => {
            user = u;
          })
          .catch((err) => {
            return res.status(500).json({ error: err.message });
          });
      }
      return res.status(200).json(formatDatatoSend(user));
    })
    .catch((err) => {
      return res.status(500).json({
        error:
          err +
          "Failed to authenticate you with google. Try with some othe google account",
      });
    });
});

//blog routes
app.post("/create-blog", verifyJWT, async (req, res) => {
  let authorId = req.user;
  let { title, desc, banner, tags, content, draft } = req.body;

  if (!title.length) {
    return res.status(403).json({ error: "You must provide a title" });
  }
  if (!draft) {
    if (!desc.length || desc.length > 200) {
      return res.status(403).json({
        error: "You must provide blog description under 200 characters",
      });
    }
    if (!banner.length) {
      return res.status(403).json({ error: "You must provide blog banner " });
    }
    if (!content.blocks.length) {
      return res
        .status(403)
        .json({ error: "There must be some blog content to publish it" });
    }
    if (!tags.length || tags.length > 10) {
      return res.status(403).json({
        error: "You must specify at least one tag to publish",
      });
    }
  }

  tags = tags.map((tag) => tag.toLowerCase());
  let blog_id =
    title
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim() + nanoid();
  console.log(blog_id);

  let blog = new Blog({
    title,
    desc,
    banner,
    content,
    tags,
    author: authorId,
    blog_id,
    draft: Boolean(draft),
  });
  blog
    .save()
    .then((blog) => {
      let incrementVal = draft ? 0 : 1;
      User.findOneAndUpdate(
        { _id: authorId },
        {
          $inc: { "account_info.total_posts": incrementVal },
          $push: { blogs: blog._id },
        }
      )
        .then((user) => {
          return res.status(200).json({
            success: "done",
            id: blog.blog_id,
          });
        })
        .catch((err) => {
          return res.status(500).json({
            error: "Failed to update total posts number",
          });
        });
    })
    .catch((err) => {
      return res.status(500).json({
        error: err.message,
      });
    });
});

app.post("/latest-posts", (req, res) => {
  let { page } = req.body;
  let maxLimit = 5;
  Blog.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title desc banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.get("/trending-posts", (req, res) => {
  let maxLimit = 5;
  Blog.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({
      "activity.total_read": -1,
      "activity.total_likes": -1,
      publisheAt: -1,
    })
    .select("blog_id title publishedAt -_id")
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/all-latest-blogs-posts", (req, res) => {
  Blog.countDocuments({ draft: false })
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/search-posts", (req, res) => {
  let { tag, query, page } = req.body;
  let maxLimit = 2;
  let findQuery;
  if (tag) {
    findQuery = {
      tags: tag,
      draft: false,
    };
  } else if (query) {
    findQuery = {
      title: new RegExp(query, "i"),
      draft: false,
    };
  }

  Blog.find(findQuery)
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title desc banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/search-posts-count", (req, res) => {
  let { tag, query } = req.body;
  let findQuery;
  if (tag) {
    findQuery = {
      tags: tag,
      draft: false,
    };
  } else if (query) {
    findQuery = {
      title: new RegExp(query, "i"),
      draft: false,
    };
  }
  Blog.countDocuments(findQuery)
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/search-users", (req, res) => {
  let { query } = req.body;
  User.find({ "personal_info.username": new RegExp(query, "i") })
    .limit(50)
    .select(
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .then((users) => {
      return res.status(200).json({ users });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
