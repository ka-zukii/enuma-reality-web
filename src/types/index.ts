export type PlayerStatus = "LIVE" | "PAGI" | "STANDUP" | "ISTIRAHAT" | "TAMU";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

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

export interface RemotePlayer {
  socketId: string;
  userId: string;
  fullName: string;
  avatarConfig?: { color?: string };
  position: [number, number, number];
  rotationY: number;
  animation: "idle" | "walk";
  zone: string;
  role: MemberRole;
  jobTitle: string | null;
  status: PlayerStatus;
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
  onlineCount?: number;
  maxCapacity?: number;
  /** Jumlah member terdaftar, dari Prisma `_count` */
  _count?: { members: number };
  rooms: WorkspaceRoom[];
}
