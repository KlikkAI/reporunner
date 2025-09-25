if (typeof compareValue === 'string' && compareValue.includes(',')) {
  const [min, max] = compareValue.split(',').map((v) => Number(v.trim()));
  const num = Number(fieldValue);
  if (!Number.isNaN(num) && !Number.isNaN(min) && !Number.isNaN(max)) {
    return num >= min && num <= max;
  }
}
return false;

case 'is_empty':
if (Array.isArray(fieldValue)) return fieldValue.length === 0;
if (typeof fieldValue === 'object') return Object.keys(fieldValue).length === 0;
return !fieldValue || fieldValue === '';

case 'is_not_empty':
if (Array.isArray(fieldValue)) return fieldValue.length > 0;
if (typeof fieldValue === 'object') return Object.keys(fieldValue).length > 0;
return fieldValue && fieldValue !== '';

case 'length_equals':
        case 'length_greater':
if (Array.isArray(fieldValue) || typeof fieldValue === 'string') {
  const length = fieldValue.length;
  const compareNum = Number(compareValue);
  if (!Number.isNaN(compareNum)) {
    return operator === 'length_equals' ? length === compareNum : length > compareNum;
  }
}
return false;

case 'is_true':
return fieldValue === true || fieldValue === 'true' || fieldValue === 1;

case 'is_false':
return fieldValue === false || fieldValue === 'false' || fieldValue === 0;

case 'is_null':
return fieldValue === null;

case 'regex':
try {
  // Handle regex patterns like /pattern/flags
  if (typeof compareValue === 'string' && compareValue.startsWith('/')) {
    const lastSlash = compareValue.lastIndexOf('/');
    const pattern = compareValue.slice(1, lastSlash);
    const flags = compareValue.slice(lastSlash + 1);
    const regex = new RegExp(pattern, flags);
    return regex.test(String(fieldValue));
  }
  // Fallback to simple regex
  const regex = new RegExp(String(compareValue));
  return regex.test(String(fieldValue));
} catch {
  return false;
}

default:
          logger.warn(`Unknown operator: $
{
  operator;
}
`);
          return false;
      }
    } catch (error) {
      logger.warn('Error evaluating condition:', {
        fieldValue,
        operator,
        compareValue,
        error,
      });
      return false;
    }
  }

  /**
   * Execute delay node
   */
  private async executeDelay(
    node: IWorkflowNode,
    _context: ExecutionContext,
    inputs: Record<string, any>
  ): Promise<any> {
    const delayMs = node.data.configuration?.delay || 1000;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
      delayed: delayMs,
      message: `;
Delayed;
execution;
by;
$;
{
  delayMs;
}
ms`,
      inputs,
    };
  }

  /**
   * Execute transform node
   */
  private async executeTransform(
    node: IWorkflowNode,
    _context: ExecutionContext,
    inputs: Record<string, any>
  ): Promise<any> {
    const transformations = node.data.configuration?.transformations || [];
    const output = { ...inputs };
