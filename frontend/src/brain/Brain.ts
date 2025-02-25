import {
  CheckHealthData,
  GetTokenDetailsData,
  GetTokenDetailsError,
  GetTokenDetailsParams,
  GetTokensData,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get list of tokens with their details
   *
   * @tags dbtn/module:tokens
   * @name get_tokens
   * @summary Get Tokens
   * @request GET:/routes/tokens
   */
  get_tokens = (params: RequestParams = {}) =>
    this.request<GetTokensData, any>({
      path: `/routes/tokens`,
      method: "GET",
      ...params,
    });

  /**
   * @description Get detailed information for a specific token
   *
   * @tags dbtn/module:tokens
   * @name get_token_details
   * @summary Get Token Details
   * @request GET:/routes/tokens/{token_address}
   */
  get_token_details = ({ tokenAddress, ...query }: GetTokenDetailsParams, params: RequestParams = {}) =>
    this.request<GetTokenDetailsData, GetTokenDetailsError>({
      path: `/routes/tokens/${tokenAddress}`,
      method: "GET",
      ...params,
    });
}
