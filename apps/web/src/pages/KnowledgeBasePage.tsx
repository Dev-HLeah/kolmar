import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { apiGet, apiPost } from '../api/client'
import './WorkflowPages.css'

type KnowledgeDocument = {
  id: string
  title: string
  sourceName: string
  sourceUrl?: string | null
  summary?: string | null
  fileType: string
  createdAt: string
}

type CollectionJob = {
  id: string
  source: string
  status: string
  totalCount: number
  doneCount: number
  message?: string | null
  startedAt: string
  finishedAt?: string | null
}

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  docx: 'Word',
  txt: 'TXT',
  pubmed: 'PubMed',
  pubchem: 'PubChem',
  openfda: 'OpenFDA',
  mfds: '식약처',
}

export function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadNotice, setUploadNotice] = useState('')
  const [collectionJob, setCollectionJob] = useState<CollectionJob | null>(null)
  const [isStartingCollection, setIsStartingCollection] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadDocuments()
    void loadLatestJob()
  }, [])

  useEffect(() => {
    if (collectionJob && (collectionJob.status === 'RUNNING' || collectionJob.status === 'PENDING')) {
      startPolling(collectionJob.id)
    } else {
      stopPolling()
    }
    return stopPolling
  }, [collectionJob?.id, collectionJob?.status])

  async function loadDocuments() {
    try {
      const data = await apiGet<KnowledgeDocument[]>('/evidence/knowledge-base')
      setDocuments(data)
    } catch {
      // ignore
    }
  }

  async function loadLatestJob() {
    try {
      const job = await apiGet<CollectionJob | null>('/evidence/knowledge-base/collect/latest')
      if (job) setCollectionJob(job)
    } catch {
      // ignore
    }
  }

  function startPolling(jobId: string) {
    stopPolling()
    pollingRef.current = setInterval(async () => {
      try {
        const job = await apiGet<CollectionJob>(`/evidence/knowledge-base/collect/status/${jobId}`)
        setCollectionJob(job)
        if (job.status === 'DONE' || job.status === 'FAILED') {
          stopPolling()
          if (job.status === 'DONE') void loadDocuments()
        }
      } catch {
        stopPolling()
      }
    }, 2000)
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    setFile(picked)
    setUploadNotice('')
  }

  async function handleUpload() {
    if (!file) {
      setUploadNotice('파일을 선택해주세요.')
      return
    }

    setIsUploading(true)
    setUploadNotice('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sourceName', sourceName.trim() || '직접 업로드')

      const response = await fetch('/api/evidence/knowledge-base/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json() as { message?: string }
        throw new Error(err.message ?? '업로드 실패')
      }

      setUploadNotice('분석 완료! 문서가 학습됐습니다.')
      setFile(null)
      setSourceName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadDocuments()
    } catch (err) {
      setUploadNotice(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleStartCollection() {
    setIsStartingCollection(true)
    try {
      const result = await apiPost<{ jobId: string; status: string }, Record<string, never>>(
        '/evidence/knowledge-base/collect',
        {},
      )
      const job = await apiGet<CollectionJob>(`/evidence/knowledge-base/collect/status/${result.jobId}`)
      setCollectionJob(job)
    } catch {
      // ignore
    } finally {
      setIsStartingCollection(false)
    }
  }

  const isCollecting = collectionJob?.status === 'RUNNING' || collectionJob?.status === 'PENDING'
  const collectionProgress = collectionJob?.totalCount
    ? Math.round((collectionJob.doneCount / collectionJob.totalCount) * 100)
    : 0

  return (
    <div className="workflow-page knowledge-base-page">
      <section className="page-heading">
        <div>
          <h2>백데이터 관리</h2>
          <p>논문·식약처 자료·실험 결과를 AI로 분석해 벡터 지식 베이스로 구축합니다.</p>
        </div>
        <button
          type="button"
          className="primary-dashboard-button"
          onClick={() => void handleStartCollection()}
          disabled={isStartingCollection || isCollecting}
        >
          {isCollecting ? `수집 중 (${collectionJob?.doneCount ?? 0}/${collectionJob?.totalCount ?? '?'})` : '자동 정보 수집'}
        </button>
      </section>

      {collectionJob && (
        <div className="kb-collection-status">
          <span className={`kb-job-badge kb-job-${collectionJob.status.toLowerCase()}`}>
            {collectionJobLabel(collectionJob)}
          </span>
          {isCollecting && collectionJob.totalCount > 0 && (
            <div className="kb-progress-bar">
              <div className="kb-progress-fill" style={{ width: `${collectionProgress}%` }} />
            </div>
          )}
          {collectionJob.message && (
            <span className="kb-job-message">{collectionJob.message}</span>
          )}
        </div>
      )}

      <div className="workflow-grid">
        <section className="workflow-panel">
          <div className="panel-heading compact">
            <h3>문서 업로드</h3>
            <span className="status-pill" style={{ fontSize: '11px', height: '24px', background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>
              OpenAI 분석
            </span>
          </div>
          <div className="kb-upload-area">
            <div className="kb-file-drop">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                id="kb-file-input"
                className="kb-file-input"
              />
              <label htmlFor="kb-file-input" className="kb-file-label">
                {file ? (
                  <span className="kb-file-selected">
                    <span className="kb-file-icon">{fileIcon(file.name)}</span>
                    {file.name}
                  </span>
                ) : (
                  <span>
                    <span className="kb-file-icon">📄</span>
                    PDF · DOCX · TXT 파일 선택
                  </span>
                )}
              </label>
            </div>
            <label className="kb-source-label">
              출처 (선택)
              <input
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="예: KCI 논문, 식약처 고시, 내부 실험"
              />
            </label>
            <div className="form-actions">
              {uploadNotice && (
                <span style={{
                  color: uploadNotice.includes('오류') || uploadNotice.includes('선택') || uploadNotice.includes('실패')
                    ? 'var(--danger)' : 'var(--accent-strong)',
                  fontWeight: 600,
                  fontSize: '13px',
                  flex: 1,
                }}>
                  {uploadNotice}
                </span>
              )}
              <button
                type="button"
                className="primary-dashboard-button"
                disabled={isUploading || !file}
                onClick={() => void handleUpload()}
              >
                {isUploading ? 'AI 분석 중...' : '업로드 및 학습'}
              </button>
            </div>
          </div>
        </section>

        <section className="workflow-panel">
          <div className="panel-heading compact">
            <h3>학습된 문서 목록</h3>
            <span className="product-status-badge product-status-candidate">{documents.length}건</span>
          </div>
          {documents.length > 0 ? (
            <div className="kb-doc-list">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className="kb-doc-item"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="kb-doc-header">
                    <span className="kb-doc-type">{FILE_TYPE_LABELS[doc.fileType] ?? doc.fileType}</span>
                    <span className="kb-doc-title">{doc.title}</span>
                  </div>
                  <div className="kb-doc-meta">
                    <span>{doc.sourceName}</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  {doc.summary && (
                    <p className="kb-doc-summary">{doc.summary}</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>아직 학습된 문서가 없습니다.</p>
            </div>
          )}
        </section>
      </div>

      {selectedDoc && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="문서 상세"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDoc(null) }}
        >
          <div className="modal-panel kb-detail-modal">
            <div className="panel-heading compact">
              <h3>{selectedDoc.title}</h3>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="닫기"
                onClick={() => setSelectedDoc(null)}
              >
                ✕
              </button>
            </div>
            <dl className="kb-detail-dl">
              <div>
                <dt>출처</dt>
                <dd>{selectedDoc.sourceName}</dd>
              </div>
              <div>
                <dt>형식</dt>
                <dd>{FILE_TYPE_LABELS[selectedDoc.fileType] ?? selectedDoc.fileType}</dd>
              </div>
              <div>
                <dt>등록일</dt>
                <dd>{formatDate(selectedDoc.createdAt)}</dd>
              </div>
              {selectedDoc.sourceUrl && (
                <div>
                  <dt>원문 URL</dt>
                  <dd>
                    <a href={selectedDoc.sourceUrl} target="_blank" rel="noreferrer">
                      {selectedDoc.sourceUrl}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {selectedDoc.summary && (
              <div className="kb-detail-summary">
                <h4>AI 분석 요약</h4>
                <p>{selectedDoc.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function fileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📕'
  if (ext === 'docx') return '📘'
  return '📄'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function collectionJobLabel(job: CollectionJob) {
  switch (job.status) {
    case 'PENDING': return '수집 대기 중'
    case 'RUNNING': return `수집 중 — ${job.doneCount}/${job.totalCount}건`
    case 'DONE': return `수집 완료 (${job.doneCount}건)`
    case 'FAILED': return '수집 실패'
    default: return job.status
  }
}
