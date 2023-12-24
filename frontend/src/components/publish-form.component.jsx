import React, { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";

const PublishForm = () => {
  const characterLimit = 200;
  const tagLimit = 2;
  let {
    blog: { title, banner, content, tags, desc },
    setEditorState,
    blog,
    setBlog,
  } = useContext(EditorContext);

  const handleCloseEvent = (e) => {
    setEditorState("editor");
  };
  const handleBlogTitleChange = (e) => {
    let input = e.target;
    setBlog({ ...blog, title: input.value });
  };
  const handleTitleKeyDown = (e) => {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  };

  const handleBlogDescChange = (e) => {
    let input = e.target;
    setBlog({ ...blog, desc: input.value });
  };

  const handleKeyDown = (e) => {
    if (e.keyCode == 13 || e.keyCode == 188) {
      e.preventDefault();
      let tag = e.target.value;
      if (tags.length < tagLimit) {
        if (!tags.includes(tag) && tag.length) {
          setBlog({ ...blog, tags: [...tags, tag] });
        } else {
        }
      } else {
        toast.error(`You can add max ${tagLimit} Tags`);
      }
      e.target.value = "";
    }
  };
  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
        <Toaster />
        <button
          className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={handleCloseEvent}
        >
          <i className="fi fi-br-cross"></i>
        </button>
        <div className="max-w-[550px] center">
          <p className="text-dark-grey mb-1">Preview</p>
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={banner} alt="" />
          </div>
          <h1 className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40">
            {title}
          </h1>
          <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">
            {desc}
          </p>
        </div>
        <div className="border-grey lg:border-1 lg:pl-8">
          <p className="text-dark-grey lg:border-1 mb-2">Blog Title</p>
          <input
            type="text"
            placeholder="Blog Title"
            defaultValue={title}
            className="input-box pl-4"
            onChange={handleBlogTitleChange}
          />
          <div className="border-grey lg:border-1 ">
            <p className="text-dark-grey lg:border-1 mt-4 mb-2 mt-9">
              Short description about your blog
            </p>
            <textarea
              maxLength={characterLimit}
              defaultValue={desc}
              placeholder="Blog Title"
              className="h-40 resize-none leading-7 input-box pl-4"
              onKeyDown={handleTitleKeyDown}
              onChange={handleBlogDescChange}
            ></textarea>

            <p className="mt-1 text-dark-grey text-sm text-right">
              {characterLimit - desc.length} character left
            </p>
            <p className="text-dark-grey mb-2 mt-9">
              Topics - (Helps is searching and renking your blog post)
            </p>
            <div className="relative input-box pl-2 py-2 pb-4">
              <input
                type="text"
                placeholder="Topic"
                className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
                onKeyDown={handleKeyDown}
              />
              {tags.map((tag, i) => {
                return <Tag tag={tag} key={i} tagIndex={i} />;
              })}
            </div>
            <p className="mt-1 mb-4 text-dark-grey text-sm text-right">
              {tagLimit - tags.length} Tags left
            </p>
            <button className="btn-dark px-8">Publish</button>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
