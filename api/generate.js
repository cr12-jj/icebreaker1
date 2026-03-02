export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { state, personality, style, reason, detail } = body;

    // ── 参数映射 ──
    const stateMap = {
      coldwar:  "双方陷入冷战，都在沉默中僵持",
      makeup:   "我想主动打破僵局，重新开口",
      wrongsay: "我说了不该说的话，想道歉修复",
      ignored:  "对方不回消息，我不知道怎么接触"
    };
    const personalityMap = {
      softheart: "心软型，真诚容易打动TA",
      gentle:    "吃软不吃硬，需要温柔而非道理",
      rational:  "理性型，需要清晰表达而非情绪化",
      sensitive: "情绪敏感型，很容易感受到被否定或忽视"
    };
    const styleMap = {
      sincere: "真诚道歉，承认自己的问题",
      cute:    "撒娇求和，用可爱软化气氛",
      humor:   "轻松幽默，用玩笑化解尴尬",
      step:    "给TA一个台阶，让TA能自然接受和解"
    };
    const reasonMap = {
      "家务分工": "家务分配不均引发的矛盾",
      "钱的问题": "消费观或财务安排的摩擦",
      "说话方式": "言语方式或语气造成的伤害",
      "时间陪伴": "对陪伴时间或质量期待不一致",
      "吃醋信任": "嫉妒或信任问题引起的争执",
      "习惯性格": "生活习惯或性格差异带来的摩擦",
      "家人问题": "涉及双方家人的矛盾",
      "说不清楚": "具体原因不明确，整体情绪紧张"
    };

    const stateText       = stateMap[state]             || state;
    const personalityText = personalityMap[personality]  || personality;
    const styleText       = styleMap[style]              || style;
    const reasonText      = reasonMap[reason]            || reason || "原因不明确";
    const detailLine      = detail ? `\n- 用户补充：${detail}` : "";

    const prompt = `
你是一名专业的情侣关系修复顾问。你的方法论融合了两位心理学权威的核心研究：

━━ 理论框架 ━━

【约翰·戈特曼（John Gottman）】
- 40年实验室数据，能以91%准确率预测婚姻结局
- 核心工具"柔化开场"（Softened Startup）：话术结构必须是「我感受 + 中性描述事件（不评判人）+ 我需要」
- 明确禁止"四骑士"：批评（你总是/从不…）、蔑视（讽刺/翻白眼）、防御（反驳/甩锅）、冷漠（装死/消失）
- 修复尝试（Repair Attempt）：争吵中或之后放一个让关系软化的小信号，比"赢得争论"更重要

【苏·约翰逊（Sue Johnson）】
- 情绪聚焦疗法（EFT）创始人，《Hold Me Tight》作者
- 核心洞见：争吵的本质不是争对错，而是依恋危机——"你是否还在乎我？你会不会抛弃我？"
- 话术必须触及底层情绪（依恋恐惧、渴望连接），而非表层情绪（愤怒、委屈）
- 使用"脆弱性语言"：说"我怕我们越来越远"比说"你惹我生气了"有效十倍

━━ 当前情况 ━━
- 状态：${stateText}
- 对方性格：${personalityText}
- 期望方式：${styleText}
- 争吵原因：${reasonText}${detailLine}

━━ 输出要求（严格执行，违反则输出无效） ━━

【speech · 破冰话术】
- 结构遵循戈特曼公式：以"我（感受词）"开头 → 中性描述发生的事（不说"你怎样"） → 表达"我希望/我需要"
- 融入苏·约翰逊的依恋语言：必须含有"我在乎这段关系"或"我需要感受到我们还是一起的"的含义（不必照抄原话）
- 根据"${styleText}"调整语气和表达方式，但上述结构和依恋内核不变
- 字数：60–100字，像真人说话，不像模板，不像范文
- 绝对禁止：说教、分析谁对谁错、"但是"转折否定、过分自责、空洞套话（"我们好好谈谈吧"之类）

【reason · 这样说的原因】
- 用1-2句话解释这段话为什么有效，必须引用上述理论中的某个具体原则
- 说人话，不用专业术语，用户要能理解
- 示例格式："这句话先说了你的感受而不是TA的错（戈特曼：避免防御反应）；结尾表达了对这段关系的在意，而不是争论谁对谁错（苏·约翰逊：触及依恋需求）"

【timing · 最佳发送时间】
- 基于对方性格（${personalityText}）给出具体建议
- 必须包含两个判断："什么时候发更好"和"什么时候不要发"
- 1-2句，可操作，不废话

【warning · 避雷点】
- 列出1-2条最可能让这次和解失败的具体行为
- 必须具体到行动（错误示例："不要态度差" → 正确示例："不要发完之后5分钟内连续追问'你看了吗'，这会制造压力让TA更想逃"）

━━ 以纯JSON格式输出，不含任何markdown、注释或额外说明 ━━
{
  "speech": "...",
  "reason": "...",
  "timing": "...",
  "warning": "..."
}
`.trim();

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是专业情侣关系修复顾问，严格遵守用户给出的方法论框架和输出格式。只输出纯JSON，不输出任何其他内容。"
          },
          {
            role: "user",
            content: prompt
          }
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
      // 字段兜底
      if (!result.speech)  result.speech  = "我有些难受，不知道怎么开口。但我不想就这样僵着，因为我很在意我们。你愿意给我一个机会说说话吗？";
      if (!result.reason)  result.reason  = "这句话以感受开头而非指责，遵循戈特曼柔化开场原则；结尾表达了对这段关系的在乎，触及了苏·约翰逊所说的依恋需求核心。";
      if (!result.timing)  result.timing  = "建议争吵后至少等待1小时再发，对方情绪稍平复时效果最好；避免在TA正在忙碌或刚睡醒时发送。";
      if (!result.warning) result.warning = "发出去之后不要立刻追问'你看了吗'或'你还生气吗'，给TA消化的时间，耐心等待回应。";
    } catch {
      result = {
        speech:  "我有些难受，不知道怎么开口。但我不想就这样僵着，因为我很在意我们。你愿意给我一个机会说说话吗？",
        reason:  "以感受开头而非指责，避免对方防御；表达对关系的在乎，触及真正的矛盾核心——依恋安全感。",
        timing:  "建议争吵后等至少1小时再发，避免在对方忙碌或情绪仍高涨时发送。",
        warning: "发出去后不要连续追问，给对方消化的空间，一条就够。"
      };
    }

    res.status(200).json({ result: JSON.stringify(result) });

  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
