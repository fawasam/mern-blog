import React, { createContext, useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import { Link, useParams, Navigate } from "react-router-dom";
import Loader from "../components/loader.component";
import axios from "axios";
const blogStructure = {
  title: null,
  banner: "",
  content: [],
  tags: [],
  desc: "",
  author: { personal_info: {} },
};
export const EditorContext = createContext({});

const Editor = () => {
  const [blog, setBlog] = useState(blogStructure);
  const [editorState, setEditorState] = useState("editor");
  const [textEditor, setTextEditor] = useState({ isReady: false });
  const [loading, setLoading] = useState(true);

  let { blog_id } = useParams();

  let access_token = useContext(UserContext)?.userAuth?.access_token || null;

  useEffect(() => {
    if (!blog_id) {
      return setLoading(false);
    }
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-posts", {
        blog_id,
        draft: true,
        mode: "edit",
      })
      .then(async ({ data: { blog } }) => {
        setBlog(blog);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);
  return (
    <EditorContext.Provider
      value={{
        blog,
        setBlog,
        editorState,
        setEditorState,
        textEditor,
        setTextEditor,
      }}
    >
      {!access_token === null ? (
        <Navigate to="/signin" />
      ) : loading ? (
        <Loader />
      ) : editorState == "editor" ? (
        <BlogEditor />
      ) : (
        <PublishForm />
      )}
    </EditorContext.Provider>
  );
};

export default Editor;
