export type ChatMessage = {
  id: string;
  text: string;
  direction: "outgoing" | "incoming";
  timestamp: number;
  status?: string;
};

export type Chat = {
  phone: string;
  chatId: string;
  name: string;
  messages: ChatMessage[];
};
