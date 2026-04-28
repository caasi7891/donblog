'use client';

import { useState } from 'react';
import MentorEvaluation from '@/components/mentor/MentorEvaluation';

type CoachingPanelProps = {
  open: boolean;
  onClose: () => void;
  reviewMarkdown: string;
};

type PanelState = 'idle' | 'loading' | 'success' | 'error';

export default function CoachingPanel({ open, onClose, reviewMarkdown }: CoachingPanelProps) {
  const [state, setState] = useState<PanelState>('idle');
  const [resultMarkdown, setResultMarkdown] = useState('');
  const [resultWarning, setResultWarning] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState('');

  const runCoaching = async () => {
    setState('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'coaching', reviewMarkdown }),
      });

      // 404 means LOCAL_MENTOR_ENABLED is unset — fail silently and close
      if (res.status === 404) {
        onClose();
        return;
      }

      let body: {
        success?: boolean;
        markdown?: string;
        warning?: string;
        error?: string;
        errorCode?: string;
      };
      try {
        body = await res.json();
      } catch {
        setState('error');
        setErrorMessage('서버 응답을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      if (res.ok && body.success) {
        setResultMarkdown(body.markdown ?? '');
        setResultWarning(body.warning);
        setState('success');
      } else {
        setState('error');
        setErrorMessage(body.error ?? '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setState('error');
      setErrorMessage('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.');
    }
  };

  const handleClose = () => {
    setState('idle');
    setResultMarkdown('');
    setResultWarning(undefined);
    setErrorMessage('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Side panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-[#0f0f0f] border-l border-white/10 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="AI 스승 코칭"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-400 text-[20px]">psychology</span>
            <span className="text-sm font-bold uppercase tracking-widest text-violet-300">AI 스승 코칭</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {state === 'idle' && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <span className="material-symbols-outlined text-violet-400/60 text-[48px]">psychology</span>
              <p className="text-sm text-neutral-400 leading-relaxed">
                현재 작성 중인 복기를 AI 스승에게 전달합니다.<br />
                매수·매도 타점과 종합 의견을 받아보세요.
              </p>
              <button
                type="button"
                onClick={runCoaching}
                className="text-sm font-bold uppercase tracking-widest bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                지금 코칭 받기
              </button>
            </div>
          )}

          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
              <p className="text-sm text-neutral-300 font-medium">스승이 복기를 읽고 있습니다...</p>
              <p className="text-xs text-neutral-500">예상 대기 2~5초</p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col gap-4">
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 leading-relaxed"
              >
                {errorMessage}
              </div>
              <button
                type="button"
                onClick={runCoaching}
                className="text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 self-start"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                다시 시도
              </button>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col gap-4">
              <MentorEvaluation markdown={resultMarkdown} warning={resultWarning} />
              <button
                type="button"
                onClick={runCoaching}
                className="text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 self-start"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                다시 받기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
