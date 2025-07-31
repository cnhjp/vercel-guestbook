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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理CORS预检请求
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "POST") {
    try {
      const { type, content, fingerprint } = req.body;
      let entry;

      if (!fingerprint) {
        return res.status(400).json({ error: "Fingerprint is required" });
      }

      if (type === "click") {
        entry = { type: "click", timestamp: new Date().toISOString(), fingerprint };
      } else if (type === "message" && content) {
        entry = {
          type: "message",
          content: content,
          timestamp: new Date().toISOString(),
          fingerprint,
        };
      } else {
        return res.status(400).json({ error: "Invalid request body" });
      }

      // 将新条目推送到列表的头部，@upstash/redis 会自动处理对象的序列化
      await redis.lpush(REDIS_KEY, entry);

      res.status(201).json({ success: true, entry });
    } catch (error) {
      console.error("Redis error:", error);
      res.status(500).json({ error: "Failed to save entry" });
    }
  } else if (req.method === "GET") {
    try {
      // 获取列表中的所有条目
      const { fingerprint } = req.query;
      let entries = await redis.lrange(REDIS_KEY, 0, -1);

      // 如果提供了指纹查询参数，则进行筛选
      if (fingerprint) {
        entries = entries.filter((entry) => entry.fingerprint === fingerprint);
      }

      res.status(200).json(entries);
    } catch (error) {
      console.error("Redis error:", error);
      res.status(500).json({ error: "Failed to retrieve entries" });
    }
  } else if (req.method === "DELETE") {
    const { admin, action } = req.query;
    if (admin !== "1") {
      return res
        .status(403)
        .json({ error: "Forbidden: Administrator access required." });
    }
    try {
      const { entry, fingerprint } = req.body;

      // 1. 删除全部
      if (action === "delete_all") {
        await redis.del(REDIS_KEY);
        return res
          .status(200)
          .json({ success: true, message: "All entries deleted." });
      }

      // 2. 根据指纹删除
      if (fingerprint && typeof fingerprint === "string") {
        const allEntries = await redis.lrange(REDIS_KEY, 0, -1);
        const tx = redis.multi();
        let removedCount = 0;
        for (const entry of allEntries) {
          if (entry.fingerprint === fingerprint) {
            tx.lrem(REDIS_KEY, 1, JSON.stringify(entry));
            removedCount++;
          }
        }
        if (removedCount > 0) {
          await tx.exec();
        }
        return res.status(200).json({ success: true, removedCount });
      }

      // 3. 删除单条记录 (保持原有功能)
      if (entry && typeof entry === "string") {
        const result = await redis.lrem(REDIS_KEY, 1, entry);
        return res.status(200).json({ success: true, removed: result > 0 });
      }

      return res.status(400).json({
        error:
          "Invalid delete request. Provide 'action=delete_all', a 'fingerprint', or an 'entry'.",
      });
    } catch (error) {
      console.error("Redis error:", error);
      res.status(500).json({ error: "Failed to delete entry" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
