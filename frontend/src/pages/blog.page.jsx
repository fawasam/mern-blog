import React, { useEffect, useState } from "react";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

export const blogDataStructure = {
  title: "",
  desc: "",
  content: [],
  tags: [],
  author: { personal_info: {} },
  banner: "",
  publishedAt: "",
};

import { useParams } from "react-router-dom";

const BlogPage = () => {
  let { blog_id } = useParams();
  const [blog, setBlog] = useState(blogDataStructure);
  const [loading, setLoading] = useState(true);

  let {
    title,
    desc,
    content,
    banner,
    publishedAt,
    author: {
      personal_info: { username, fullname, profile_img },
    },
  } = blog;

  const fetchBlog = () => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-posts", { blog_id })
      .then(async ({ data: { blog } }) => {
        setBlog(blog);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };
  useEffect(() => {
    fetchBlog();
  }, []);
  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <div className=" max-w-[900px]center py-10 max-lg:px-[5vw]">
          <img src={banner} alt="banner" className="aspect-video" />

          <div className="mt-12">
            <h2>{title}</h2>
            <div className="flex max-sm:flex-col justify-between my-8 ">
              <div>
                <img src={profile_img} alt="profile image" />
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimationWrapper>
  );
};

export default BlogPage;
