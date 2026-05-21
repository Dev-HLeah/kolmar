import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'
import './KnowledgeSearchPage.css'
import './WorkflowPages.css'

type SearchResult = {
  id: string
  title: string
  summary?: string | null
  source: string
  sourceUrl?: string | null
  grade: string
  matchType: string
}

type SearchResponse = {
  query: string
  results: SearchResult[]
}

type EvidenceSource = {
  id: string
  name: string
  type: string
  baseUrl?: string | null
}

type EvidenceItem = {
  id: string
  title: string
  summary?: string | null
  sourceUrl?: string | null
  grade?: string | null
  source?: EvidenceSource
}

type RegisteredEvidence = {
  id: string
  title: string
  summary?: string | null
  sourceName: string
  sourceType: string
  sourceUrl?: string | null
  grade: string
}

type JsonPayload =
  | string
  | number
  | boolean
  | null
  | JsonPayload[]
  | {
      [key: string]: JsonPayload
    }

type RawImportRecord = {
  id?: string
  externalId?: string | null
  sourceUrl?: string | null
  normalizedStatus?: string | null
}

type ImportJob = {
  id: string
  sourceName: string
  status: string
  startedAt?: string | null
  finishedAt?: string | null
  message?: string | null
  rawRecords?: RawImportRecord[]
}

const fallbackNotice = 'API 연결 실패로 로컬 근거 후보를 표시합니다.'
const registrationFallbackNotice = 'API 연결 실패로 로컬 근거 목록에만 반영됐습니다.'
const importJobFallbackNotice = 'API 연결 실패로 로컬 수집 작업 목록에만 반영됐습니다.'

