import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from "cloudinary";
import { env } from "./env";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = (
  file: Express.Multer.File,
  folder: string,
): Promise<UploadApiResponse & { download_url: string }> => {
  return new Promise((resolve, reject) => {
    const isVideo = file.mimetype.startsWith("video");
    const isDocument = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
    ].includes(file.mimetype);

    const options: UploadApiOptions = {
      folder,
      resource_type: isDocument ? "raw" : isVideo ? "video" : "image",
      use_filename: true,
      unique_filename: true,
      // ← Forces Cloudinary to store with the original filename + extension
      // This is what prevents the 404 on .pptx/.pdf files
      ...(isDocument && {
        filename_override: file.originalname,
      }),
    };

    if (isVideo) {
      options.transformation = [
        { streaming_profile: "hd", format: "m3u8" },
        { quality: "auto" },
      ];
      options.eager = [
        { width: 720, height: 480, crop: "pad", video_codec: "h264" },
        { format: "jpg", resource_type: "video", frames: 1 },
      ];
      options.eager_async = true;
    } else if (!isDocument) {
      options.transformation = [
        { width: 1200, crop: "limit", quality: "auto", fetch_format: "auto" },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));

        // Generate a secure download URL with the attachment flag
        // Only needed for documents — videos/images are streamed directly
        const download_url = isDocument
          ? cloudinary.url(result.public_id, {
              resource_type: result.resource_type,
              flags: "attachment",
              secure: true,
            })
          : result.secure_url;

        resolve({ ...result, download_url });
      },
    );

    const stream = Readable.from(file.buffer);
    stream.on("error", (err) => reject(err));
    stream.pipe(uploadStream);
  });
};

export default cloudinary;