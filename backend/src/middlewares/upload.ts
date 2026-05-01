import multer from 'multer';

const armazenamento = multer.memoryStorage();

export const uploadImagem = multer({
  storage: armazenamento,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});