import type { INodeProperty } from '@/core';
import type { INodePropertyOptions } from '../nodes/types';
import type { NodeProperty, PropertyOption } from '../types/dynamicProperties';

/**
 * Reverse Type adapters to convert from dynamic properties back to n8n-inspired types
 * Used to bridge existing property definitions to registry nodes
 */

/**
 * Convert PropertyOption to INodePropertyOptions
 */
function convertPropertyOptionToNodePropertyOptions(
  options: PropertyOption[]
): INodePropertyOptions[] {
  return options.map((option) => ({
    name: option.name,
    displayName: option.displayName || option.name,
    value: option.value || option.name,
    description: option.description,
    action: option.action,
  }));
}

/**
 * Convert PropertyType to n8n PropertyType
 */
function convertPropertyTypeToINodeType(type: string): string {
  // Map our dynamic property types back to n8n types
  const typeMap: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    select: 'options',
    multiSelect: 'multiOptions',
    text: 'text',
    json: 'json',
    dateTime: 'dateTime',
    collection: 'collection',
    fixedCollection: 'fixedCollection',
    color: 'color',
    file: 'file',
    resourceLocator: 'resourceLocator',
    credentialsSelect: 'credentialsSelect',
    expression: 'string', // expressions are stored as strings
  };

  return typeMap[type] || type;
}

/**
 * Convert NodeProperty to INodeProperty
 */
export function convertNodePropertyToINodeProperty(nodeProperty: NodeProperty): INodeProperty {
  const property: INodeProperty = {
    name: nodeProperty.name,
    displayName: nodeProperty.displayName,
    type: convertPropertyTypeToINodeType(nodeProperty.type) as any,
    description: nodeProperty.description,
    placeholder: nodeProperty.placeholder,
    default: nodeProperty.default,
    required: nodeProperty.required,
    noDataExpression: nodeProperty.noDataExpression,
    displayOptions: nodeProperty.displayOptions as any,
  };

  // Convert options if present
  if (nodeProperty.options) {
    property.options = convertPropertyOptionToNodePropertyOptions(nodeProperty.options);
  }

  // Handle type-specific conversions
  if (nodeProperty.typeOptions) {
    property.typeOptions = {
      multipleValues: nodeProperty.typeOptions.multipleValues,
      multipleValueButtonText: nodeProperty.typeOptions.multipleValueButtonText,
      minValue: nodeProperty.typeOptions.minValue,
      maxValue: nodeProperty.typeOptions.maxValue,
      numberStepSize: nodeProperty.typeOptions.numberStepSize,
      numberPrecision: nodeProperty.typeOptions.numberPrecision,
      alwaysOpenEditWindow: nodeProperty.typeOptions.alwaysOpenEditWindow,
      showAlpha: nodeProperty.typeOptions.showAlpha,
      loadOptionsMethod: nodeProperty.typeOptions.loadOptionsMethod,
    };
  }

  // Handle collection properties
  if (nodeProperty.values) {
    // For collection type, put sub-properties in 'values' NOT 'options'
    if (nodeProperty.type === 'collection') {
      property.values = nodeProperty.values.map(convertNodePropertyToINodeProperty);
    } else {
      // For other types, use the standard collection mapping
      property.collection = nodeProperty.values.map((collection) => ({
        name: collection.name,
        displayName: collection.displayName,
        values: collection.values?.map(convertNodePropertyToINodeProperty) || [],
      }));
    }
  }

  // Handle routing
  if (nodeProperty.routing) {
    property.routing = nodeProperty.routing as any;
  }

  // Handle credential types (specific to credentialsSelect)
  if (nodeProperty.type === 'credentialsSelect' && (nodeProperty as any).credentialTypes) {
    (property as any).credentialTypes = (nodeProperty as any).credentialTypes;
  }

  // Handle min/max for number types
  if (nodeProperty.type === 'number') {
    if ((nodeProperty as any).min !== undefined) {
      property.typeOptions = property.typeOptions || {};
      property.typeOptions.minValue = (nodeProperty as any).min;
    }
    if ((nodeProperty as any).max !== undefined) {
      property.typeOptions = property.typeOptions || {};
      property.typeOptions.maxValue = (nodeProperty as any).max;
    }
  }

  // Handle rows for text type
  if (nodeProperty.type === 'text' && (nodeProperty as any).rows) {
    property.typeOptions = property.typeOptions || {};
    property.typeOptions.rows = (nodeProperty as any).rows;
  }

  return property;
}

/**
 * Convert array of NodeProperty to array of INodeProperty
 */
export function convertNodePropertiesToINodeProperties(
  nodeProperties: NodeProperty[]
): INodeProperty[] {
  return nodeProperties.map(convertNodePropertyToINodeProperty);
}
