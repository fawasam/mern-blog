import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import { Link, useParams } from "react-router-dom";
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import BlogContent from "../components/blog-content.component";
import CommentsContainer, {
  fetchComments,
} from "../components/comments.component";

export const blogStructure = {
  title: "",
  _id: "",
  desc: "",
  content: [],
  author: { personal_info: {} },
  banner: "",
  publishedAt: "",
};

export const BlogContext = createContext({});
const BlogPage = () => {
  let { blog_id } = useParams();

  const [blog, setBlog] = useState(blogStructure);
  const [similarBlogs, setSimilarBlogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [islikedByUser, setIslikedByUser] = useState(false);
  const [commentsWrapper, setCommentsWrapper] = useState(true);
  const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);

  let {
    title,
    desc,
    content,
    banner,
    publishedAt,
    author: {
      personal_info: { username: author_username, fullname, profile_img },
    },
  } = blog;

  const fetchBlog = () => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-posts", { blog_id })
      .then(async ({ data: { blog } }) => {
        blog.comments = await fetchComments({
          blog_id: blog._id,
          setParentCommentCountFun: setTotalParentCommentsLoaded,
        });
        setBlog(blog);
        axios
          .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-posts", {
            tag: blog.tags[0],
            limit: 6,
            eliminate_blog: blog_id,
          })
          .then(async ({ data }) => {
            setSimilarBlogs(data.blogs);
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
          });

        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  const resetState = () => {
    setBlog(blogStructure);
    setSimilarBlogs(null);
    setLoading(true);
    setCommentsWrapper(false);
    setTotalParentCommentsLoaded(0);
  };

  useEffect(() => {
    resetState();
    fetchBlog();
  }, [blog_id]);

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <BlogContext.Provider
          value={{
            blog,
            setBlog,
            islikedByUser,
            setIslikedByUser,
            commentsWrapper,
            setCommentsWrapper,
            totalParentCommentsLoaded,
            setTotalParentCommentsLoaded,
          }}
        >
          <CommentsContainer />
          <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <img src={banner} alt="banner" className="aspect-video" />
            {/* title ande author details  */}
            <div className="mt-12">
              <h2>{title}</h2>

              {/* user details  */}

              <div className="flex max-sm:flex-col justify-between my-8 ">
                <div className="flex gap-5 items-start">
                  <img
                    src={profile_img}
                    alt="profile image"
                    className="w-12 h-12 rounded-full"
                  />
                  <p className="capitalize">
                    {fullname}
                    <br />@
                    <Link className="underline" to={`/user/${author_username}`}>
                      {author_username}
                    </Link>
                  </p>
                </div>
                <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
                  Published on {getDay(publishedAt)}
                </p>
              </div>
            </div>
            <BlogInteraction />
            {/* Blog content will go over here */}

            <div className="my-12 font-gelasio blog-page-content">
              {content[0]?.blocks?.map((block, i) => {
                return (
                  <div key={i} className="my-4 md:my-8">
                    <BlogContent block={block} />
                  </div>
                );
              })}
            </div>
            <BlogInteraction />
            {/* similar blogs will go over here  */}
            {similarBlogs != null && similarBlogs.length ? (
              <>
                <h1 className="text-2xl mt-14 mb-10 font-medium ">
                  Similar Blogs
                </h1>

                {similarBlogs.map((blog, i) => {
                  let {
                    author: { personal_info },
                  } = blog;
                  return (
                    <AnimationWrapper
                      key={i}
                      transition={{ duration: 1, delay: i * 0.08 }}
                    >
                      <BlogPostCard content={blog} author={personal_info} />
                    </AnimationWrapper>
                  );
                })}
              </>
            ) : (
              ""
            )}
          </div>
        </BlogContext.Provider>
      )}
    </AnimationWrapper>
  );
};

export default BlogPage;
