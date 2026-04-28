'use client';

type MentorEvaluationProps = {
  markdown: string;
  warning?: string;
};

type SubSections = {
  welldone: string;
  toImprove: string;
  nextTry: string;
};

type ParsedEvaluation = {
  buy: SubSections;
  sell: SubSections;
  summary: string;
};

const HEADERS = {
  buyRoot: '## 매수',
  sellRoot: '## 매도',
  summaryRoot: '## 매매 총평',
  welldone: '### 잘한점',
  toImprove: '### 아쉬운점',
  nextTry: '### 다음에 시도할 것',
} as const;

function parseMarkdown(markdown: string): ParsedEvaluation | null {
  const lines = markdown.split('\n');

  // Find positions of all structural headers in order
  let buyIdx = -1;
  let sellIdx = -1;
  let summaryIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === HEADERS.buyRoot && buyIdx === -1) buyIdx = i;
    else if (trimmed === HEADERS.sellRoot && sellIdx === -1 && buyIdx !== -1) sellIdx = i;
    else if (trimmed === HEADERS.summaryRoot && summaryIdx === -1 && sellIdx !== -1) summaryIdx = i;
  }

  if (buyIdx === -1 || sellIdx === -1 || summaryIdx === -1) return null;

  function extractSubSection(
    sectionStart: number,
    sectionEnd: number,
    headerText: string,
    occurrence: number
  ): string {
    let found = 0;
    let capturing = false;
    const bodyLines: string[] = [];

    for (let i = sectionStart + 1; i < sectionEnd; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('### ')) {
        if (trimmed === headerText) {
          found++;
          if (found === occurrence) {
            capturing = true;
            continue;
          }
        }
        if (capturing) break;
      } else if (capturing) {
        bodyLines.push(lines[i]);
      }
    }

    return bodyLines.join('\n').trim();
  }

  const buy: SubSections = {
    welldone: extractSubSection(buyIdx, sellIdx, HEADERS.welldone, 1),
    toImprove: extractSubSection(buyIdx, sellIdx, HEADERS.toImprove, 1),
    nextTry: extractSubSection(buyIdx, sellIdx, HEADERS.nextTry, 1),
  };

  const sell: SubSections = {
    welldone: extractSubSection(sellIdx, summaryIdx, HEADERS.welldone, 1),
    toImprove: extractSubSection(sellIdx, summaryIdx, HEADERS.toImprove, 1),
    nextTry: extractSubSection(sellIdx, summaryIdx, HEADERS.nextTry, 1),
  };

  const summaryLines: string[] = [];
  for (let i = summaryIdx + 1; i < lines.length; i++) {
    summaryLines.push(lines[i]);
  }
  const summary = summaryLines.join('\n').trim();

  return { buy, sell, summary };
}

function SubSection({
  title,
  body,
  icon,
  accentClass,
}: {
  title: string;
  body: string;
  icon: string;
  accentClass: string;
}) {
  return (
    <div className={`border-l-4 ${accentClass} pl-3 py-1`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-xs font-mono uppercase tracking-widest text-white/60">{title}</span>
      </div>
      <p
        className="text-sm text-white/80 leading-relaxed"
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {body || '—'}
      </p>
    </div>
  );
}

function TradingCard({
  title,
  sections,
  headerClass,
}: {
  title: string;
  sections: SubSections;
  headerClass: string;
}) {
  return (
    <div className="rounded-sm border border-white/10 bg-white/5 overflow-hidden">
      <div className={`px-4 py-2 ${headerClass}`}>
        <span className="text-sm font-mono font-semibold tracking-wider">{title}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        <SubSection
          title="잘한점"
          body={sections.welldone}
          icon="✓"
          accentClass="border-green-500/60"
        />
        <SubSection
          title="아쉬운점"
          body={sections.toImprove}
          icon="△"
          accentClass="border-yellow-500/60"
        />
        <SubSection
          title="다음에 시도할 것"
          body={sections.nextTry}
          icon="→"
          accentClass="border-blue-400/60"
        />
      </div>
    </div>
  );
}

export default function MentorEvaluation({ markdown, warning }: MentorEvaluationProps) {
  const parsed = parseMarkdown(markdown);

  return (
    <div className="flex flex-col gap-4">
      {warning && (
        <div
          role="alert"
          className="rounded-sm border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300"
        >
          {warning}
        </div>
      )}

      {parsed === null ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-mono text-white/40">응답 형식이 예상과 다릅니다.</p>
          <pre
            className="rounded-sm border border-white/10 bg-white/5 p-4 text-sm text-white/70 overflow-x-auto"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {markdown}
          </pre>
        </div>
      ) : (
        <>
          <TradingCard
            title="매수"
            sections={parsed.buy}
            headerClass="bg-red-500/20 text-red-300"
          />
          <TradingCard
            title="매도"
            sections={parsed.sell}
            headerClass="bg-blue-500/20 text-blue-300"
          />
          <div className="rounded-sm border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-2 bg-white/10">
              <span className="text-sm font-mono font-semibold tracking-wider text-white/80">
                매매 총평
              </span>
            </div>
            <div className="px-4 py-3">
              <p
                className="text-sm text-white/80 leading-relaxed"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {parsed.summary || '—'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
