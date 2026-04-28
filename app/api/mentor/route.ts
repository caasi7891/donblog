import type { NextRequest } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import {
  type MentorRequest,
  type LlmAdapter,
  type ChatMessage,
  validateEvaluation,
  stripMdxComponents,
  mapSdkErrorToKorean,
} from '@/lib/mentor';

// Force dynamic -- never statically cache this route
export const dynamic = 'force-dynamic';

// ============================================================
// LlmAdapter implementation wrapping @anthropic-ai/claude-agent-sdk
// ============================================================

const claudeAgentSdkAdapter: LlmAdapter = {
  async complete({ systemPrompt, userMessage }) {
    // History is already embedded in `userMessage` by buildUserMessage() at the
    // route-handler level. Adapter passes prompt as-is to avoid duplicating context.
    try {
      const conversation = query({
        prompt: userMessage,
        options: {
          systemPrompt,
          tools: [],       // disable ALL tools — text-only response
          maxTurns: 1,     // single API round-trip
          model: 'claude-sonnet-4-6',
          permissionMode: 'plan', // read-only mode
          // yarn 1 classic skips platform optionalDependencies, so the bundled
          // CLI binary is missing. Fall back to the user's PATH-installed
          // `claude` (which uses the same OAuth credentials at ~/.claude/).
          pathToClaudeCodeExecutable: process.env.CLAUDE_CODE_PATH || 'claude',
        },
      });

      for await (const message of conversation) {
        if (message.type === 'result') {
          if (message.subtype === 'success') {
            return { text: message.result };
          }
          // error subtypes: error_max_turns, error_during_execution, etc.
          const stopReason = message.stop_reason ?? 'unknown';
          const mapped = mapSdkErrorToKorean(stopReason);
          return { error: mapped.message, errorCode: mapped.errorCode };
        }
      }

      // No result message received — treat as SDK error
      return {
        error: '멘토 서비스에서 응답을 받지 못했습니다.',
        errorCode: 'SDK_ERROR' as const,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('ENOENT') || msg.includes('not found')) {
        return {
          error: 'Claude Code CLI를 찾을 수 없습니다. `claude` 명령어가 설치되어 있는지 확인해주세요.',
          errorCode: 'SDK_ERROR' as const,
        };
      }
      if (msg.includes('rate_limit')) {
        return {
          error: '현재 요청이 많습니다. 잠시 후 다시 시도해주세요.',
          errorCode: 'RATE_LIMIT' as const,
        };
      }
      if (msg.includes('authentication') || msg.includes('auth')) {
        return {
          error: '인증에 실패했습니다. 터미널에서 `claude login`을 실행해주세요.',
          errorCode: 'AUTH_FAILED' as const,
        };
      }
      return {
        error: '멘토 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        errorCode: 'SDK_ERROR' as const,
      };
    }
  },
};

// ============================================================
// Helper: format conversation history into a prompt string
// ============================================================

// (buildPromptWithHistory removed — history is now embedded by buildUserMessage
// at the route-handler level, so the adapter passes userMessage as-is.)

// ============================================================
// System prompt builder
// ============================================================

function buildSystemPrompt(principles: string): string {
  return `${principles}

---

# 출력 형식 지시

사용자의 매매 복기를 평가할 때는 다음 markdown 구조를 정확히 따라 응답하세요:

## 매수
### 잘한점
...
### 아쉬운점
...
### 다음에 시도할 것
...

## 매도
### 잘한점
...
### 아쉬운점
...
### 다음에 시도할 것
...

## 매매 총평
...

반드시 위 9개 헤더(## 매수, ### 잘한점, ### 아쉬운점, ### 다음에 시도할 것, ## 매도, ### 잘한점, ### 아쉬운점, ### 다음에 시도할 것, ## 매매 총평)를 모두 포함하세요. 응답은 4000 토큰 이내로 작성하세요. 한국어로 답변하세요.

후속 질문(채팅 형식)에는 위 9-헤더 형식을 따르지 말고 자유 서술로 답변하세요.`;
}

// ============================================================
// User message builder
// ============================================================

function buildUserMessage(
  cleanReview: string,
  mode: MentorRequest['mode'],
  messages?: ChatMessage[],
): string {
  const isFollowUp = mode === 'query' && (messages?.length ?? 0) > 0;

  if (!isFollowUp) {
    return `다음 복기를 평가해주세요.\n\n${cleanReview}`;
  }

  // Follow-up: embed the review as context + the conversation messages
  const lastMsg = messages![messages!.length - 1];
  const history = messages!.slice(0, -1);
  const base = `아래 매매 복기에 대한 대화입니다.\n\n[복기]\n${cleanReview}`;

  if (history.length === 0) {
    return `${base}\n\n[현재 질문]\n${lastMsg.content}`;
  }

  const formatted = history
    .map((m) => `[${m.role === 'user' ? '사용자' : '스승'}]: ${m.content}`)
    .join('\n\n');
  return `${base}\n\n[대화 기록]\n${formatted}\n\n[현재 질문]\n${lastMsg.content}`;
}

