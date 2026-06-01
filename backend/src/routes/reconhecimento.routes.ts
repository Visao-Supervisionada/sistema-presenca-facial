import { Router } from "express";

import {
  validarReconhecimentoController,
  classificarReconhecimentoController,
} from "../controllers/reconhecimento.controller";
import { uploadImagem } from "../middlewares/upload";

const router = Router();

router.post(
  "/validar",
  uploadImagem.single("file"),
  validarReconhecimentoController,
);

router.post(
  "/classificar",
  uploadImagem.single("file"),
  classificarReconhecimentoController,
);

export default router;