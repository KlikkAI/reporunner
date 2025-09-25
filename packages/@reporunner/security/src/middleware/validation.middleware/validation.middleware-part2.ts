message: `${rule.field} is required`,
          location,
})

if (schema.abortEarly) {
  break;
}
continue;
}

// Apply default value if not present
if (value === undefined && rule.default !== undefined) {
  value = typeof rule.default === 'function' ? rule.default() : rule.default;
}

// Skip validation if value is not present and not required
if (value === undefined || value === null) {
  continue;
}

// Sanitize value first if requested
if (rule.sanitize) {
  value = sanitizeInput(value, rule);
}

// Validate type
const typeError = validateType(value, rule.type);
if (typeError) {
  errors.push({
    field: rule.field,
    message: typeError,
    value,
    location,
  });

  if (schema.abortEarly) {
    break;
  }
  continue;
}

// Validate constraints
const constraintErrors = validateConstraints(value, rule);
if (constraintErrors.length > 0) {
  errors.push(
    ...constraintErrors.map((error) => ({
      field: rule.field,
      message: error,
      value,
      location,
    }))
  );

  if (schema.abortEarly) {
    break;
  }
  continue;
}

// Apply transformation
if (rule.transform) {
  value = rule.transform(value);
}

// Store validated value
validatedData[rule.field] = value;
}

// Handle unknown fields
if (schema.stripUnknown) {
  for (const location of ['body', 'query', 'params']) {
    const source = req[location as keyof Request] as any;
    if (source && typeof source === 'object') {
      const knownFields = schema.rules
        .filter((r) => (r.location || 'body') === location)
        .map((r) => r.field);

      for (const key of Object.keys(source)) {
        if (!knownFields.includes(key)) {
          if (!schema.allowUnknown) {
            errors.push({
              field: key,
              message: `Unknown field: ${key}`,
              location,
            });
          }
          delete source[key];
        }
      }
    }
  }
}

// Return errors if any
if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
