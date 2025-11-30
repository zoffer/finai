// API接口：获取股票列表
import type { H3Event } from "h3";
import { AKTOOLS } from "~~/server/utils/aktools";

export default defineApiEventHandler(async (event: H3Event) => {
  // 使用Nuxt推荐的方式获取环境变量
  try {
    return await AKTOOLS.stock_info_a_code_name();
  } catch (error) {
    return new ApiError({
      code: "get_stock_error",
      message: "获取股票失败"
    });
  }
});