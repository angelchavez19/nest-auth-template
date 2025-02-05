export interface GitHubUserCredentialsErrorI {
  error: string;
  error_description: string;
  error_uri: string;
}

export interface GithubUserCredentialsI {
  access_token: string;
  scope: string;
  token_type: string;
}

export interface GithubUserI {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: null;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: Date;
  updated_at: Date;
}

export interface GithubUserEmailI {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string;
}
