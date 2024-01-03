import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../Schema/User.js";
import { nanoid } from "nanoid";
import Comment from "../Schema/Comment.js";
import Notification from "../Schema/Notification.js";
import Blog from "../Schema/Blog.js";

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

const deleteComments = (_id) => {
  Comment.findOneAndDelete({ _id })
    .then((comment) => {
      if (comment?.parent) {
        Comment.findOneAndUpdate(
          { _id: comment.parent },
          { $pull: { children: _id } }
        )
          .then((data) => console.log("Comment delete from parent"))
          .catch((err) => console.log(err));
      }

      Notification.findOneAndDelete({ comment: _id }).then((notification) =>
        console.log("Comment notification deleted")
      );
      Notification.findOneAndDelete({ reply: _id }).then((notification) =>
        console.log("Reply notification deleted")
      );

      Blog.findOneAndUpdate(
        { _id: comment.blog_id },
        {
          $pull: { comments: _id },
          $inc: {
            "activity.total_comments": -1,
            "activity.total_parent_comments": comment.parent ? 0 : -1,
          },
        }
      ).then((blog) => {
        console.log("blog updated");
        if (comment?.children?.length) {
          comment?.children?.map((replies) => {
            deleteComments(replies);
          });
        }
      });
    })
    .catch((err) => {
      console.log(err.message);
    });
};

export { formatDatatoSend, generateUsername, verifyJWT, deleteComments };
