export type Notification = {
  receiptId?: number;
  body?: {
    typeWebhook?: string;
    timestamp?: number;
    idMessage?: string;
    senderData?: {
      chatId?: string;
      chatName?: string;
      senderName?: string;
      senderPhoneNumber?: number | string;
    };
    messageData?: {
      typeMessage?: string;
      textMessageData?: { textMessage?: string };
    };
  };
};
