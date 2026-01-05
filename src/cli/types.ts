export type MessageType = 'user' | 'assistant' | 'error' | 'shell';

export type Message = {
  id: number;
  type: MessageType;
  text: string;
};
