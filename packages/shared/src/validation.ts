import { USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_PATTERN, MESSAGE_MAX_LENGTH } from './constants.js';

export function validateUsername(username: string): string | null {
  if (username.length < USERNAME_MIN_LENGTH) return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
  if (username.length > USERNAME_MAX_LENGTH) return `Username must be at most ${USERNAME_MAX_LENGTH} characters`;
  if (!USERNAME_PATTERN.test(username)) return 'Username can only contain letters, numbers, and underscores';
  return null;
}

export function validateMessageContent(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length === 0) return 'Message cannot be empty';
  if (trimmed.length > MESSAGE_MAX_LENGTH) return `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters`;
  return null;
}
