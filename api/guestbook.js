import { Redis } from "@upstash/redis";

// 从环境变量中初始化 Redis 客户端
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const REDIS_KEY = "guestbook_entries";

export default async function handler(req, res) {
  // 为CORS设置响应头，允许跨域请求
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理CORS预检请求
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "POST") {
    try {
      const { type, content } = req.body;
      let entry;

      if (type === "click") {
        entry = { type: "click", timestamp: new Date().toISOString() };
      } else if (type === "message" && content) {
        entry = {
          type: "message",
          content: content,
          timestamp: new Date().toISOString(),
        };
      } else {
        return res.status(400).json({ error: "Invalid request body" });
      }

      // 将新条目推送到列表的头部
      await redis.lpush(REDIS_KEY, JSON.stringify(entry));

      res.status(201).json({ success: true, entry });
    } catch (error) {
      console.error("Redis error:", error);
      res.status(500).json({ error: "Failed to save entry" });
    }
  } else if (req.method === "GET") {
    try {
      // 获取列表中的所有条目
      const entries = await redis.lrange(REDIS_KEY, 0, -1);
      res.status(200).json(entries);
    } catch (error) {
      console.error("Redis error:", error);
      res.status(500).json({ error: "Failed to retrieve entries" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
