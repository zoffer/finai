import { defineMcpHandler } from "@nuxtjs/mcp-toolkit/server";

export default defineMcpHandler({
    name: "FinAI MCP Server",
    route: "/mcp",
    browserRedirect: "/",
});
