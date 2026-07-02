import axios from "axios";
import api from "./Api.jsx";

/**
 * Extracts the file key from an UploadThing URL.
 * @param {string} url - The UploadThing file URL (e.g., "https://utfs.io/f/abc123_image.jpg")
 * @returns {string} The file key (e.g., "abc123_image.jpg")
 */
export const extractFileKeyFromUrl = (url) => {
  if (!url) return null;
  
  // Handle different UploadThing URL formats
  const patterns = [
    /\/f\/([^\/\?#]+)/, // Standard format: /f/filename (excluding query params and fragments)
    /utfs\.io\/f\/([^\/\?#]+)/, // Full URL format
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Could not extract file key from URL
  return null;
};

/**
 * Deletes a file by calling the backend API.
 * @param {string} fileUrl - The file URL to delete
 * @returns {Promise<{success: boolean, message: string, deletedFiles: string[], failedFiles: string[]}>} Deletion result
 */
export const deleteFileByUrl = async (fileUrl) => {
  if (!fileUrl) {
    throw new Error("File URL is required for deletion");
  }
  
  // Extract file key from URL
  const fileKey = extractFileKeyFromUrl(fileUrl);
  
  if (!fileKey) {
    return {
      success: false,
      message: "Could not extract file key from URL. Please check if it's a valid UploadThing URL.",
      deletedFiles: [],
      failedFiles: [fileUrl]
    };
  }
  
  try {
    // Call the backend API using the configured api instance with file key
    const response = await api.delete(`/v1/uploadthing/files/${fileKey}`);
    
    const result = response.data;
    
    if (response.status === 200 && result.success) {
      return {
        success: true,
        message: result.message || "File deleted successfully",
        deletedFiles: result.deletedFiles || [fileKey],
        failedFiles: result.failedFiles || [],
        data: result,
      };
    } else {
      
      return {
        success: false,
        message: result.message || "Failed to delete file",
        deletedFiles: result.deletedFiles || [],
        failedFiles: result.failedFiles || [fileKey],
        error: result.error,
      };
    }
  } catch (error) {

    return {
      success: false,
      message: "Failed to delete file. Please try again.",
      deletedFiles: [],
      failedFiles: [fileKey],
      error: error.message,
    };
  }
};

/**
 * Uploads a file (image or PDF) using UploadThing service via backend proxy.
 * @param {File} file - The file to upload (image or PDF).
 * @param {string} field - A string used to determine callbackSlug (e.g. 'photos', 'license').
 * @returns {Promise<{field: string, url: string, fileKey: string}>} The uploaded file metadata.
 */
export const uploadFile = async (file, field) => {
  try {
    // Determine the file type for validation
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    if (!isImage && !isPDF) {
      throw new Error("Only images and PDFs are allowed");
    }

    // Create FormData to send to backend
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", field);
    formData.append("fileType", isImage ? "image" : "pdf");

    // Call backend endpoint which securely handles UploadThing API
    const response = await api.post("/v1/uploadthing/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data || !response.data.url) {
      throw new Error("Invalid response from upload service");
    }

    // Return the standardized response
    return {
      field,
      url: response.data.url,
      fileKey: response.data.fileKey || response.data.key || null,
    };
  } catch (error) {
    
    throw error;
  }
};
