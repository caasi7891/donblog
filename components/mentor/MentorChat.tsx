'use client';

import { useState, useRef, useEffect } from 'react';
import MentorEvaluation from '@/components/mentor/MentorEvaluation';
import { useAuth } from '@/components/AuthProvider';
import type { ChatMessage, MentorResponse } from '@/lib/mentor';

type ChatTurn = { role: 'user' | 'assistant'; content: string; isInitial?: boolean };

type MentorChatProps = {
  reviewMarkdown: string;
  postSlug: string;
};

type Phase = 'idle' | 'loadingInitial' | 'chatting' | 'loadingFollowup' | 'disabled';

export default function MentorChat({ reviewMarkdown, postSlug }: MentorChatProps) {
  const { user } = useAuth();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const [phase, setPhase] = useState<Phase>('idle');
  const [initialEval, setInitialEval] = useState<{ markdown: string; warning?: string } | null>(null);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedInput, setFailedInput] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, phase]);

  // Auth gate: UX only (security gate is LOCAL_MENTOR_ENABLED on the server)
  if (!user || !adminEmail || user.email !== adminEmail) {
    return null;
  }

  async function handleInitialQuery() {
    setPhase('loadingInitial');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'query', reviewMarkdown }),
      });

      if (res.status === 404) {
        setPhase('disabled');
        return;
      }

      const data: MentorResponse = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.success === false ? data.error : '오류가 발생했습니다.';
        setErrorMsg(msg);
        setPhase('idle');
        return;
      }

      setInitialEval({ markdown: data.markdown, warning: data.warning });
      setMessages([{ role: 'assistant', content: data.markdown, isInitial: true }]);
      setPhase('chatting');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      setPhase('idle');
    }
  }

  async function handleSendFollowup(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userTurn: ChatTurn = { role: 'user', content: trimmed };
    const newMessages = [...messages, userTurn];
    setMessages(newMessages);
    setInputValue('');
    setPhase('loadingFollowup');
    setErrorMsg(null);
    setFailedInput(null);

    // Build API messages (exclude isInitial flag, convert to ChatMessage shape)
    const apiMessages: ChatMessage[] = newMessages
      .filter(m => !m.isInitial)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'query', reviewMarkdown, messages: apiMessages }),
      });

      if (res.status === 404) {
        setPhase('disabled');
        return;
      }

      const data: MentorResponse = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.success === false ? data.error : '오류가 발생했습니다.';
        setErrorMsg(msg);
        setFailedInput(trimmed);
        // Remove the user turn we optimistically added
        setMessages(prev => prev.slice(0, -1));
        setPhase('chatting');
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.markdown }]);
      setPhase('chatting');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      setFailedInput(trimmed);
      setMessages(prev => prev.slice(0, -1));
      setPhase('chatting');
    }
  }

  function handleRetry() {
    if (failedInput) {
      handleSendFollowup(failedInput);
    }
  }

  const isInFlight = phase === 'loadingInitial' || phase === 'loadingFollowup';
  const sendDisabled = isInFlight || inputValue.trim() === '';

  // --- IDLE STATE ---
  if (phase === 'idle') {
    return (
      <div className="mt-8 pt-8 border-t border-white/10">
        {errorMsg && (
          <p className="mb-4 text-sm text-red-400 font-mono">{errorMsg}</p>
        )}
        <button
          onClick={handleInitialQuery}
          className="px-6 py-3 bg-primary text-on-primary font-mono text-xs uppercase tracking-widest font-bold rounded-sm hover:opacity-90 active:scale-95 transition-all"
        >
          스승에게 묻기
        </button>
      </div>
    );
  }

  // --- LOADING INITIAL STATE ---
  if (phase === 'loadingInitial') {
    return (
      <div className="mt-8 pt-8 border-t border-white/10">
        <div className="flex items-center gap-3 text-sm text-on-surface-variant font-mono">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          <span>스승이 복기를 읽고 있습니다... (2~5초 소요)</span>
        </div>
      </div>
    );
  }

  // --- DISABLED STATE ---
  if (phase === 'disabled') {
    return (
      <div className="mt-8 pt-8 border-t border-white/10">
        <p className="text-sm text-on-surface-variant font-mono">기능이 비활성화되어 있습니다.</p>
      </div>
    );
  }

  // --- CHATTING / LOADING FOLLOWUP STATE ---
  const followupTurns = messages.filter(m => !m.isInitial);

  return (
    <div className="mt-8 pt-8 border-t border-white/10 space-y-6" key={postSlug}>
      {/* Initial evaluation */}
      {initialEval && (
        <MentorEvaluation markdown={initialEval.markdown} warning={initialEval.warning} />
      )}

      {/* Follow-up message history */}
      {followupTurns.length > 0 && (
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
          {followupTurns.map((turn, idx) => (
            <div
              key={idx}
              className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-sm text-sm leading-relaxed ${
                  turn.role === 'user'
                    ? 'bg-primary/20 text-on-surface border border-primary/30'
                    : 'bg-surface-container text-on-surface-variant border border-white/10'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {turn.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {phase === 'loadingFollowup' && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 bg-surface-container border border-white/10 rounded-sm">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Error + retry */}
      {errorMsg && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-red-400 font-mono">{errorMsg}</p>
          {failedInput && (
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 font-mono text-[10px] uppercase tracking-widest rounded-sm transition-colors"
            >
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-3 items-end">
        <textarea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !sendDisabled) {
              e.preventDefault();
              handleSendFollowup(inputValue);
            }
          }}
          disabled={isInFlight}
          placeholder="스승에게 질문하세요... (Shift+Enter 줄바꿈)"
          rows={2}
          className="flex-1 bg-surface-container-lowest border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 font-mono text-xs p-2 transition-colors resize-none text-on-surface placeholder:text-on-surface-variant/40 disabled:opacity-50"
        />
        <button
          onClick={() => handleSendFollowup(inputValue)}
          disabled={sendDisabled}
          className="px-4 py-2 bg-primary text-on-primary font-mono text-xs uppercase tracking-widest font-bold rounded-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
        >
          전송
        </button>
      </div>
    </div>
  );
}
