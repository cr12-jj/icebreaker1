// Vercel serverless function 超时配置（延长到 25 秒，避免 DeepSeek 响应慢导致崩溃）
export const maxDuration = 25;

export default async function handler(req, res) {

  // ── 只接受 POST ──
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 兜底默认响应（API 完全失败时使用）──
  const FALLBACK = {
    speech:  "我有些难受，不知道怎么开口……但我不想就这样僵着，因为我很在意我们。你愿意让我说说吗？",
    reason:  "以感受开头而非指责，对方不会立刻防御（戈特曼）；表达对关系的在乎，触及依恋安全感（苏·约翰逊）。",
    timing:  "争吵后至少等 1 小时再发，不要在 TA 情绪还高或刚起床时发送。",
    warning: "发完不要连续追问，一条就够，给对方消化的空间。"
  };

  try {
    // ── 解析请求体 ──
    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const {
      state       = '',
      personality = '',
      style       = '',
      reason      = '',
      detail      = '',
      petName     = '暖糊'
    } = body || {};

    // ── 参数映射 ──
    const stateMap = {
      coldwar:  "双方陷入冷战，都在沉默中僵持",
      makeup:   "用户想主动打破僵局，重新开口",
      wrongsay: "用户说了不该说的话，想道歉修复",
      ignored:  "对方不回消息，用户不知道怎么接触"
    };
    const personalityMap = {
      softheart: "心软型——真诚的表达容易打动TA，但TA也需要感受到被尊重",
      gentle:    "吃软不吃硬——讲道理会让TA更抵触，温柔和耐心比逻辑更管用",
      rational:  "理性型——TA需要清晰、不情绪化的表达，混乱的情绪会让TA关闭",
      sensitive: "情绪敏感型——TA很容易感受到被否定或被忽视，措辞要格外轻柔"
    };
    const styleMap = {
      sincere: "真诚道歉，直接承认自己哪里做得不够好",
      cute:    "撒娇求和，用可爱和柔软软化气氛",
      humor:   "轻松幽默，用一点玩笑感化解尴尬，但不失真诚",
      step:    "给对方一个台阶，让TA能自然顺坡下驴接受和解"
    };
    const reasonMap = {
      "家务分工": "家务分配不均引发的矛盾",
      "钱的问题": "消费观或财务安排上的摩擦",
      "说话方式": "言语方式或语气造成了伤害",
      "时间陪伴": "对陪伴时间或质量的期待不一致",
      "吃醋信任": "因嫉妒或信任问题引起的争执",
      "习惯性格": "生活习惯或性格差异带来的摩擦",
      "家人问题": "涉及双方家人的矛盾",
      "说不清楚": "具体原因不明确，整体情绪紧张"
    };

    const stateText       = stateMap[state]            || state       || "状态不明";
    const personalityText = personalityMap[personality] || personality || "性格不明";
    const styleText       = styleMap[style]             || style       || "方式不明";
    const reasonText      = reasonMap[reason]           || reason      || "原因不明确";
    const detailLine      = detail ? `\n- 用户补充细节：${detail}` : "";

    // ── Prompt ──
    // 注意：DeepSeek json_object 模式要求 prompt 里必须出现 "json" 字样
    const systemPrompt = `你是一只名叫「${petName}」的治愈系小宠物，住在用户的手机里。

身份特征：
- 你是小动物，不是人类，没有性别，没有立场，天然中立、无评判
- 你只做一件事：帮用户找到一句能打开心门的话，让两个人重新靠近
- 你说话温柔、简短，像毛茸茸的小东西轻轻推了推用户的手

你掌握的知识（凭直觉感受到，不需要在回答里说出来）：
1. 戈特曼"柔化开场"：以感受开头，中性描述事件，表达需要；绝不攻击对方
2. 苏·约翰逊依恋理论：争吵本质是"你还在乎我吗"的恐惧，触及这一点才是真正破冰

请严格按照要求输出 JSON 格式的回答。`;

    const userPrompt = `有人来找${petName}帮忙了，请根据以下情况生成破冰方案，输出为 JSON 格式。

【情况】
- 状态：${stateText}
- 对方性格：${personalityText}
- 期望方式：${styleText}
- 吵架原因：${reasonText}${detailLine}

【输出要求】请生成以下四个字段的 JSON：

speech（破冰话术）：
- 结构：「我（感受词）」→「中性描述事件，不评判对方」→「我希望/我需要」
- 必须含有"在乎这段关系"或"想重新靠近"的依恋含义，自然融入
- 根据"${styleText}"调整语气，结构不变
- 60–100字，像真人说话，不像模板
- 禁止：说教、分析对错、"但是"否定转折、过度自责、空话套话

reason（这样说的原因）：
- 引用戈特曼或苏·约翰逊的具体原则解释为何有效
- 1–2句，说人话，不用术语

timing（最佳发送时间）：
- 基于对方性格给出具体建议
- 必须同时包含"什么时候发更好"和"什么时候不要发"
- 1–2句

warning（避雷点）：
- 1–2条发出去后最可能让和解失败的具体行为
- 必须具体到动作，不能泛泛而谈

请输出纯 JSON，格式如下，不要有任何其他内容：
{"speech":"...","reason":"...","timing":"...","warning":"..."}`;

    // ── 调用 DeepSeek API ──
    let apiResponse;
    try {
      apiResponse = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt   }
          ],
          response_format: { type: "json_object" },
          temperature: 0.72,
          max_tokens: 700
        })
      });
    } catch (fetchErr) {
      // 网络层错误（DNS、连接超时等），直接返回兜底
      console.error("Fetch error:", fetchErr.message);
      return res.status(200).json({ result: JSON.stringify(FALLBACK) });
    }

    // ── 解析 API 响应 ──
    let apiData;
    try {
      apiData = await apiResponse.json();
    } catch {
      console.error("API response not JSON, status:", apiResponse.status);
      return res.status(200).json({ result: JSON.stringify(FALLBACK) });
    }

    // ── 检查 API 层错误（400 / 401 / 422 / 500 等）──
    if (!apiResponse.ok || apiData.error) {
      console.error("DeepSeek API error:", JSON.stringify(apiData.error || apiData));
      return res.status(200).json({ result: JSON.stringify(FALLBACK) });
    }

    // ── 提取 content ──
    const rawContent = apiData?.choices?.[0]?.message?.content || "";

    if (!rawContent || rawContent.trim() === "") {
      // DeepSeek 偶尔返回空 content，官方已知问题
      console.error("DeepSeek returned empty content");
      return res.status(200).json({ result: JSON.stringify(FALLBACK) });
    }

    // ── 解析 JSON（多层兜底）──
    let result;

    // 尝试 1：直接解析
    try {
      result = JSON.parse(rawContent);
    } catch {
      // 尝试 2：提取第一个 {...} 块（模型有时会在 JSON 外多输出文字）
      try {
        const match = rawContent.match(/\{[\s\S]*\}/);
        if (match) {
          result = JSON.parse(match[0]);
        }
      } catch {
        result = null;
      }
    }

    // 尝试 3：彻底失败，使用兜底
    if (!result || typeof result !== 'object') {
      console.error("JSON parse failed, raw content:", rawContent.slice(0, 200));
      return res.status(200).json({ result: JSON.stringify(FALLBACK) });
    }

    // ── 字段补全兜底 ──
    if (!result.speech)  result.speech  = FALLBACK.speech;
    if (!result.reason)  result.reason  = FALLBACK.reason;
    if (!result.timing)  result.timing  = FALLBACK.timing;
    if (!result.warning) result.warning = FALLBACK.warning;

    return res.status(200).json({ result: JSON.stringify(result) });

  } catch (unexpectedErr) {
    // 最外层兜底：任何意外错误都不让 function 崩溃
    console.error("Unexpected error:", unexpectedErr.message, unexpectedErr.stack);
    return res.status(200).json({ result: JSON.stringify({
      speech:  "我有些难受，不知道怎么开口……但我不想就这样僵着，因为我很在意我们。你愿意让我说说吗？",
      reason:  "以感受开头而非指责，对方不会立刻防御；表达对关系的在乎，触及依恋安全感。",
      timing:  "争吵后至少等 1 小时再发，不要在 TA 情绪还高或刚起床时发送。",
      warning: "发完不要连续追问，一条就够，给对方消化的空间。"
    })});
  }
}
