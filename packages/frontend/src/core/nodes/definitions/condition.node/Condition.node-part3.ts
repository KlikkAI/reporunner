default:
return false;
}
          })

conditionResult = logic === 'AND' ? ruleResults.every((r) => r) : ruleResults.some((r) => r)
}
      }

if (conditionResult) {
  results.true.push(item);
} else {
  results.false.push(item);
}
}

return [results.true, results.false];
}
}
