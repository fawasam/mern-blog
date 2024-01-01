import React, { useContext, useState } from "react";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { BlogContext } from "../pages/blog.page";

const CommentField = ({ action }) => {
  const [comment, setComment] = useState("");
  let access_token = useContext(UserContext)?.userAuth?.access_token || null;

  let {
    userAuth: { username, fullname, profile_img },
  } = useContext(UserContext);
  let {
    blog: {
      _id,
      author: { _id: blog_author },
      comments: { results: commentArr },
      comments,
      activity,
      activity: { total_comments, total_parent_comments },
    },
    blog,
    setBlog,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  const handleComment = (e) => {
    if (!access_token) {
      return toast.error("Please login first to leave a comment");
    }
    if (!comment.length) {
      return toast.error("Write something to leave a comment");
    }
    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + "/add-comment",
        { _id, blog_author, comment },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(({ data }) => {
        data.commented_By = {
          personal_info: { username, profile_img, fullname },
        };
        let newCommentArr;
        data.childrenLevel = 0;
        newCommentArr = [data, ...commentArr];

        let parentCommentIncrementVal = 1;
        setBlog({
          ...blog,
          comments: { ...comments, results: newCommentArr },
          activity: {
            ...activity,
            total_comments: total_comments + 1,
            total_parent_comments:
              total_parent_comments + parentCommentIncrementVal,
          },
        });
        setTotalParentCommentsLoaded(
          (prev) => prev + parentCommentIncrementVal
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      <Toaster />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Leave a comment..."
        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
      ></textarea>
      <button className="btn-dark mt-5 px-10" onClick={handleComment}>
        {action}
      </button>
    </>
  );
};

export default CommentField;
