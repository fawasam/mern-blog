import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InpageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import axios from "axios";
import { filterPaginationData } from "../common/filter-pagination-data";

const SearchPage = () => {
  let { query } = useParams();
  const [blogs, setBlogs] = useState(null);
  const [pageState, setPageState] = useState("home");

  const searchBlogs = ({ page = 1, create_new_arr = false }) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-posts", {
        query,
        page,
      })
      .then(async ({ data }) => {
        let formatedData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute: "/search-posts-count",
          data_to_send: { query },
          create_new_arr,
        });
        setBlogs(formatedData);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const resetState = () => {
    setBlogs(null);
  };

  useEffect(() => {
    resetState();
    searchBlogs({ page: 1, create_new_arr: true });
  }, [query]);

  return (
    <section className="h-cover flex justify-center gap-10">
      <div className="w-full">
        <InpageNavigation
          routes={[`Search Results for ${query}`, "Accounts Matched"]}
          defaultHidden={["Accounts Matched"]}
        >
          <>
            {blogs == null ? (
              <Loader />
            ) : blogs.results.length ? (
              blogs.results.map((blog, i) => {
                return (
                  <AnimationWrapper
                    transition={{ duration: 1, delay: i * 0.1 }}
                    key={i}
                  >
                    <BlogPostCard
                      content={blog}
                      author={blog.author.personal_info}
                    />
                  </AnimationWrapper>
                );
              })
            ) : (
              <NoDataMessage message={"No blogs published"} />
            )}
            <LoadMoreDataBtn state={blogs} fetchDataFun={searchBlogs} />
          </>
        </InpageNavigation>
      </div>
    </section>
  );
};

export default SearchPage;
