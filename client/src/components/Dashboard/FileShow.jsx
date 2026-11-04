import { getExpiryInfo, isDateExpired } from "../../utils/expiryUtils";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserFiles, deleteFile } from "../../redux/slice/file/fileThunk";
import { formatDistanceToNowStrict, differenceInDays } from "date-fns";
import { FaWhatsapp, FaTelegramPlane, FaInstagram, FaEnvelope, FaHeadset,FaDownload } from "react-icons/fa"
import { toast } from "react-toastify";
import axiosInstance from "../../config/axiosInstance";

const FileShow = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { files } = useSelector((state) => state.file);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to permanently delete this file? It will be removed from S3 and the share link will stop working.")) {
      return;
    }
    try {
      const res = await dispatch(deleteFile(fileId));
      if (res.error) {
        toast.error(res.payload?.error || res.payload?.message || "Failed to delete file");
      } else {
        toast.success("File permanently deleted from S3 and database!");
        if (user?._id) {
          dispatch(getUserFiles(user._id));
        }
      }
    } catch (err) {
      toast.error("Error deleting file");
    }
  };
  const handlePreview = async (file) => {
    if (file.expiresAt && new Date(file.expiresAt) <= new Date()) {
      toast.error("This file has expired and is no longer accessible.");
      if (user?._id) {
        dispatch(getUserFiles(user._id));
      }
      return;
    }

    if (file.shortUrl) {
      try {
        const res = await axiosInstance.get(`/files${file.shortUrl}`);
        if (res.data && (res.data.downloadUrl || res.data.path)) {
          const freshUrl = res.data.downloadUrl || res.data.path;
          setPreviewFile({
            ...file,
            path: freshUrl,
            downloadUrl: freshUrl
          });
          return;
        }
      } catch (err) {
        if (err.response?.status === 410 || err.response?.status === 404) {
          toast.error("This file has expired or was deleted.");
          if (user?._id) {
            dispatch(getUserFiles(user._id));
          }
          return;
        }
        console.warn("Could not refresh preview URL:", err);
      }
    }
    setPreviewFile(file);
  };

  const [searchTerm, setSearchTerm] = useState("");
const [filterType, setFilterType] = useState("");
const [filterStatus, setFilterStatus] = useState("");


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const currentUserId = user?._id || user?.id;
    if (currentUserId) {
      dispatch(getUserFiles(currentUserId));
    }
  }, [user, dispatch]);

  const sortFileName = (filename)=>{
    // Sort the file name to ensure consistent display
    return filename.length > 20 ? `${filename.slice(0, 20)}...` : filename;
  }

  // const handleShare = (url) => {
  //   const encodedURL = encodeURIComponent(url);
  //   return {
  //     whatsapp: `https://wa.me/?text=${encodedURL}`,
  //     facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,
  //     instagram: "#",
  //     email: `mailto:?subject=File%20Share&body=Here's%20your%20file:%20${encodedURL}`,
  //     qr: `https://api.qrserver.com/v1/create-qr-code/?data=${encodedURL}&size=150x150`,
  //   };
  // };

  function handleShare(shortUrl) {
  const frontendBaseUrl = window.location.origin; // Automatically picks http://localhost:5173 or your deployed domain
  const fullUrl = `${frontendBaseUrl}${shortUrl}`;

  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent("Download file: " + fullUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=Check this out!`,
    email: `mailto:?subject=Shared File&body=${encodeURIComponent("Here’s your file: " + fullUrl)}`,
    copy: fullUrl,
    qr: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(fullUrl)}&size=150x150`
  };
}
const downloadQRCode = async (shortUrl) => {
  const qrUrl = handleShare(shortUrl).qr;

  try {
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("QR code download failed:", error);
    alert("Failed to download QR code. Please try again.");
  }
};

// Filter logic
const filteredFiles = files?.filter((file) => {
  const nameMatch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
  const typeMatch = filterType ? file.type === filterType : true;
  
  const statusMatch = filterStatus
    ? filterStatus === "expired"
      ? differenceInDays(new Date(file.expiresAt), new Date()) <= 0
      : differenceInDays(new Date(file.expiresAt), new Date()) > 0
    : true;

  return nameMatch && typeMatch && statusMatch;
});

// Pagination logic
const totalPages = Math.ceil((filteredFiles?.length || 0) / itemsPerPage);
const paginatedFiles = filteredFiles?.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

  return (
    <div className="flex flex-col mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold mb-4">📁 Your Uploaded Files</h2>
        <p className="text-sm text-gray-500">
  Showing {filteredFiles.length} file{filteredFiles.length !== 1 && "s"}
</p>

        
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full lg:items-center mb-4">
  <div className="relative flex-1">
    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-text)]"
      placeholder="Search by file name"
      aria-label="Search"
    />
  </div>

  <select
    className="px-3 py-2 border rounded-lg"
    value={filterType}
    onChange={(e) => setFilterType(e.target.value)}
  >
    <option value="">All Types</option>
    {[...new Set(files?.map((f) => f.type))].map((type) => (
      <option key={type} value={type}>{type}</option>
    ))}
  </select>

  <select
    className="px-3 py-2 border rounded-lg"
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
  >
    <option value="">All Status</option>
    <option value="active">Active</option>
    <option value="expired">Expired</option>
  </select>

  {(filterType || filterStatus || searchTerm) && (
    <button
      onClick={() => {
        setSearchTerm("");
        setFilterType("");
        setFilterStatus("");
      }}
      className="px-3 py-2 bg-red-100 text-red-500 rounded hover:bg-red-200"
    >
      Reset
    </button>
  )}
