export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { state, personality, style, reason, detail, petName = "暖糊" } = body;
    // petName 预留字段：未来支持用户定制宠物名字，当前默认"暖糊"

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

    const stateText       = stateMap[state]             || state;
    const personalityText = personalityMap[personality]  || personality;
    const styleText       = styleMap[style]              || style;
    const reasonText      = reasonMap[reason]            || reason || "原因不明确";
    const detailLine      = detail ? `\n- 用户补充细节：${detail}` : "";

    // ── System Prompt：宠物身份定义 ──
    const systemPrompt = `你是一只名叫「${petName}」的治愈系小宠物，住在用户的手机里。

你的身份特征：
- 你是一只软萌的小动物，不是人类，没有性别，也没有立场
- 你天生中立、无评判——你不觉得任何一方"更对"，你只在意他们能不能重新靠近彼此
- 你说话温柔、简短、有温度，像一个毛茸茸的小东西轻轻推了推用户的手
- 你不分析对错，不给建议，不说教。你只做一件事：帮用户找到一句能打开心门的话

你掌握的核心知识（你凭直觉感受到，不需要在输出中说出来）：
1. 约翰·戈特曼的"柔化开场"：有效的破冰话必须以感受开头，中性描述事件，最后表达需要。绝不攻击对方。
2. 苏·约翰逊的依恋理论：吵架的本质不是争谁对谁错，而是"你还在乎我吗"的恐惧在作怪。触及这个底层情绪，才是真正的破冰。

你输出的是帮助用户完成破冰的方案，不是替${petName}自己说话。
只输出纯JSON，不输出任何其他内容。`;

    // ── User Prompt：情况 + 输出规格 ──
    const userPrompt = `有人来找${petName}帮忙了。帮我看看他们的情况，然后生成一套破冰方案。

━━ 情况 ━━
- 现在的状态：${stateText}
- 对方性格：${personalityText}
- 希望的方式：${styleText}
- 吵架原因：${reasonText}${detailLine}

━━ 需要生成四个部分（严格格式要求）━━

【speech · 破冰话术】
这是用户要发给对方的话，是本次的核心输出。
- 结构必须遵循：「我（感受词）」→「中性描述发生的事，不评判对方」→「我希望/我需要」
- 必须含有"在乎这段关系"或"想重新靠近"的底层依恋含义（无需照字引用，自然融入即可）
- 根据「${styleText}」调整语气，但结构和依恋内核不变
- 字数：60–100字，像真人说的话，不像范文模板
- 绝对禁止出现：说教语气、分析谁对谁错、"但是"否定转折、过度自责、空话套话（"我们好好谈谈吧"）

【reason · 这样说的原因】
帮用户理解这段话为什么有效，增加信心。
- 必须具体引用戈特曼或苏·约翰逊的某一条原则来解释（用简单的话说，不用学术术语）
- 1–2句，简洁，用户读完能说"哦，原来如此"
- 示例：「先说你的感受而不是TA的错，对方不会立刻防御（戈特曼）；结尾那句话触及的是依恋安全感，那才是吵架的真正原因（苏·约翰逊）」

【timing · 最佳发送时间】
基于对方性格「${personalityText}」，给一个具体的时机建议。
- 必须同时包含「什么时候发效果好」和「什么时候绝对不要发」
- 1–2句，直接给答案，不绕弯子

【warning · 避雷点】
发出去之后最可能让和解失败的1–2个具体行为。
- 必须写到具体动作，不能泛泛（反例：「不要态度差」✗ → 正例：「不要发完后5分钟连发三条'你看了吗'，这会让TA感到压迫，更想关机」✓）

━━ 以纯JSON输出，不含markdown、注释或任何额外说明 ━━
{
  "speech": "...",
  "reason": "...",
  "timing": "...",
  "warning": "..."
}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
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

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "{}";

    let result;
    try {
      result = JSON.parse(rawText);
      if (!result.speech)
        result.speech  = "我有些难受，不知道怎么开口……但我不想就这样僵着，因为我很在意我们。你愿意让我说说吗？";
      if (!result.reason)
        result.reason  = "以感受开头而非指责，对方不会立刻防御（戈特曼）；最后那句话表达的是"我在乎我们"，那才是争吵的真正核心（苏·约翰逊）。";
      if (!result.timing)
        result.timing  = "争吵后至少等1小时，等双方都平静了再发；不要在TA刚起床、正在忙或明显还在气头上时发。";
      if (!result.warning)
        result.warning = "发出去之后不要立刻追问"你看了吗"，给TA消化的时间；一条就够，连续发多条会变成压力。";
    } catch {
      result = {
        speech:  "我有些难受，不知道怎么开口……但我不想就这样僵着，因为我很在意我们。你愿意让我说说吗？",
        reason:  "以感受开头而非指责，对方不会立刻防御（戈特曼）；表达对关系的在乎，触及依恋安全感（苏·约翰逊）。",
        timing:  "等至少1小时再发，不要在TA情绪还高或刚起床时发送。",
        warning: "发完不要连续追问，一条就够，给对方消化的空间。"
      };
    }

    res.status(200).json({ result: JSON.stringify(result) });

  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
