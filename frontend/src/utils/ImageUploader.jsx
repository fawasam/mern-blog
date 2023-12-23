import { Toaster, toast } from "react-hot-toast";

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
