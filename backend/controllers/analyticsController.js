import { getAnalyticsOverview } from "../services/analyticsService.js";

export const getOverview = async (req, res, next) => {
  try {
    const overview = await getAnalyticsOverview();
    res.status(200).json(overview);
  } catch (error) {
    next(error);
  }
};
