import { useUserContext } from "@/context/AuthContext";
import { timeAgo } from "@/lib/utils";
import { Models} from "appwrite";
import { Link } from "react-router-dom";
import PostStats from "./PostStats";
import { useEffect, useState } from "react";
import { appwriteConfig, storage } from "@/lib/appwrite/config";

// Helper function to check the content-type from metadata (image or video)
const getMediaType = (mimeType: string): string => {
  if (mimeType.startsWith("video")) {
    return "video";
  }
  return "image"; // Default to image if it's not a video
};

type PostCardProps = {
  post: Models.Document;
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();
  const [mediaType, setMediaType] = useState<string>("");

  useEffect(() => {
    // Fetch file metadata from Appwrite
    const fetchFileMetadata = async () => {
      try {
        
        const file = await storage.getFile(appwriteConfig.storageId, post.imageId);
        const mimeType = file.mimeType || ""; // Get the MIME type from metadata
        const type = getMediaType(mimeType);
        setMediaType(type);
      } catch (error) {
        console.error("Error fetching file metadata:", error);
      }
    };

    fetchFileMetadata();
  }, [post.imageId]);

  if (!post.creator) return null;

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creator.$id}`}>
            <img
              src={post?.creator?.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="Creator"
              className="rounded-full w-12 lg:h-12"
            />
          </Link>

          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">{post.creator.name}</p>
            <div className="flex gap-2 text-light-3 items-center">
              <p className="subtle-semibold lg:small-regular">{timeAgo(post.$createdAt)}</p>
              - <p className="subtle-semibold lg:small-regular">{post.location}</p>
            </div>
          </div>
        </div>

        <Link to={`/update-post/${post.$id}`} className={`${user.id !== post.creator.$id && "hidden"}`}>
          <img src="/assets/icons/edit.svg" alt="edit" width={20} height={20} />
        </Link>
      </div>

      <Link to={`/posts/${post.$id}`}>
        <div className="small-medium lg:base-medium py-5">
          <p>{post.caption}</p>
          <ul className="flex gap-1 mt-2">
            {post.tags.map((tag: string) => (
              <li key={tag} className="text-light-3">#{tag}</li>
            ))}
          </ul>
        </div>

        {/* Check if the media type is video or image */}
        {mediaType === "video" ? (
          <video
            className="file_uploader-video"
            controls
            loop
            autoPlay
            muted
            preload="metadata"
          >
            <source src={post.imageUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={post.imageUrl || "/assets/icons/profile-placeholder.svg"}
            className="post-card_img"
            alt="post image"
          />
        )}
      </Link>

      <PostStats post={post} userId={user.id} />
    </div>
  );
};

export default PostCard;
