export type MessageType = 'user' | 'assistant' | 'error';

export type Message = {
  id: number;
  type: MessageType;
  text: string;
};
