/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react'
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Tooltip,
  Input,
  Select,
} from 'antd'
import {
  EyeOutlined,
  CopyOutlined,
  EditOutlined,
  FilterOutlined,
} from '@ant-design/icons'

const { Text } = Typography
const { Option } = Select

interface TableViewProps {
  data: any
  onFieldClick?: (fieldPath: string) => void
  onDataTransform?: (transformedData: any) => void
  compact?: boolean
}

interface TableRow {
  key: string
  field: string
  type: string
  value: any
  displayValue: string
  path: string
  nullable: boolean
  size?: number
}

const inferType = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return 'date'
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email'
    if (/^https?:\/\//.test(value)) return 'url'
    return 'string'
  }
  return typeof value
}

const getTypeColor = (type: string) => {
  const colors = {
    string: 'green',
    number: 'blue',
    boolean: 'purple',
    date: 'orange',
    email: 'cyan',
    url: 'magenta',
    array: 'red',
    object: 'yellow',
    null: 'gray',
    undefined: 'gray',
  }
  return colors[type as keyof typeof colors] || 'default'
}

const formatDisplayValue = (value: any, type: string): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'

  switch (type) {
    case 'string':
      return value.length > 100 ? `${value.substring(0, 97)}...` : value
    case 'array':
      return `Array(${value.length})`
    case 'object':
      return `Object(${Object.keys(value).length} keys)`
    case 'date':
      return new Date(value).toLocaleString()
    case 'boolean':
      return value ? 'true' : 'false'
    case 'number':
      return value.toLocaleString()
    default:
      return String(value)
  }
}

const flattenObject = (obj: any, prefix: string = ''): TableRow[] => {
  const rows: TableRow[] = []

  if (!obj || typeof obj !== 'object') return rows

  Object.entries(obj).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    const type = inferType(value)
    const displayValue = formatDisplayValue(value, type)
    const nullable = value === null || value === undefined

    const row: TableRow = {
      key: path,
      field: key,
      type,
      value,
      displayValue,
      path,
      nullable,
      size: typeof value === 'string' ? value.length : undefined,
    }

    rows.push(row)

    // Recursively add nested object properties
    if (type === 'object' && value && Object.keys(value).length > 0) {
      rows.push(...flattenObject(value, path))
    }

    // For arrays, show the first item's structure if it's an object
    if (type === 'array' && Array.isArray(value) && value.length > 0) {
      const firstItem = value[0]
      if (firstItem && typeof firstItem === 'object') {
        rows.push(...flattenObject(firstItem, `${path}[0]`))
      }
    }
  })

  return rows
}

const TableView: React.FC<TableViewProps> = ({
  data,
  onFieldClick,
  onDataTransform,
  compact = false,
}) => {
  const [filterType, setFilterType] = useState<string>('all')
  const [searchText, setSearchText] = useState('')

  const tableData = useMemo(() => {
    return flattenObject(data)
  }, [data])

  const filteredData = useMemo(() => {
    let filtered = tableData

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(row => row.type === filterType)
    }

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(
        row =>
          row.field.toLowerCase().includes(search) ||
          row.path.toLowerCase().includes(search) ||
          String(row.displayValue).toLowerCase().includes(search)
      )
    }

    return filtered
  }, [tableData, filterType, searchText])

  const typeOptions = useMemo(() => {
    const types = new Set(tableData.map(row => row.type))
    return Array.from(types).sort()
  }, [tableData])

  const copyValue = (value: any) => {
    const text =
      typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    navigator.clipboard.writeText(text)
  }

  const viewFullValue = (row: TableRow) => {
    onFieldClick?.(row.path)
  }

  const columns = [
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      width: compact ? 120 : 200,
      render: (text: string, record: TableRow) => (
        <div>
          <Text className="text-white font-medium">{text}</Text>
          {!compact && (
            <div className="text-xs text-gray-400 mt-1">{record.path}</div>
          )}
        </div>
      ),
      sorter: (a: TableRow, b: TableRow) => a.field.localeCompare(b.field),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string, record: TableRow) => (
        <Space direction="vertical" size="small">
          <Tag color={getTypeColor(type)}>{type}</Tag>
          {record.nullable && <Tag color="red">nullable</Tag>}
        </Space>
      ),
      filters: typeOptions.map(type => ({ text: type, value: type })),
      onFilter: (value: any, record: TableRow) => record.type === value,
    },
    {
      title: 'Value',
      dataIndex: 'displayValue',
      key: 'value',
      ellipsis: true,
      render: (displayValue: string, record: TableRow) => {
        const isLongValue =
          record.type === 'string' && record.size && record.size > 100
        const isComplexValue =
          record.type === 'object' || record.type === 'array'

        return (
          <div className="flex items-center justify-between">
            <Text
              className={`${record.nullable ? 'text-gray-500 italic' : 'text-gray-300'}`}
              style={{ maxWidth: compact ? 150 : 300 }}
            >
              {displayValue}
            </Text>
            <Space size="small">
              {(isLongValue || isComplexValue) && (
                <Tooltip title="View full value">
                  <Button
                    icon={<EyeOutlined />}
                    size="small"
                    type="text"
                    onClick={() => viewFullValue(record)}
                    className="text-gray-400 hover:text-white"
                  />
                </Tooltip>
              )}
              <Tooltip title="Copy value">
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  type="text"
                  onClick={() => copyValue(record.value)}
                  className="text-gray-400 hover:text-white"
                />
              </Tooltip>
              {onDataTransform && (
                <Tooltip title="Use in transform">
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    type="text"
                    onClick={() =>
                      onDataTransform({ [record.field]: record.value })
                    }
                    className="text-gray-400 hover:text-white"
                  />
                </Tooltip>
              )}
            </Space>
          </div>
        )
      },
    },
  ]

  if (compact) {
    // Remove the path display and reduce column widths for compact mode
    columns[0].width = 100
    columns[2].render = (displayValue: string, record: TableRow) => (
      <Text
        className={`${record.nullable ? 'text-gray-500 italic' : 'text-gray-300'}`}
        ellipsis={{ tooltip: displayValue }}
        style={{ maxWidth: 120 }}
      >
        {displayValue}
      </Text>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-400">
        <FilterOutlined className="text-4xl mb-2" />
        <div>No data to display</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden h-full flex flex-col">
      {/* Filters and Controls */}
      <div
        className={`${compact ? 'p-2' : 'p-3'} border-b border-gray-700 bg-gray-800 flex-shrink-0`}
      >
        <Space wrap size={compact ? 'small' : 'middle'}>
          <Input.Search
            placeholder="Search fields and values..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: compact ? 150 : 200 }}
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: compact ? 100 : 120 }}
          >
            <Option value="all">All Types</Option>
            {typeOptions.map(type => (
              <Option key={type} value={type}>
                <Tag color={getTypeColor(type)}>{type}</Tag>
              </Option>
            ))}
          </Select>
          <Text className="text-gray-400 text-sm">
            {filteredData.length} of {tableData.length} fields
          </Text>
        </Space>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-hidden">
        <Table
          dataSource={filteredData}
          columns={columns}
          pagination={{
            pageSize: compact ? 8 : 15,
            showSizeChanger: !compact,
            showQuickJumper: !compact,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} fields`,
            size: compact ? 'small' : 'default',
          }}
          className="dark-table ps-4"
          scroll={{ y: 'calc(100vh - 300px)' }}
        />
      </div>
    </div>
  )
}

export default TableView
