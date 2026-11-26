export type PlayerStatus =
  | "LIVE"
  | "PAGI"
  | "SORE"
  | "MALAM"
  | "STANDUP"
  | "ISTIRAHAT";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

/** Sinkron dengan server. "reconnecting": socket putus, avatar ditahan server (grace period). */
export type ConnectionState = "connected" | "reconnecting";

export interface ChatMessage {
  id: string;
  channel: "PROXIMITY" | "GLOBAL" | "PRIVATE";
  senderId: string;
  senderName: string;
  receiverId?: string;
  receiverName?: string;
  content: string;
  createdAt?: string;
}

/** Penumpang trem: posisi lokal di dalam kabin. null jika tidak sedang naik. */
export interface RideState {
  rx: number;
  rz: number;
}

export interface RemotePlayer {
  ride?: RideState | null;
  socketId: string;
  userId: string;
  fullName: string;
  /** `character` berisi id avatar, mis. "male_1" atau "karakter_1" */
  avatarConfig?: { color?: string; character?: string };
  position: [number, number, number];
  rotationY: number;
  animation: "idle" | "walk" | "sit";
  zone: string;
  role: MemberRole;
  jobTitle: string | null;
  status: PlayerStatus;
  connectionState?: ConnectionState;
}

export interface WorkspaceRoom {
  id: string;
  name: string;
  mapTemplate: string;
  buildingKey?: string | null;
}

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  /** Hanya dikirim server untuk member */
  inviteCode?: string;
  isAuto?: boolean;
  /** Pemain online dan kursi yang sedang dicadangkan */
  onlineCount?: number;
  maxCapacity?: number;
  /** Jumlah member terdaftar (termasuk yang sedang offline), dari Prisma `_count` */
  _count?: { members: number };
  rooms: WorkspaceRoom[];
}
