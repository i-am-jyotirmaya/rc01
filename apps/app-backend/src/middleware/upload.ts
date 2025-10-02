import multer from 'multer';
import { env } from '../config/env';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image uploads are allowed'));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024 },
  fileFilter,
});
