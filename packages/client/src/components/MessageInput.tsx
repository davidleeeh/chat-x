import { useState, type FormEvent } from "react";
import { validateMessageContent } from "@chat-x/shared";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  onTypingChange: (isTyping: boolean) => Promise<void>;
}

export function MessageInput({ onSend, onTypingChange }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleChange = async (newContent: string) => {
    const oldContent = content;

    setContent(newContent);

    if (newContent === oldContent) return;
    if (oldContent === "" && newContent !== "") return await onTypingChange(true);
    if (oldContent !== "" && newContent === "") return await onTypingChange(false);
    return;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    const validationError = validateMessageContent(trimmed);
    if (validationError) return;

    setSending(true);
    try {
      await onSend(trimmed);
      handleChange("");
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message..."
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        disabled={sending}
        autoFocus
      />
      <button type="submit" disabled={sending || !content.trim()}>
        Send
      </button>
    </form>
  );
}
