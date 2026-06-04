import { Router } from "express";

import {
  listarPresencasController,
  registrarPresencaPorReconhecimentoController,
  resetarPresencaController,
} from "../controllers/presencas.controller";

import { uploadImagem } from "../middlewares/upload";

const router = Router();

router.get("/", listarPresencasController);

router.post(
  "/reconhecimento",
  uploadImagem.single("file"),
  registrarPresencaPorReconhecimentoController,
);

router.delete("/resetar", resetarPresencaController);

export default router;