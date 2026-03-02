export default async function handler(req, res) {
  try {
    // ⭐ Vercel 必须用 req.json() 来解析 body
    const body = await req.json();
    const { state, personality, style } = body;

    const prompt = `
你是一个情侣和解专家暖糊。

用户状态：${state}
对方性格：${personality}
期望方式：${style}

请生成一段：
真诚、不说教、给台阶的破冰话
控制在100字以内
`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    res.status(200).json({
      result: data.choices?.[0]?.message?.content || "生成失败，请稍后再试"
    });

  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
