import React, { useEffect, useState } from "react";
import { getDay } from "../common/date";
import Loader from "./loader.component";

const CommentCard = ({ index, commentData, leftVal }) => {
  const [loading, setLoading] = useState(false);
  let {
    commented_by: { personal_info },
    commentedAt,
    comment,
  } = commentData;
  let { profile_img, fullname, username } = personal_info;
  console.log(fullname + " " + username);

  return (
    <div className="w-full " style={{ paddingLeft: `${leftVal * 10}px` }}>
      {loading ? (
        <Loader />
      ) : (
        <div className="my-5 p-6 rouded-md border border-grey">
          <div className="flex gap-3 items-center mb-8">
            <img
              src={profile_img}
              alt={username}
              className="w-6 h-6 rounded-full "
            />
            <p className="line-clamp-1">
              {fullname} @{username}
            </p>
            <p className="min-w-fit ">{getDay(commentedAt)}</p>
          </div>
          <p className="font-gelasio text-xl ml-3">{comment}</p>
        </div>
      )}
    </div>
  );
};

export default CommentCard;
