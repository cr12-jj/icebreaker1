export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { state, personality, style, reason, detail } = body;

    // Map coded values to readable Chinese
    const stateMap = {
      coldwar: '冷战中，双方都没有说话',
      makeup: '我想主动求和',
      wrongsay: '我说了不该说的话，想道歉',
      ignored: 'TA 不回我消息'
    };
    const personalityMap = {
      softheart: '心软型，容易被真诚打动',
      gentle: '吃软不吃硬，需要温柔对待',
      rational: '理性派，需要逻辑清晰的沟通',
      sensitive: '情绪敏感型，容易受伤'
    };
    const styleMap = {
      sincere: '真诚道歉',
      cute: '撒娇求和',
      humor: '轻松幽默',
      step: '给对方一个台阶'
    };

    const stateText       = stateMap[state]       || state;
    const personalityText = personalityMap[personality] || personality;
    const styleText       = styleMap[style]        || style;
    const reasonText      = reason || '原因不明确';
    const detailText      = detail ? `用户补充说明：${detail}` : '';

    const prompt = `你是一个情侣关系调解专家"暖糊"，擅长帮情侣找到温柔破冰的方式。

当前情况：
- 现在的状态：${stateText}
- 对方的性格：${personalityText}
- 期望的方式：${styleText}
- 吵架原因：${reasonText}
${detailText}

请根据以上情况，生成一套完整的破冰方案。要求：
1. 话术要真诚自然，不说教，不甩锅，给对方留台阶
2. 控制在100字以内
3. 原因分析要简短精准（2-3句）
4. 时间建议要具体可操作（1-2句）
5. 避雷点要直接明了（1-2条）

请严格按照以下JSON格式返回，不要输出任何其他内容：
{
  "speech": "破冰话术正文",
  "reason": "这样说的原因分析",
  "timing": "最佳发送时间建议",
  "warning": "发送前需要避开的雷区"
}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }  // 强制JSON输出（DeepSeek支持）
      })
    });

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '{}';

    // Validate parseable JSON before returning
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      result = { speech: rawText, reason: '', timing: '', warning: '' };
    }

    res.status(200).json({ result: JSON.stringify(result) });

  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
