return inputData.map((item: any) => ({
          json: {
            ...item.json,
            [variableName]: variableValue,
            timestamp: new Date().toISOString(),
          },
        }));
}

      default:
return inputData;
}
  }
}
