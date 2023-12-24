import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const uploadImageByURL = (e) => {
  let link = new Promise((resolve, reject) => {
    try {
      resolve(e);
    } catch (error) {
      reject(error);
    }
  });
  return link.then((url) => {
    return {
      success: 1,
      file: { url },
    };
  });
};

const uploadImageByFile = (e) => {
  let img = e;
  if (img) {
    var loadingToast = toast.loading("Uploading....");
  }
  const formData = new FormData();
  formData.append("image", img);
  return axios
    .post(import.meta.env.VITE_SERVER_DOMAIN + "/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => {
      const url = response.data.imageUrl;
      if (url) {
        return {
          success: 1,
          file: { url },
        };
      }
    })
    .catch((error) => {
      // toast.dismiss(loadingToast);
      toast.error(error);
      console.error("Error uploading image:", error);
    });
};

export const tools = {
  embed: Embed,
  list: { class: List, inlineToolbar: true },
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByUrl: uploadImageByURL,
        uploadByFile: uploadImageByFile,
      },
    },
  },
  header: {
    class: Header,
    config: {
      placeholder: "Type Heading....",
      levels: [2, 3],
      defaultLevel: 2,
    },
  },
  quote: { class: Quote, inlineToolbar: true },
  marker: Marker,
  inlineCode: InlineCode,
};
