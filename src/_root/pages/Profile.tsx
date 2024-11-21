import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
} from "react-router-dom";

import { LikedPosts } from "@/_root/pages";
import { useUserContext } from "@/context/AuthContext";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import GridPostList from "@/components/shared/GridPostList";
import React from "react";
import { databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";

interface StabBlockProps {
  value: string | number;
  label: string;
}

const StatBlock = ({ value, label }: StabBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const Profile = () => {
  const { id } = useParams(); // The profile being viewed
  const { pathname } = useLocation();

  const { user } = useUserContext(); // Current logged-in user
  const [currentUser, setCurrentUser] = React.useState<any>(null); // Profile user data
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [followersCount, setFollowersCount] = React.useState(0);
  const [followingCount, setFollowingCount] = React.useState(0);


  // Initialize Appwrite Client
 // Replace with your project ID
 const fetchFollowCounts = async () => {
  if (!id) return;

  try {
    // Get followers count
    const followersResponse = await databases.listDocuments(
      "673b11e000369b047a33",
      "673cbc330003acec1d10",
      [Query.equal("followingId", id)]
    );
    setFollowersCount(followersResponse.total);

    // Get following count
    const followingResponse = await databases.listDocuments(
      "673b11e000369b047a33",
      "673cbc330003acec1d10",
      [Query.equal("followerId", id)]
    );
    setFollowingCount(followingResponse.total);
  } catch (error) {
    console.error("Error fetching follow counts:", error);
  }
};

  // Fetch user data
  const fetchUser = async () => {
    try {
      setLoading(true);
      const userResponse = await databases.getDocument(
        "673b11e000369b047a33",
        "673b1289002353a1aaae",
        id || ""
      );
      setCurrentUser(userResponse);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if the current user is following the profile user
  const checkFollowStatus = async () => {
    if (!user || !id) return;

    try {
      const response = await databases.listDocuments(
        "673b11e000369b047a33",
        "673cbc330003acec1d10",
        [
          Query.equal("followerId", user.id),
          Query.equal("followingId", id),
        ]
      );

      setIsFollowing(response.documents.length > 0);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  // Handle Follow/Unfollow
  const handleFollowClick = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow: Delete the follow document
        const response = await databases.listDocuments(
          "673b11e000369b047a33",
          "673cbc330003acec1d10",
          [
            Query.equal("followerId", user.id),
            Query.equal("followingId", id),
          ]
        );

        if (response.documents.length > 0) {
          await databases.deleteDocument(
            "673b11e000369b047a33",
            "673cbc330003acec1d10",
            response.documents[0].$id
          );

          setFollowersCount((prev) => prev - 1); // Decrease the profile user's follower count
          setFollowingCount((prev) => prev - 1); // Decrease current user's following count
        }
      } else {
        // Follow: Create a new follow document
        await databases.createDocument(
          "673b11e000369b047a33",
          "673cbc330003acec1d10",
          "unique()", // Auto-generate ID
          {
            followerId: user.id,
            followingId: id,
            createdAt: new Date().toISOString(),
          }
        );

        setFollowersCount((prev) => prev + 1); // Increase the profile user's follower count
        setFollowingCount((prev) => prev + 1); // Increase current user's following count
      }

      // Toggle follow state
      setIsFollowing(!isFollowing);

      fetchFollowCounts();
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUser();
    checkFollowStatus();
    fetchFollowCounts();
  }, [id]);

  if (loading || !currentUser)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={
              currentUser.imageUrl || "/assets/icons/profile-placeholder.svg"
            }
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full"
          />
          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {currentUser.name}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{currentUser.username}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={currentUser.posts.length} label="Posts" />
              <StatBlock value={followersCount} label="Followers" />
              <StatBlock value={followingCount} label="Following" />
            </div>

            <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
              {currentUser.bio}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <div className={`${user.id !== currentUser.$id && "hidden"}`}>
              <Link
                to={`/update-profile/${currentUser.$id}`}
                className={`h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg ${
                  user.id !== currentUser.$id && "hidden"
                }`}
              >
                <img
                  src={"/assets/icons/edit.svg"}
                  alt="edit"
                  width={20}
                  height={20}
                />
                <p className="flex whitespace-nowrap small-medium">
                  Edit Profile
                </p>
              </Link>
            </div>
            <div className={`${user.id === id && "hidden"}`}>
              <Button
                type="button"
                onClick={handleFollowClick}
                className="shad-button_primary px-8"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : isFollowing
                  ? "Unfollow"
                  : "Follow"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {currentUser.$id === user.id && (
        <div className="flex max-w-5xl w-full">
          <Link
            to={`/profile/${id}`}
            className={`profile-tab rounded-l-lg ${
              pathname === `/profile/${id}` && "!bg-dark-3"
            }`}
          >
            <img
              src={"/assets/icons/posts.svg"}
              alt="posts"
              width={20}
              height={20}
            />
            Posts
          </Link>
          <Link
            to={`/profile/${id}/liked-posts`}
            className={`profile-tab rounded-r-lg ${
              pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"
            }`}
          >
            <img
              src={"/assets/icons/like.svg"}
              alt="like"
              width={20}
              height={20}
            />
            Liked Posts
          </Link>
        </div>
      )}

      <Routes>
        <Route
          index
          element={<GridPostList posts={currentUser.posts} showUser={false} />}
        />
        {currentUser.$id === user.id && (
          <Route path="/liked-posts" element={<LikedPosts />} />
        )}
      </Routes>
      <Outlet />
    </div>
  );
};

export default Profile;
