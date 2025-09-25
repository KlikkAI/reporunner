return new Date(value) < new Date(condition.value);
case 'after':
return new Date(value) > new Date(condition.value);
default:
return false;
}
  })
}

export const getContextValue = (context: any, type: string): any => {
  switch (type) {
    case 'time':
      return Date.now();
    case 'ip':
      return context?.ipAddress;
    case 'location':
      return context?.location;
    case 'device':
      return context?.device;
    default:
      return context?.[type];
  }
};

// Role hierarchy utilities
export const getRoleLevel = (roleName: string): number => {
  const roleLevels: Record<string, number> = {
    owner: 10,
    admin: 8,
    manager: 6,
    editor: 4,
    viewer: 2,
    guest: 1,
  };
  return roleLevels[roleName] || 0;
};

export const canManageRole = (userRole: string, targetRole: string): boolean => {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
};

export const getAvailableRoles = (userRole: string): string[] => {
  const userLevel = getRoleLevel(userRole);
  const allRoles = ['owner', 'admin', 'manager', 'editor', 'viewer', 'guest'];
  return allRoles.filter((role) => getRoleLevel(role) < userLevel);
};
