import React, { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {
  let {
    blog: {
      _id,
      title,
      blog_id,
      activity,
      activity: { total_likes, total_comments },
      author: {
        personal_info: { username: author_username },
      },
    },
    blog,
    setBlog,
    islikedByUser,
    setIslikedByUser,
  } = useContext(BlogContext);

  let username = useContext(UserContext)?.userAuth?.username || null;
  let access_token = useContext(UserContext)?.userAuth?.access_token || null;

  const handleLike = () => {
    if (access_token) {
      setIslikedByUser((prev) => !prev);
      !islikedByUser ? total_likes++ : total_likes--;
      setBlog({ ...blog, activity: { ...activity, total_likes } });

      axios
        .post(
          import.meta.env.VITE_SERVER_DOMAIN + "/like-post",
          {
            _id,
            islikedByUser,
          },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(({ data }) => {
          console.log(data);
        })
        .catch((err) => {
          console.log(err);
          // setLoading(false);
        });
    } else {
      toast.error("Please login to like this blog");
    }
  };

  useEffect(() => {
    if (access_token) {
      //make request to server to get like inforamtion
      axios
        .post(
          import.meta.env.VITE_SERVER_DOMAIN + "/isliked-by-user",
          {
            _id,
          },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(({ data: { result } }) => {
          setIslikedByUser(Boolean(result));
        })
        .catch((err) => {
          console.log(err);
          // setLoading(false);
        });
    }
  }, []);
  return (
    <>
      <Toaster />
      <hr className="border-grey my-2" />
      <div className="flex gap-6 justify-between">
        <div className="flex gap-3 items-center">
          {/* total likes  */}

          <button
            className={
              "w-10 h-10 rounded-full flex items-center justify-center bg-grey/80 " +
              (islikedByUser ? "bg-red/20 text-red" : "bg-grey/80")
            }
            onClick={handleLike}
          >
            <i
              className={
                "fi " + (islikedByUser ? "fi-ss-heart" : "fi-rr-heart")
              }
            ></i>
          </button>
          <p className="text-xl text-dark-grey">{total_likes}</p>

          {/* comment  */}

          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
            <i className="fi fi-rr-comment-dots"></i>
          </button>
          <p className="text-xl text-dark-grey">{total_comments}</p>
        </div>

        {/* edit button  */}
        <div className="flex gap-6 items-center">
          {username == author_username && (
            <Link
              to={`/editor/${blog_id}`}
              className="underline hover:text-purple"
            >
              Edit
            </Link>
          )}
          <Link
            to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${location.href}`}
          >
            <i className="fi fi-brands-twitter text-xl hover:text-twitter"></i>
          </Link>
        </div>
      </div>
      <hr className="border-grey my-2" />
    </>
  );
};

export default BlogInteraction;
