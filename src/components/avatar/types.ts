import { type RefObject } from "react";
import { type PlayerTickData } from "@/hooks/useOfficeSocket";
import { type MemberRole, type PlayerStatus } from "@/types";

export interface Avatar3DProps {
  userId: string;
  fullName: string;
  color?: string;
  avatarId?: string | null;
  initialPosition: [number, number, number];
  isLocal?: boolean;
  localStateRef?: RefObject<PlayerTickData>;
  remoteTicksRef?: RefObject<Record<string, PlayerTickData>>;
  bubbleMessage?: string | null;
  isFirstPerson?: boolean;
  role?: MemberRole | null;
  jobTitle?: string | null;
  status?: PlayerStatus | null;
}
