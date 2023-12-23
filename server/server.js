import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import User from "./Schema/User.js";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import cors from "cors";
import path from "path";
// import aws from "aws";
import multer from "multer";
//google
import { getAuth } from "firebase-admin/auth";
import serviceAccountKey from "./blog-app-2de5c-firebase-adminsdk-axh0x-4675b40ffe.json" assert { type: "json" };
import admin from "firebase-admin";

const app = express();
const PORT = process.env.PORT || 3000;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

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
// const s3 = new aws.s3({
//   region: "ap-south-1",
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_,
// });
// Set up Multer storage
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize Multer upload
const upload = multer({
  storage: storage,
}).single("image");

// Handle POST request for image upload
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

app.post("/signup", async (req, res) => {
  const { fullname, email, password } = req.body;

  if (fullname.length < 3) {
    return res
      .status(403)
      .json({ error: "Fullname must be at least 3 characters" });
  }
  if (!email.length) {
    return res.status(403).json({ error: "Enter Email" });
  }
  if (!emailRegex.test(email)) {
    return res.status(403).json({ error: "Email is invalid" });
  }
  if (!passwordRegex.test(password)) {
    return res.status(403).json({
      error:
        "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters ",
    });
  }

  bcrypt.hash(password, 10, async (err, hashed_password) => {
    let username = await generateUsername(email);
    let user = new User({
      personal_info: {
        fullname,
        email,
        password: hashed_password,
        username,
      },
    });

    user
      .save()
      .then((newUser) => {
        return res.status(200).json(formatDatatoSend(newUser));
      })
      .catch((err) => {
        if (err.code == "11000") {
          return res.status(500).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: err.message });
      });
  });
});

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
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
