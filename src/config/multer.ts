import multer from "multer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// memoryStorage — files stay as Buffers in RAM, no disk writes before Cloudinary upload
// Always validate MIME type, not file extension (extensions can be spoofed)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only jpeg, png, webp allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB — without this, large uploads can exhaust RAM
  }
});

export default upload;
