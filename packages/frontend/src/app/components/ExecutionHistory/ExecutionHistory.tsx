// Execution History Component - Display workflow execution results
import React, { useState, useEffect, useCallback } from 'react'
import { logger } from '@/core/services/LoggingService'
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Timeline,
  Card,
  Statistic,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
} from 'antd'
import { StopOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { WorkflowApiService } from '@/core'
const workflowApiService = new WorkflowApiService()
import type {
  WorkflowExecution,
  WorkflowExecutionFilter,
} from '@/core/types/execution'

const { RangePicker } = DatePicker
const { Search } = Input
const { Option } = Select

export const ExecutionHistory: React.FC<{
  workflowId?: string
  onClose?: () => void
}> = ({ workflowId, onClose }) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedExecution, setSelectedExecution] =
    useState<WorkflowExecution | null>(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [filter, setFilter] = useState<WorkflowExecutionFilter>({
    workflowId,
    limit: 20,
    offset: 0,
  })
  const [total, setTotal] = useState(0)

  const loadExecutions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await workflowApiService.getExecutions(filter)
      setExecutions(result.items)
      setTotal(result.total)
    } catch (error) {
      logger.error(
        'Failed to load executions',
        error instanceof Error ? error : undefined
      )
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadExecutions()
  }, [loadExecutions])

  const handleStopExecution = async (executionId: string) => {
    try {
      await workflowApiService.stopExecution(executionId)
      await loadExecutions()
    } catch (error) {
      logger.error(
        'Failed to stop execution',
        error instanceof Error ? error : undefined,
        { executionId }
      )
    }
  }

  const showExecutionDetails = async (execution: WorkflowExecution) => {
    setSelectedExecution(execution)
    setDetailsVisible(true)
  }

  const getStatusColor = (status: WorkflowExecution['status']) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      running: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray',
      success: 'green',
      error: 'red',
    }
    return colors[status] || 'default'
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return '-'
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const columns = [
    {
      title: 'Execution ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <span className="font-mono text-xs">{id.substring(0, 8)}...</span>
      ),
    },
    {
      title: 'Workflow',
      dataIndex: 'workflowName',
      key: 'workflowName',
      width: 200,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WorkflowExecution['status']) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 120,
      render: (record: WorkflowExecution) => (
        <div className="text-xs">
          {record.progress?.completedNodes?.length || 0} /{' '}
          {record.progress?.totalNodes || 0} nodes
        </div>
      ),
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 100,
      render: (record: WorkflowExecution) => formatDuration(record.duration),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record: WorkflowExecution) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showExecutionDetails(record)}
          >
            Details
          </Button>
          {record.status === 'running' && (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleStopExecution(record.id)}
            >
              Stop
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const content = (
    <div className="execution-history">
      <div className="mb-4">
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Search
              placeholder="Search executions..."
              onSearch={value =>
                setFilter({ ...filter, workflowId: value || workflowId })
              }
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: '100%' }}
              onChange={value => setFilter({ ...filter, status: value })}
            >
              <Option value="pending">Pending</Option>
              <Option value="running">Running</Option>
              <Option value="completed">Completed</Option>
              <Option value="failed">Failed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker
              placeholder={['Start date', 'End date']}
              onChange={dates => {
                if (dates) {
                  setFilter({
                    ...filter,
                    dateFrom: dates[0]?.toISOString(),
                    endDate: dates[1]?.toISOString(),
                  })
                } else {
                  setFilter({
                    ...filter,
                    dateFrom: undefined,
                    endDate: undefined,
                  })
                }
              }}
            />
          </Col>
          <Col span={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadExecutions}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={executions}
        rowKey="id"
        loading={loading}
        pagination={{
          current: Math.floor((filter.offset || 0) / (filter.limit || 20)) + 1,
          pageSize: filter.limit || 20,
          total,
          onChange: (page, pageSize) => {
            setFilter({
              ...filter,
              offset: (page - 1) * (pageSize || 20),
              limit: pageSize,
            })
          },
        }}
      />

      <Modal
        title="Execution Details"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedExecution && (
          <div>
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <Statistic
                  title="Status"
                  value={selectedExecution.status.toUpperCase()}
                  valueStyle={{
                    color: getStatusColor(selectedExecution.status),
                  }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Duration"
                  value={formatDuration(selectedExecution.duration)}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Nodes Completed"
                  value={`${selectedExecution.progress?.completedNodes?.length || 0} / ${selectedExecution.progress?.totalNodes || 0}`}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Success Rate"
                  value={`${Math.round(((selectedExecution.results?.filter((r: { status: string }) => r.status === 'success').length || 0) / (selectedExecution.results?.length || 1)) * 100)}%`}
                  suffix="%"
                />
              </Col>
            </Row>

            <Card title="Node Execution Results" className="mb-4">
              <Timeline>
                {selectedExecution.results?.map(
                  (result: {
                    nodeId: string
                    nodeName: string
                    status: string
                    output?: unknown
                    error?: string
                    duration?: number
                    executedAt: string
                  }) => (
                    <Timeline.Item
                      key={result.nodeId}
                      color={
                        result.status === 'success'
                          ? 'green'
                          : result.status === 'error'
                            ? 'red'
                            : 'gray'
                      }
                    >
                      <div>
                        <strong>{result.nodeName}</strong>
                        <Tag
                          color={result.status === 'success' ? 'green' : 'red'}
                          className="ml-2"
                        >
                          {result.status}
                        </Tag>
                        <div className="text-gray-500 text-xs">
                          {new Date(result.executedAt).toLocaleString()} •{' '}
                          {formatDuration(result.duration)}
                        </div>
                        {result.error && (
                          <div className="text-red-500 text-sm mt-1">
                            {result.error}
                          </div>
                        )}
                        {result.output && (
                          <details className="mt-1">
                            <summary className="text-blue-500 cursor-pointer text-sm">
                              View Output
                            </summary>
                            <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
                              {JSON.stringify(result.output, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </Timeline.Item>
                  )
                )}
              </Timeline>
            </Card>

            {selectedExecution.error && (
              <Card title="Execution Error" className="border-red-200">
                <div className="text-red-600">
                  <div className="font-semibold">
                    {selectedExecution.error.message}
                  </div>
                  {selectedExecution.error.nodeId && (
                    <div className="text-sm mt-1">
                      Failed at node: {selectedExecution.error.nodeId}
                    </div>
                  )}
                  {selectedExecution.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="bg-red-50 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
                        {selectedExecution.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )

  // If onClose is provided, wrap in a modal
  if (onClose) {
    return (
      <Modal
        title="Execution History"
        open={true}
        onCancel={onClose}
        width={1200}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
      >
        {content}
      </Modal>
    )
  }

  return content
}
