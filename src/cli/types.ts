export type MessageType = 'user' | 'assistant' | 'error' | 'shell' | 'system';

export type Message = {
  id: number;
  type: MessageType;
  text: string;
};
