import { useState, useEffect, useCallback, useRef } from 'react';

const MAX_STORED_MESSAGES = 50;
const STORAGE_VERSION = 1;
const HISTORY_TURNS = 6; // how many earlier messages are sent with each question

const storageKey = (userId) =>
  `axispt_assistant_history_v${STORAGE_VERSION}_${userId || 'anon'}`;

function loadHistory(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORAGE_VERSION) return [];
    return Array.isArray(parsed.messages) ? parsed.messages : [];
  } catch {
    return [];
  }
}

function saveHistory(userId, messages) {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({
        version: STORAGE_VERSION,
        messages: messages.slice(-MAX_STORED_MESSAGES),
      })
    );
  } catch {
    // quota exceeded or private mode — ignore
  }
}

function readToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
}

function readUserId() {
  try {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user_id || parsed?.id || null;
  } catch {
    return null;
  }
}

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

export default function useAssistant() {
  const userId = readUserId();
  const [messages, setMessages] = useState(() => loadHistory(userId));
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // Always holds the latest messages so `ask` can stay stable (empty deps).
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    saveHistory(userId, messages);
  }, [messages, userId]);

  // NOTE: deliberately no abort-on-unmount cleanup. React StrictMode simulates
  // an unmount right after mount in development, which cancelled the request
  // started by the dashboard "Ask a follow-up" button. A request is now only
  // aborted when a newer ask replaces it.

  const ask = useCallback(async (question) => {
    const text = (question || '').trim();
    if (!text) return;

    // Earlier turns only (taken before the new question is added).
    const history = messagesRef.current
      .slice(-HISTORY_TURNS)
      .map(({ role, text: t }) => ({ role, text: t }));

    setError(null);
    setMessages((m) => [
      ...m,
      { id: nextId(), role: 'user', text, createdAt: Date.now() },
    ]);
    setIsAsking(true);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const role = sessionStorage.getItem('role') || localStorage.getItem('role');
      const endpoint = role === 'student'
        ? `${process.env.REACT_APP_API_URL}/student/assistant/ask`
        : `${process.env.REACT_APP_API_URL}/admin/assistant/ask`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${readToken()}`,
        },
        body: JSON.stringify({ question: text, history }),
        signal: controller.signal,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to get a response.');
        return;
      }

      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: 'assistant',
          text: data.data.answer,
          sources: data.data.sources || [],
          refused: !!data.data.refused,
          liveData: data.data.liveData,
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Connection error. Please try again.');
      }
    } finally {
      // Only the newest request may clear the spinner.
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsAsking(false);
      }
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(storageKey(userId));
    } catch {}
  }, [userId]);

  return { messages, isAsking, error, ask, clearHistory };
}