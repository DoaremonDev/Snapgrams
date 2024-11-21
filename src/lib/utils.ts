import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

export function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds <= 2) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInMonths / 12);

  if (diffInYears >= 1) {
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  }
  if (diffInMonths >= 1) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }
  if (diffInWeeks >= 1) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }
  if (diffInDays >= 1) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
  if (diffInHours >= 1) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }
  if (diffInMinutes >= 1) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }
  return `${diffInSeconds} second${diffInSeconds > 1 ? "s" : ""} ago`;
}


export const checkIsLiked = (likeList: string[], userId: string) => {
  return likeList.includes(userId);
};



