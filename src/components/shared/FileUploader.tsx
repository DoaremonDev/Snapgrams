import  { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import { Button } from "../ui/button";

type FileUploaderProps = {
  fieldChange: (files: File[]) => void;
  mediaUrl: string;
};

const FileUploader = ({ fieldChange, mediaUrl }: FileUploaderProps) => {
  const [file, setFile] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState(mediaUrl);

    console.log(file);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setFile(acceptedFiles);
      fieldChange(acceptedFiles);
      setFileUrl(URL.createObjectURL(acceptedFiles[0]));
    },
    [fieldChange]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpeg", ".jpg", ".svg"],
      "video/*": [".mp4"],
    },
  });

  // Helper function to determine if the file is a video
  const isVideo = (fileUrl: string) => {
    const videoExtensions = ["mp4"];
    const fileExtension = fileUrl.split(".").pop()?.toLowerCase();
    return videoExtensions.includes(fileExtension || "");
  };

  return (
    <div
      {...getRootProps()}
      className="flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer"
    >
      <input {...getInputProps()} className="cursor-pointer" />
      {fileUrl ? (
        <>
          <div className="flex flex-1 justify-center w-full p-5 lg:p-10">
            {isVideo(fileUrl) ? (
              <video
                className="file_uploader-video"
                controls
                preload="metadata"
              >
                <source src={fileUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={fileUrl} alt="uploaded" className="file_uploader-img" />
            )}
          </div>
          <p className="file_uploader-label">
            Click or drag photo/video to replace
          </p>
        </>
      ) : (
        <div className="file_uploader-box">
          <img
            src="/assets/icons/file-upload.svg"
            width={96}
            height={77}
            alt="file-upload"
          />
          <h3 className="base-medium text-light-2 mb-2 mt-6">Drag Files Here</h3>
          <p className="text-light-4 small-regular mb-6">
            SVG, PNG, JPG, MP4, WEBM, OGG
          </p>
          <Button className="shad-button_dark_4">Select from Gallery</Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
