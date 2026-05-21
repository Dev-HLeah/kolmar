import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { apiGet } from '../api/client'
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

const fallbackNotice = 'API 연결 실패로 로컬 근거 후보를 표시합니다.'

export function KnowledgeSearchPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [searchedQuery, setSearchedQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [notice, setNotice] = useState('')
  const [isSearching, setIsSearching] = useState(false)

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
    </div>
  )
}

function toSearchPath(query: string) {
  return `/search?q=${encodeURIComponent(query)}`
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
