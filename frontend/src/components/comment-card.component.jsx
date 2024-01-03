import React, { useContext, useEffect, useState } from "react";
import { getDay } from "../common/date";
import Loader from "./loader.component";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import CommentField from "./comment-field.component";
import { BlogContext } from "../pages/blog.page";
import axios from "axios";
const CommentCard = ({ index, commentData, leftVal }) => {
  let {
    commented_by: {
      personal_info: { profile_img, fullname, username },
    },
    commentedAt,
    comment,
    _id,
    children,
  } = commentData;

  let {
    blog: {
      comments: { results: commentsArr },
      comments,
    },
    blog,
    setBlog,
  } = useContext(BlogContext);

  let access_token = useContext(UserContext)?.userAuth?.access_token || null;
  const [isReplying, setIsReplying] = useState(false);

  const handleReplyClick = () => {
    if (!access_token) {
      return toast.error("Login first to leave reply");
    }
    setIsReplying((prev) => !prev);
  };

  const removeCommentsCards = (startingPoint) => {
    if (commentsArr[startingPoint]) {
      while (
        commentsArr[startingPoint].childrenLevel > commentData.childrenLevel
      ) {
        commentsArr.splice(startingPoint, 1);
        if (!commentsArr[startingPoint]) {
          break;
        }
      }
    }
    setBlog({ ...blog, comments: { results: commentsArr } });
  };

  const hideReplies = () => {
    commentData.isReplyLoaded = false;
    removeCommentsCards(index + 1);
  };

  const loadReplies = ({ skip = 0 }) => {
    if (children.length) {
      hideReplies();

      axios
        .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-replies", {
          _id,
          skip,
        })
        .then(({ data: { replies } }) => {
          commentData.isReplyLoaded = true;
          for (let i = 0; i < replies.length; i++) {
            replies[i].childrenLevel = commentData.childrenLevel + 1;

            commentsArr.splice(index + i + 1 + skip, 0, replies[i]);
          }
          setBlog({ ...blog, comments: { ...comments, results: commentsArr } });
        })
        .catch((err) => console.log(err));
    }
  };

  return (
    <div className="w-full " style={{ paddingLeft: `${leftVal * 10}px` }}>
      <div className="my-5 p-6 rouded-md border border-grey">
        <div className="flex gap-3 items-center mb-8">
          <img
            src={profile_img}
            alt={username}
            className="w-6 h-6 rounded-full "
          />
          <p className="line-clamp-1">
            {fullname} @{username}
          </p>
          <p className="min-w-fit ">{getDay(commentedAt)}</p>
        </div>
        <p className="font-gelasio text-xl ml-3">{comment}</p>
        <div className="flex gap-5 items-center mt-5">
          {commentData.isReplyLoaded ? (
            <button
              className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
              onClick={hideReplies}
            >
              <i className="fi fi-rs-comment-dots"></i>
              Hide Reply
            </button>
          ) : (
            <button
              className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
              onClick={loadReplies}
            >
              {" "}
              <i className="fi fi-rs-comment-dots"></i>
              {children.length} Reply
            </button>
          )}
          <button className="underline" onClick={handleReplyClick}>
            Reply
          </button>
        </div>
        {isReplying ? (
          <div className="mt-8">
            <CommentField
              action={"reply"}
              index={index}
              replyingTo={_id}
              setReplying={setIsReplying}
            />
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default CommentCard;
