import React, { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { profileDataStructure } from "./profile.page";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { Toaster, toast } from "react-hot-toast";
import InputBox from "../components/input.component";
import { storeInSession } from "../common/session";

const EditProfile = () => {
  let access_token = useContext(UserContext)?.userAuth?.access_token || null;
  let { userAuth, setUserAuth } = useContext(UserContext);

  let bioLimit = 150;

  const [profile, setProfile] = useState(profileDataStructure);
  const [loading, setLoading] = useState(true);
  const [characterLeft, setCharacterLeft] = useState(bioLimit);
  const [updatedProfileImg, setupdatedProfileImg] = useState(null);
  let profileImageEle = useRef();
  let editProfileForm = useRef();

  let {
    personal_info: {
      fullname,
      username: profile_username,
      profile_img,
      email,
      bio,
    },
    social_links,
  } = profile;

  const handleCharacterChange = (e) => {
    setCharacterLeft(bioLimit - e.target.value.length);
  };

  const handleImagePreview = (e) => {
    let img = e.target.files[0];
    profileImageEle.current.src = URL.createObjectURL(img);
    setupdatedProfileImg(img);
  };

  const handleImageUpload = (e) => {
    e.preventDefault();

    if (updatedProfileImg) {
      let loadingToast = toast.loading("Uploading...");
      e.target.setAttribute("disabled", true);
      const formData = new FormData();
      formData.append("image", updatedProfileImg);
      axios
        .post(import.meta.env.VITE_SERVER_DOMAIN + "/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then((response) => {
          const url = response.data.imageUrl;
          console.log("Image URL:", url);
          if (url) {
            axios
              .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/update-profile-img",
                { url },
                {
                  headers: {
                    Authorization: `Bearer ${access_token}`,
                  },
                }
              )
              .then(({ data }) => {
                let newUserAuth = {
                  ...userAuth,
                  profile_img: data.profile_img,
                };
                storeInSession("user", JSON.stringify(newUserAuth));
                setUserAuth(newUserAuth);
                setupdatedProfileImg(null);
                toast.dismiss(loadingToast);
                e.target.removeAttribute("disabled");
                toast.success("Uploaded 👍");
              })
              .catch(({ response }) => {
                e.target.removeAttribute("disabled");
                toast.error(response.data.error);
                toast.dismiss(loadingToast);
                console.error("Error uploading image:", response.data.error);
              });
          }
        })
        .catch((error) => {
          e.target.removeAttribute("disabled");
          toast.error(error);
          console.error("Error uploading image:", error);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let form = new FormData(editProfileForm.current);

    let formData = {};
    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    let {
      username,
      bio,
      facebook,
      github,
      instagram,
      twitter,
      website,
      youtube,
    } = formData;

    if (username.length < 3) {
      return toast.error("Username must be at least 3 characters");
    }
    if (bio.length > bioLimit) {
      return toast.error("Bio should not be more than " + bioLimit);
    }
    let loadingToast = toast.loading("Uploading...");
    e.target.setAttribute("disabled", true);

    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + "/update-profile",
        {
          username,
          bio,
          social_links: {
            facebook,
            github,
            instagram,
            twitter,
            website,
            youtube,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(({ data }) => {
        if (userAuth.username != data.username) {
          let newUserAuth = { ...userAuth, username: data.username };
          storeInSession("user", JSON.stringify(newUserAuth));
          setUserAuth(newUserAuth);
        }
        toast.dismiss(loadingToast);
        e.target.removeAttribute("disabled");
        toast.success("Profile updated successfully");
      })
      .catch(({ response }) => {
        toast.dismiss(loadingToast);
        e.target.removeAttribute("disabled");
        toast.error(response.data.error);
      });
  };

  useEffect(() => {
    if (access_token) {
      axios
        .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
          username: userAuth.username,
        })
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [access_token]);
  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <form action="" ref={editProfileForm}>
          <Toaster />
          <h1 className="max-md:hidden">Edit Profile</h1>
          <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
            <div className="max-lg:center mb-5">
              <label
                htmlFor="uploadImg"
                id="profileImgLable"
                className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden"
              >
                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/30 opacity-0 hover:opacity-100 cursor-pointer">
                  Upload Image
                </div>
                <img src={profile_img} alt="" ref={profileImageEle} />
              </label>
              <input
                type="file"
                id="uploadImg"
                accept=".jpg, .png, .jpeg"
                hidden
                onChange={handleImagePreview}
              />
              <button
                className="btn-light mt-5 max-lg:center lg:w-full px-10"
                onClick={handleImageUpload}
              >
                Upload
              </button>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                <div>
                  <InputBox
                    name={"fullname"}
                    type={"text"}
                    value={fullname}
                    placeholder={"Full Name"}
                    disable={true}
                    icon={"fi fi-rr-user"}
                  />
                </div>
                <div>
                  <InputBox
                    name={"email"}
                    type={"email"}
                    value={email}
                    placeholder={"Email"}
                    disable={true}
                    icon={"fi fi-rr-envelope"}
                  />
                </div>
              </div>
              <InputBox
                type={"text"}
                name={"username"}
                value={profile_username}
                placeholder={"Username"}
                icon={"fi fi-rr-at"}
              />
              <p className="text-dark-grey -mt-3">
                Username will use to search user and will be visible to all
                users{" "}
              </p>
              <textarea
                name="bio"
                maxLength={bioLimit}
                defaultValue={bio}
                className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5"
                placeholder="Bio"
                onChange={handleCharacterChange}
              ></textarea>
              <p className="mt-1 text-dark-grey">
                {characterLeft} characters left
              </p>
              <p className="my-6 text-dark-grey">
                Add your social handles below{" "}
              </p>

              {/* social link  */}
              <div className="md:grid md:grid-cols-2 gap-x-6">
                {Object.keys(social_links).map((key, i) => {
                  let link = social_links[key];
                  <i
                    className={`fi ${
                      key != "website" ? "fi-brands-" + key : "fi-rr-globe"
                    } text-xl hover:text-black`}
                  ></i>;
                  return (
                    <InputBox
                      key={i}
                      name={key}
                      type={"text"}
                      value={link}
                      placeholder={"https://"}
                      icon={
                        "fi " +
                        (key != "website" ? "fi-brands-" + key : " fi-rr-globe")
                      }
                    />
                  );
                })}
              </div>

              <button
                className="btn-dark w-auto px-10 "
                type="submit"
                onClick={handleSubmit}
              >
                Update
              </button>
            </div>
          </div>
        </form>
      )}
    </AnimationWrapper>
  );
};

export default EditProfile;
