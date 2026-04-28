// ============================================================
// Types
// ============================================================

export type MentorMode = 'coaching' | 'query';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type MentorRequest = {
  mode: MentorMode;
  reviewMarkdown: string;
  messages?: ChatMessage[]; // only for mode='query' follow-ups
};

export type MentorResponse =
  | {
      success: true;
      markdown: string; // raw LLM output (valid 9-header or free-form follow-up)
      isFollowUp: boolean;
      warning?: string; // present when validation retry still failed (degraded success)
    }
  | {
      success: false;
      error: string; // Korean user-facing error message
      errorCode: 'VALIDATION_FAILED' | 'RATE_LIMIT' | 'AUTH_FAILED' | 'SDK_ERROR' | 'DISABLED';
    };

// Convenience alias for the errorCode union so LlmAdapter can reuse it without
// the conditional-type trick (which TypeScript resolves cleanly but is verbose).
export type MentorErrorCode = Extract<MentorResponse, { success: false }>['errorCode'];

// ============================================================
// 9-header validation
// ============================================================

// Headers must appear in this order. The 매도 sub-headers share names
// with 매수 sub-headers, so validation checks positional ordering:
// the second occurrence of each sub-header must come after '## 매도'.
const REQUIRED_HEADERS = [
  '## 매수',
  '### 잘한점',           // under 매수
  '### 아쉬운점',         // under 매수
  '### 다음에 시도할 것', // under 매수
  '## 매도',
  '### 잘한점',           // under 매도 (second occurrence)
  '### 아쉬운점',         // under 매도 (second occurrence)
  '### 다음에 시도할 것', // under 매도 (second occurrence)
  '## 매매 총평',
];

export function validateEvaluation(markdown: string): { valid: boolean; missing: string[] } {
  const lines = markdown.split('\n');
  let pointer = 0;

  for (const line of lines) {
    if (pointer >= REQUIRED_HEADERS.length) break;
    if (line.trim() === REQUIRED_HEADERS[pointer]) {
      pointer++;
    }
  }

  const missing = REQUIRED_HEADERS.slice(pointer);
  return missing.length === 0
    ? { valid: true, missing: [] }
    : { valid: false, missing };
}

// ============================================================
// MDX component stripping
// ============================================================

export function stripMdxComponents(mdx: string): string {
  // 1. Remove self-closing JSX tags: <ComponentName ... />
  //    Use [\s\S]*? instead of the `s` flag (not available below ES2018).
  let result = mdx.replace(/<[A-Z][A-Za-z]*\s[\s\S]*?\/>/g, '');

  // 2. Remove paired JSX tags: <ComponentName ...>...</ComponentName>
  result = result.replace(/<([A-Z][A-Za-z]*)\b[^>]*>[\s\S]*?<\/\1>/g, '');

  return result;
}

// ============================================================
// LLM Adapter interface
// ============================================================

export interface LlmAdapter {
  complete(params: {
    systemPrompt: string;
    userMessage: string;
    history?: ChatMessage[];
    maxTokens?: number;
  }): Promise<{ text: string } | { error: string; errorCode: MentorErrorCode }>;
}

// The Agent SDK implementation of LlmAdapter wraps query() with tools: [].
// A future fallback implementation could use @anthropic-ai/sdk directly
// with a locally-read OAuth token (~50 lines). The interface makes
// swapping implementations a single-file change.

// ============================================================
// SDK error mapping
// ============================================================

export function mapSdkErrorToKorean(error: string): { message: string; errorCode: MentorErrorCode } {
  if (error.includes('rate_limit')) {
    return {
      message: '현재 요청이 많습니다. 잠시 후 다시 시도해주세요.',
      errorCode: 'RATE_LIMIT',
    };
  }
  if (error.includes('authentication_failed')) {
    return {
      message: '인증에 실패했습니다. 터미널에서 `claude login`을 실행해주세요.',
      errorCode: 'AUTH_FAILED',
    };
  }
  if (error.includes('billing_error')) {
    return {
      message: '구독 상태를 확인해주세요.',
      errorCode: 'AUTH_FAILED',
    };
  }
  if (error.includes('max_output_tokens')) {
    return {
      message: '응답이 너무 길어 중단되었습니다. 다시 시도해주세요.',
      errorCode: 'SDK_ERROR',
    };
  }
  if (error.includes('server_error')) {
    return {
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      errorCode: 'SDK_ERROR',
    };
  }
  return {
    message: '알 수 없는 오류가 발생했습니다.',
    errorCode: 'SDK_ERROR',
  };
}
