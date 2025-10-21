/**
 * Frontend E2E Validation Framework
 * Creates user workflow automation and testing system
 * Requirements: 1.3, 1.5
 */

import { type Browser, type BrowserContext, chromium, type Page } from 'playwright';
import type { IE2EValidator } from '../interfaces/index.js';
import type {
  IntegrationFailure,
  IntegrationResults,
  WorkflowFailure,
  WorkflowResults,
} from '../types/index.js';

export interface E2EWorkflow {
  name: string;
  description: string;
  steps: E2EStep[];
  timeout?: number;
  retries?: number;
}

export interface E2EStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'assert' | 'screenshot';
  selector?: string;
  url?: string;
  text?: string;
  expected?: string;
  timeout?: number;
}

export interface E2EValidationConfig {
  baseUrl: string;
  headless: boolean;
  timeout: number;
  workflows: E2EWorkflow[];
  screenshotPath?: string;
  viewport?: { width: number; height: number };
}

export interface CrossPackageIntegration {
  fromPackage: string;
  toPackage: string;
  testScenario: string;
  validationSteps: E2EStep[];
}

export class E2EValidator implements IE2EValidator {
  private config: E2EValidationConfig;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(config: E2EValidationConfig) {
    this.config = config;
  }

  /**
   * Run frontend workflow validation
   * Requirements: 1.3, 1.5
   */
  async runFrontendWorkflows(): Promise<WorkflowResults> {
    const _startTime = Date.now();
    const failures: WorkflowFailure[] = [];
    let passedCount = 0;

    try {
      await this.initializeBrowser();

      for (const workflow of this.config.workflows) {
        try {
          const result = await this.executeWorkflow(workflow);
          if (result.success) {
            passedCount++;
          } else {
            failures.push(result.failure!);
          }
        } catch (error) {
          failures.push({
            workflowName: workflow.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } finally {
      await this.cleanup();
    }

    return {
      totalWorkflows: this.config.workflows.length,
      passedWorkflows: passedCount,
      failedWorkflows: failures,
      crossPackageIntegration: {
        testedIntegrations: 0,
        passedIntegrations: 0,
        failedIntegrations: [],
      },
      status: failures.length === 0 ? 'success' : 'failure',
    };
  }

  /**
   * Validate user journeys across the application
   * Requirements: 1.3
   */
  async validateUserJourneys(): Promise<WorkflowResults> {
    const userJourneys: E2EWorkflow[] = [
      {
        name: 'User Authentication Journey',
        description: 'Test user login and authentication flow',
        steps: [
          { action: 'navigate', url: '/login' },
          { action: 'wait', selector: '[data-testid="login-form"]', timeout: 5000 },
          { action: 'type', selector: '[data-testid="email-input"]', text: 'test@example.com' },
          { action: 'type', selector: '[data-testid="password-input"]', text: 'password123' },
          { action: 'click', selector: '[data-testid="login-button"]' },
          { action: 'wait', selector: '[data-testid="dashboard"]', timeout: 10000 },
          { action: 'assert', selector: '[data-testid="user-menu"]', expected: 'visible' },
        ],
      },
      {
        name: 'Workflow Creation Journey',
        description: 'Test creating a new workflow',
        steps: [
          { action: 'navigate', url: '/workflows' },
          { action: 'wait', selector: '[data-testid="workflows-page"]', timeout: 5000 },
          { action: 'click', selector: '[data-testid="create-workflow-button"]' },
          { action: 'wait', selector: '[data-testid="workflow-editor"]', timeout: 5000 },
          {
            action: 'type',
            selector: '[data-testid="workflow-name-input"]',
            text: 'Test Workflow',
          },
          {
            action: 'type',
            selector: '[data-testid="workflow-description-input"]',
            text: 'Test workflow description',
          },
          { action: 'click', selector: '[data-testid="save-workflow-button"]' },
          { action: 'wait', selector: '[data-testid="workflow-saved-message"]', timeout: 5000 },
        ],
      },
    ];

    const tempConfig = { ...this.config, workflows: userJourneys };
    const tempValidator = new E2EValidator(tempConfig);
    return tempValidator.runFrontendWorkflows();
  }

  /**
   * Check cross-package integration validation
   * Requirements: 1.5
   */
  async checkCrossPackageIntegration(): Promise<WorkflowResults> {
    const integrations: CrossPackageIntegration[] = [
      {
        fromPackage: 'frontend',
        toPackage: 'backend',
        testScenario: 'API Communication',
        validationSteps: [
          { action: 'navigate', url: '/api-test' },
          { action: 'wait', selector: '[data-testid="api-status"]', timeout: 5000 },
          { action: 'assert', selector: '[data-testid="api-status"]', expected: 'connected' },
        ],
      },
      {
        fromPackage: 'frontend',
        toPackage: '@klikkflow/shared',
        testScenario: 'Shared Component Usage',
        validationSteps: [
          { action: 'navigate', url: '/components' },
          { action: 'wait', selector: '[data-testid="shared-button"]', timeout: 5000 },
          { action: 'click', selector: '[data-testid="shared-button"]' },
          { action: 'assert', selector: '[data-testid="shared-button"]', expected: 'clicked' },
        ],
      },
    ];

    const integrationFailures: IntegrationFailure[] = [];
    let passedIntegrations = 0;

    try {
      await this.initializeBrowser();

      for (const integration of integrations) {
        try {
          const result = await this.testIntegration(integration);
          if (result.success) {
            passedIntegrations++;
          } else {
            integrationFailures.push(result.failure!);
          }
        } catch (error) {
          integrationFailures.push({
            fromPackage: integration.fromPackage,
            toPackage: integration.toPackage,
            error: error instanceof Error ? error.message : 'Unknown error',
            component: integration.testScenario,
          });
        }
      }
    } finally {
      await this.cleanup();
    }

    const integrationResults: IntegrationResults = {
      testedIntegrations: integrations.length,
      passedIntegrations,
      failedIntegrations: integrationFailures,
    };

    return {
      totalWorkflows: integrations.length,
      passedWorkflows: passedIntegrations,
      failedWorkflows: [],
      crossPackageIntegration: integrationResults,
      status: integrationFailures.length === 0 ? 'success' : 'failure',
    };
  }

  /**
   * Generate comprehensive E2E report
   * Requirements: 1.5
   */
  async generateE2EReport(): Promise<WorkflowResults> {
    const workflowResults = await this.runFrontendWorkflows();
    const journeyResults = await this.validateUserJourneys();
    const integrationResults = await this.checkCrossPackageIntegration();

    const combinedResults: WorkflowResults = {
      totalWorkflows:
        workflowResults.totalWorkflows +
        journeyResults.totalWorkflows +
        integrationResults.totalWorkflows,
      passedWorkflows:
        workflowResults.passedWorkflows +
        journeyResults.passedWorkflows +
        integrationResults.passedWorkflows,
      failedWorkflows: [
        ...workflowResults.failedWorkflows,
        ...journeyResults.failedWorkflows,
        ...integrationResults.failedWorkflows,
      ],
      crossPackageIntegration: integrationResults.crossPackageIntegration,
      status:
        workflowResults.status === 'success' &&
        journeyResults.status === 'success' &&
        integrationResults.status === 'success'
          ? 'success'
          : 'failure',
    };

    return combinedResults;
  }

  /**
   * Initialize browser and context
   */
  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });

    this.context = await this.browser.newContext({
      viewport: this.config.viewport || { width: 1280, height: 720 },
    });
  }

  /**
   * Execute a single workflow
   */
  private async executeWorkflow(workflow: E2EWorkflow): Promise<{
    success: boolean;
    failure?: WorkflowFailure;
  }> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const page = await this.context.newPage();

    try {
      for (const step of workflow.steps) {
        await this.executeStep(page, step);
      }

      return { success: true };
    } catch (error) {
      // Take screenshot on failure if path is configured
      if (this.config.screenshotPath) {
        const screenshotPath = `${this.config.screenshotPath}/${workflow.name}-failure.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      return {
        success: false,
        failure: {
          workflowName: workflow.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          screenshot: this.config.screenshotPath ? `${workflow.name}-failure.png` : undefined,
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Execute a single step in a workflow
   */
  private async executeStep(page: Page, step: E2EStep): Promise<void> {
    const timeout = step.timeout || this.config.timeout;

    switch (step.action) {
      case 'navigate':
        if (!step.url) {
          throw new Error('URL required for navigate action');
        }
        await page.goto(`${this.config.baseUrl}${step.url}`, { timeout });
        break;

      case 'click':
        if (!step.selector) {
          throw new Error('Selector required for click action');
        }
        await page.click(step.selector, { timeout });
        break;

      case 'type':
        if (!(step.selector && step.text)) {
          throw new Error('Selector and text required for type action');
        }
        await page.fill(step.selector, step.text, { timeout });
        break;

      case 'wait':
        if (!step.selector) {
          throw new Error('Selector required for wait action');
        }
        await page.waitForSelector(step.selector, { timeout });
        break;

      case 'assert': {
        if (!step.selector) {
          throw new Error('Selector required for assert action');
        }
        const element = await page.waitForSelector(step.selector, { timeout });

        if (step.expected === 'visible') {
          const isVisible = await element.isVisible();
          if (!isVisible) {
            throw new Error(`Element ${step.selector} is not visible`);
          }
        } else if (step.expected === 'clicked') {
          // For clicked state, we might check for a class or attribute
          const hasClickedState = await element.evaluate(
            (el) => el.classList.contains('clicked') || el.getAttribute('data-clicked') === 'true'
          );
          if (!hasClickedState) {
            throw new Error(`Element ${step.selector} does not have clicked state`);
          }
        } else if (step.expected === 'connected') {
          const text = await element.textContent();
          if (!text?.includes('connected')) {
            throw new Error(`Element ${step.selector} does not show connected state`);
          }
        }
        break;
      }

      case 'screenshot': {
        const screenshotPath = this.config.screenshotPath || './screenshots';
        await page.screenshot({
          path: `${screenshotPath}/step-${Date.now()}.png`,
          fullPage: true,
        });
        break;
      }

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  /**
   * Test cross-package integration
   */
  private async testIntegration(integration: CrossPackageIntegration): Promise<{
    success: boolean;
    failure?: IntegrationFailure;
  }> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const page = await this.context.newPage();

    try {
      for (const step of integration.validationSteps) {
        await this.executeStep(page, step);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        failure: {
          fromPackage: integration.fromPackage,
          toPackage: integration.toPackage,
          error: error instanceof Error ? error.message : 'Unknown error',
          component: integration.testScenario,
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Cleanup browser resources
   */
  private async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Create default E2E workflows for validation
   */
  static createDefaultWorkflows(_baseUrl: string): E2EWorkflow[] {
    return [
      {
        name: 'Homepage Load Test',
        description: 'Verify homepage loads correctly',
        steps: [
          { action: 'navigate', url: '/' },
          { action: 'wait', selector: 'body', timeout: 5000 },
          { action: 'assert', selector: 'body', expected: 'visible' },
        ],
      },
      {
        name: 'Navigation Test',
        description: 'Test main navigation functionality',
        steps: [
          { action: 'navigate', url: '/' },
          { action: 'wait', selector: '[data-testid="main-nav"]', timeout: 5000 },
          { action: 'click', selector: '[data-testid="workflows-link"]' },
          { action: 'wait', selector: '[data-testid="workflows-page"]', timeout: 5000 },
        ],
      },
      {
        name: 'API Health Check',
        description: 'Verify API connectivity from frontend',
        steps: [
          { action: 'navigate', url: '/health' },
          { action: 'wait', selector: '[data-testid="health-status"]', timeout: 5000 },
          { action: 'assert', selector: '[data-testid="health-status"]', expected: 'connected' },
        ],
      },
    ];
  }
}
