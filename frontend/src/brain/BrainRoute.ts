import { CheckHealthData, GetTokenDetailsData, GetTokensData } from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Get list of tokens with their details
   * @tags dbtn/module:tokens
   * @name get_tokens
   * @summary Get Tokens
   * @request GET:/routes/tokens
   */
  export namespace get_tokens {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTokensData;
  }

  /**
   * @description Get detailed information for a specific token
   * @tags dbtn/module:tokens
   * @name get_token_details
   * @summary Get Token Details
   * @request GET:/routes/tokens/{token_address}
   */
  export namespace get_token_details {
    export type RequestParams = {
      /** Token Address */
      tokenAddress: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTokenDetailsData;
  }
}
