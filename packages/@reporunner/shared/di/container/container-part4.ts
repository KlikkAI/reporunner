return target;
}
}

// Factory decorator
export function Factory(identifier: symbol) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const factory = descriptor.value;

    setTimeout(() => {
      container.register({
        identifier,
        implementation: null,
        factory,
      });
    }, 0);

    return descriptor;
  };
}
