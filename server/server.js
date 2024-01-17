import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";
import Notification from "./Schema/Notification.js";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import cors from "cors";
import path from "path";
import multer from "multer";
import { getAuth } from "firebase-admin/auth";
import serviceAccountKey from "./blog-app-2de5c-firebase-adminsdk-axh0x-4675b40ffe.json" assert { type: "json" };
import admin from "firebase-admin";
import userRoutes from "./routes/userRoutes.js";
import Comment from "./Schema/Comment.js";
import { populate } from "dotenv";
import { deleteComments } from "./utils/helpers.js";

const app = express();
const PORT = process.env.PORT || 3000;

const SERVER_URL = process.env.SERVER_URL_DEVELOPMENT;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

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
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

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
      const imageUrl = SERVER_URL + "/uploads/" + req.file.filename;
      res.status(200).json({ imageUrl: imageUrl });
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

app.use("/uploads", express.static("uploads"));
app.use("/", userRoutes);

//user routes
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
  let { title, desc, banner, tags, content, draft, id } = req.body;

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
    id ||
    title
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim() + nanoid();
  console.log(blog_id);

  if (id) {
    Blog.findOneAndUpdate(
      { blog_id },
      {
        title,
        desc,
        banner,
        content,
        tags,
        draft: draft ? draft : false,
      }
    )
      .then(() => {
        return res.status(200).json({
          success: "done",
          id: blog_id,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          error: err.message,
        });
      });
  } else {
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
              error: err.message,
            });
          });
      })
      .catch((err) => {
        return res.status(500).json({
          error: err.message,
        });
      });
  }
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
  let { tag, query, author, page, limit, eliminate_blog } = req.body;
  let maxLimit = limit ? limit : 2;
  let findQuery;
  if (tag) {
    findQuery = {
      tags: tag,
      draft: false,
      blog_id: { $ne: eliminate_blog },
    };
  } else if (query) {
    findQuery = {
      title: new RegExp(query, "i"),
      draft: false,
    };
  } else if (author) {
    findQuery = {
      author,
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

app.post("/get-profile", (req, res) => {
  let { username } = req.body;

  User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updatedAt -blogs")
    .then((user) => {
      return res.status(200).json(user);
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/get-posts", (req, res) => {
  let { blog_id, draft, mode } = req.body;
  let incrementVal = mode != "edit" ? 1 : 0;

  Blog.findOneAndUpdate(
    { blog_id },
    { $inc: { "activity.total_reads": incrementVal } }
  )
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname"
    )
    .select("blog_id title desc banner content activity tags publishedAt ")
    .then((blog) => {
      User.findOneAndUpdate(
        { "personal_info.username": blog.author.personal_info.username },
        { $inc: { "account_info.total_reads": incrementVal } }
      ).catch((err) => {
        console.log(err.message);
        return res.status(500).json({ error: err.message });
      });

      if (blog.draft && !draft) {
        return res
          .status(500)
          .json({ error: "you can not access draft blogs" });
      }
      return res.status(200).json({ blog });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/like-post", verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id, islikedByUser } = req.body;

  let incrementVal = !islikedByUser ? 1 : -1;

  Blog.findOneAndUpdate(
    { _id },
    { $inc: { "activity.total_likes": incrementVal } }
  )
    .then((blog) => {
      if (!islikedByUser) {
        let like = new Notification({
          type: "like",
          blog: blog._id,
          notification_for: blog.author,
          user: user_id,
        });
        like.save().then((notification) => {
          return res.status(200).json({ liked_By_User: true });
        });
      } else {
        Notification.findOneAndDelete({
          user: user_id,
          type: "like",
          blog: _id,
        })
          .then((data) => {
            return res.status(200).json({ liked_By_User: false });
          })
          .catch((err) => {
            console.log(err.message);
            return res.status(500).json({ error: err.message });
          });
      }
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/isliked-by-user", verifyJWT, (req, res) => {
  let user_id = req.user;
  let { _id } = req.body;

  Notification.exists({ user: user_id, type: "like", blog: _id })
    .then((result) => {
      return res.status(200).json({ result });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

//comment
app.post("/add-comment", verifyJWT, (req, res) => {
  let user_id = req.user;
  let { _id, comment, blog_author, replying_to } = req.body;
  console.log(replying_to);
  if (!comment.length) {
    return res
      .status(403)
      .json({ error: "Write something to leave a comment" });
  }

  //creating a comment DOC

  let commentObj = {
    blog_id: _id,
    blog_author,
    comment,
    commented_by: user_id,
  };

  if (replying_to) {
    commentObj.parent = replying_to;
    commentObj.isReply = true;
  }

  new Comment(commentObj)
    .save()
    .then(async (commentFile) => {
      let { comment, commentedAt, children } = commentFile;
      Blog.findOneAndUpdate(
        { _id },
        {
          $push: { comments: commentFile._id },
          $inc: {
            "activity.total_comments": 1,
            "activity.total_parent_comments": replying_to ? 0 : 1,
          },
        }
      ).then(() => {
        console.log("New comment created");
      });
      let notificationObj = {
        type: replying_to ? "reply" : "comment",
        blog: _id,
        notification_for: blog_author,
        user: user_id,
        comment: commentFile._id,
      };

      if (replying_to) {
        notificationObj.replied_on_comment = replying_to;

        await Comment.findOneAndUpdate(
          { _id: replying_to },
          { $push: { children: commentFile._id } }
        ).then((replyingToCommentDoc) => {
          notificationObj.notification_for = replyingToCommentDoc.commented_by;
        });
      }
      new Notification(notificationObj).save().then(() => {
        console.log("New notification created");
      });

      return res.status(200).json({
        comment,
        commentedAt,
        _id: commentFile._id,
        user_id,
        children,
      });
    })

    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/get-post-comments", (req, res) => {
  let { blog_id, skip } = req.body;

  let maxLimit = 5;
  Comment.find({ blog_id, isReply: false })
    .populate(
      "commented_by",
      "personal_info.username personal_info.fullname personal_info.profile_img"
    )
    .skip(skip)
    .limit(maxLimit)
    .sort({ commentedAt: -1 })
    .then((comment) => {
      return res.status(200).json(comment);
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/get-replies", (req, res) => {
  let { _id, skip } = req.body;

  let maxLimit = 5;
  Comment.findOne({ _id })
    .populate({
      path: "children",
      options: {
        limit: maxLimit,
        skip: skip,
        sort: { commentedAt: -1 },
      },
      populate: {
        path: "commented_by",
        select:
          "personal_info.profile_img personal_info.fullname personal_info.username",
      },
      select: "-blog_id -updatedAt",
    })
    .select("children")
    .then((doc) => {
      return res.status(200).json({ replies: doc.children });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

app.post("/delete-comment", verifyJWT, (req, res) => {
  let user_id = req.user;
  let { _id } = req.body;

  Comment.findOne({ _id }).then((comment) => {
    if (user_id == comment.commented_by || user_id == comment.blog_author) {
      deleteComments(_id);
      return res.status(200).json({ status: "done" });
    } else {
      return res.status(403).json({ error: "You can not delete this comment" });
    }
  });
});

//userRoute
app.post("/change-password", verifyJWT, (req, res) => {
  let { currentPassword, newPassword } = req.body;

  if (currentPassword == newPassword) {
    return res.status(403).json({
      error: "Please change your password to new password",
    });
  }
  if (
    !passwordRegex.test(currentPassword) ||
    !passwordRegex.test(newPassword)
  ) {
    return res.status(403).json({
      error:
        "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters ",
    });
  }

  User.findOne({ _id: req.user })
    .then((user) => {
      if (user.google_auth) {
        return res.status(403).json({
          error:
            "You can't change account's password because you logged in through Google",
        });
      }

      bcrypt.compare(
        currentPassword,
        user.personal_info.password,
        (err, result) => {
          if (err) {
            return res.status(500).json({
              error:
                "Some error occured while changing the password, please try again later",
            });
          }
          if (!result) {
            return res.status(403).json({
              error: "Incorrect password, please try again later",
            });
          }

          bcrypt.hash(newPassword, 10, (err, hashed_password) => {
            User.findOneAndUpdate(
              { _id: req.user },
              { "personal_info.password": hashed_password }
            )
              .then((u) => {
                return res.status(200).json({ status: "Password updated" });
              })
              .catch((err) => {
                return res.status(500).json({
                  error:
                    "Some error occurred while saving new password Please try again later",
                });
              });
          });
        }
      );
    })
    .catch((err) => {
      return res.status(500).json({
        error: "User not found",
      });
    });
});

app.post("/update-profile-img", verifyJWT, (req, res) => {
  let { url } = req.body;

  User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
    .then(() => {
      return res.status(200).json({ profile_img: url });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

app.post("/update-profile", verifyJWT, (req, res) => {
  let bioLimit = 150;
  let { username, bio, social_links } = req.body;

  if (username.length < 3) {
    return res
      .status(403)
      .json({ error: "Username must be at least 3 characters" });
  }
  if (bio.length > bioLimit) {
    return res
      .status(403)
      .json({ error: "Bio should not be more than " + bioLimit });
  }

  let socialLinksArr = Object.keys(social_links);

  try {
    for (let i = 0; i < socialLinksArr.length; i++) {
      if (social_links[socialLinksArr[i]].length) {
        let hostname = new URL(social_links[socialLinksArr[i]]).hostname;
        if (
          !hostname.includes(`${socialLinksArr[i]}.com`) &&
          socialLinksArr[i] != "website"
        ) {
          return res.status(403).json({
            error: `${socialLinksArr[i]} link is invalid. You must enter a full link`,
          });
        }
      }
    }
  } catch (error) {
    return res.status(500).json({
      error: "You must provide full social links with http(s) included",
    });
  }

  let UpdatedObj = {
    "personal_info.username": username,
    "personal_info.bio": bio,
    social_links,
  };

  User.findOneAndUpdate({ _id: req.user }, UpdatedObj, {
    runValidators: true,
  })
    .then(() => {
      return res.status(200).json({ username });
    })
    .catch((err) => {
      if (err.code == 11000) {
        return res.status(409).json({ error: "Username is already taken" });
      }
      return res.status(500).json({ error: err.message });
    });
});

//notification

app.get("/new-notification", verifyJWT, (req, res) => {
  let user_id = req.user;
  Notification.exists({
    notification_for: user_id,
    seen: false,
    // user: { $ne: user_id },
  })
    .then((result) => {
      if (result) {
        return res.status(200).json({ new_notification_available: true });
      } else {
        return res.status(200).json({ new_notification_available: false });
      }
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
