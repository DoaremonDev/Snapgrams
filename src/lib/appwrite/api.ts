import { ID, Query } from "appwrite";

import { appwriteConfig, account, databases, storage, avatars } from "./config";
import { IUpdatePost, INewPost, INewUser, IUpdateUser } from "@/types";

// ============================================================
// AUTH
// ============================================================

// ============================== SIGN UP
export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: new URL(avatarUrl),
    });

    return newUser;
  } catch (error) {
    console.log(error);
    return error;
  }
}

// ============================== SAVE USER TO DB
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );

    return newUser;
  } catch (error) {
    console.log(error);
  }
}

// ============================== SIGN IN
export async function signInAccount(user: { email: string; password: string }) {
  try {
    console.log(user.email)
    console.log(user.password)
    const session = await account.createEmailPasswordSession(user.email, user.password);

    return session;
  } catch (error) {
    console.log(error);
  }
}
// ============================== GET ACCOUNT
export async function getAccount() {
  try {
    const currentAccount = await account.get();
    console.log(currentAccount)

    return currentAccount;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );
    console.log(currentUser)

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current")
    return session;
  } catch (error) {
    console.log(error)
    
  }
}

export async function createPost(post: INewPost) {
  console.log(post);

  try {
    // Step 1: Upload file
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw new Error("File upload failed");

    // Step 2: Generate the appropriate URL based on file type
    const fileUrl = await getFileUrl(uploadedFile.$id, uploadedFile.name);

    // Step 3: Handle post tags
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Step 4: Create a new post
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl, // Use the generated URL (image or video)
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
      }
    );

    if (!newPost) {
      deleteFile(uploadedFile.$id); // Clean up uploaded file if post creation failed
      throw new Error("Failed to create new post");
    }

    return newPost;
    
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
}



export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    )

    return uploadedFile;
  } catch (error) {
    console.log(error)
  }
}

export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000, // width
      2000, // height
      "top" as any, // gravity
      100, // quality
    );
    return fileUrl;
  } catch (error) {
    console.log(error)
  }
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId)
    return { status: "ok" };
  } catch (error) {
    console.log(error)
  }
}

export async function getRecentPosts() {
  const posts = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.orderDesc('$createdAt'), Query.limit(20)]
  )

  if (!posts) throw Error;

  return posts;
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray
      }
    )

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error)
  }
}

export async function savePost(postId: string, userId: string) {
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId
      }
    )

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error)
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId
    )

    if (!statusCode) throw Error;

    return {status: 'ok'}
  } catch (error) {
    console.log(error)
  }
}

export async function getPostById(postId?: string) {
  if (!postId) throw Error;

  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      const loo = new URL(fileUrl);

      image = { ...image, imageUrl: loo, imageId: uploadedFile.$id };
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //  Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

export async function getUserPosts(userId?: string) {
  if (!userId) return;

  try {
    const post = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc("$updatedAt"), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

export async function searchPosts(searchTerm: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("tags", searchTerm)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

export async function getUsers(limit?: number) {
  const queries: any[] = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    );

    if (!users) throw Error;

    return users;
  } catch (error) {
    console.log(error);
  }
}

export async function getUserById(userId: string) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );

    if (!user) throw Error;

    return user;
  } catch (error) {
    console.log(error);
  }
}

export async function updateUser(user: IUpdateUser) {
  const hasFileToUpdate = user.file.length > 0;
  try {
    let image = {
      imageUrl: user.imageUrl,
      imageId: user.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(user.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    //  Update user
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        bio: user.bio,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
      }
    );

    // Failed to update
    if (!updatedUser) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (user.imageId && hasFileToUpdate) {
      await deleteFile(user.imageId);
    }

    return updatedUser;
  } catch (error) {
    console.log(error);
  }
}

export const followUserAPI = async (currentUserId: string, followUserId: string) => {
  // You can update the 'followingList' of the current user and 'followersList' of the user being followed
  try {
    // Example: Create a follow relationship in your database (Appwrite)
    const followData = {
      followerId: currentUserId,
      followingId: followUserId,
      createdAt: new Date().toISOString(),
    };

    const result = await databases.createDocument(
      appwriteConfig.databaseId, // Your Appwrite database ID
      "673cbc330003acec1d10", // Your collection ID for follow relationships
      ID.unique(), // You can generate a unique ID for the follow relationship
      followData
    );
    return result; // Return the result from Appwrite (or success message)
  } catch (error) {
    console.error("Error following user:", error);
    throw new Error("Unable to follow user");
  }
};

export const unfollowUserAPI = async (currentUserId: string, followUserId: string) => {
  try {
    // Query to find the follow relationship document based on followerId and followingId
    const response = await databases.listDocuments(
      appwriteConfig.databaseId, // Replace with your Appwrite database ID
      "673cbc330003acec1d10", // Replace with your collection ID for follow relationships
      [
        `followerId=${currentUserId}`, // Filter by currentUserId
        `followingId=${followUserId}`  // Filter by followUserId
      ]
    );

    if (response.documents.length > 0) {
      const followDocId = response.documents[0].$id; // Get the document ID of the follow relationship
      await databases.deleteDocument(
        "your-database-id", // Replace with your Appwrite database ID
        "your-follow-collection-id", // Replace with your collection ID
        followDocId // Document ID to delete
      );
      return { status: "unfollowed" }; // Return success message
    } else {
      throw new Error("Follow relationship not found");
    }
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw new Error("Unable to unfollow user");
  }
};

async function getFileUrl(fileId: string, fileName: string): Promise<string> {
  // Check the file extension to determine if it's an image or a video
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  
  if (["mp4", "webm", "ogg"].includes(fileExtension || "")) {
    // Return the direct URL for video
    return `${appwriteConfig.url}/storage/buckets/${appwriteConfig.storageId}/files/${fileId}/view?project=673a1a7a0001a9a43b79`;
  } else {
    // Return the preview URL for images
    return `${appwriteConfig.url}/storage/buckets/${appwriteConfig.storageId}/files/${fileId}/preview?project=673a1a7a0001a9a43b79`;
  }
}

