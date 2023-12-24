import React, { useContext, useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { useEffect } from "react";
import { tools } from "./tools.component";

export const handleBannerUpload = (e) => {
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
      const url = response.data.imageUrl;
      console.log("Image URL:", url);
      toast.dismiss(loadingToast);
      toast.success("Uploaded 👍");
      setBlog({ ...blog, banner: url });
    })
    .catch((error) => {
      toast.dismiss(loadingToast);
      toast.error(error);
      console.error("Error uploading image:", error);
    });
};
const BlogEditor = () => {
  let {
    blog: { title, banner, content, tags, desc },
    blog,
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  useEffect(() => {
    setTextEditor(
      new EditorJS({
        holderId: "textEditor",
        data: content,
        tools: tools,
        placeholder: "Let's write an awesome story",
      })
    );
  }, []);

  const handleError = (e) => {
    let img = e.target;
    img.src = defaultBanner;
  };
  const handleTitleKeyDown = (e) => {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  };
  const handleTitleChange = (e) => {
    let input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
    setBlog({ ...blog, title: input.value });
  };
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
        const url = response.data.imageUrl;
        console.log("Image URL:", url);
        toast.dismiss(loadingToast);
        toast.success("Uploaded 👍");
        setBlog({ ...blog, banner: url });
      })
      .catch((error) => {
        toast.dismiss(loadingToast);
        toast.error(error);
        console.error("Error uploading image:", error);
      });
  };
  const handlePublishEvent = (e) => {
    // if (!banner.length) {
    //   return toast.error("Upload a blog banner to publish it");
    // }
    // if (!title.length) {
    //   return toast.error("Write blog title to publish it");
    // }
    if (textEditor.isReady) {
      textEditor.save().then((data) => {
        console.log(data);
        if (data.blocks.length) {
          setBlog({ ...blog, content: data });
          setEditorState("publish");
        } else {
          return toast.error("Write something in your blog to publish it");
        }
      });
    }
  };
  return (
    <>
      <nav className="navbar">
        <Link to={"/"} className="flex-none w-10">
          <img src={logo} alt="image" />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title?.length ? title : "New Blog"}
        </p>
        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Publish
          </button>
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
                  src={banner}
                  alt="image"
                  className="z-20"
                  onError={handleError}
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
            <textarea
              defaultValue={title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 "
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>
            <hr className="w-full opacity-10 my-5" />
            <div id="textEditor" className="font-galasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
