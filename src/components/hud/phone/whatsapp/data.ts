import type { ChatMessage, RemotePlayer } from "@/types";

interface WaMessage {
  fromMe: boolean;
  text: string;
  time: string;
}

export interface WaContact {
  id: string;
  name: string;
  role: string;
  color: string;
  messages: WaMessage[];
}

export const INITIAL_CONTACTS: WaContact[] = [
  {
    id: "tim-enuma",
    name: "Tim Enuma HQ",
    role: "Grup Kantor",
    color: "bg-blue-600",
    messages: [
      {
        fromMe: false,
        text: "Halo! Selamat datang di Enuma City.",
        time: "09:15",
      },
      {
        fromMe: false,
        text: "Standup jam 10.30 di gedung HQ ya.",
        time: "09:16",
      },
    ],
  },
  {
    id: "lunara",
    name: "Barista Lunara",
    role: "Lunara Cafe",
    color: "bg-amber-600",
    messages: [
      {
        fromMe: false,
        text: "Kopi susu gula aren baru ready nih!",
        time: "10:02",
      },
    ],
  },
  {
    id: "warung",
    name: "Warung Madura",
    role: "Buka 24 Jam",
    color: "bg-emerald-600",
    messages: [
      {
        fromMe: false,
        text: "Jajanan & minuman dingin lengkap kak.",
        time: "08:40",
      },
    ],
  },
];

export interface PhoneChatContext {
  currentUserId: string;
  messages: ChatMessage[];
  remotePlayers: RemotePlayer[];
  onSendMessage: (
    channel: "PROXIMITY" | "GLOBAL" | "PRIVATE",
    content: string,
    receiverId?: string,
  ) => void;
  onFocusInputChange?: (focused: boolean) => void;
}
