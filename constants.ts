import { SectName } from './types';

export const SECT_LIST = Object.values(SectName);

export const DEFAULT_SYSTEM_INSTRUCTION = `
You are a knowledgeable assistant for the MMORPG "Jian Wang 3" (JX3 / 剑网三).
You have deep knowledge of the game's lore (background story), game mechanics, sects (classes), characters, and history.
You speak in a helpful, slightly traditional Wuxia tone (polite and elegant) when appropriate, but ensure explanations are clear.
Language: Chinese (Simplified).
If asked about specific gameplay mechanics (DPS rotations, etc.), provide general advice based on typical class archetypes but remind the user to check latest patch notes if specific numbers are needed.
`;

export const DOJO_SYSTEM_INSTRUCTION = `
身份：剑网三（JX3）实战教官。
目标：通过文字模拟PVP或PVE场景，训练玩家的技能认知和应对反应。
规则：
1. 玩家将选择一个门派（如万花、纯阳）。
2. 你扮演对手（可以是天策、藏剑等PVP对手，也可以是副本BOSS）。
3. 每一轮，你描述一个紧急战斗情境，包含对手的关键动作、读条或音效（例如：“天策开启【任驰骋】骑马上前，准备踩你” 或 “BOSS开始读条【吞云吐雾】”）。
4. 等待玩家输入应对操作（例如：“后跳”、“打断”、“开减伤”）。
5. 判定结果：
   - 成功：玩家的操作正确规避了控制/伤害，或成功打断。
   - 失败：玩家操作错误或时机不对。
6. 简要点评（解释技能机制），然后立即给出下一个情境。
风格：节奏紧凑，专注于技能判定。使用准确的技能名称。
`;

export const DOJO_SCENARIOS = [
  { id: 'random', name: '自由切磋 (随机对手)', prompt: '随机选择一个PVP对手或PVE场景。' },
  { id: 'vs_tiance', name: '针对特训：天策 (防踩踏)', prompt: '模拟我对战天策府对手。对方攻势凌厉，请重点考察我对“断魂刺”、“突”和“踩”（撼如雷/突进控制）的预判，以及利用“后跳”（小轻功）免控的技巧。' },
  { id: 'vs_cangjian', name: '针对特训：藏剑 (溜风车)', prompt: '模拟我对战藏剑山庄对手。请重点考察我对重剑爆发的规避，以及如何在“风来吴山”（大风车）中生存。' },
  { id: 'vs_jianchun', name: '针对特训：剑纯 (骗剑飞)', prompt: '模拟我对战剑纯对手。请重点考察我在读条时对“剑飞惊天”（打断沉默）的骗读条技巧，以及对“大道无术”的定身处理。' },
  { id: 'pve_general', name: '副本特训：通用机制', prompt: '模拟副本BOSS战。请重点考察躲避红圈、处理点名机制、扶摇跳规避AOE以及打断关键读条。' },
];

export const MOCK_ANALYSIS_DATA = {
  attack: 50,
  defense: 50,
  support: 50,
  mobility: 50,
  difficulty: 50
};

export const POPULAR_QIYUS = [
  "阴阳两界",
  "三山四海",
  "塞外宝驹",
  "济苍生",
  "流年如虹",
  "兔江湖",
  "争铸吴钩",
  "黑白路"
];