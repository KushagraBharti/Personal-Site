import { Router } from "express";
import publicRoutes from "./public";
import privateRoutes from "./private";

const router = Router();

router.use("/api", publicRoutes);
router.use("/api/private", privateRoutes);

export default router;
