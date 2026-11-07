import express from "express";
import {
  getComponents,
  createComponent,
  updateComponent,
  deleteComponent,
} from "../controllers/componentController.js";

const router = express.Router();

router.get("/", getComponents);
router.post("/", createComponent);
router.put("/:id", updateComponent);
router.delete("/:id", deleteComponent);

export default router;
