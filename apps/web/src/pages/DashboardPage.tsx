import { useState } from 'react'
import { apiPost } from '../api/client'
import { FormulaInputTable, type FormulaRow } from '../components/FormulaInputTable'
import './DashboardPage.css'

const initialRows: FormulaRow[] = [
  { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
  { ingredientName: '', amount: '', unit: 'mg', ratio: '', note: '' },
]

const metrics = [
  { label: '등록 제품', value: '0', tone: 'neutral' },
  { label: '진행 프로젝트', value: '0', tone: 'neutral' },
  { label: '계획 Try', value: '0', tone: 'neutral' },
  { label: '근거 자료', value: '0', tone: 'neutral' },
]

const kolmarForms = [
  '츄어블 정제',
  '이중 제형 정제',
  '미니/멀티 정제',
  '쿨멜팅 분말',
  '크런치 분말',
  '팝핑 분말',
  '스틱 포장',
  'Multi PTP',
]

const dosageFormLabels: Record<string, string> = {
  tablet: '정제',
  powder: '분말',
}

const localRecommendationNotice = 'API 연결 실패로 로컬 후보 초안을 표시합니다.'

type DraftTryCandidate = {
  title: string
  objective: string
  suggestedChanges: string[]
  riskChecks: string[]
}

type SafetySignal = {
  type: string
  label: string
  severity: 'warning' | 'caution' | 'info'
  message: string
  evidenceLevel: string
  relatedIngredients: string[]
}

type DraftTryRecommendation = {
  projectName: string
  safetyNotice: string
  safetySignals?: SafetySignal[]
  candidates: DraftTryCandidate[]
}

type FormulaIngredientInput = {
  ingredientName: string
  amount: string | null
  unit: string | null
  ratio: string | null
  note: string | null
}

const severityLabels: Record<SafetySignal['severity'], string> = {
  warning: '강한 주의',
  caution: '주의',
  info: '검토',
}

export function DashboardPage() {
  const [rows, setRows] = useState(initialRows)
  const [groupName, setGroupName] = useState('')
  const [targetFunction, setTargetFunction] = useState('')
  const [dosageForm, setDosageForm] = useState('tablet')
  const [recommendation, setRecommendation] = useState<DraftTryRecommendation | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleCreateDraftTries() {
    const payload = {
      projectName: nullableText(groupName),
      targetFunction: nullableText(targetFunction),
      dosageForm: dosageFormLabels[dosageForm],
      constraints: [],
      evidenceContext: [],
      sourceFormula: {
        ingredients: rows
          .map((row) => ({
            ingredientName: row.ingredientName.trim(),
            amount: nullableText(row.amount),
            unit: nullableText(row.unit),
            ratio: nullableText(row.ratio),
            note: nullableText(row.note),
          }))
          .filter((row) => row.ingredientName.length > 0),
      },
    }

    setIsGenerating(true)

    try {
      const result = await apiPost<DraftTryRecommendation, typeof payload>(
        '/recommendations/draft-tries',
        payload,
      )
      setRecommendation(result)
    } catch {
      setRecommendation(createLocalRecommendation(payload.sourceFormula.ingredients))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="dashboard-page">
      <section className="page-heading">
        <div>
          <h2>연구 대시보드</h2>
          <p>제품 자산, 신규 프로젝트, 배합 Try를 한 흐름에서 관리</p>
        </div>
        <button type="button" className="primary-dashboard-button">
          신규 프로젝트
        </button>
      </section>

      <section className="metric-grid" aria-label="업무 현황">
        {metrics.map((metric) => (
          <figure className="metric-tile" key={metric.label}>
            <figcaption>{metric.label}</figcaption>
            <strong>{metric.value}</strong>
          </figure>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel wide">
          <FormulaInputTable rows={rows} onChange={setRows} />
        </div>

        <div className="dashboard-panel">
          <div className="panel-heading">
            <h3>고형제 제형</h3>
            <span>Kolmar 특화</span>
          </div>
          <div className="tag-list">
            {kolmarForms.map((form) => (
              <span key={form}>{form}</span>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-heading">
            <h3>Try 기본값</h3>
            <span>선택 입력</span>
          </div>
          <div className="try-defaults">
            <label>
              그룹명
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="예: 신물 억제"
              />
            </label>
            <label>
              목표 기능
              <input
                value={targetFunction}
                onChange={(event) => setTargetFunction(event.target.value)}
                placeholder="예: 위 건강"
              />
            </label>
            <label>
              생성 개수
              <input inputMode="numeric" placeholder="100" />
            </label>
            <label>
              기준 제형
              <select value={dosageForm} onChange={(event) => setDosageForm(event.target.value)}>
                <option value="tablet">정제</option>
                <option value="powder">분말</option>
              </select>
            </label>
            <button
              type="button"
              className="primary-dashboard-button"
              onClick={handleCreateDraftTries}
              disabled={isGenerating}
            >
              {isGenerating ? 'AI 후보 생성 중' : 'AI 후보 Try 생성'}
            </button>
          </div>
        </div>
      </section>

      {recommendation ? (
        <section className="recommendation-panel" aria-label="AI 후보 Try 초안">
          <div className="panel-heading">
            <div>
              <h3>AI 후보 Try 초안</h3>
              <p>{recommendation.projectName}</p>
            </div>
            <span>{recommendation.candidates.length}개 후보</span>
          </div>
          <p className="safety-notice">{recommendation.safetyNotice}</p>
          {recommendation.safetySignals?.length ? (
            <section className="safety-signal-panel">
              <div className="safety-signal-heading">
                <h4>안전/규제 신호</h4>
                <span>{recommendation.safetySignals.length}개</span>
              </div>
              <div className="safety-signal-grid">
                {recommendation.safetySignals.map((signal) => (
                  <article className="safety-signal-card" data-severity={signal.severity} key={signal.type}>
                    <div className="safety-signal-title">
                      <strong>{signal.label}</strong>
                      <span>{severityLabels[signal.severity]}</span>
                    </div>
                    <p>{signal.message}</p>
                    <div className="signal-meta">
                      <span>{signal.evidenceLevel}</span>
                      {signal.relatedIngredients.map((ingredient) => (
                        <span key={ingredient}>{ingredient}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          <div className="candidate-grid">
            {recommendation.candidates.map((candidate) => (
              <article className="candidate-card" key={candidate.title}>
                <h4>{candidate.title}</h4>
                <p>{candidate.objective}</p>
                <div>
                  <strong>변경 후보</strong>
                  <ul>
                    {candidate.suggestedChanges.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>위험 확인</strong>
                  <ul>
                    {candidate.riskChecks.map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function nullableText(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : null
}

function createLocalRecommendation(
  ingredients: FormulaIngredientInput[],
): DraftTryRecommendation {
  const ingredientNames = ingredients.map((ingredient) => ingredient.ingredientName).join(', ') || '입력 원료'

  return {
    projectName: '로컬 후보 초안',
    safetyNotice: localRecommendationNotice,
    safetySignals: createLocalSafetySignals(ingredients),
    candidates: [
      {
        title: '안정성 우선 로컬 후보',
        objective: 'API 연결 전에도 독성, 상한, 상호작용 확인 흐름을 먼저 잡는다.',
        suggestedChanges: [`입력 원료: ${ingredientNames}`, '증량은 보류하고 기준 함량부터 검토'],
        riskChecks: ['일일 섭취량 상한', '원료 간 상호작용', '제형별 안정성'],
      },
    ],
  }
}

function createLocalSafetySignals(ingredients: FormulaIngredientInput[]): SafetySignal[] {
  const hasVitaminC = ingredients.some(isVitaminCInput)
  const zincIngredient = ingredients.find((ingredient) => includesText(ingredient.ingredientName, '아연'))
  const signals: SafetySignal[] = []

  const vitaminCIngredient = ingredients.find(isVitaminCInput)
  if (vitaminCIngredient) {
    signals.push({
      type: 'local-sensory-stability',
      label: '관능/산미 안정성',
      severity: 'caution',
      message: '비타민 C 또는 산미 메모가 있어 맛과 색 변화 가능성 확인이 필요합니다.',
      evidenceLevel: 'local-formulation-signal',
      relatedIngredients: [vitaminCIngredient.ingredientName],
    })
  }

  if (zincIngredient) {
    signals.push({
      type: 'local-upper-intake-review',
      label: '상한 섭취량 검토',
      severity: 'warning',
      message: '아연은 함량 입력 후 일일 섭취량 상한 확인이 필요합니다.',
      evidenceLevel: 'local-rule-of-thumb',
      relatedIngredients: [zincIngredient.ingredientName],
    })
  }

  if (hasVitaminC && zincIngredient) {
    signals.push({
      type: 'local-combination-review',
      label: '원료 조합 검토',
      severity: 'info',
      message: '비타민 C와 아연 조합은 함량 변화 시 맛, 위장 부담, 표시 기준을 함께 검토합니다.',
      evidenceLevel: 'local-internal-review',
      relatedIngredients: ['비타민 C', '아연'],
    })
  }

  return signals
}

function isVitaminCInput(ingredient: FormulaIngredientInput) {
  return (
    includesText(ingredient.ingredientName, '비타민 c') ||
    includesText(ingredient.ingredientName, 'vitamin c') ||
    includesText(ingredient.note, '산미')
  )
}

function includesText(value: string | null, keyword: string) {
  return value?.toLowerCase().includes(keyword.toLowerCase()) ?? false
}
