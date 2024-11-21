import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useGetPostById,
  useGetUserPosts,
  useDeletePost,
} from "@/lib/react-query/queriesAndMutations";
import { timeAgo } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import PostStats from "@/components/shared/PostStats";
import GridPostList from "@/components/shared/GridPostList";
import { useState, useEffect } from "react";
import { appwriteConfig, storage } from "@/lib/appwrite/config";



// Helper function to fetch file metadata and determine media type
const getMediaTypeFromMetadata = async (fileId: string) => {
  try {
    const file = await storage.getFile(appwriteConfig.storageId, fileId);
    const mimeType = file.mimeType?.split("/")[0]; // "image" or "video"
    
    // Return media type based on MIME type
    if (mimeType === "video") return "video";
    if (mimeType === "image") return "image";
    return "unknown";
  } catch (error) {
    console.error("Error fetching file metadata:", error);
    return "unknown";
  }
};

const PostDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUserContext();

  const { data: post, isLoading } = useGetPostById(id);
  const { data: userPosts, isLoading: isUserPostLoading } = useGetUserPosts(post?.creator.$id);
  const { mutate: deletePost } = useDeletePost();

  const relatedPosts = userPosts?.documents.filter((userPost) => userPost.$id !== id);
  const [mediaType, setMediaType] = useState<string>("");

  // Fetch and set the media type based on the file metadata
  useEffect(() => {
    if (post?.imageId) {
      const fetchMediaType = async () => {
        const type = await getMediaTypeFromMetadata(post.imageId);
        setMediaType(type);
      };
      fetchMediaType();
    }
  }, [post?.imageId]);

  const handleDeletePost = () => {
    deletePost({ postId: id, imageId: post?.imageId });
    navigate(-1);
  };

  return (
    <div className="post_details-container">
    {/* Back Navbar with Left-Aligned Navigation */}
    <div className="hidden md:flex max-w-5xl w-full">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="shad-button_ghost">
          <img
            src={"/assets/icons/back.svg"}
            alt="back"
            width={24}
            height={24}
          />
          <p className="small-medium lg:base-medium">Back</p>
        </Button>
      </div>
      {/* Main Content */}
      {isLoading || !post ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          {/* Render the media based on the type */}
          {mediaType === "video" ? (
            <video
              className="post_details-video"
              controls
              loop
              autoPlay
              muted
              preload="metadata"
            >
              <source src={post?.imageUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : mediaType === "image" ? (
            <img
              src={post?.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="post"
              className="post_details-img"
            />
          ) : (
            <p>Unsupported media type</p>
          )}

          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link
                to={`/profile/${post?.creator.$id}`}
                className="flex items-center gap-3">
                <img
                  src={
                    post?.creator.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="w-8 h-8 lg:w-12 lg:h-12 rounded-full"
                />
                <div className="flex gap-1 flex-col">
                  <p className="base-medium lg:body-bold text-light-1">
                    {post?.creator.name}
                  </p>
                  <div className="flex-center gap-2 text-light-3">
                    <p className="subtle-semibold lg:small-regular ">{timeAgo(post?.$createdAt)}</p>
                    •
                    <p className="subtle-semibold lg:small-regular">{post?.location}</p>
                  </div>
                </div>
              </Link>

              <div className="flex-center gap-4">
                <Link
                  to={`/update-post/${post?.$id}`}
                  className={`${user.id !== post?.creator.$id && "hidden"}`}>
                  <img
                    src={"/assets/icons/edit.svg"}
                    alt="edit"
                    width={24}
                    height={24}
                  />
                </Link>

                <Button
                  onClick={handleDeletePost}
                  variant="ghost"
                  className={`post_details-delete_btn ${user.id !== post?.creator.$id && "hidden"}`}>
                  <img
                    src={"/assets/icons/delete.svg"}
                    alt="delete"
                    width={24}
                    height={24}
                  />
                </Button>
              </div>
            </div>

            <hr className="border w-full border-dark-4/80" />

            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p>{post?.caption}</p>
              <ul className="flex gap-1 mt-2">
                {post?.tags.map((tag: string, index: string) => (
                  <li key={`${tag}${index}`} className="text-light-3 small-regular">
                    #{tag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full">
              <PostStats post={post} userId={user.id} />
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        <hr className="border w-full border-dark-4/80" />
        <h3 className="body-bold md:h3-bold w-full my-10">More Related Posts</h3>

        {isUserPostLoading || !relatedPosts ? (
          <Loader />
        ) : (
          <GridPostList posts={relatedPosts} />
        )}
      </div>
    </div>
  );
};

export default PostDetails;
