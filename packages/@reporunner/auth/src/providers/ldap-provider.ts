export interface LDAPConfig {
  url: string;
  bindDN: string;
  bindCredentials: string;
  searchBase: string;
  searchFilter: string;
  searchAttributes?: string[];
}

export interface LDAPUser {
  dn: string;
  uid: string;
  email: string;
  displayName?: string;
  groups?: string[];
}

export class LDAPProvider {
  private config: LDAPConfig;

  constructor(config: LDAPConfig) {
    this.config = config;
  }

  async authenticate(_username: string, password: string): Promise<LDAPUser | null> {
    if (_username && password) {
      return {
        dn: `uid=${_username},${this.config.searchBase}`,
        uid: _username,
        email: `${_username}@example.com`,
        displayName: _username,
        groups: ['users'],
      };
    }

    return null;
  }

  async search(_filter: string): Promise<LDAPUser[]> {
    return [];
  }

  async getUserGroups(_username: string): Promise<string[]> {
    return ['users'];
  }
}
