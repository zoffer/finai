// API接口：获取股票列表
import type { H3Event } from "h3";
import { AKTOOLS } from "~~/server/utils/aktools";

export default defineApiEventHandler(async (event: H3Event) => {
  try {
    return await AKTOOLS.list();
  } catch (error) {
    return new ApiError({
      code: "get_stock_error",
      message: "获取股票失败"
    });
  }
});