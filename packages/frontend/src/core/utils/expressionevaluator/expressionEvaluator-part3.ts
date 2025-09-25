static
extractAllExpressions(text: string)
: string[]
{
  const expressions: string[] = [];
  const regex = /\{\{(.*?)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    expressions.push(match[1].trim());
  }

  return expressions;
}

// Evaluate single expression
evaluate(expression: string)
: any
{
  if (!ExpressionEvaluator.isExpression(expression)) {
    return expression;
  }

  try {
    const content = ExpressionEvaluator.extractExpressionContent(expression);
    const type = ExpressionEvaluator.detectExpressionType(expression);

    switch (type) {
      case ExpressionType.SIMPLE:
        return this.evaluateSimpleExpression(content);
      case ExpressionType.COMPLEX:
        return this.evaluateComplexExpression(content);
      case ExpressionType.CONDITIONAL:
        return this.evaluateConditionalExpression(content);
      case ExpressionType.FUNCTION_CALL:
        return this.evaluateFunctionExpression(content);
      default:
        return this.evaluateGenericExpression(content);
    }
  } catch (_error) {
    return expression; // Return original if evaluation fails
  }
}

// Evaluate simple field access: $json.field
private
evaluateSimpleExpression(content: string)
: any
{
  const path = content.trim();
  return this.resolvePath(path);
}

// Evaluate complex expressions with operators
private
evaluateComplexExpression(content: string)
: any
{
  // Replace variable references with actual values
  let processedContent = content;

  // Find all variable references
  const variables = this.extractVariableReferences(content);

  for (const variable of variables) {
    const value = this.resolvePath(variable);
    const serializedValue = this.serializeValue(value);
    processedContent = processedContent.replace(
      new RegExp(`\\$${variable.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`, 'g'),
      serializedValue
    );
  }

  // Safely evaluate the expression
  return this.safeEval(processedContent);
}

// Evaluate conditional expressions: condition ? true : false
private
evaluateConditionalExpression(content: string)
: any
{
  const parts = content.split('?');
  if (parts.length !== 2) return content;

  const condition = parts[0].trim();
  const branches = parts[1].split(':');
  if (branches.length !== 2) return content;

  const trueValue = branches[0].trim();
  const falseValue = branches[1].trim();

  const conditionResult = this.evaluate(`{{ ${condition} }}`);
  const isTruthy = this.isTruthy(conditionResult);

  const selectedBranch = isTruthy ? trueValue : falseValue;
  return this.evaluate(`{{ ${selectedBranch} }}`);
}

// Evaluate function calls: $json.date.toDate()
private
evaluateFunctionExpression(content: string)
: any
{
  // This is a complex implementation - simplified version
  try {
    const processed = this.preprocessFunctions(content);
    return this.safeEval(processed);
  } catch (_error) {
    return this.evaluateGenericExpression(content);
  }
}

// Fallback generic evaluation
private
evaluateGenericExpression(content: string)
: any
{
    return this.resolvePath(content);
