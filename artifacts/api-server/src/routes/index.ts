import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leaderboardRouter from "./leaderboard";
import mapGameRouter from "./mapGame";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leaderboardRouter);
router.use(mapGameRouter);

export default router;