// ============================================================
// POST /api/mentor
// ============================================================

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Gate: LOCAL_MENTOR_ENABLED
  if (process.env.LOCAL_MENTOR_ENABLED !== 'true') {
    return new Response('Not Found', { status: 404 });
  }

  // 2. Parse and validate request body
  let body: MentorRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: '잘못된 요청 형식입니다.', errorCode: 'VALIDATION_FAILED' },
      { status: 400 },
    );
  }

  if (!body.mode || !(['coaching', 'query'] as const).includes(body.mode)) {
    return Response.json(
      { success: false, error: '올바른 mode를 지정해주세요. (coaching 또는 query)', errorCode: 'VALIDATION_FAILED' },
      { status: 400 },
    );
  }

  if (!body.reviewMarkdown?.trim()) {
    return Response.json(
      { success: false, error: '복기 내용이 비어있습니다.', errorCode: 'VALIDATION_FAILED' },
      { status: 400 },
    );
  }

  // Validate messages array if present
  if (body.messages !== undefined) {
    if (!Array.isArray(body.messages)) {
      return Response.json(
        { success: false, error: '잘못된 메시지 형식입니다.', errorCode: 'VALIDATION_FAILED' },
        { status: 400 },
      );
    }
    for (const msg of body.messages) {
      if (
        typeof msg !== 'object' ||
        msg === null ||
        !['user', 'assistant'].includes(msg.role) ||
        typeof msg.content !== 'string'
      ) {
        return Response.json(
          { success: false, error: '메시지 형식이 올바르지 않습니다. role은 user 또는 assistant여야 합니다.', errorCode: 'VALIDATION_FAILED' },
          { status: 400 },
        );
      }
    }
  }

  // 3. Read principles file
  const principlesPath = path.join(process.cwd(), 'content', 'mentor', 'principles.md');
  let principles: string;
  try {
    principles = await fs.readFile(principlesPath, 'utf-8');
  } catch {
    return Response.json(
      { success: false, error: '원칙 문서가 없습니다 (content/mentor/principles.md).', errorCode: 'SDK_ERROR' },
      { status: 500 },
    );
  }

  // 4. Strip MDX components
  const cleanReview = stripMdxComponents(body.reviewMarkdown);

  // 5. Build system prompt and user message
  const systemPrompt = buildSystemPrompt(principles);
  const userMessage = buildUserMessage(cleanReview, body.mode, body.messages);

  const isFollowUp = body.mode === 'query' && (body.messages?.length ?? 0) > 0;

  // 6. Call adapter (history already embedded in userMessage by buildUserMessage)
  const result = await claudeAgentSdkAdapter.complete({
    systemPrompt,
    userMessage,
    maxTokens: 4000,
  });

  if ('error' in result) {
    const errorCode = result.errorCode;
    const status =
      errorCode === 'AUTH_FAILED' ? 401 :
      errorCode === 'RATE_LIMIT' ? 429 : 502;
    return Response.json(
      { success: false, error: result.error, errorCode },
      { status },
    );
  }

  let resultText = result.text;

  // 7. Validate 9-header structure (initial eval only, not follow-ups)
  if (!isFollowUp) {
    const validation = validateEvaluation(resultText);
    if (!validation.valid) {
      // Retry once with stronger format reminder
      const retryUserMessage = userMessage +
        '\n\n[중요] 이전 응답이 형식을 따르지 않았습니다. 반드시 9개 헤더를 모두 포함하세요:\n## 매수\n### 잘한점\n### 아쉬운점\n### 다음에 시도할 것\n## 매도\n### 잘한점\n### 아쉬운점\n### 다음에 시도할 것\n## 매매 총평';

      const retryResult = await claudeAgentSdkAdapter.complete({
        systemPrompt,
        userMessage: retryUserMessage,
        maxTokens: 4000,
      });

      if (!('error' in retryResult)) {
        const retryValidation = validateEvaluation(retryResult.text);
        if (retryValidation.valid) {
          resultText = retryResult.text;
        } else {
          // Give up — return with warning
          return Response.json({
            success: true,
            markdown: resultText,
            isFollowUp: false,
            warning: '스승의 응답 형식이 완전하지 않습니다. 누락된 섹션: ' + validation.missing.join(', '),
          });
        }
      }
      // If retry also errored, fall through with the original text + warning
      else {
        return Response.json({
          success: true,
          markdown: resultText,
          isFollowUp: false,
          warning: '스승의 응답 형식이 완전하지 않습니다. 누락된 섹션: ' + validation.missing.join(', '),
        });
      }
    }
  }

  // 8. Return success
  return Response.json({ success: true, markdown: resultText, isFollowUp });
}
