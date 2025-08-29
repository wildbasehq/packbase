import { t } from 'elysia';

// Valid message types enum
export const MESSAGE_TYPES = {
  TEXT: 'text',
  // Future types can be added here:
  // IMAGE: 'image',
  // FILE: 'file',
  // SYSTEM: 'system',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// Array of valid message types for validation
export const VALID_MESSAGE_TYPES = Object.values(MESSAGE_TYPES);

// Message type validation schema
export const MessageTypeSchema = t.Union([
  t.Literal(MESSAGE_TYPES.TEXT),
  // Add future message types here
]);

// Request body schema for creating messages
export const CreateMessageBody = t.Object({
  content: t.String({ minLength: 1, maxLength: 4000 }),
  message_type: t.Optional(MessageTypeSchema),
  reply_to: t.Optional(t.String({ format: 'uuid' })),
});

// Validation utility functions
export const validateMessageType = (messageType: string): boolean => {
  return VALID_MESSAGE_TYPES.includes(messageType as MessageType);
};

export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};