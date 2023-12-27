import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { UserContext } from "../App";
import AboutUser from "../components/about.component";

export const profileDataStructure = {
  personal_info: {
    fullname: "",
    email: "",
    username: "",
    bio: "",
    profile_img: "",
  },
  social_links: {
    youtube: "",
    instagram: "",
    facebook: "",
    twitter: "",
    github: "",
    website: "",
  },
  account_info: {
    total_posts: 0,
    total_reads: 0,
  },
  _id: "",
  joinedAt: "",
};

const ProfilePage = () => {
  let { id: profileId } = useParams();

  const [profile, setProfile] = useState(profileDataStructure);
  const [loading, setLoading] = useState(true);
  let username = useContext(UserContext)?.userAuth?.username || null;

  let {
    personal_info: {
      fullname,
      email,
      username: profile_username,
      bio,
      profile_img,
    },
    account_info: { total_posts, total_reads },
    joinedAt,
    social_links,
  } = profile;

  const fetchUserProfile = () => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
        username: profileId,
      })
      .then(({ data: user }) => {
        setProfile(user);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };
  const resetState = () => {
    setProfile(profileDataStructure);
    setLoading(true);
  };
  useEffect(() => {
    resetState();
    fetchUserProfile();
  }, [profileId]);

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12 ">
          <div className="flex flex-col max-md:items-center gap-5 min-w-[250px]">
            <img
              src={profile_img}
              alt={profile_username}
              className="w-48 h-48 bg-grey rounded-full md:w-32 md:h-32"
            />
            <h1 className="text-2xl font-medium">@{profile_username}</h1>
            <p className="text-xl capitalize h-6">{fullname}</p>
            <p>
              {total_posts.toLocaleString()} Blogs -{" "}
              {total_reads.toLocaleString()} Reads
            </p>

            <div className="flex gap-4 mt-2">
              {profileId == username && (
                <Link
                  to={"/settings/edit-profile"}
                  className="btn-light rounded-sm"
                >
                  Edit Profile
                </Link>
              )}
            </div>
            <AboutUser />
          </div>
        </section>
      )}
    </AnimationWrapper>
  );
};

export default ProfilePage;
