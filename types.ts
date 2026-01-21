export enum SectName {
  ChunYang = "纯阳",
  WanHua = "万花",
  ShaoLin = "少林",
  // Fixed: Renamed 'Qi Xiu' to 'QiXiu' to be a valid identifier
  QiXiu = "七秀",
  TianCe = "天策",
  CangJian = "藏剑",
  WuDu = "五毒",
  TangMen = "唐门",
  MingJiao = "明教",
  GaiBang = "丐帮",
  CangYun = "苍云",
  ChangGe = "长歌",
  BaDao = "霸刀",
  PengLai = "蓬莱",
  LingXue = "凌雪阁",
  YanTian = "衍天宗",
  YaoZong = "北天药宗",
  DaoZong = "刀宗",
  WanLing = "万灵山庄"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
  timestamp: number;
}

export interface SectAnalysis {
  name: string;
  description: string;
  stats: {
    attack: number;
    defense: number;
    support: number;
    mobility: number;
    difficulty: number;
  };
  poem?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}