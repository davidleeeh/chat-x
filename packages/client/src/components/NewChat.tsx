import { useState, type FormEvent } from "react";

interface NewChatProps {
  onStart: (username: string) => Promise<void>;
}

export function NewChat({ onStart }: NewChatProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setError("");
    setSubmitting(true);
    try {
      await onStart(trimmed);
      setUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start chat");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-chat">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !username.trim()}>
          Chat
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
