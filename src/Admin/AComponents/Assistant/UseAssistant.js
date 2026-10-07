import { useState, useEffect, useCallback, useRef } from 'react';

const MAX_STORED_MESSAGES = 50;
const STORAGE_VERSION = 1;

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

export default function useAssistant() {   // ← lowercase 'use'
  const userId = readUserId();
  const [messages, setMessages] = useState(() => loadHistory(userId));
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    saveHistory(userId, messages);
  }, [messages, userId]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const ask = useCallback(async (question) => {
    const text = (question || '').trim();
    if (!text) return;

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
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/admin/assistant/ask`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${readToken()}`,
          },
          body: JSON.stringify({ question: text }),
          signal: controller.signal,
        }
      );
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
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Connection error. Please try again.');
      }
    } finally {
      setIsAsking(false);
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