export function KnowledgeSearchPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [searchedQuery, setSearchedQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [notice, setNotice] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [sourceName, setSourceName] = useState('')
  const [sourceType, setSourceType] = useState('official')
  const [evidenceTitle, setEvidenceTitle] = useState('')
  const [evidenceSummary, setEvidenceSummary] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceGrade, setEvidenceGrade] = useState('official')
  const [registeredEvidence, setRegisteredEvidence] = useState<RegisteredEvidence[]>([])
  const [registrationNotice, setRegistrationNotice] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [importJobs, setImportJobs] = useState<ImportJob[]>([])
  const [importSourceName, setImportSourceName] = useState('')
  const [importStatus, setImportStatus] = useState('IMPORTED')
  const [importMessage, setImportMessage] = useState('')
  const [externalId, setExternalId] = useState('')
  const [rawSourceUrl, setRawSourceUrl] = useState('')
  const [rawJson, setRawJson] = useState('')
  const [importJobNotice, setImportJobNotice] = useState('')
  const [isCreatingImportJob, setIsCreatingImportJob] = useState(false)

  const loadSearch = useCallback(async (nextQuery: string) => {
    const normalizedQuery = nextQuery.trim()

    if (!normalizedQuery) {
      return
    }

    try {
      const response = await apiGet<SearchResponse>(toSearchPath(normalizedQuery))
      setSearchedQuery(response.query)
      setResults(response.results)
      setNotice('')
    } catch {
      setSearchedQuery(normalizedQuery)
      setResults([createFallbackResult(normalizedQuery)])
      setNotice(fallbackNotice)
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const urlQuery = new URLSearchParams(location.search).get('q')?.trim() ?? ''

    if (!urlQuery) {
      return
    }

    let isActive = true

    async function loadFromUrl() {
      try {
        const response = await apiGet<SearchResponse>(toSearchPath(urlQuery))

        if (!isActive) {
          return
        }

        setSearchedQuery(response.query)
        setResults(response.results)
        setNotice('')
      } catch {
        if (!isActive) {
          return
        }

        setSearchedQuery(urlQuery)
        setResults([createFallbackResult(urlQuery)])
        setNotice(fallbackNotice)
      } finally {
        if (isActive) {
          setIsSearching(false)
        }
      }
    }

    void loadFromUrl()

    return () => {
      isActive = false
    }
  }, [location.search])

  useEffect(() => {
    let isActive = true

    async function loadImportJobs() {
      try {
        const jobs = await apiGet<ImportJob[]>('/evidence/import-jobs')

        if (!isActive) {
          return
        }

        setImportJobs(jobs)
      } catch {
        if (!isActive) {
          return
        }

        setImportJobs([])
      }
    }

    void loadImportJobs()

    return () => {
      isActive = false
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      setSearchParams({})
      setSearchedQuery('')
      setResults([])
      setNotice('')
      return
    }

    setIsSearching(true)

    if ((searchParams.get('q') ?? '') === normalizedQuery) {
      void loadSearch(normalizedQuery)
      return
    }

    setSearchParams({ q: normalizedQuery })
  }

  async function handleRegisterEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedSourceName = sourceName.trim()
    const normalizedTitle = evidenceTitle.trim()

    if (!normalizedSourceName || !normalizedTitle) {
      setRegistrationNotice('출처명과 근거 제목은 입력해야 합니다.')
      return
    }

    const sourcePayload = {
      name: normalizedSourceName,
      type: sourceType,
      baseUrl: null,
    }
    const itemPayloadBase = {
      title: normalizedTitle,
      summary: nullableText(evidenceSummary),
      rawText: nullableText(evidenceSummary),
      sourceUrl: nullableText(evidenceUrl),
      grade: nullableText(evidenceGrade),
    }

    setIsRegistering(true)

    try {
      const createdSource = await apiPost<EvidenceSource, typeof sourcePayload>(
        '/evidence/sources',
        sourcePayload,
      )
      const createdItem = await apiPost<EvidenceItem, typeof itemPayloadBase & { sourceId: string }>(
        '/evidence/items',
        {
          sourceId: createdSource.id,
          ...itemPayloadBase,
        },
      )

      setRegisteredEvidence((current) => [
        toRegisteredEvidence(createdItem, createdSource, sourcePayload),
        ...current,
      ])
      setRegistrationNotice('')
    } catch {
      setRegisteredEvidence((current) => [
        createLocalRegisteredEvidence({
          sourceName: normalizedSourceName,
          sourceType,
          title: normalizedTitle,
          summary: nullableText(evidenceSummary),
          sourceUrl: nullableText(evidenceUrl),
          grade: nullableText(evidenceGrade) ?? 'unreviewed',
        }),
        ...current,
      ])
      setRegistrationNotice(registrationFallbackNotice)
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleCreateImportJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedSourceName = importSourceName.trim()

    if (!normalizedSourceName) {
      setImportJobNotice('수집 출처는 입력해야 합니다.')
      return
    }

    const parsedRawPayload = parseOptionalJson(rawJson)

    if (parsedRawPayload === invalidJsonPayload) {
      setImportJobNotice('원본 JSON 형식이 올바르지 않습니다.')
      return
    }

    const rawRecordFieldsEntered = Boolean(
      externalId.trim() || rawSourceUrl.trim() || rawJson.trim(),
    )
    const records = rawRecordFieldsEntered
      ? [
          {
            externalId: nullableText(externalId),
            sourceUrl: nullableText(rawSourceUrl),
            rawPayload: parsedRawPayload ?? {},
          },
        ]
      : []
    const payload = {
      sourceName: normalizedSourceName,
      status: importStatus,
      message: nullableText(importMessage),
      records,
    }

    setIsCreatingImportJob(true)

    try {
      const createdJob = await apiPost<ImportJob, typeof payload>(
        '/evidence/import-jobs',
        payload,
      )

      setImportJobs((current) => [createdJob, ...current])
      setImportJobNotice('')
      setImportSourceName('')
      setImportMessage('')
      setExternalId('')
      setRawSourceUrl('')
      setRawJson('')
    } catch {
      setImportJobs((current) => [
        createLocalImportJob({
          sourceName: normalizedSourceName,
          status: importStatus,
          message: nullableText(importMessage),
          rawRecords: records.map((record) => ({
            externalId: record.externalId,
            sourceUrl: record.sourceUrl,
            normalizedStatus: 'PENDING',
          })),
        }),
        ...current,
      ])
      setImportJobNotice(importJobFallbackNotice)
    } finally {
      setIsCreatingImportJob(false)
    }
  }

  return (
    <div className="workflow-page knowledge-search-page">
      <section className="page-heading">
        <div>
          <h2>근거 검색</h2>
          <p>공식 기준, 외부 근거, 내부 실험 후보를 빠르게 참조</p>
        </div>
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>검색 조건</h3>
          <span>Evidence + Vector</span>
        </div>
        <form className="knowledge-search-form" onSubmit={handleSubmit}>
          <label>
            검색어
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 비타민 C, 아연, 위 건강"
            />
          </label>
          <button type="submit" className="primary-dashboard-button" disabled={isSearching}>
            {isSearching ? '검색 중' : '근거 검색'}
          </button>
        </form>
        {notice ? <p className="local-notice">{notice}</p> : null}
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>검색 결과</h3>
          <span>{results.length}개</span>
        </div>
        {searchedQuery ? (
          <p className="result-context">검색어: {searchedQuery}</p>
        ) : (
          <p className="empty-result">검색어를 입력하면 관련 근거 후보가 표시됩니다.</p>
        )}
        {results.length > 0 ? (
          <div className="knowledge-result-list">
            {results.map((result) => (
              <article className="knowledge-result-card" key={result.id}>
                <div className="result-card-heading">
                  <h3>{result.title}</h3>
                  <span>{result.matchType}</span>
                </div>
                {result.summary ? <p>{result.summary}</p> : null}
                <dl>
                  <div>
                    <dt>출처</dt>
                    <dd>{result.source}</dd>
                  </div>
                  <div>
                    <dt>등급</dt>
                    <dd>{result.grade}</dd>
                  </div>
                </dl>
                {result.sourceUrl ? (
                  <a href={result.sourceUrl} target="_blank" rel="noreferrer">
                    원문 보기
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>외부 데이터 수집</h3>
          <span>OpenAPI 저장</span>
        </div>
        <form className="import-job-form" onSubmit={handleCreateImportJob}>
          <label>
            수집 출처
            <input
              value={importSourceName}
              onChange={(event) => setImportSourceName(event.target.value)}
              placeholder="예: MFDS OpenAPI, KIPRIS OpenAPI"
            />
          </label>
          <label>
            수집 상태
            <select value={importStatus} onChange={(event) => setImportStatus(event.target.value)}>
              <option value="IMPORTED">IMPORTED</option>
              <option value="NORMALIZED">NORMALIZED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </label>
          <label className="wide-field">
            수집 메모
            <input
              value={importMessage}
              onChange={(event) => setImportMessage(event.target.value)}
              placeholder="예: 특허 원문 수집, 식약처 기준 갱신"
            />
          </label>
          <label>
            외부 ID
            <input
              value={externalId}
              onChange={(event) => setExternalId(event.target.value)}
              placeholder="예: PAT-001"
            />
          </label>
          <label>
            원본 URL
            <input
              value={rawSourceUrl}
              onChange={(event) => setRawSourceUrl(event.target.value)}
              placeholder="https://"
            />
          </label>
          <label className="wide-field">
            원본 JSON
            <textarea
              value={rawJson}
              onChange={(event) => setRawJson(event.target.value)}
              placeholder='{"ingredient":"비타민 C"}'
            />
          </label>
          <div className="registration-actions">
            <button type="submit" className="primary-dashboard-button" disabled={isCreatingImportJob}>
              {isCreatingImportJob ? '등록 중' : '수집 작업 등록'}
            </button>
          </div>
        </form>
        {importJobNotice ? <p className="local-notice">{importJobNotice}</p> : null}
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>수집 작업</h3>
          <span>{importJobs.length}개</span>
        </div>
        {importJobs.length > 0 ? (
          <div className="knowledge-result-list">
            {importJobs.map((job) => (
              <article className="knowledge-result-card" key={job.id}>
                <div className="result-card-heading">
                  <h3>{job.sourceName}</h3>
                  <span>{job.status}</span>
                </div>
                {job.message ? <p>{job.message}</p> : null}
                <dl>
                  <div>
                    <dt>원본</dt>
                    <dd>원본 {job.rawRecords?.length ?? 0}건</dd>
                  </div>
                  <div>
                    <dt>정규화</dt>
                    <dd>{job.rawRecords?.[0]?.normalizedStatus ?? 'PENDING'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-result">외부 데이터 수집 작업이 이 목록에 표시됩니다.</p>
        )}
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>근거 등록</h3>
          <span>저장 후 재사용</span>
        </div>
        <form className="evidence-registration-form" onSubmit={handleRegisterEvidence}>
          <label>
            출처명
            <input
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
              placeholder="예: MFDS, 특허청, 내부 실험"
            />
          </label>
          <label>
            출처 유형
            <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
              <option value="official">공식 기준</option>
              <option value="patent">특허</option>
              <option value="internal">내부 실험</option>
              <option value="reference">참고 근거</option>
            </select>
          </label>
          <label className="wide-field">
            근거 제목
            <input
              value={evidenceTitle}
              onChange={(event) => setEvidenceTitle(event.target.value)}
              placeholder="예: 비타민 C 고형제 기준 규격"
            />
          </label>
          <label className="wide-field">
            요약
            <input
              value={evidenceSummary}
              onChange={(event) => setEvidenceSummary(event.target.value)}
              placeholder="기준, 실험 결과, 위험 신호 요약"
            />
          </label>
          <label>
            원문 URL
            <input
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
              placeholder="https://"
            />
          </label>
          <label>
            근거 등급
            <select value={evidenceGrade} onChange={(event) => setEvidenceGrade(event.target.value)}>
              <option value="official">official</option>
              <option value="patent">patent</option>
              <option value="internal">internal</option>
              <option value="unreviewed">unreviewed</option>
            </select>
          </label>
          <div className="registration-actions">
            <button type="submit" className="primary-dashboard-button" disabled={isRegistering}>
              {isRegistering ? '등록 중' : '근거 등록'}
            </button>
          </div>
        </form>
        {registrationNotice ? <p className="local-notice">{registrationNotice}</p> : null}
      </section>

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>등록 근거</h3>
          <span>{registeredEvidence.length}개</span>
        </div>
        {registeredEvidence.length > 0 ? (
          <div className="knowledge-result-list">
            {registeredEvidence.map((item) => (
              <article className="knowledge-result-card" key={item.id}>
                <div className="result-card-heading">
                  <h3>{item.title}</h3>
                  <span>{item.grade}</span>
                </div>
                {item.summary ? <p>{item.summary}</p> : null}
                <dl>
                  <div>
                    <dt>출처</dt>
                    <dd>{item.sourceName}</dd>
                  </div>
                  <div>
                    <dt>유형</dt>
                    <dd>{item.sourceType}</dd>
                  </div>
                </dl>
                {item.sourceUrl ? (
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    원문 보기
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-result">등록한 근거가 이 목록에 표시됩니다.</p>
        )}
      </section>
    </div>
  )
}

function toSearchPath(query: string) {
  return `/search?q=${encodeURIComponent(query)}`
}

function nullableText(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : null
}

const invalidJsonPayload = Symbol('invalid-json-payload')

function parseOptionalJson(value: string): JsonPayload | typeof invalidJsonPayload | null {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  try {
    return JSON.parse(normalized) as JsonPayload
  } catch {
    return invalidJsonPayload
  }
}

function toRegisteredEvidence(
  item: EvidenceItem,
  source: EvidenceSource,
  fallback: { name: string; type: string },
): RegisteredEvidence {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    sourceName: item.source?.name ?? source.name ?? fallback.name,
    sourceType: item.source?.type ?? source.type ?? fallback.type,
    sourceUrl: item.sourceUrl,
    grade: item.grade ?? 'unreviewed',
  }
}

function createLocalRegisteredEvidence(input: Omit<RegisteredEvidence, 'id'>): RegisteredEvidence {
  return {
    id: `local-evidence-${Date.now()}`,
    ...input,
  }
}

function createLocalImportJob(input: Omit<ImportJob, 'id'>): ImportJob {
  return {
    id: `local-import-${Date.now()}`,
    startedAt: new Date().toISOString(),
    ...input,
  }
}

function createFallbackResult(query: string): SearchResult {
  return {
    id: 'local-fallback-evidence',
    title: `${query} 관련 로컬 근거 후보`,
    summary:
      'API 연결 전에도 검색 흐름을 확인하기 위한 로컬 후보입니다. Supabase와 pgvector 연결 후 정형 근거와 벡터 유사도 결과로 대체됩니다.',
    source: 'local-fallback',
    sourceUrl: null,
    grade: 'mock',
    matchType: 'mock-vector',
  }
}