</div>

      

      {!files || files.length === 0 ? (
        <p className="text-gray-500">No files uploaded yet.</p>
      ) : (
        <div className="-my-2 overflow-x-auto">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden border border-[var(--border-color)] rounded-md shadow-md">
             <table className="min-w-full divide-y divide-[var(--border-color)] text-[var(--text-color)]">
  <thead className="bg-[var(--primary-text)] text-[var(--text-on-primary)] hidden md:table-header-group">
                <tr>
                  {[
                    "File Name",
                    "Size",
                    "Type",
                    "Download",
                    "Status",
                    "Actions",
                    "Expiry At",
                    "Uploaded At",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              {/* <tbody className="bg-[var(--bg-color)] divide-y divide-[var(--border-color)]">
                {paginatedFiles?.map((file) => {
                  const shareLinks = handleShare(file.shortUrl);
                  const formattedSize =
                    file.size > 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                      : file.size > 1024
                      ? `${(file.size / 1024).toFixed(2)} KB`
                      : `${file.size} Bytes`;

                  const isExpired =
                    differenceInDays(new Date(file.expiresAt), new Date()) <= 0;

                  return (
                    <tr key={file._id} className="hover:bg-[var(--hover-bg-color)]">
                      <td className="px-6 py-4 text-sm">{sortFileName(file.name)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formattedSize}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {file.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {file.downloadedContent}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-medium ${
                            file.status === "Active" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {file.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-3">
                        <button
                          onClick={() => handlePreview(file)}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setShareFile(file)}
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          Share
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-red-500">
                        {isExpired
                          ? "Expired"
                          : `Expires in ${differenceInDays(
                              new Date(file.expiresAt),
                              new Date()
                            )} days`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        Uploaded{" "}
                        {formatDistanceToNowStrict(new Date(file.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody> */}
              <tbody className="bg-[var(--bg-color)] divide-y divide-[var(--border-color)]">
  {paginatedFiles?.map((file) => {
    const shareLinks = handleShare(file.shortUrl);
    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : file.size > 1024
        ? `${(file.size / 1024).toFixed(2)} KB`
        : `${file.size} Bytes`;

    const isExpired =
      differenceInDays(new Date(file.expiresAt), new Date()) <= 0;

    return (
      <>
        {/* Desktop Row */}
        <tr
          key={file._id}
          className="hover:bg-[var(--hover-bg-color)] hidden md:table-row"
        >
          <td className="px-6 py-4 text-sm">{sortFileName(file.name)}</td>
          <td className="px-6 py-4 text-sm text-gray-400">{formattedSize}</td>
          <td className="px-6 py-4 text-sm text-gray-400">{file.type}</td>
          <td className="px-6 py-4 text-sm text-gray-400">
            {file.downloadedContent}
          </td>
          <td className="px-6 py-4 text-sm">
            <span
              className={`font-medium ${
                file.status === "active" ? "text-green-500" : "text-red-500"
              }`}
            >
              {file.status}
            </span>
          </td>
          <td className="px-6 py-4 text-sm space-x-3">
            <button
              onClick={() => handlePreview(file)}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Preview
            </button>
            <button
              onClick={() => setShareFile(file)}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Share
            </button>
          </td>
          <td className="px-6 py-4 text-sm text-red-500">
            {isExpired
              ? "Expired"
              : `Expires in ${differenceInDays(
                  new Date(file.expiresAt),
                  new Date()
                )} days`}
          </td>
          <td className="px-6 py-4 text-sm text-gray-400">
            Uploaded{" "}
            {formatDistanceToNowStrict(new Date(file.createdAt), {
              addSuffix: true,
            })}
          </td>
        </tr>

        {/* Mobile Card */}
        <tr key={`mobile-${file._id}`} className="block md:hidden border-b border-gray-200">
          <td className="block px-4 py-4">
            <div className="mb-2">
              <strong className="text-gray-700 dark:text-gray-200">📄 {sortFileName(file.name)}</strong>
              <div className="text-xs text-gray-400">{file.type} | {formattedSize}</div>
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Status: </span>
              <span className={file.status === "active" ? "text-green-600" : "text-red-500"}>
                {file.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Downloaded:</span> {file.downloadedContent}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Expiry:</span>{" "}
              {isExpired
                ? "Expired"
                : `Expires in ${differenceInDays(
                    new Date(file.expiresAt),
                    new Date()
                  )} days`}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Uploaded:</span>{" "}
              {formatDistanceToNowStrict(new Date(file.createdAt), {
                addSuffix: true,
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-3">
              <button
                onClick={() => handlePreview(file)}
                className="text-blue-500 underline"
              >
                Preview
              </button>
              <button
                onClick={() => setShareFile(file)}
                className="text-purple-500 underline"
              >
                Share
              </button>
            </div>
          </td>
        </tr>
      </>
    );
  })}
</tbody>

            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 px-2">
              <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className="px-4 py-2 rounded text-white bg-[var(--primary-text)] hover:opacity-90 disabled:opacity-50"
  >
    Previous
  </button>
              <span className="text-sm text-gray-950 dark:text-gray-900">
                Page {currentPage} of {totalPages}
              </span>
               <button
    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
    className="px-4 py-2 rounded text-white bg-[var(--primary-text)] hover:opacity-90 disabled:opacity-50"
  >
    Next
  </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate pr-4">
                {previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Centered & Height-Constrained */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50/70 dark:bg-gray-950/40 min-h-[220px]">
              {previewFile.type.startsWith("image/") && (
                <img
                  src={previewFile.downloadUrl || previewFile.path}
                  alt={previewFile.name}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
              {previewFile.type.startsWith("video/") && (
                <video controls className="max-h-[65vh] w-auto max-w-full rounded-lg shadow-sm">
                  <source src={previewFile.downloadUrl || previewFile.path} type={previewFile.type} />
                  Your browser does not support the video tag.
                </video>
              )}
              {previewFile.type.startsWith("audio/") && (
                <div className="w-full max-w-md p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-center">
                  <p className="text-sm font-medium mb-3 text-gray-600 dark:text-gray-300">Audio Preview</p>
                  <audio controls className="w-full">
                    <source src={previewFile.downloadUrl || previewFile.path} type={previewFile.type} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {previewFile.type === "application/pdf" && (
                <iframe
                  src={previewFile.downloadUrl || previewFile.path}
                  title="PDF Preview"
                  className="w-full h-[65vh] rounded-lg border border-gray-200 dark:border-gray-800"
                ></iframe>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Size: {(previewFile.size / 1024).toFixed(1)} KB
              </span>
              <div className="flex items-center gap-2">
                {previewFile.downloadUrl && (
                  <a
                    href={previewFile.downloadUrl}
                    download={previewFile.name}
                    className="px-4 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-4 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareFile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShareFile(null)}
        >
  <div
    className="bg-white dark:bg-[--bg-color] p-6 rounded-xl shadow-2xl w-full max-w-md md:max-w-2xl"
    onClick={(e) => e.stopPropagation()}
  >
    <h3 className="text-lg font-bold mb-4 text-center">
      Share "{shareFile?.name}"
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[var(--text-color)]">
      <a
        href={handleShare(shareFile.shortUrl).whatsapp}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-4 border rounded hover:shadow transition"
      >
        <FaWhatsapp className="text-green-500 text-2xl" />
        <span className="font-semibold">WhatsApp</span>
      </a>

      <a
        href={handleShare(shareFile.shortUrl).instagram || "#"}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-4 border rounded hover:shadow transition"
      >
        <FaInstagram className="text-pink-500 text-2xl" />
        <span className="font-semibold">Instagram</span>
      </a>

      <a
        href={handleShare(shareFile.shortUrl).telegram}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-4 border rounded hover:shadow transition"
      >
        <FaTelegramPlane className="text-blue-500 text-2xl" />
        <span className="font-semibold ">Telegram</span>
      </a>

      <a
        href={handleShare(shareFile.shortUrl).email}
        className="flex items-center gap-3 p-4 border rounded hover:shadow transition"
      >
        <FaEnvelope className="text-red-500 text-2xl" />
        <span className="font-semibold">Email</span>
      </a>
      

      
    </div>

    <div className="mt-6 text-center">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        QR Code:
      </p>
      <img
        src={handleShare(shareFile.shortUrl).qr}
        alt="QR Code"
        className="mx-auto border rounded w-32 h-32"
      />
      <div className="flex flex-col items-center mt-4">
      <button
  onClick={() => downloadQRCode(shareFile.shortUrl)}
  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-500 rounded hover:bg-blue-200 transition"
>
  <FaDownload className="text-blue-500 text-2xl" />
  <span className="font-semibold">Download QR Code</span>
</button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(handleShare(shareFile.shortUrl).copy);
           toast.success("Link copied to clipboard!");
          }}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-500 rounded hover:bg-blue-200 transition"
        >
          <FaDownload className="text-blue-500 text-2xl" />
          <span className="font-semibold">Copy Link</span>
        </button>

        </div>
      
    </div>
    

    <div className="mt-6 text-center">
      <button
        onClick={() => setShareFile(null)}
        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
      >
        Close
      </button>
    </div>
  </div>
</div>
      )}
    </div>
  );
};

export default FileShow;
