/*import React from "react";
import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite"; // Adjust the import to your Appwrite configuration
import Loader from "@/components/shared/Loader";
import Image from "next/image";
import { Query } from "appwrite";
import { useUserContext } from "@/context/AuthContext";

/// Types
interface Story {
  $id: string;
  storyURL: string;
  creatorID: string;
  createdAt: string;
}

interface Follow {
  $id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

// API Fetch Function
const fetchStories = async (userId: string): Promise<Record<string, Story[]>> => {
  // Fetch followed users
  const followingResponse = await databases.listDocuments<Follow>("Follows", [
    Query.equal("followerId", userId),
  ]);
  const followingIds = followingResponse.documents.map((doc: Follow) => doc.followingId);

  if (followingIds.length === 0) return {};

  // Fetch stories from followed users created in the last 24 hours
  const storyResponse = await databases.listDocuments<Story>("Stories", [
    Query.equal("creatorID", followingIds),
    Query.greaterThan("createdAt", (Date.now() - 24 * 60 * 60 * 1000).toString()), // Last 24 hours
  ]);

  // Group stories by creatorID
  return storyResponse.documents.reduce((acc: Record<string, Story[]>, story: Story) => {
    if (!acc[story.creatorID]) {
      acc[story.creatorID] = [];
    }
    acc[story.creatorID].push(story);
    return acc;
  }, {});
};

// StoryView Component
const StoryView: React.FC = () => {
  const { user } = useUserContext();

  const { data: stories, isLoading, isError } = useQuery(
    ["stories", user.$id],
    () => fetchStories(user.$id),
    {
      enabled: !!user.$id, // Only fetch if user ID is available
    }
  );

  if (isLoading) return <Loader />;
  if (isError || !stories || Object.keys(stories).length === 0)
    return <p className="text-center text-gray-500">No stories to show</p>;

  return (
    <div className="story-view-container">
      {Object.entries(stories).map(([creatorID, userStories]) => (
        <div key={creatorID} className="story-group">
          <div className="profile">
            <Image
              src="/assets/icons/profile-placeholder.svg" // Circular placeholder
              alt="User profile"
              width={60}
              height={60}
              className="rounded-full"
            />
          </div>
          <div className="story-thumbnails">
            {userStories.map((story) => (
              <div key={story.$id} className="story-thumbnail">
                <Image
                  src={story.storyURL}
                  alt="Story"
                  width={100}
                  height={150}
                  className="rounded-md"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoryView;*/


const StoryView = () => {
  return (
    <div>StoryView</div>
  )
}

export default StoryView
