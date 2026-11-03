import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const allowedExtensions = [
  // Images
  '.jpg', '.jpeg', '.webp', '.png', '.gif', '.svg', '.bmp', '.ico',
  // Videos & Audio
  '.mp4', '.avi', '.mov', '.mkv', '.mk3d', '.mks', '.mka', '.webm', '.mp3', '.wav', '.ogg',
  // Documents & Archives
  '.pdf', '.txt', '.csv', '.json', '.zip', '.tar', '.gz', '.rar', '.7z',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`❌ Unsupported file type: ${ext}`));
    }
    cb(null, true);
  }
});

export default upload;
