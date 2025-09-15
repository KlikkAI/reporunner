/* eslint-disable @typescript-eslint/no-explicit-any */
// Workflow Tester Component - Test workflows before execution
import React, { useState } from "react";
import {
  Card,
  Button,
  Alert,
  Steps,
  Timeline,
  Tag,
  Space,
  Input,
  Form,
  Modal,
  Spin,
} from "antd";
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { WorkflowApiService } from "@/core";
const workflowApiService = new WorkflowApiService();
import { exportWorkflowToBackend } from "@/core/utils/workflowExporter";
import { useExecutionMonitor } from "@/app/services/executionMonitor";
import type { Node, Edge } from "reactflow";
import type { WorkflowExecution } from "@/core/types/execution";

const { TextArea } = Input;
const { Step } = Steps;

export const WorkflowTester: React.FC<{
  nodes: Node[];
  edges: Edge[];
  onClose: () => void;
}> = ({ nodes, edges, onClose }) => {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [triggerData, setTriggerData] = useState("");
  const [testMode, setTestMode] = useState<
    "validate" | "dry_run" | "full_test"
  >("validate");

  const { execution, isConnected } = useExecutionMonitor(executionId);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const workflowJson = exportWorkflowToBackend(nodes, edges);

      if (testMode === "validate") {
        // Just validate the workflow structure
        const result = await workflowApiService.testWorkflow(workflowJson);
        setTestResult({
          type: "validation",
          ...result,
        });
      } else if (testMode === "dry_run") {
        // Dry run - validate and simulate execution
        const result = await workflowApiService.testWorkflow(workflowJson);
        setTestResult({
          type: "dry_run",
          ...result,
        });
      } else {
        // Full test execution
        const triggerPayload = triggerData
          ? JSON.parse(triggerData)
          : undefined;
        const result = await workflowApiService.executeWorkflow({
          workflow: workflowJson,
          triggerData: triggerPayload,
          options: {
            timeout: 300000, // 5 minutes
          },
        });

        setExecutionId(result.id);
        setTestResult({
          type: "full_execution",
          execution: result,
        });
      }
    } catch (error: any) {
      setTestResult({
        type: "error",
        error: error.message || "Test execution failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const stopTest = async () => {
    if (executionId) {
      try {
        await workflowApiService.stopExecution(executionId);
      } catch (error) {
        console.error("Failed to stop test execution:", error);
      }
    }
  };

  const renderValidationResult = (result: any) => (
    <div>
      <Alert
        type={result.isValid ? "success" : "error"}
        message={
          result.isValid ? "Workflow is valid" : "Workflow validation failed"
        }
        description={
          <div>
            {result.errors.length > 0 && (
              <div className="mb-2">
                <strong>Errors:</strong>
                <ul className="mt-1">
                  {result.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-600">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.warnings.length > 0 && (
              <div>
                <strong>Warnings:</strong>
                <ul className="mt-1">
                  {result.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-orange-600">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.estimatedDuration && (
              <div className="mt-2">
                <strong>Estimated Duration:</strong>{" "}
                {Math.round(result.estimatedDuration / 1000)}s
              </div>
            )}
          </div>
        }
      />
    </div>
  );

  const renderExecutionResult = (exec: WorkflowExecution) => (
    <div>
      <div className="mb-4">
        <Alert
          type={
            exec.status === "completed"
              ? "success"
              : exec.status === "failed"
                ? "error"
                : "info"
          }
          message={`Execution ${exec.status}`}
          description={
            <div>
              <div>
                Started:{" "}
                {exec.startedAt
                  ? new Date(exec.startedAt).toLocaleString()
                  : "N/A"}
              </div>
              {exec.completedAt && (
                <div>
                  Completed: {new Date(exec.completedAt).toLocaleString()}
                </div>
              )}
              {exec.duration && (
                <div>Duration: {Math.round(exec.duration / 1000)}s</div>
              )}
              <div>
                Progress: {exec.progress?.completedNodes?.length || 0} /{" "}
                {exec.progress?.totalNodes || 0} nodes
              </div>
            </div>
          }
        />
      </div>

      <Card title="Node Execution Timeline" size="small">
        <Timeline>
          {exec.results?.map((result) => (
            <Timeline.Item
              key={result.nodeId}
              color={
                result.status === "success"
                  ? "green"
                  : result.status === "error"
                    ? "red"
                    : "gray"
              }
              dot={
                result.status === "success" ? (
                  <CheckCircleOutlined />
                ) : result.status === "error" ? (
                  <ExclamationCircleOutlined />
                ) : undefined
              }
            >
              <div>
                <Space>
                  <strong>{result.nodeName}</strong>
                  <Tag color={result.status === "success" ? "green" : "red"}>
                    {result.status}
                  </Tag>
                  <span className="text-gray-500">
                    {Math.round(result.duration)}ms
                  </span>
                </Space>

                {result.error && (
                  <div className="text-red-500 text-sm mt-1">
                    {result.error}
                  </div>
                )}

                {result.output && Object.keys(result.output).length > 0 && (
                  <details className="mt-1">
                    <summary className="text-blue-500 cursor-pointer text-sm">
                      View Output ({Object.keys(result.output).length} fields)
                    </summary>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto max-h-32">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </Timeline.Item>
          ))}

          {exec.progress?.currentNodeId && exec.status === "running" && (
            <Timeline.Item color="blue" dot={<Spin size="small" />}>
              <div>
                <strong>Currently executing...</strong>
                <div className="text-gray-500 text-sm">
                  Node: {exec.progress?.currentNodeId}
                </div>
              </div>
            </Timeline.Item>
          )}
        </Timeline>
      </Card>

      {exec.error && (
        <Card title="Execution Error" className="mt-4 border-red-200">
          <Alert
            type="error"
            message={exec.error.message}
            description={
              <div>
                {exec.error.nodeId && (
                  <div>
                    Failed at node: <code>{exec.error.nodeId}</code>
                  </div>
                )}
                {exec.error.code && (
                  <div>
                    Error code: <code>{exec.error.code}</code>
                  </div>
                )}
              </div>
            }
          />
        </Card>
      )}
    </div>
  );

  const currentExecution = execution || testResult?.execution;

  return (
    <Modal
      title={
        <Space>
          <BugOutlined />
          Workflow Tester
          {!isConnected && executionId && (
            <Tag color="orange">Disconnected</Tag>
          )}
        </Space>
      }
      open={true}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        currentExecution?.status === "running" ? (
          <Button key="stop" danger onClick={stopTest}>
            Stop Test
          </Button>
        ) : (
          <Button
            key="test"
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={testing}
            onClick={runTest}
          >
            Run Test
          </Button>
        ),
      ]}
    >
      <div className="workflow-tester">
        <div className="mb-4">
          <Steps
            current={
              testMode === "validate" ? 0 : testMode === "dry_run" ? 1 : 2
            }
            size="small"
          >
            <Step
              title="Validate"
              description="Check workflow structure"
              onClick={() => setTestMode("validate")}
              style={{ cursor: "pointer" }}
            />
            <Step
              title="Dry Run"
              description="Simulate execution"
              onClick={() => setTestMode("dry_run")}
              style={{ cursor: "pointer" }}
            />
            <Step
              title="Full Test"
              description="Real execution"
              onClick={() => setTestMode("full_test")}
              style={{ cursor: "pointer" }}
            />
          </Steps>
        </div>

        {testMode === "full_test" && (
          <Card title="Test Configuration" size="small" className="mb-4">
            <Form layout="vertical">
              <Form.Item
                label="Trigger Data (JSON)"
                help="Optional test data to trigger the workflow"
              >
                <TextArea
                  rows={4}
                  placeholder={`{
  "subject": "Test email",
  "from": "test@example.com",
  "body": "This is a test customer support email about my order status."
}`}
                  value={triggerData}
                  onChange={(e) => setTriggerData(e.target.value)}
                />
              </Form.Item>
            </Form>
          </Card>
        )}

        <Card
          title="Test Results"
          size="small"
          extra={testing && <Spin size="small" />}
        >
          {!testResult && !testing && (
            <div className="text-gray-500 text-center py-8">
              Configure your test settings and click "Run Test" to begin
            </div>
          )}

          {testing && (
            <div className="text-center py-8">
              <Spin size="large" />
              <div className="mt-2">
                {testMode === "validate"
                  ? "Validating workflow..."
                  : testMode === "dry_run"
                    ? "Running simulation..."
                    : "Executing workflow..."}
              </div>
            </div>
          )}

          {testResult && testResult.type === "error" && (
            <Alert
              type="error"
              message="Test Failed"
              description={testResult.error}
            />
          )}

          {testResult &&
            (testResult.type === "validation" ||
              testResult.type === "dry_run") &&
            renderValidationResult(testResult)}

          {(testResult?.type === "full_execution" || currentExecution) &&
            renderExecutionResult(currentExecution)}
        </Card>
      </div>
    </Modal>
  );
};
