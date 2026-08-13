import { useState, type FormEvent } from "react";
import { validateMessageContent } from "@chat-x/shared";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    const validationError = validateMessageContent(trimmed);
    if (validationError) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setContent("");
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
        onChange={(e) => setContent(e.target.value)}
        disabled={sending}
        autoFocus
      />
      <button type="submit" disabled={sending || !content.trim()}>
        Send
      </button>
    </form>
  );
}
