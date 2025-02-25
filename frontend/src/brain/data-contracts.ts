/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/**
 * Token
 * Model for token information
 */
export interface Token {
  /** Name */
  name: string;
  /** Symbol */
  symbol: string;
  /** Market Cap */
  market_cap: number;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Bonded At */
  bonded_at?: string | null;
  /** Model for token price and volume metrics */
  metrics: TokenMetrics;
  /** Chain Id */
  chain_id?: string | null;
  /** Token Address */
  token_address?: string | null;
  /** Icon */
  icon?: string | null;
  /** Description */
  description?: string | null;
  /** Links */
  links?: TokenLink[] | null;
}

/**
 * TokenLink
 * Model for token links
 */
export interface TokenLink {
  /** Type */
  type: string;
  /** Label */
  label: string;
  /** Url */
  url: string;
}

/**
 * TokenList
 * Model for list of tokens
 */
export interface TokenList {
  /** Tokens */
  tokens: Token[];
  /** Total */
  total: number;
  /** Cached */
  cached: boolean;
}

/**
 * TokenMetrics
 * Model for token price and volume metrics
 */
export interface TokenMetrics {
  /** Five Min Price */
  five_min_price?: number | null;
  /** One Hour Price */
  one_hour_price?: number | null;
  /** Six Hour Price */
  six_hour_price?: number | null;
  /** Twenty Four Hour Price */
  twenty_four_hour_price?: number | null;
  /** Five Min Volume */
  five_min_volume?: number | null;
  /** One Hour Volume */
  one_hour_volume?: number | null;
  /** Six Hour Volume */
  six_hour_volume?: number | null;
  /** Twenty Four Hour Volume */
  twenty_four_hour_volume?: number | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export type GetTokensData = TokenList;

export interface GetTokenDetailsParams {
  /** Token Address */
  tokenAddress: string;
}

export type GetTokenDetailsData = Token;

export type GetTokenDetailsError = HTTPValidationError;
