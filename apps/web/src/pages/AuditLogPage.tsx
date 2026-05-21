import { useEffect, useState } from 'react'
import { apiGet } from '../api/client'
import './WorkflowPages.css'

type AuditLog = {
  id: string
  action: string
  targetType: string
  targetId?: string | null
  summary?: string | null
  createdAt: string
}

const fallbackNotice = 'API 연결 실패로 운영 로그를 불러오지 못했습니다.'

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadAuditLogs() {
      try {
        const response = await apiGet<AuditLog[]>('/audit-logs')

        if (!isActive) {
          return
        }

        setLogs(response)
        setNotice('')
      } catch {
        if (!isActive) {
          return
        }

        setLogs([])
        setNotice(fallbackNotice)
      }
    }

    void loadAuditLogs()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <div className="workflow-page">
      <section className="page-heading">
        <div>
          <h2>운영 로그</h2>
          <p>제품, 프로젝트, Try 변경 이력을 최신순으로 확인</p>
        </div>
      </section>

      {notice ? <p className="local-notice">{notice}</p> : null}

      <section className="workflow-panel">
        <div className="panel-heading compact">
          <h3>최근 변경 이력</h3>
          <span>{logs.length}건</span>
        </div>
        <div className="workflow-table-wrap">
          <table className="workflow-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>요약</th>
                <th>대상</th>
                <th>시각</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.summary ?? '-'}</td>
                  <td>
                    {log.targetType} {log.targetId ?? '-'}
                  </td>
                  <td>{log.createdAt}</td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4}>표시할 운영 로그가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
