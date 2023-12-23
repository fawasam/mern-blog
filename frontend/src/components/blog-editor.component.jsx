import React, { useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

const BlogEditor = () => {
  let blogBannerRef = useRef();
  const handleBannerUpload = (e) => {
    let img = e.target.files[0];
    if (img) {
      var loadingToast = toast.loading("Uploading....");
    }
    const formData = new FormData();
    formData.append("image", img);
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log("Image URL:", response.data.imageUrl);
        blogBannerRef.current.src = response.data.imageUrl;
        toast.dismiss(loadingToast);
        toast.success("Uploaded 👍");
      })
      .catch((error) => {
        toast.dismiss(loadingToast);
        toast.error(error);
        console.error("Error uploading image:", error);
      });
  };
  return (
    <>
      <nav className="navbar">
        <Link to={"/"} className="flex-none w-10">
          <img src={logo} alt="image" />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">New Blog</p>
        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2">Publish</button>
          <button className="btn-light py-2">Save Draft</button>
        </div>
      </nav>
      <Toaster />
      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video bg-white border-4 border-grey hove:opacity-80">
              <label htmlFor="uploadBanner">
                <img
                  src={defaultBanner}
                  ref={blogBannerRef}
                  alt="image"
                  className="z-20"
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
