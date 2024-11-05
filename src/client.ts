/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "https://api.changenow.io";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<T> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data.data;
    });
  };
}

/**
 * @title ChangeNOW
 * @version 1.0.0
 * @baseUrl https://api.changenow.io
 * @contact
 *
 * # Authentication
 *
 * Integrate the ChangeNOW exchange service using the
 *
 * <a href="https://changenow.io/">changenow.io</a>
 *
 * API.
 * To access the ChangeNOW API you need to generate an API key. You can get one in
 *
 * <a href="https://changenow.io/affiliate">your personal affiliate account</a>
 *
 * or by emailing us at
 *
 * [partners@changenow.io](https://mailto:partners@changenow.io)
 *
 * Please note that we offer the opportunity to add extra fields in the Create transaction request [for the standard](#dfe05b67-8453-462e-b4dd-fa4b0001c197) or [fixed-rate flow](#91302b9f-eb2d-4b71-a11f-825d63939f5f):
 *
 * - userId — a personal and permanent identifier under which information is stored in the database;
 *
 * - payload — object that can contain up to 5 arbitrary fields up to 64 characters long;
 *
 *
 * If you would like to enable these fields, please contact us at [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) with the subject line "Special partner fields".
 *
 * Note: In some cases, you might need a private API key. Those cases include situations when you can not guarantee the security of your standard API key, for example, when it is transferred onto the client-side or when someone else has access to it. To avoid the list of transactions that were conducted through your API getting public, you can use a private API key. To get it, please contact us at
 *
 * <a href="mailto:api@changenow.io"></a>
 *
 * <a href="https://mailto:partners@changenow.io">partners@changenow.io</a>
 *
 * After getting your private API key, you can use your standard API key for running all the API methods, except for the 'Get the transaction list' method. The 'Get the transaction' method can be called only with your private API key.
 *
 * **Rate limits**
 * Here are the rate limits for our API endpoints:
 * \- 1800 calls per minute
 * \- 30 calls per second
 *
 * # Work Flow
 *
 * <h4>Here is a simple work flow for the Standard Flow API:</h4>
 *
 * 1. API - Get a list of currently available currencies with the
 *
 *     <a href="#f5216aba-6a44-49eb-a075-ad4435aa40db">'List of available currencies'</a>
 *
 *     method;
 *
 * 2. UI - Ask a user for the currency pair to exchange. For example, BTC (Bitcoin) to ETH (Ethereum);
 *
 * 3. API - Get the minimum exchange amount for the selected currency pair with the
 *
 *     <a href="#6f50a577-8558-4f58-b90c-85dfaab42c81">'Minimal Exchange Amount'</a>
 *
 *     method;
 *
 * 4. UI - Ask a user for the amount to exchange and check if this amount is bigger than the minimum exchange amount;
 *
 * 5. API - Call the
 *
 *     <a href="#c95b63b2-03e1-4087-95cd-6b43c237dc7f">'Estimated Exchange Amount'</a>
 *
 *     method to get the estimated amount for the exchange (in our example, ETH estimated amount);
 *
 * 6. UI - Show a user the estimated exchange amount and ask for confirmation;
 *
 * 7. UI - Ask a user for their wallet address to send the funds after the exchange is completed (their refund address, extra ID, refund extra ID);
 *
 * 8. API - Call the
 *
 *     <a href="#dfe05b67-8453-462e-b4dd-fa4b0001c197">'Create Exchange Transaction'</a>
 *
 *     method to create an exchange and get the deposit address (in our example, the generated BTC wallet address is returned from this method);
 *
 * 9. UI - Ask a user to send the funds that they want to exchange to the generated deposit address (in our example, user has to send BTC coins);
 *
 * 10. UI - A user sends coins, ChangeNOW performs an exchange and makes a withdrawal to user address (in our example, to their ETH address);
 *
 * 11. API - With
 *
 *     <a href="#fa12244b-f879-4675-a6f7-553cc59435dc">'Transaction status'</a>
 *
 *     you can get the transaction status and display it to a user for them to obtain all the info on the exchange.
 *
 *
 * <h5>Scheme Of Using ChangeNOW's API For The Standard Flow</h5>
 *
 * <img src="http://changenow.io/images/partners/assets/api/standard-flow.png">
 *
 * <h4>Here is a simple work flow for the Fixed-Rate Flow API:</h4>
 *
 * 1. API - Get the list of currently available currencies with the
 *
 *     <a href="#f5216aba-6a44-49eb-a075-ad4435aa40db">'List of available currencies'</a>
 *
 *     method. Use _fixedRate=true_ request parameter.
 *
 * 2. UI - Ask a user to select a pair to exchange. For example, BTC (Bitcoin) to ETH (Ethereum);
 *
 * 3. API - Ask a user for the amount to exchange and check if this amount is bigger than the minimum exchange amount and less than the maximum amount (minimum and maximum exchange amounts may be obtained from the
 *
 *     <a href="#e81140f2-f341-41d4-8f91-94eee733fdd2">'Exchange range fixed-rate'</a>
 *
 *     method);
 *
 * 4. API - Call the
 *
 *     <a href="#b61164cf-a1bd-4448-9cd1-62f6252b8d8c">'Estimated fixed-rate exchange amount'</a>
 *
 *     method to get the estimated amount for the exchange (in our example, the ETH estimated amount).
 *
 * 5. UI - Show a user the estimated exchange amount and ask for confirmation;
 *
 * 6. UI - Inform a user that a deposit must be made within a certain timeframe (20 minutes), otherwise exchange will not proceed;
 *
 * 7. UI - Ask a user for their wallet address to send the funds after the exchange is completed (their refund address, extra ID, refund extra ID);
 *
 * 8. API - Call the
 *
 *     <a href="#91302b9f-eb2d-4b71-a11f-825d63939f5f">'Create fixed-rate exchange'</a>
 *
 *     method to create an exchange and get the deposit address (in our example, the generated BTC wallet address is returned from this method). The deposit must be made within a certain timeframe (20 minutes), otherwise exchange will not proceed;
 *
 * 9. UI - Ask a user to send the funds that they want to exchange to the deposit address within a certain time frame (in our example, user has to send BTC);
 *
 * 10. UI - A user sends coins, ChangeNOW performs an exchange and makes a withdrawal to user address (in our example, to their ETH address);
 *
 * 11. API - With
 *
 *     <a href="#fa12244b-f879-4675-a6f7-553cc59435dc">'Transaction status'</a>
 *
 *     you can get the transaction status and display it to a user for them to obtain all the info on the exchange.
 *
 *
 * <h5>Scheme Of Using ChangeNOW's API For The Fixed-Rate Flow</h5>
 *
 * <img src="https://content-api.changenow.io/uploads/FR_first_9e4faf4b97.png">
 *
 * # API Documentation
 */
export class ChangeNowClient<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  v1 = {
    /**
     * @description This API endpoint returns the list of available currencies. Some currencies get enabled or disabled from time to time, so make sure to refresh the list occasionally. <h3>Successful response:</h3> <p>The response contains an array of objects with currency information.</p> <h5>Successful response fields</h5> <table> <tr> <td><b>Name</b></td> <td><b>Type</b></td> <td><b>Description</b></td> </tr> <tr> <td><b><i>ticker</i></b></td> <td><i>String</i></td> <td>Currency ticker</td> </tr> <tr> <td><b><i>name</i></b></td> <td><i>String</i></td> <td>Currency name</td> </tr> <tr> <td><b><i>image</i></b></td> <td><i>String</i></td> <td>Currency logo url</td> </tr> <tr> <td><b><i>hasExternalId</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency has an Extra ID</td> </tr> <tr> <td><b><i>isFiat</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is a fiat currency (EUR, USD)</td> </tr> <tr> <td><b><i>featured</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is popular</td> </tr> <tr> <td><b><i>isStable</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is stable</td> </tr> <tr> <td><b><i>supportsFixedRate</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is available on a fixed-rate flow</td> </tr> </table> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Common
     * @name ListOfAvailableCurrencies
     * @summary List of available currencies
     * @request GET:/v1/currencies
     * @secure
     */
    listOfAvailableCurrencies: (
      query?: {
        /**
         * (Optional) Set true to return only active currencies
         * @example "true"
         */
        active?: string;
        /**
         * (Optional) Set true to return only  for the currencies  available on a fixed-rate flow
         * @example "true"
         */
        fixedRate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          featured?: boolean;
          /** @example false */
          hasExternalId?: boolean;
          /** @example "https://changenow.io/images/coins/btc.svg" */
          image?: string;
          /** @example false */
          isFiat?: boolean;
          /** @example false */
          isStable?: boolean;
          /** @example "Bitcoin" */
          name?: string;
          /** @example true */
          supportsFixedRate?: boolean;
          /** @example "btc" */
          ticker?: string;
        }[],
        any
      >({
        path: `/v1/currencies`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns the array of markets available for the specified currency be default. The availability of a particular pair is determined by the 'isAvailable' field. Some currencies get enabled or disabled from time to time, so make sure to refresh the list occasionally. <h3>Successful response:</h3> <p>The response contains an array of objects with currencies information.</p> <h5>Successful response fields</h5> <table> <tr> <td><b>Name</b></td> <td><b>Type</b></td> <td><b>Description</b></td> </tr> <tr> <td><b><i>ticker</i></b></td> <td><i>String</i></td> <td>Currency ticker</td> </tr> <tr> <td><b><i>name</i></b></td> <td><i>String</i></td> <td>Currency name</td> </tr> <tr> <td><b><i>image</i></b></td> <td><i>String</i></td> <td>Currency logo url</td> </tr> <tr> <td><b><i>hasExternalId</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency has an Extra ID</td> </tr> <tr> <td><b><i>isFiat</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is a fiat currency (EUR, USD)</td> </tr> <tr> <td><b><i>featured</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is popular</td> </tr> <tr> <td><b><i>isStable</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is stable</td> </tr> <tr> <td><b><i>supportsFixedRate</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is available on a fixed-rate flow</td> </tr> <tr> <td><b><i>isAvailable</i></b></td> <td><i>Boolean</i></td> <td>Indicates whether the pair is currently supported by our service</td> </tr> </table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Common
     * @name ListOfAvailableCurrenciesForASpecificCurrency
     * @summary List of available currencies for a specific currency
     * @request GET:/v1/currencies-to/{ticker}
     * @secure
     */
    listOfAvailableCurrenciesForASpecificCurrency: (
      ticker: string,
      query?: {
        /**
         * (Optional) Set true to return only for the currencies available on a fixed-rate flow
         * @example "true"
         */
        fixedRate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          featured?: boolean;
          /** @example false */
          hasExternalId?: boolean;
          /** @example "https://changenow.io/images/coins/eth.svg" */
          image?: string;
          /** @example true */
          isAvailable?: boolean;
          /** @example false */
          isFiat?: boolean;
          /** @example false */
          isStable?: boolean;
          /** @example "Ethereum" */
          name?: string;
          /** @example true */
          supportsFixedRate?: boolean;
          /** @example "eth" */
          ticker?: string;
        }[],
        {
          /** @example "page_not_found" */
          error?: string;
        }
      >({
        path: `/v1/currencies-to/${ticker}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This method returns the name of the coin, the coin's main features (such as anonymity, the need for Extra ID, and logo), and the coin's supported wallets. <h3>Successful response:</h3> <p>The response contains an object with currency information.</p> <h5>Successful response fields</h5> <table> <tr> <td><b>Name</b></td> <td><b>Type</b></td> <td><b>Description</b></td> </tr> <tr> <td><b><i>ticker</i></b></td> <td><i>String</i></td> <td>Currency ticker</td> </tr> <tr> <td><b><i>name</i></b></td> <td><i>String</i></td> <td>Currency name</td> </tr> <tr> <td><b><i>image</i></b></td> <td><i>String</i></td> <td>Currency logo url</td> </tr> <tr> <td><b><i>warnings</i></b></td> <td><i>String</i></td> <td>Some warnings like warnings that transactions on this network take longer or that the currency has moved to another network. Field “from” for warnings in case of exchange of this currency and field “to” for warnings in case of exchange for this currency, respectively</td> </tr> <tr> <td><b><i>hasExternalId</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency has an Extra ID</td> </tr> <tr> <td><b><i>isFiat</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency is a fiat currency (EUR, USD)</td> </tr> <tr> <td><b><i>isAnonymous</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a currency has the ability to hide their transactions. This means that even if you know someone’s address, you won’t be able to recognize the balance and receive information about transactions without additional information (e.g. XMR)</td> </tr> <tr> <td><b><i>wallets</i></b></td> <td><i>Object</i></td> <td>This field contains a list of primary and secondary wallets. For each wallet, this endpoint returns the name, url, logo url, supported platforms, degree of anonymity, degree of security, application weight and indicates if the wallet supports different currencies</td> </tr> <tr> <td><b><i>addressExplorerMask</i></b></td> <td><i>String</i></td> <td>This field helps to create a link for the wallet address. Wallet address url = this field.replace('$$', payinAddress or payoutAddress from the <a href="#fa12244b-f879-4675-a6f7-553cc59435dc">Transaction status API endpoint</a>)</td> </tr> <tr> <td><b><i>transactionExplorerMask</i></b></td> <td><i>String</i></td> <td>This field helps to create a link for the transaction hash. Transaction hash url = this field.replace('$$', payinHash or payoutHash from the <a href="#fa12244b-f879-4675-a6f7-553cc59435dc">Transaction status API endpoint</a>) </td> </tr> </table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Common
     * @name CurrencyInfo
     * @summary Currency info
     * @request GET:/v1/currencies/{ticker}
     * @secure
     */
    currencyInfo: (ticker: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "https://www.blockchain.com/btc/address/$$" */
          addressExplorerMask?: string;
          /** @example false */
          hasExternalId?: boolean;
          /** @example "https://changenow.io/images/coins/btc.svg" */
          image?: string;
          /** @example false */
          isAnonymous?: boolean;
          /** @example false */
          isFiat?: boolean;
          /** @example "Bitcoin" */
          name?: string;
          /** @example "btc" */
          ticker?: string;
          /** @example "https://blockchain.info/tx/$$" */
          transactionExplorerMask?: string;
          wallets?: {
            /** @example [{"imageUrl":"https://changenow.io/uploads/wallets/b7ZsfbwiwgGedKOT.png","multi":false,"name":"BTC Guarda","platforms":{"android":false,"chromeos":false,"ios":false,"linux":true,"macos":true,"web":true,"windows":true},"properties":{"anonymity":"High","security":"High","weight":""},"url":"https://guarda.co/"}] */
            primary?: {
              /** @example "https://changenow.io/uploads/wallets/b7ZsfbwiwgGedKOT.png" */
              imageUrl?: string;
              /** @example false */
              multi?: boolean;
              /** @example "BTC Guarda" */
              name?: string;
              platforms?: {
                /** @example false */
                android?: boolean;
                /** @example false */
                chromeos?: boolean;
                /** @example false */
                ios?: boolean;
                /** @example true */
                linux?: boolean;
                /** @example true */
                macos?: boolean;
                /** @example true */
                web?: boolean;
                /** @example true */
                windows?: boolean;
              };
              properties?: {
                /** @example "High" */
                anonymity?: string;
                /** @example "High" */
                security?: string;
                /** @example "" */
                weight?: string;
              };
              /** @example "https://guarda.co/" */
              url?: string;
            }[];
            /** @example [{"imageUrl":"https://changenow.io/uploads/wallets/NH_Re2o91T_uUgLT.svg","multi":true,"name":"Jaxx","platforms":{"android":true,"chromeos":true,"ios":true,"linux":true,"macos":true,"windows":true},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://jaxx.io/"},{"imageUrl":"https://changenow.io/uploads/wallets/tet9_ylzVbt6HfXH.svg","multi":false,"name":"Electrum","platforms":{"android":true,"chromeos":false,"ios":false,"linux":true,"macos":true,"windows":true},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://electrum.org/#home"},{"imageUrl":"https://changenow.io/uploads/wallets/As3dajXLL4luF7b1.svg","multi":false,"name":"Bitcoin Wallet","platforms":{"android":true,"chromeos":false,"ios":false,"linux":false,"macos":false,"windows":false},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://play.google.com/store/apps/details?id=de.schildbach.wallet"},{"imageUrl":"https://changenow.io/uploads/wallets/8YWrcAV4shyiuwM9.png","multi":true,"name":"Exodus","platforms":{"android":false,"chromeos":false,"ios":false,"linux":true,"macos":true,"windows":true},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://www.exodus.io/"},{"imageUrl":"https://changenow.io/uploads/wallets/4zc5TQsOF3oxfZBg.png","multi":false,"name":"Bitcoin Knots","platforms":{"android":false,"chromeos":false,"ios":false,"linux":true,"macos":true,"windows":true},"properties":{"anonymity":"High","security":"High","weight":"~ 170 GB"},"url":"https://bitcoinknots.org/"},{"imageUrl":"https://changenow.io/uploads/wallets/gZkk1gWlUElDrm70.svg","multi":false,"name":"Bitcoin Core","platforms":{"android":false,"chromeos":false,"ios":false,"linux":true,"macos":true,"windows":true},"properties":{"anonymity":"High","security":"High","weight":"~ 170 GB"},"url":"https://bitcoin.org/en/download"},{"imageUrl":"https://changenow.io/uploads/wallets/hxmCBY9UvN46RAQy.png","multi":false,"name":"Strong Coin","platforms":{"android":false,"chromeos":true,"ios":false,"linux":false,"macos":false,"windows":false},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://strongcoin.com"},{"imageUrl":"https://changenow.io/uploads/wallets/JOlcngQWuOIpEcje.png","multi":false,"name":"coinbase","platforms":{"android":false,"chromeos":true,"ios":false,"linux":false,"macos":false,"windows":false},"properties":{"anonymity":"Low","security":"Low","weight":""},"url":"https://www.coinbase.com/"},{"imageUrl":"https://changenow.io/uploads/wallets/X3MTjfT_Lb8hbEl6.png","multi":false,"name":"Mobi","platforms":{"android":true,"chromeos":false,"ios":true,"linux":false,"macos":false,"windows":false},"properties":{"anonymity":"Low","security":"Low","weight":""},"url":"https://www.mobi.me/"},{"imageUrl":"https://changenow.io/uploads/wallets/x3pwL4YMy9p54Y0_.svg","multi":false,"name":"Melis","platforms":{"android":true,"chromeos":true,"ios":true,"linux":true,"macos":true,"windows":true},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://www.melis.io/"},{"imageUrl":"https://changenow.io/uploads/wallets/36LQevZK4OR_v-mB.png","multi":false,"name":"Bitpay","platforms":{"android":true,"chromeos":false,"ios":true,"linux":true,"macos":true,"windows":true},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://bitpay.com/"},{"imageUrl":"https://changenow.io/uploads/wallets/jheyBRBINM-IWAJj.png","multi":true,"name":"Atomic","platforms":{"android":false,"chromeos":false,"ios":false,"linux":true,"macos":true,"web":false,"windows":true},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://atomicwallet.io/"},{"imageUrl":"https://changenow.io/uploads/wallets/IrH0nxrkr6YZOtAP.png","multi":false,"name":"Bitcoin.com Wallet","platforms":{"android":true,"chromeos":false,"ios":true,"linux":true,"macos":true,"web":false,"windows":true},"properties":{"anonymity":"Medium","security":"Medium","weight":""},"url":"https://wallet.bitcoin.com/"}] */
            secondary?: {
              /** @example "https://changenow.io/uploads/wallets/NH_Re2o91T_uUgLT.svg" */
              imageUrl?: string;
              /** @example true */
              multi?: boolean;
              /** @example "Jaxx" */
              name?: string;
              platforms?: {
                /** @example true */
                android?: boolean;
                /** @example true */
                chromeos?: boolean;
                /** @example true */
                ios?: boolean;
                /** @example true */
                linux?: boolean;
                /** @example true */
                macos?: boolean;
                /** @example false */
                web?: boolean;
                /** @example true */
                windows?: boolean;
              };
              properties?: {
                /** @example "Medium" */
                anonymity?: string;
                /** @example "Medium" */
                security?: string;
                /** @example "" */
                weight?: string;
              };
              /** @example "https://jaxx.io/" */
              url?: string;
            }[];
          };
          warnings?: {
            /** @example "" */
            from?: string;
            /** @example "" */
            to?: string;
          };
        },
        {
          /** @example "page_not_found" */
          error?: string;
        }
      >({
        path: `/v1/currencies/${ticker}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns the transactions initiated by users. The transactions are sorted by the time they were last updated in ascending order (i.e. status update time). **Note:** If your API key transmitted to the client side or is not private for any other reasons, you can get a private key. In this case, you can call this method only using your private key, the list of transactions will not be available using the API key. For other methods, you can use a standart API key. If you want to get a private key, please, email us at <a href="mailto:api@changenow.io"></a><a rel="noreferrer noopener nofollow" href="https://mailto:partners@changenow.io" target="_blank" url="mailto:partners@changenow.io">partners@changenow.io</a> . <h3>Successful response:</h3> <p>The response contains an array of objects with the info about the transactions.</p> Response fields vary depending on the status and type of transaction. <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>status</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction status:<br>new,<br>waiting,<br>confirming,<br>exchanging,<br>sending,<br>finished,<br>failed,<br>refunded,<br>verifying<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinHash</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction hash in the blockchain of the currency that you specified in the fromCurrency field that you send when creating the transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutHash</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction hash in the blockchain of the currency that you specified in the toCurrency field. We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The wallet address that will recieve the exchanged funds</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID that you send when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amountSend</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Amount you send</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amountReceive</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Amount you receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>tokensDestination</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Wallet address to receive NOW tokens upon exchange<br>Note: this field is currently not relevant. All allocated coins were distributed.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund address (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>ExtraId for refund (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>validUntil</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time of transaction validity</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>id</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>You can use it to get transaction status at the <a rel="noreferrer noopener nofollow" href="#fa12244b-f879-4675-a6f7-553cc59435dc" target="_self" url="#fa12244b-f879-4675-a6f7-553cc59435dc">Transaction status API endpoint</a></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>updatedAt</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time of the last transaction update (e.g. status update)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>verificationSent</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if a transaction has been sent for verification</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>expectedSendAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The amount you want to send<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>expectedReceiveAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Estimate based on the field <i>expectedSendAmount</i>.<br>Formula for calculating the estimated amount is given below</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> - Formula for the estimated amount ``` estimatedAmount = (rate * amount) - networkFee ``` <h3>Request Parameters:</h3>
     *
     * @tags API v1, Common
     * @name ListOfTransactions
     * @summary List of transactions
     * @request GET:/v1/transactions/{api_key}
     * @secure
     */
    listOfTransactions: (
      apiKey: string,
      query?: {
        /**
         * (Optional) Set a ticker of a payin currency to filter transactions
         * @example "btc"
         */
        from?: string;
        /**
         * (Optional) Set a ticker of a payout currency to filter transactions
         * @example "eth"
         */
        to?: string;
        /**
         * (Optional) Set a transaction status (available statuses below) to filter transactions
         *
         * Possible transaction statuses
         *
         * * new
         * * waiting
         * * confirming
         * * exchanging
         * * sending
         * * finished
         * * failed
         * * refunded
         * * verifying
         * @example "waiting"
         */
        status?: string;
        /**
         * (Optional) Limit of transactions to return (default: 10)
         *
         * Note:  You can only specify limit bigger than 0 and less than 100
         * @example "50"
         */
        limit?: string;
        /**
         * (Optional) Number of transactions to skip (default: 0)
         *
         * Note:  You can only specify offset bigger than 0
         * @example "0"
         */
        offset?: string;
        /**
         * (Optional) Set a date to filter transactions created after this specified date.
         *
         * Format: YYYY-MM-DDTHH:mm:ss.sssZ
         * @example ""
         */
        dateFrom?: string;
        /**
         * (Optional) Set a date to filter transactions created before this specified date.
         *
         * Format: YYYY-MM-DDTHH:mm:ss.sssZ
         * @example ""
         */
        dateTo?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 51.1593658 */
          expectedReceiveAmount?: number;
          /** @example 1 */
          expectedSendAmount?: number;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "5d80d184a53a73" */
          id?: string;
          /** @example "3NPcAGmzggbPn6BpARxyauHYC6oLBaiStN" */
          payinAddress?: string;
          /** @example "0xdddddddddddddddddddddddddddddddddddddddd" */
          payoutAddress?: string;
          /** @example "waiting" */
          status?: string;
          /** @example "eth" */
          toCurrency?: string;
          /** @example "2019-08-22T17:34:06.124Z" */
          updatedAt?: string;
        }[],
        any
      >({
        path: `/v1/transactions/${apiKey}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint creates a transaction, generates an address for sending funds and returns transaction attributes. **Note:** we also give the opportunity to transfer additional fields in the "Create exchange transaction" method, which we return in the ["Transaction status"](#fa12244b-f879-4675-a6f7-553cc59435dc) method. Аdditional fields that can be transferred include: - userId — a personal and permanent identifier under which information is stored in the database; - payload — object that can contain up to 5 arbitrary fields up to 64 characters long; If you would like to enable these fields, please contact us at [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) with the subject line "Special partner fields". <h3>Successful response:</h3> <p>The response contains an object with transaction information.</p> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>id</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>You can use it to get transaction status at the<a rel="noreferrer noopener nofollow" href="#fa12244b-f879-4675-a6f7-553cc59435dc" target="_self" url="#fa12244b-f879-4675-a6f7-553cc59435dc">Transaction status API endpoint</a></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The wallet address that will recieve the exchanged funds</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID that you send when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Amount of currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund address (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund Extra ID (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraIdName</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Field name currency Extra ID (e.g. Memo, Extra ID)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3> In this method you need to send the request body as JSON. This is an example of what json request should look like ``` { "from": "btc", "to": "eth", "address": "0x57f31ad4b64095347F87eDB1675566DAfF5EC886", "amount": "12.346", "extraId": "", "refundAddress" : "", "refundExtraId": "", "userId": "", "payload": "", "contactEmail": "" } ```
     *
     * @tags API v1, Standard Flow (Floating Rate)
     * @name CreateExchangeTransaction
     * @summary Create exchange transaction
     * @request POST:/v1/transactions/{api_key}
     */
    createExchangeTransaction: (
      apiKey: string,
      data: {
        /** @example "r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV" */
        address?: string;
        /** @example "1.34567" */
        amount?: string;
        /** @example "example@example.com" */
        contactEmail?: string;
        /** @example "123456789" */
        extraId?: string;
        /** @example "btc" */
        from?: string;
        /** @example "1Nh7uHdvY6fNwtQtM1G5EZAFPLC33B59rB" */
        refundAddress?: string;
        /** @example "" */
        refundExtraId?: string;
        /** @example "xrp" */
        to?: string;
        /** @example "" */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 74.7999317 */
          amount?: number;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "33d9b8e1867579" */
          id?: string;
          /** @example "328E95juhLbXeDDVDR9thh58MtCsnKuvf6" */
          payinAddress?: string;
          /** @example "0x57f31ad4b64095347F87eDB1675566DAfF5EC886" */
          payoutAddress?: string;
          /** @example "" */
          payoutExtraId?: string;
          /** @example "Destination tag" */
          payoutExtraIdName?: string;
          /** @example "" */
          refundAddress?: string;
          /** @example "" */
          refundExtraId?: string;
          /** @example "eth" */
          toCurrency?: string;
        },
        {
          /** @example "out_of_range" */
          error?: string;
          /** @example "Amount is less then minimal: 0.002644 BTC" */
          message?: string;
        }
      >({
        path: `/v1/transactions/${apiKey}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns the status and additional information of a single transaction. Transaction ID is taken from the 'Create transaction' request on the <a href="#dfe05b67-8453-462e-b4dd-fa4b0001c197">standart flow</a> or <a href="#91302b9f-eb2d-4b71-a11f-825d63939f5f">fixed-rate flow</a> . <h3>Successful response:</h3> <p>The response contains an object with transaction information.</p> <p>Fields in the response vary depending on the status and a type of the transaction.</p> <h5>Successful response fields</h5> <table><tbody><tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Description</b></td></tr><tr><td><i><b>status</b></i></td><td><i>String</i></td><td>Transaction status:<br>new,<br>waiting,<br>confirming,<br>exchanging,<br>sending,<br>finished,<br>failed,<br>refunded,<br>verifying<br></td></tr><tr><td><i><b>payinAddress</b></i></td><td><i>String</i></td><td>We generate it when creating a transaction</td></tr><tr><td><i><b>payoutAddress</b></i></td><td><i>String</i></td><td>The wallet address that will recieve the exchanged funds</td></tr><tr><td><i><b>fromCurrency</b></i></td><td><i>String</i></td><td>Ticker of the currency you want to exchange</td></tr><tr><td><i><b>toCurrency</b></i></td><td><i>String</i></td><td>Ticker of the currency you want to receive</td></tr><tr><td><i><b>id</b></i></td><td><i>String</i></td><td>Transaction ID</td></tr><tr><td><i><b>updatedAt</b></i></td><td><i>String</i></td><td>Date and time of the last transaction update (e.g. status update)</td></tr><tr><td><i><b>expectedSendAmount</b></i></td><td><i>Number</i></td><td>The amount you want to send</td></tr><tr><td><i><b>expectedReceiveAmount</b></i></td><td><i>Number</i></td><td>Estimate based on the field <i>expectedSendAmount</i>.<br>Formula for calculating the estimated amount is given below</td></tr><tr><td><i><b>createdAt</b></i></td><td><i>String</i></td><td>Transaction creation date and time</td></tr><tr><td><i><b>isPartner</b></i></td><td><i>Boolean</i></td><td>Indicates if transactions are affiliate</td></tr><tr><td><i><b>depositReceivedAt</b></i></td><td><i>String</i></td><td>Deposit receiving date and time</td></tr><tr><td><i><b>payinExtraIdName</b></i></td><td><i>String</i></td><td>Field name currency Extra ID (e.g. Memo, Extra ID)</td></tr><tr><td><i><b>payoutExtraIdName</b></i></td><td><i>String</i></td><td>Field name currency Extra ID (e.g. Memo, Extra ID)</td></tr><tr><td><i><b>payinHash</b></i></td><td><i>String</i></td><td>Transaction hash in the blockchain of the currency which you specified in the fromCurrency field that you send when creating the transaction</td></tr><tr><td><i><b>payoutHash</b></i></td><td><i>String</i></td><td>Transaction hash in the blockchain of the currency which you specified in the toCurrency field. We generate it when creating a transaction</td></tr><tr><td><i><b>payinExtraId</b></i></td><td><i>String</i></td><td>We generate it when creating a transaction</td></tr><tr><td><i><b>payoutExtraId</b></i></td><td><i>String</i></td><td>Extra ID that you send when creating a transaction</td></tr><tr><td><i><b>amountSend</b></i></td><td><i>Number</i></td><td>Amount you send</td></tr><tr><td><i><b>amountReceive</b></i></td><td><i>Number</i></td><td>Amount you receive<br></td></tr><tr><td><i><b>tokensDestination</b></i></td><td><i>String</i></td><td>Wallet address to receive NOW tokens upon exchange</td></tr><tr><td><i><b>refundAddress</b></i></td><td><i>String</i></td><td>Refund address (if you specified it)</td></tr><tr><td><i><b>refundExtraId</b></i></td><td><i>String</i></td><td>ExtraId for refund (if you specified it)</td></tr><tr><td><i><b>validUntil</b></i></td><td><i>String</i></td><td>Date and time of transaction validity</td></tr><tr><td><i><b>verificationSent</b></i></td><td><i>Boolean</i></td><td>Indicates if a transaction has been sent for verification</td></tr><tr><td><i><b>userId</b></i></td><td><i>String</i></td><td>Partner user ID that was sent when the transaction was created</td></tr><tr><td><i><b>payload</b></i></td><td><i>Object</i></td><td>Object that was sent when the transaction was created (can contain up to 5 arbitrary fields up to 64 characters long)</td></tr></tbody></table> - <p>estimatedAmount = (rate \\* amount) - networkFee</p> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Common
     * @name TransactionStatus
     * @summary Transaction status
     * @request GET:/v1/transactions/{id}/{api_key}
     * @secure
     */
    transactionStatus: (id: string, apiKey: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "2019-08-22T14:47:49.943Z" */
          createdAt?: string;
          /** @example 52.31667 */
          expectedReceiveAmount?: number;
          /** @example 1 */
          expectedSendAmount?: number;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "50727663e5d9a4" */
          id?: string;
          /** @example false */
          isPartner?: boolean;
          /** @example "32Ge2ci26rj1sRGw2NjiQa9L7Xvxtgzhrj" */
          payinAddress?: string;
          /** @example "0x57f31ad4b64095347F87eDB1675566DAfF5EC886" */
          payoutAddress?: string;
          /** @example "waiting" */
          status?: string;
          /** @example "eth" */
          toCurrency?: string;
          /** @example "2019-08-22T14:47:49.943Z" */
          updatedAt?: string;
        },
        {
          /** @example "user_not_found" */
          error?: string;
          /** @example "Can’t identify a user" */
          message?: string;
        }
      >({
        path: `/v1/transactions/${id}/${apiKey}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns estimated exchange amount for the exchange. <h3>Successful response:</h3> <h5>Successful response fields</h5> <table> <tr> <td><b>Name</b></td> <td><b>Type</b></td> <td><b>Description</b></td> </tr> <tr> <td><b><i>estimatedAmount</i></b></td> <td><i>Number</i></td> <td>Estimated exchange amount</td> </tr> <tr> <td><b><i>transactionSpeedForecast</i></b></td> <td><i>String</i></td> <td>Dash-separated min and max estimated time in minutes</td> </tr> <tr> <td><b><i>warningMessage</i></b></td> <td><i>String || null</i></td> <td>Some warnings like warnings that transactions on this network take longer or that the currency has moved to another network</td> </tr> </table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Standard Flow (Floating Rate)
     * @name EstimatedExchangeAmount
     * @summary Estimated exchange amount
     * @request GET:/v1/exchange-amount/{send_amount}/{from_to}/
     */
    estimatedExchangeAmount: (
      sendAmount: string,
      fromTo: string,
      query?: {
        /**
         * (Required) Partner public API key
         * @example "your_api_key"
         */
        api_key?: string;
        /**
         * (Optional) Use this flag if you would like to get an estimate for the balance import (without withdrawal fee)
         * @example ""
         */
        isTopUp?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 58.4142873 */
          estimatedAmount?: number;
          /** @example "10-60" */
          transactionSpeedForecast?: string;
          /** @example null */
          warningMessage?: any;
        },
        {
          /** @example "pair_is_inactive" */
          error?: string;
          /** @example "Pair is inactive" */
          message?: string;
        }
      >({
        path: `/v1/exchange-amount/${sendAmount}/${fromTo}/`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description <p>This API endpoint returns the list of all available pairs. Some currencies get enabled or disabled from time to time, so make sure to refresh the list occasionally.</p> <p>Notice that the resulting array will contain about 13000 pairs.</p> <h3>Successful response:</h3> <p>The response contains an array of underscore separated pair of tickers.</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Standard Flow (Floating Rate)
     * @name ListOfAllAvailablePairs
     * @summary List of all available pairs
     * @request GET:/v1/market-info/available-pairs/
     */
    listOfAllAvailablePairs: (
      query?: {
        /**
         * Set false to return all available pairs, except pairs supported by our partners
         * @example "false"
         */
        includePartners?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<string[], any>({
        path: `/v1/market-info/available-pairs/`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint returns minimal payment amount required to make an exchange. If you try to exchange less, the transaction will most likely fail. <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Standard Flow (Floating Rate)
     * @name MinimalExchangeAmount
     * @summary Minimal exchange amount
     * @request GET:/v1/min-amount/{from_to}
     */
    minimalExchangeAmount: (
      fromTo: string,
      query?: {
        /** @example "your_api_key" */
        api_key?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 0.002645 */
          minAmount?: number;
        },
        {
          /** @example "pair_is_inactive" */
          error?: string;
        }
      >({
        path: `/v1/min-amount/${fromTo}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description <b>New!</b> The API endpoint returns minimal payment amount and maximum payment amount required to make an exchange. If you try to exchange less than minimum or more than maximum, the transaction will most likely fail. Any pair of assets has minimum amount and some of pairs have maximum amount. <h3>Successful response:</h3> <h5>Successful response fields</h5> <table> <tr> <td><b>Name</b></td> <td><b>Type</b></td> <td><b>Description</b></td> </tr> <tr> <td><b><i>minAmount</i></b></td> <td><i>Number</i></td> <td>Minimal payment amount</td> </tr> <tr> <td><b><i>maxAmount</i></b></td> <td><i>Number|null</i></td> <td>Maximum payment amount. Could be null.</td> </tr> </table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Standard Flow (Floating Rate)
     * @name ExchangeRange
     * @summary Exchange range
     * @request GET:/v1/exchange-range/{from_to}
     */
    exchangeRange: (
      fromTo: string,
      query?: {
        /** @example "your_api_key" */
        api_key?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example null */
          maxAmount?: any;
          /** @example 0.0002625 */
          minAmount?: number;
        },
        {
          /** @example "not_valid_params" */
          error?: string;
          /** @example "Currency thet is not supported" */
          message?: string;
        }
      >({
        path: `/v1/exchange-range/${fromTo}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns the list of all the pairs available on a fixed-rate flow. Some currencies get enabled or disabled from time to time and the market info gets updates, so make sure to refresh the list occasionally. One time per minute is sufficient. <h3>Successful response:</h3> <p>The response contains an array of objects with currency information.</p> <h5>Successful response fields</h5> <table> <tr> <td><b>Name</b></td> <td><b>Type</b></td> <td><b>Description</b></td> </tr> <tr> <td><b><i>from</i></b></td> <td><i>String</i></td> <td>Currency ticker</td> </tr> <tr> <td><b><i>to</i></b></td> <td><i>String</i></td> <td>Currency ticker</td> </tr> <tr> <td><b><i>min</i></b></td> <td><i>Number</i></td> <td>Minimal limit for exchange</td> </tr> <tr> <td><b><i>max</i></b></td> <td><i>Number</i></td> <td>Maximum limit for exchange</td> </tr> <tr> <td><b><i>rate</i></b></td> <td><i>Number</i></td> <td>Exchange rate. Formula for calculating the estimated amount is given below</td> </tr> <tr> <td><b><i>minerFee</i></b></td> <td><i>Number</i></td> <td>Network fee for transferring funds between wallets, it should be deducted from the result. Formula for calculating the estimated amount is given below</td> </tr> </table> * <p>Formula for the estimated amount</p> <pre><code>estimatedAmount = (rate * amount) - networkFee</code></pre> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Fixed-Rate Flow
     * @name ListOfAvailableFixedRateMarkets
     * @summary List of available fixed-rate markets
     * @request GET:/v1/market-info/fixed-rate/{api_key}
     */
    listOfAvailableFixedRateMarkets: (apiKey: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "eth" */
          from?: string;
          /** @example 45.4784256 */
          max?: number;
          /** @example 0.1364731 */
          min?: number;
          /** @example 0.0014198 */
          minerFee?: number;
          /** @example 2.6001385 */
          rate?: number;
          /** @example "xmr" */
          to?: string;
        }[],
        {
          /** @example "user_not_found" */
          error?: string;
        }
      >({
        path: `/v1/market-info/fixed-rate/${apiKey}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns fixed-rate estimated exchange amount of coins to be received upon exchange. <h3>Successful response:</h3> <h5>Successful response fields</h5> <table><tbody><tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Description</b></td></tr><tr><td><i><b>estimatedAmount</b></i></td><td><i>Number</i></td><td>Estimated exchange amount<br>Сalculated based on the formula below<br></td></tr><tr><td><i><b>networkFee</b></i></td><td><i>Number</i></td><td>Network fee for transferring funds between wallets, it should be deducted from the result.<br>Formula for calculating the estimated amount is given below</td></tr><tr><td><i><b>transactionSpeedForecast</b></i></td><td><i>String</i></td><td>Dash-separated min and max estimated time in minutes</td></tr><tr><td><i><b>warningMessage</b></i></td><td><i>String || null</i></td><td>Some warnings like warnings that transactions on this network take longer or that the currency has moved to another network</td></tr><tr><td><i><b>rateId</b></i></td><td><i>String</i></td><td>(Optional) Use rateId for fixed-rate flow. If this field is true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Current estimated amount would be valid until time in field "validUntil"</td></tr><tr><td><i><b>validUntil</b></i></td><td><i>String</i></td><td>Date and time of transaction validity</td></tr></tbody></table> - <p>estimatedAmount = (rate \\* amount) - networkFee</p> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Fixed-Rate Flow
     * @name EstimatedFixedRateExchangeAmount
     * @summary Estimated fixed-rate exchange amount
     * @request GET:/v1/exchange-amount/fixed-rate/{send_amount}/{from_to}
     */
    estimatedFixedRateExchangeAmount: (
      sendAmount: string,
      fromTo: string,
      query?: {
        /**
         * (Required) Partner public API key
         * @example "your_api_key"
         */
        api_key?: string;
        /**
         * (Optional) Use rateId for fixed-rate flow. If this field is true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Current estimated amount would be valid until time in field "validUntil"
         * @example "true"
         */
        useRateId?: string;
        /**
         * (Optional) Use this flag if you would like to get an estimate for the balance import (without withdrawal fee)
         * @example ""
         */
        isTopUp?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 0.03962647 */
          estimatedAmount?: number;
          /** @example 0.0005605 */
          networkFee?: number;
          /** @example "c3mDvf1JcFeMzwfRHXAYzaQbbclXXF6Y" */
          rateId?: string;
          /** @example "10-60" */
          transactionSpeedForecast?: string;
          /** @example "2023-11-08T15:44:11.519Z" */
          validUntil?: string;
          /** @example null */
          warningMessage?: any;
        },
        {
          /** @example "out_of_range" */
          error?: string;
          /** @example "Check market-info API method to get available exchange amount range" */
          message?: string;
        }
      >({
        path: `/v1/exchange-amount/fixed-rate/${sendAmount}/${fromTo}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns fixed-rate estimated exchange amount of coins to be received upon exchange. <h3>Successful response:</h3> <h5>Successful response fields</h5> <table><tbody><tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Description</b></td></tr><tr><td><i><b>estimatedDeposit</b></i></td><td><i>Number</i></td><td>Estimated exchange amount<br>Сalculated based on the formula below<br></td></tr><tr><td><i><b>rateId</b></i></td><td><i>String</i></td><td>(Optional) Use rateId for fixed-rate flow. If this field is true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Current estimated amount would be valid until time in field "validUntil"</td></tr><tr><td><i><b>validUntil</b></i></td><td><i>String</i></td><td>Date and time of transaction validity</td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Fixed-Rate Flow
     * @name EstimatedFixedRateExchangeAmountReverse
     * @summary Estimated fixed-rate exchange amount reverse
     * @request GET:/v1/exchange-deposit/fixed-rate/{send_amount}/{from_to}
     */
    estimatedFixedRateExchangeAmountReverse: (
      sendAmount: string,
      fromTo: string,
      query?: {
        /**
         * (Required) Partner public API key
         * @example "your_api_key"
         */
        api_key?: string;
        /**
         * (Optional) Use rateId for fixed-rate flow. If this field is true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Current estimated amount would be valid until time in field "validUntil"
         * @example "true"
         */
        useRateId?: string;
        /**
         * (Optional) Use this flag if you would like to get an estimate for the balance import (without withdrawal fee)
         * @example ""
         */
        isTopUp?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 0.27207313 */
          estimatedDeposit?: number;
          /** @example "c3mDvf1JcFeMzwfR1lqZDPKMo8otSEck" */
          rateId?: string;
          /** @example "2023-11-08T15:44:41.912Z" */
          validUntil?: string;
        },
        {
          /** @example "out_of_range" */
          error?: string;
          /** @example "Check market-info API method to get available exchange amount range" */
          message?: string;
          range?: {
            /** @example 5867.91503 */
            max?: number;
            /** @example 61.866933 */
            min?: number;
          };
        }
      >({
        path: `/v1/exchange-deposit/fixed-rate/${sendAmount}/${fromTo}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description <b>New!</b> The API endpoint returns minimal payment amount and maximum payment amount required to make an exchange. If you try to exchange less than minimum or more than maximum, the transaction will most likely fail. Any pair of assets has minimum amount and some of pairs have maximum amount. <h3>Successful response:</h3> <h5>Successful response fields</h5> <table> <tr> <td><b>Name</b></td> <td><b>Type</b></td> <td><b>Description</b></td> </tr> <tr> <td><b><i>minAmount</i></b></td> <td><i>Number</i></td> <td>Minimal payment amount</td> </tr> <tr> <td><b><i>maxAmount</i></b></td> <td><i>Number|null</i></td> <td>Maximum payment amount. Could be null.</td> </tr> </table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v1, Fixed-Rate Flow
     * @name ExchangeRangeFixedRate
     * @summary Exchange range fixed-rate
     * @request GET:/v1/exchange-range/fixed-rate/{from_to}
     */
    exchangeRangeFixedRate: (
      fromTo: string,
      query?: {
        /** @example "your_api_key" */
        api_key?: string;
        /**
         * (Optional) Use rateId for fixed-rate flow. If this field is true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Current estimated amount would be valid until time in field "validUntil"
         * @example "true"
         */
        useRateId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example null */
          maxAmount?: any;
          /** @example 0.0002625 */
          minAmount?: number;
        },
        {
          /** @example "not_valid_params" */
          error?: string;
          /** @example "Currency thet is not supported" */
          message?: string;
        }
      >({
        path: `/v1/exchange-range/fixed-rate/${fromTo}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint creates a transaction, generates an address for sending funds and returns transaction attributes. **Note:** we also give the opportunity to transfer additional fields in the "Create fixed-rate exchange" method, which we return in the ["Transaction status"](#fa12244b-f879-4675-a6f7-553cc59435dc) method. Аdditional fields that can be transferred include: - userId — a personal and permanent identifier under which information is stored in the database; - payload — object that can contain up to 5 arbitrary fields up to 64 characters long; If you would like to enable these fields, please contact us at [partners@changenow.io](https://mailto:partners@changenow.io) with the subject line "Special partner fields". <h3>Successful response:</h3> <p>The response contains an object with transaction information.</p> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>id</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>You can use it to get transaction status at the<a rel="noreferrer noopener nofollow" href="#fa12244b-f879-4675-a6f7-553cc59435dc" target="_self" url="#fa12244b-f879-4675-a6f7-553cc59435dc">Transaction status API endpoint</a></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The wallet address that will recieve the exchanged funds</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID that you send when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Amount of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund address (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund Extra ID (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraIdName</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Field name currency Extra ID (e.g. Memo, Extra ID)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>validUntil</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time of transaction validity</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>rateId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>(Required) Use rateId for fixed-rate flow. Set it to value that you got from previous method for estimated amount to freeze estimated amount.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3> In this method you need to send the request body as JSON. This is an example of what json request should look like ``` { "from": "btc", "to": "xlm", "address": "GAM6Y7R5LKBYOC5VCF3L3B24EMM2IA5S7KTWTR65G65N7BJQRV32OGFB", "amount": "12.0645", "extraId": "123456789", "refundAddress": "1Nh7uHdvY6fNwtQtM1G5EZAFPLC33B59rB", "refundExtraId": "", "userId": "", "payload": "", "contactEmail": "" } ```
     *
     * @tags API v1, Fixed-Rate Flow
     * @name CreateFixedRateExchange
     * @summary Create fixed-rate exchange
     * @request POST:/v1/transactions/fixed-rate/{api_key}
     */
    createFixedRateExchange: (
      apiKey: string,
      data: {
        /** @example "GAM6Y7R5LKBYOC5VCF3L3B24EMM2IA5S7KTWTR65G65N7BJQRV32OGFB" */
        address?: string;
        /** @example "0.12345" */
        amount?: string;
        /** @example "" */
        contactEmail?: string;
        /** @example "123456789" */
        extraId?: string;
        /** @example "btc" */
        from?: string;
        /** @example "" */
        rateId?: string;
        /** @example "1Nh7uHdvY6fNwtQtM1G5EZAFPLC33B59rB" */
        refundAddress?: string;
        /** @example "" */
        refundExtraId?: string;
        /** @example "xlm" */
        to?: string;
        /** @example "" */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 62.9737711 */
          amount?: number;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "a5c73e2603f40d" */
          id?: string;
          /** @example "33eFX2jfeWbXMSmRe9ewUUTrmSVSxZi5cj" */
          payinAddress?: string;
          /** @example "0x57f31ad4b64095347F87eDB1675566DAfF5EC886" */
          payoutAddress?: string;
          /** @example "" */
          payoutExtraId?: string;
          /** @example "Memo" */
          payoutExtraIdName?: string;
          /** @example "" */
          refundAddress?: string;
          /** @example "" */
          refundExtraId?: string;
          /** @example "eth" */
          toCurrency?: string;
          /** @example "2019-09-09T14:01:04.921Z" */
          validUntil?: string;
        },
        {
          /** @example "out_of_range" */
          error?: string;
          /** @example "Check market-info API method to get available exchange amount range" */
          message?: string;
        }
      >({
        path: `/v1/transactions/fixed-rate/${apiKey}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint creates a transaction, generates an address for sending funds and returns transaction attributes. **Note:** we also give the opportunity to transfer additional fields in the "Create fixed-rate exchange" method, which we return in the ["Transaction status"](#fa12244b-f879-4675-a6f7-553cc59435dc) method. Аdditional fields that can be transferred include: - userId —a personal and permanent identifier under which information is stored in the database; - payload — object that can contain up to 5 arbitrary fields up to 64 characters long; If you would like to enable these fields, please contact us at [partners@changenow.io](https://mailto:partners@changenow.io) with the subject line "Special partner fields". <h3>Successful response:</h3> <p>The response contains an object with transaction information.</p> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>id</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>You can use it to get transaction status at the<a rel="noreferrer noopener nofollow" href="#fa12244b-f879-4675-a6f7-553cc59435dc" target="_self" url="#fa12244b-f879-4675-a6f7-553cc59435dc">Transaction status API endpoint</a></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The wallet address that will recieve the exchanged funds</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID that you send when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>result</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Amount of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund address (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund Extra ID (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraIdName</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Field name currency Extra ID (e.g. Memo, Extra ID)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>validUntil</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time of transaction validity</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>rateId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>(Required) Use rateId for fixed-rate flow. Set it to value that you got from previous method for estimated amount to freeze estimated amount.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3> In this method you need to send the request body as JSON. This is an example of what json request should look like ``` { "from": "btc", "to": "xlm", "address": "GAM6Y7R5LKBYOC5VCF3L3B24EMM2IA5S7KTWTR65G65N7BJQRV32OGFB", "amount": "12.0645", "extraId": "123456789", "refundAddress": "1Nh7uHdvY6fNwtQtM1G5EZAFPLC33B59rB", "refundExtraId": "", "userId": "", "payload": "", "contactEmail": "" } ```
     *
     * @tags API v1, Fixed-Rate Flow
     * @name CreateReverseFixedRateExchange
     * @summary Create reverse fixed-rate exchange
     * @request POST:/v1/transactions/fixed-rate/from-result/{api_key}
     */
    createReverseFixedRateExchange: (
      apiKey: string,
      data: {
        /** @example "GAM6Y7R5LKBYOC5VCF3L3B24EMM2IA5S7KTWTR65G65N7BJQRV32OGFB" */
        address?: string;
        /** @example "" */
        contactEmail?: string;
        /** @example "123456789" */
        extraId?: string;
        /** @example "btc" */
        from?: string;
        /** @example "" */
        rateId?: string;
        /** @example "1Nh7uHdvY6fNwtQtM1G5EZAFPLC33B59rB" */
        refundAddress?: string;
        /** @example "" */
        refundExtraId?: string;
        /** @example "123456789" */
        result?: string;
        /** @example "xlm" */
        to?: string;
        /** @example "" */
        userId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 62.9737711 */
          amount?: number;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "a5c73e2603f40d" */
          id?: string;
          /** @example "33eFX2jfeWbXMSmRe9ewUUTrmSVSxZi5cj" */
          payinAddress?: string;
          /** @example "0x57f31ad4b64095347F87eDB1675566DAfF5EC886" */
          payoutAddress?: string;
          /** @example "" */
          payoutExtraId?: string;
          /** @example "Memo" */
          payoutExtraIdName?: string;
          /** @example "" */
          refundAddress?: string;
          /** @example "" */
          refundExtraId?: string;
          /** @example "eth" */
          toCurrency?: string;
          /** @example "2019-09-09T14:01:04.921Z" */
          validUntil?: string;
        },
        {
          /** @example "out_of_range" */
          error?: string;
          /** @example "Check market-info API method to get available exchange amount range" */
          message?: string;
        }
      >({
        path: `/v1/transactions/fixed-rate/from-result/${apiKey}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  v2 = {
    /**
     * @description This is a method for creating a fiat-to-cryptocurrency exchange transaction. <h3>Successful response:</h3> <p>The response contains an object with transaction information.</p> <h5>Successful response fields</h5> <table><tbody><tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Description</b></td></tr><tr><td><i><b>from_amount</b></i></td><td><i>Number</i></td><td>Must be greater then 0.</td></tr><tr><td><i><b>from_currency</b></i></td><td><i>String</i></td><td>Ticker of the currency you want to exchange.<br>It is optional when using rateId field.</td></tr><tr><td><i><b>to_currency</b></i></td><td><i>String</i></td><td>(Ticker of the currency you want to receive.<br>It is optional when using rateId field</td></tr><tr><td><i><b>from_network</b></i></td><td><i>String</i></td><td>Network of the currency you want to exchange</td></tr><tr><td><i><b>to_network</b></i></td><td><i>String</i></td><td>Network of the currency you want to receive</td></tr><tr><td><i><b>payout_address</b></i></td><td><i>String</i></td><td>Address to receive a currency</td></tr><tr><td><i><b>payout_extra_id</b></i></td><td><i>String</i></td><td>Refund Extra ID</td></tr><tr><td><i><b>deposit_type</b></i></td><td><i>String</i></td><td>Direction of exchange flow [ SEPA_1, VISA_MC1, VISA_MC2, LUQAPAY, CRYPTO_THROUGH_CN ]</td></tr><tr><td><i><b>payout_type</b></i></td><td><i>String</i></td><td>Direction of exchange flow [ SEPA_1, VISA_MC1, VISA_MC2, LUQAPAY, CRYPTO_THROUGH_CN ]</td></tr><tr><td><i><b>external_partner_link_id</b></i></td><td><i>String</i></td><td>Partner id</td></tr><tr><td><i><b>customer.contact_info.email</b></i></td><td><i>String</i></td><td>Customer's email address</td></tr><tr><td><i><b>customer.contact_info.phone</b></i></td><td><i>String</i></td><td>Customer's phone number</td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3> In this method you need to send the request body as JSON. This is an example of what json request should look like ``` json { "from_amount": 1200.24, "from_currency": "EUR", "to_currency": "BTC", "from_network": null, "to_network": "BNB", "payout_address": "mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy", "payout_extra_id": "1", "deposit_type": "SEPA_1", "payout_type": "SEPA_1", "external_partner_link_id": "", "customer": { "contact_info": { "email": "email@email.com", "phone_number": "+3723800037" } } } ```
     *
     * @tags API v2, Operations with fiat
     * @name CreateExchangeTransactionWithFiat
     * @summary Create exchange transaction with fiat
     * @request POST:/v2/fiat-transaction
     */
    createExchangeTransactionWithFiat: (
      data: {
        customer?: {
          contact_info?: {
            /** @example "email@email.com" */
            email?: string;
            /** @example "+3723800037" */
            phone_number?: string;
          };
        };
        /** @example "SEPA_1" */
        deposit_type?: string;
        /** @example "" */
        external_partner_link_id?: string;
        /** @example 1200.24 */
        from_amount?: number;
        /** @example "EUR" */
        from_currency?: string;
        /** @example null */
        from_network?: any;
        /** @example "mtXWDB6k5yC5v7TcwKZHB89SUp85yCKshy" */
        payout_address?: string;
        /** @example "1" */
        payout_extra_id?: string;
        /** @example "SEPA_1" */
        payout_type?: string;
        /** @example "BTC" */
        to_currency?: string;
        /** @example "BNB" */
        to_network?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "2021-07-14T10:36:40.273Z" */
          created_at?: string;
          /** @example "SEPA_1" */
          deposit_type?: string;
          /** @example null */
          email?: any;
          /** @example [] */
          errors?: any[];
          estimate_breakdown?: {
            convertedAmount?: {
              /** @example "1197.75" */
              amount?: string;
              /** @example "EUR" */
              currency?: string;
            };
            /** @example "19.57475300" */
            estimatedExchangeRate?: string;
            /** @example 1200.24 */
            fromAmount?: number;
            networkFee?: {
              /** @example "0.1" */
              amount?: string;
              /** @example "TRX" */
              currency?: string;
            };
            /** @example [{"amount":"2.49","currency":"EUR","name":"Service fee"}] */
            serviceFees?: {
              /** @example "2.49" */
              amount?: string;
              /** @example "EUR" */
              currency?: string;
              /** @example "Service fee" */
              name?: string;
            }[];
            /** @example "23445.66041" */
            toAmount?: string;
          };
          /** @example "1200.24" */
          expected_from_amount?: string;
          /** @example "23445.66041" */
          expected_to_amount?: string;
          /** @example null */
          external_partner_link_id?: any;
          /** @example "0" */
          from_amount?: string;
          /** @example "EUR" */
          from_currency?: string;
          /** @example null */
          from_currency_with_network?: any;
          /** @example null */
          from_network?: any;
          /** @example "4496229738" */
          id?: string;
          /** @example "DE" */
          location?: string;
          /** @example null */
          output_hash?: any;
          /** @example "6437862205" */
          partner_id?: string;
          payout?: {
            /** @example "0x7cC3BD073c6d9564bb67ffCb86f76D36e48ce3F1" */
            address?: string;
            /** @example "1" */
            extra_id?: string;
          };
          /** @example "CRYPTO_THROUGH_CN" */
          payout_type?: string;
          /** @example "https://payments.guardarian.com/checkout?tid=4496229738" */
          redirect_url?: string;
          /** @example "new" */
          status?: string;
          /** @example null */
          status_details?: any;
          /** @example null */
          to_amount?: any;
          /** @example "TRX" */
          to_currency?: string;
          /** @example null */
          to_currency_with_network?: any;
          /** @example null */
          to_network?: any;
          /** @example "2021-07-14T10:36:40.273Z" */
          updated_at?: string;
        },
        | {
            /** @example "BAD_REQUEST" */
            code?: string;
            /** @example "Bad request error" */
            message?: string;
            /** @example 400 */
            statusCode?: number;
          }
        | {
            /** @example "INVALID_TOKEN" */
            code?: string;
            /** @example "Invalid token" */
            message?: string;
            /** @example 401 */
            statusCode?: number;
          }
        | {
            /** @example "FORBIDDEN" */
            code?: string;
            /** @example "Forbidden request error" */
            message?: string;
            /** @example 403 */
            statusCode?: number;
          }
        | {
            /** @example "NOT_FOUND" */
            code?: string;
            /** @example "Not found" */
            message?: string;
            /** @example 404 */
            statusCode?: number;
          }
        | {
            /** @example "INTERNAL_ERROR" */
            code?: string;
            /** @example "The server encountered an internal error" */
            message?: string;
            /** @example 500 */
            statusCode?: number;
          }
      >({
        path: `/v2/fiat-transaction`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This is a method for obtaining information about the submitted transaction by its identifier
     *
     * @tags API v2, Operations with fiat
     * @name TransactionStatus1
     * @summary Transaction status
     * @request GET:/v2/fiat-status/
     */
    transactionStatus1: (
      query?: {
        /** @example "id" */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "OK" */
          message?: string;
        },
        | {
            /** @example "INVALID_TOKEN" */
            code?: string;
            /** @example "Invalid token" */
            message?: string;
            /** @example 401 */
            statusCode?: number;
          }
        | {
            /** @example "INTERNAL_ERROR" */
            code?: string;
            /** @example "The server encountered an internal error" */
            message?: string;
            /** @example 500 */
            statusCode?: number;
          }
      >({
        path: `/v2/fiat-status/`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This is a method for estimating the exchange amount. <h3>Request Parameters:</h3> In this method you need to send the request body as JSON. This is an example of what json request should look like <pre><code> { "from_currency": "USD" "from_network": "from_amount": 1200.24 "to_currency": "BTC" "to_network": "deposit_type": "payout_type": } </code></pre>
     *
     * @tags API v2, Operations with fiat
     * @name Estimate
     * @summary Estimate
     * @request GET:/v2/fiat-estimate
     */
    estimate: (
      query?: {
        /**
         * (Required) Currency to change
         * @example ""
         */
        from_currency?: string;
        /**
         * Network to change
         * @example ""
         */
        from_network?: string;
        /**
         * (Required) Amount to change
         * @example ""
         */
        from_amount?: string;
        /**
         * (Required) Currency to get
         * @example ""
         */
        to_currency?: string;
        /**
         * Network to get
         * @example ""
         */
        to_network?: string;
        /**
         * Deposit type
         * @example ""
         */
        deposit_type?: string;
        /**
         * Payout type
         * @example ""
         */
        payout_type?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "OK" */
          message?: string;
        },
        | {
            /** @example "BAD_REQUEST" */
            code?: string;
            /** @example "Bad request error" */
            message?: string;
            /** @example 400 */
            statusCode?: number;
          }
        | {
            /** @example "INVALID_TOKEN" */
            code?: string;
            /** @example "Invalid token" */
            message?: string;
            /** @example 401 */
            statusCode?: number;
          }
        | {
            /** @example "INTERNAL_ERROR" */
            code?: string;
            /** @example "The server encountered an internal error" */
            message?: string;
            /** @example 500 */
            statusCode?: number;
          }
      >({
        path: `/v2/fiat-estimate`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This is a method for getting min and max range.
     *
     * @tags API v2, Operations with fiat
     * @name Marketinfo
     * @summary MarketInfo
     * @request GET:/v2/fiat-market-info/min-max-range/eth-eth_eur
     */
    marketinfo: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "EUR" */
          from?: string;
          /** @example "25000" */
          max?: string;
          /** @example "16.5" */
          min?: string;
          /** @example "USDT" */
          to?: string;
        },
        | {
            /** @example "BAD_REQUEST" */
            code?: string;
            /** @example "Bad request error" */
            message?: string;
            /** @example 400 */
            statusCode?: number;
          }
        | {
            /** @example "INTERNAL_ERROR" */
            code?: string;
            /** @example "The server encountered an internal error" */
            message?: string;
            /** @example 500 */
            statusCode?: number;
          }
      >({
        path: `/v2/fiat-market-info/min-max-range/eth-eth_eur`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint checks the health status of the fiat-to-cryptocurrency exchange service
     *
     * @tags API v2, Operations with fiat
     * @name FiatHelthcheckService
     * @summary Fiat helthcheck service
     * @request GET:/v2/fiat-status
     */
    fiatHelthcheckService: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "OK" */
          message?: string;
        },
        {
          /** @example "INTERNAL_ERROR" */
          code?: string;
          /** @example "The server encountered an internal error" */
          message?: string;
          /** @example 500 */
          statusCode?: number;
        }
      >({
        path: `/v2/fiat-status`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description This is a method for obtaining information about the fiat currencies that can be used to buy cryptocurrencies.
     *
     * @tags API v2, Operations with fiat
     * @name FiatCurrencies
     * @summary Fiat currencies
     * @request GET:/v2/fiat-currencies/fiat
     */
    fiatCurrencies: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example null */
          block_explorer_url_mask?: any;
          /** @example "FIAT" */
          currency_type?: string;
          /** @example 300 */
          default_exchange_value?: number;
          /** @example true */
          enable?: boolean;
          /** @example true */
          has_external_id?: boolean;
          /** @example 5517577077 */
          id?: number;
          /** @example true */
          is_available?: boolean;
          /** @example true */
          is_featured?: boolean;
          /** @example true */
          is_stable?: boolean;
          /** @example "https://somewhere.com" */
          logoUrl?: string;
          /** @example "Euro" */
          name?: string;
          /** @example [{"block_explorer_url_mask":null,"name":"Binance Coin Mainnet","network":"BNB","payment_methods":{"deposit_enabled":true,"type":"SEPA_1","withdrawal_enabled":true}}] */
          networks?: {
            /** @example null */
            block_explorer_url_mask?: any;
            /** @example "Binance Coin Mainnet" */
            name?: string;
            /** @example "BNB" */
            network?: string;
            payment_methods?: {
              /** @example true */
              deposit_enabled?: boolean;
              /** @example "SEPA_1" */
              type?: string;
              /** @example true */
              withdrawal_enabled?: boolean;
            };
          }[];
          /** @example [{"deposit_enabled":true,"type":"SEPA_1","withdrawal_enabled":true}] */
          payment_methods?: {
            /** @example true */
            deposit_enabled?: boolean;
            /** @example "SEPA_1" */
            type?: string;
            /** @example true */
            withdrawal_enabled?: boolean;
          }[];
          /** @example "EUR" */
          ticker?: string;
        }[],
        {
          /** @example "INTERNAL_ERROR" */
          code?: string;
          /** @example "The server encountered an internal error" */
          message?: string;
          /** @example 500 */
          statusCode?: number;
        }
      >({
        path: `/v2/fiat-currencies/fiat`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description This is a method for obtaining information about the cryptocurrencies that a customer can buy using fiat currencies.
     *
     * @tags API v2, Operations with fiat
     * @name CryptoCurrencies
     * @summary Crypto currencies
     * @request GET:/v2/fiat-currencies/crypto
     */
    cryptoCurrencies: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example null */
          block_explorer_url_mask?: any;
          /** @example "FIAT" */
          currency_type?: string;
          /** @example 300 */
          default_exchange_value?: number;
          /** @example true */
          enable?: boolean;
          /** @example true */
          has_external_id?: boolean;
          /** @example 5517577077 */
          id?: number;
          /** @example true */
          is_available?: boolean;
          /** @example true */
          is_featured?: boolean;
          /** @example true */
          is_stable?: boolean;
          /** @example "https://somewhere.com" */
          logoUrl?: string;
          /** @example "Euro" */
          name?: string;
          /** @example [{"block_explorer_url_mask":null,"name":"Binance Coin Mainnet","network":"BNB","payment_methods":{"deposit_enabled":true,"type":"SEPA_1","withdrawal_enabled":true}}] */
          networks?: {
            /** @example null */
            block_explorer_url_mask?: any;
            /** @example "Binance Coin Mainnet" */
            name?: string;
            /** @example "BNB" */
            network?: string;
            payment_methods?: {
              /** @example true */
              deposit_enabled?: boolean;
              /** @example "SEPA_1" */
              type?: string;
              /** @example true */
              withdrawal_enabled?: boolean;
            };
          }[];
          /** @example [{"deposit_enabled":true,"type":"SEPA_1","withdrawal_enabled":true}] */
          payment_methods?: {
            /** @example true */
            deposit_enabled?: boolean;
            /** @example "SEPA_1" */
            type?: string;
            /** @example true */
            withdrawal_enabled?: boolean;
          }[];
          /** @example "EUR" */
          ticker?: string;
        }[],
        {
          /** @example "INTERNAL_ERROR" */
          code?: string;
          /** @example "The server encountered an internal error" */
          message?: string;
          /** @example 500 */
          statusCode?: number;
        }
      >({
        path: `/v2/fiat-currencies/crypto`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint to get possible actions that can be applied to your exchange Access to this endpoint you can receive upon dedicated request to [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) ### SUCCESSFUL RESPONSE The response contains an object with an information about available actions #### SUCCESSFUL RESPONSE FIELDS <table><tbody><tr><th>Name</th><th>Type</th><th>Description</th></tr><tr><td><div><b>available</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Boolean</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if an exchange can be pushed or refunded</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><b>amount</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Number</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Amount that can be refunded</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><b>address</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>String</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund address if specified when creating an exchange via ChangeNOW API</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><b>additionalAddressList</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>String</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>A list of initial addresses</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><b>currentEstimate</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Number</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Current estimate for a pair</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> You can find examples of errors in the Example request block (use the drop-down list). ### Request Parameters:
     *
     * @tags API v2, Exchange Actions
     * @name GetAvailableActions
     * @summary Get available actions
     * @request GET:/v2/exchange/actions
     * @secure
     */
    getAvailableActions: (
      query?: {
        /**
         * (Required) Transaction ID from Create transaction request
         * @example "104305fa95353d"
         */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          continue?: {
            /** @example true */
            available?: boolean;
            /** @example "0.0277754" */
            currentEstimate?: string;
          };
          /** @example null */
          error?: any;
          refund?: {
            /** @example ["0x40FBAC48435dE25FFFC1FCeFA5A5a054FC9b7E56"] */
            additionalAddressList?: string[];
            address?: {
              /** @example "33ybgTeATi1DMoWic8X7wqjZvAuw6fQEuL" */
              address?: string;
              /** @example null */
              extraId?: any;
            };
            /** @example "0.00012294" */
            amount?: string;
            /** @example true */
            available?: boolean;
          };
        },
        {
          /** @example "not_found" */
          error?: string;
          /** @example "Exchange not found" */
          message?: string;
        }
      >({
        path: `/v2/exchange/actions`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint continues an exchange that can be pushed Access to this endpoint you can receive upon dedicated request to [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) ### SUCCESSFUL RESPONSE The response contains an object with request status #### SUCCESSFUL RESPONSE FIELDS <table><tbody><tr><th>Name</th><th>Type</th><th>Description</th></tr><tr><td><div><i><b>result</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if an exchange is pushed</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The amount of exchange with which it was continued</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>currency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Currency of сontinued exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>network</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of continued exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> You can find examples of errors in the Example request block (use the drop-down list). ### REQUEST PARAMETERS:
     *
     * @tags API v2, Exchange Actions
     * @name ContinueExchange
     * @summary Continue  exchange
     * @request POST:/v2/exchange/continue
     * @secure
     */
    continueExchange: (
      data: {
        /** @example "7ba4327eb4fdfd" */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          result?: {
            data?: {
              estimate?: {
                /** @example 48.46847508 */
                amount?: number;
                /** @example "trx" */
                currency?: string;
                /** @example "trx" */
                network?: string;
              };
            };
            /** @example true */
            result?: boolean;
          };
        },
        | {
            /** @example "not_available" */
            error?: string;
            /** @example "Continue not available for exchange 7ba4327eb4fdfd" */
            message?: string;
          }
        | {
            /** @example "not_found" */
            error?: string;
            /** @example "Exchange not found" */
            message?: string;
          }
      >({
        path: `/v2/exchange/continue`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint for refunding your deposit to the refund or original address Access to this endpoint you can receive upon dedicated request to [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) ### SUCCESSFUL RESPONSE The response contains an object with request status #### SUCCESSFUL RESPONSE FIELDS <table><tbody><tr><th>Name</th><th>Type</th><th>Description</th></tr><tr><td><div><i><b>result</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if an exchange is refunded</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> You can find examples of errors in the Example request block (use the drop-down list). #### REQUEST PARAMETERS:
     *
     * @tags API v2, Exchange Actions
     * @name RefundExchange
     * @summary Refund exchange
     * @request POST:/v2/exchange/refund
     * @secure
     */
    refundExchange: (
      data: {
        /** @example "THy6JTNy1aBgY52wKFCvAM4YXRxgzFwCaK" */
        address?: string;
        /** @example "7ba4327eb4fdfd" */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example true */
          result?: boolean;
        },
        | {
            /** @example "not_available" */
            error?: string;
            /** @example "Refund not available for exchange 7ba4327eb4fdfd" */
            message?: string;
          }
        | {
            /** @example "not_found" */
            error?: string;
            /** @example "Exchange not found" */
            message?: string;
          }
      >({
        path: `/v2/exchange/refund`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns the list of available currencies. Access to this endpoint you can receive upon dedicated request to [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) <h3>Successful response:</h3> <p>The response contains an array of objects with currency information.</p> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>ticker</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Currency ticker</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>name</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Currency name</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>image</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Currency logo url</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>hasExternalId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if a currency has an Extra ID</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>isFiat</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if a currency is a fiat currency (EUR, USD)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>featured</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if a currency is popular</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>isStable</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if a currency is stable</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>supportsFixedRate</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if a currency is available on a fixed-rate flow</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>network</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Currency network</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>tokenContract</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Contract for token or null for non-token</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>buy</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if a currency is available to buy</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>sell</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if a currency is available to sell</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>legacyTicker</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>LegacyTicker includes info about currency ticker and currency network</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name ListOfAvailableCurrencies1
     * @summary List of available currencies
     * @request GET:/v2/exchange/currencies
     */
    listOfAvailableCurrencies1: (
      query?: {
        /**
         * (Optional) Set true to return only active currencies
         * @example ""
         */
        active?: string;
        /**
         * (Optional) Type of exchange flow. Enum: ["standard", "fixed-rate"]. Default value is standard
         * @example "standard"
         */
        flow?: string;
        /**
         * (Optional) If this field is true, only currencies available for buy are returned.
         * @example ""
         */
        buy?: string;
        /**
         * (Optional) If this field is true, only currencies available for sell are returned.
         * @example ""
         */
        sell?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v2/exchange/currencies`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description The API endpoint returns minimal payment amount required to make an exchange. If you try to exchange less, the transaction will most likely fail. <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name MinimalExchangeAmount1
     * @summary Minimal exchange amount
     * @request GET:/v2/exchange/min-amount
     */
    minimalExchangeAmount1: (
      query?: {
        /**
         * (Required) Ticker of the currency you want to exchange
         * @example "btc"
         */
        fromCurrency?: string;
        /**
         * (Required) Ticker of the currency you want to receive
         * @example "usdt"
         */
        toCurrency?: string;
        /**
         * (Optional) Network of the currency you want to exchange
         * @example "btc"
         */
        fromNetwork?: string;
        /**
         * (Optional) Network of the currency you want to receive
         * @example "eth"
         */
        toNetwork?: string;
        /**
         * (Optional) Type of exchange flow. Enum: ["standard", "fixed-rate"]. Default value is standard
         * @example "standard"
         */
        flow?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "standard" */
          flow?: string;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "btc" */
          fromNetwork?: string;
          /** @example 0.0002787 */
          minAmount?: number;
          /** @example "usdt" */
          toCurrency?: string;
          /** @example "eth" */
          toNetwork?: string;
        },
        any
      >({
        path: `/v2/exchange/min-amount`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description <p>This API endpoint returns the list of all available pairs. Some currencies get enabled or disabled from time to time, so make sure to refresh the list occasionally.</p> <p>Notice that the resulting array will contain about 13000 pairs.</p> Access to this endpoint you can receive upon dedicated request to [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) <h3>Successful response:</h3> <p>The response contains an array of underscore separated pair of tickers.<br></p> <p>You can find&nbsp;examples of errors&nbsp;in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name ListOfAllAvailablePairs1
     * @summary List of all available pairs
     * @request GET:/v2/exchange/available-pairs
     */
    listOfAllAvailablePairs1: (
      query?: {
        /**
         * Ticker of the currency you want to exchange
         * @example ""
         */
        fromCurrency?: string;
        /**
         * Ticker of the currency you want to receive
         * @example ""
         */
        toCurrency?: string;
        /**
         * Network of the currency you want to exchange
         * @example ""
         */
        fromNetwork?: string;
        /**
         * Network of the currency you want to receive
         * @example ""
         */
        toNetwork?: string;
        /**
         * Type of exchange flow. Enum: ["standard", "fixed-rate"]
         * @example ""
         */
        flow?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          flow?: {
            /** @example false */
            "fixed-rate"?: boolean;
            /** @example true */
            standard?: boolean;
          };
          /** @example "eth" */
          fromCurrency?: string;
          /** @example "eth" */
          fromNetwork?: string;
          /** @example "btc" */
          toCurrency?: string;
          /** @example "btc" */
          toNetwork?: string;
        }[],
        | {
            /** @example "not_valid_params" */
            error?: string;
            /** @example "toCurrency is required" */
            message?: string;
          }
        | {
            /** @example "string" */
            code?: string;
            /** @example "string" */
            error?: string;
          }
      >({
        path: `/v2/exchange/available-pairs`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint returns minimal payment amount and maximum payment amount required to make an exchange. If you try to exchange less than minimum or more than maximum, the transaction will most likely fail. Any pair of assets has minimum amount and some of pairs have maximum amount. Access to this endpoint you can receive upon dedicated request to [partners@changenow.io](https://mailto:partners@changenow.io) <h3>Successful response:</h3> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromNetwork</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toNetwork</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>flow</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Type of exchange flow. Enum: ["standard", "fixed-rate"]</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>minAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Minimal payment amount</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>maxAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Maximum payment amount. Could be null.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name ExchangeRange1
     * @summary Exchange range
     * @request GET:/v2/exchange/range
     */
    exchangeRange1: (
      query?: {
        /**
         * (Required) Ticker of the currency you want to exchange
         * @example "btc"
         */
        fromCurrency?: string;
        /**
         * (Required) Ticker of the currency you want to receive
         * @example "eth"
         */
        toCurrency?: string;
        /**
         * (Optional) Network of the currency you want to exchange
         * @example "btc"
         */
        fromNetwork?: string;
        /**
         * (Optional) Network of the currency you want to receive
         * @example "eth"
         */
        toNetwork?: string;
        /**
         * (Optional) Type of exchange flow. Enum: ["standard", "fixed-rate"]. Default value is standard
         * @example "standard"
         */
        flow?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "standard" */
          flow?: string;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "btc" */
          fromNetwork?: string;
          /** @example null */
          maxAmount?: any;
          /** @example 0.0002625 */
          minAmount?: number;
          /** @example "usdt" */
          toCurrency?: string;
          /** @example "eth" */
          toNetwork?: string;
        },
        {
          /** @example "not_valid_params" */
          error?: string;
          /** @example "Currency t is not supported" */
          message?: string;
        }
      >({
        path: `/v2/exchange/range`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns estimated exchange amount for the exchange and some additional fields. Accepts to and from currencies, currencies' networks, exchange flow, and RateID. Access to this endpoint you can receive upon dedicated request to [partners@changenow.io](https://mailto:partners@changenow.io) <h3>Successful response:</h3> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromNetwork</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toNetwork</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>flow</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Type of exchange flow. Enum: ["standard", "fixed-rate"]</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>type</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Direction of exchange flow. Use "direct" value to set amount for currencyFrom and get amount of currencyTo. Use "reverse" value to set amount for currencyTo and get amount of currencyFrom. Enum: ["direct", "reverse"]</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>rateId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String || null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>RateId is needed for fixed-rate flow. If you set param "useRateId" to true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Current estimated amount would be valid until time in field "validUntil"</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>validUntil</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String || null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time before estimated amount would be freezed in case of using rateId. If you set param "useRateId" to true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Estimated amount would be valid until this date and time</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>transactionSpeedForecast</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String || null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Dash-separated min and max estimated time in minutes</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>warningMessage</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String || null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Some warnings like warnings that transactions on this network take longer or that the currency has moved to another network</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Exchange amount of fromCurrency (in case when type=reverse it is an estimated value)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Exchange amount of toCurrency (in case when type=direct it is an estimated value)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>depositFee</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Deposit fee in the selected currency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>withdrawalFee</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Withdrawal fee in the selected currency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>userId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>A personal and permanent identifier under which information is stored in the database<br>(If you would like to enable this field, please contact us at partners@changenow.io with the subject line "Special partner fields")</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name EstimatedExchangeAmount1
     * @summary Estimated exchange amount
     * @request GET:/v2/exchange/estimated-amount
     */
    estimatedExchangeAmount1: (
      query?: {
        /**
         * (Required) Ticker of the currency you want to exchange
         * @example "btc"
         */
        fromCurrency?: string;
        /**
         * (Required) Ticker of the currency you want to receive
         * @example "eth"
         */
        toCurrency?: string;
        /**
         * (Required if type is direct) Must be greater then 0.
         * @example "0.1"
         */
        fromAmount?: string;
        /**
         * (Required if type is reverse) Must be greater then 0.
         * @example ""
         */
        toAmount?: string;
        /**
         * (Optional) Network of the currency you want to exchange
         * @example "btc"
         */
        fromNetwork?: string;
        /**
         * (Optional) Network of the currency you want to receive
         * @example "eth"
         */
        toNetwork?: string;
        /**
         * (Optional) Type of exchange flow. Enum: ["standard", "fixed-rate"]. Default value is standard
         * @example "fixed-rate"
         */
        flow?: string;
        /**
         * (Optional) Direction of exchange flow. Enum: ["direct", "reverse"]. Default value is direct
         * @example ""
         */
        type?: string;
        /**
         * (Optional) Use rateId for fixed-rate flow. If this field is true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Current estimated amount would be valid until time in field "validUntil"
         * @example ""
         */
        useRateId?: string;
        /**
         * (Optional) Use this flag if you would like to get an estimate for the balance import (without withdrawal fee)
         * @example ""
         */
        isTopUp?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 0.0001302 */
          depositFee?: number;
          /** @example "fixed-rate" */
          flow?: string;
          /** @example 0.1 */
          fromAmount?: number;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "btc" */
          fromNetwork?: string;
          /** @example "Sd5UzPYKbys4miuq1vwYX9dowPkQipgt" */
          rateId?: string | null;
          /** @example 3434.835033 */
          toAmount?: number;
          /** @example "usdt" */
          toCurrency?: string;
          /** @example "eth" */
          toNetwork?: string;
          /** @example null */
          transactionSpeedForecast?: string | null;
          /** @example "direct" */
          type?: string;
          /** @example null */
          userId?: any;
          /** @example "2023-11-07T09:21:27.448Z" */
          validUntil?: string | null;
          /** @example null */
          warningMessage?: any;
          /** @example 3.20195179 */
          withdrawalFee?: number;
        },
        any
      >({
        path: `/v2/exchange/estimated-amount`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint creates a transaction, generates an address for sending funds and returns transaction attributes. **Note:** we also give the opportunity to transfer additional fields in the "Create exchange transaction" method, which we return in the ["Transaction status"](#e7383038-3f62-41c4-a965-9f23f98c2fd1) method. Аdditional fields that can be transferred include: - userId — a personal and permanent identifier under which information is stored in the database; - payload — object that can contain up to 5 arbitrary fields up to 64 characters long; If you would like to enable these fields, please contact us at [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) with the subject line "Special partner fields". <h3>Successful response:</h3> <p>The response contains an object with transaction information.</p> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>id</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>You can use it to get transaction status at the<a rel="noreferrer noopener nofollow" href="#fa12244b-f879-4675-a6f7-553cc59435dc" target="_self" url="#fa12244b-f879-4675-a6f7-553cc59435dc">Transaction status API endpoint</a></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Amount of currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Amount of currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>flow</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Type of exchange flow. Enum: ["standard", "fixed-rate"]</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>type</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Direction of exchange flow. Use "direct" value to set amount for currencyFrom and get amount of currencyTo. Use "reverse" value to set amount for currencyTo and get amount of currencyFrom. Enum: ["direct", "reverse"]</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The wallet address that will recieve the exchanged funds</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID that you send when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromNetwork</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toNetwork</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund address (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund Extra ID (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraIdName</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Field name currency Extra ID (e.g. Memo, Extra ID)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>rateId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>(Required) Use rateId for fixed-rate flow. Set it to value that you got from previous method for estimated amount to freeze estimated amount.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3> In this method you need to send the request body as JSON. This is an example of what json request should look like ``` { "fromCurrency": "btc", "fromNetwork": "btc", "toCurrency": "usdt", "toNetwork": "eth", "fromAmount": "0.1", "toAmount": "", "address": "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb", "extraId": "", "refundAddress": "", "refundExtraId": "", "userId": "", "payload": "", "contactEmail": "", "flow": "standard", "type": "direct", "rateId": "" } ```
     *
     * @tags API v2
     * @name CreateExchangeTransaction1
     * @summary Create exchange transaction
     * @request POST:/v2/exchange
     */
    createExchangeTransaction1: (
      data: {
        /** @example "0x57f31ad4b64095347F87eDB1675566DAfF5EC886" */
        address?: string;
        /** @example "fixed-rate" */
        flow?: string;
        /** @example "0.01" */
        fromAmount?: string;
        /** @example "btc" */
        fromCurrency?: string;
        /** @example "btc" */
        fromNetwork?: string;
        /** @example "puLHO5Y2EPg05QkN11OnbRxCA3wCGtBr" */
        rateId?: string;
        /** @example "eth" */
        toCurrency?: string;
        /** @example "eth" */
        toNetwork?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "standard" */
          flow?: string;
          /** @example 0.003 */
          fromAmount?: number;
          /** @example "btc" */
          fromCurrency?: string;
          /** @example "btc" */
          fromNetwork?: string;
          /** @example "3a2360771439a3" */
          id?: string;
          /** @example "3M7QKsJDKbVZAhFPpFSVtVQv6Nzon3Lwtv" */
          payinAddress?: string;
          /** @example "0x57f31ad4b64095347F87eDB1675566DAfF5EC886" */
          payoutAddress?: string;
          /** @example "135Hej8p1xSKoChWu5x6LSbNn5opgpojGn" */
          refundAddress?: string;
          /** @example 0.052286 */
          toAmount?: number;
          /** @example "eth" */
          toCurrency?: string;
          /** @example "eth" */
          toNetwork?: string;
          /** @example "direct" */
          type?: string;
          /** @example "2023-11-07T10:09:46.517Z" */
          validUntil?: string;
        },
        any
      >({
        path: `/v2/exchange`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns the status and additional information of a single transaction. Transaction ID is taken from the <a href="#3c8edfd0-ae3f-4738-a01c-de3e196bd761">'Create transaction'</a> endpoint. **Note:** we also give the opportunity to transfer additional fields in the ['Create transaction'](#3c8edfd0-ae3f-4738-a01c-de3e196bd761) endpoint, which we return in this method. Аdditional fields that can be transferred include: - userId — a personal and permanent identifier under which information is stored in the database; - payload — object that can contain up to 5 arbitrary fields up to 64 characters long; If you would like to enable these fields, please contact us at [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) with the subject line "Special partner fields". <h3>Successful response:</h3> <p>The response contains an object with transaction information.</p> <p>Fields in the response vary depending on the status and a type of the transaction.</p> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>id</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction ID</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>status</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction status:<br>new,<br>waiting,<br>confirming,<br>exchanging,<br>sending,<br>finished,<br>failed,<br>refunded,<br>verifying<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>actionsAvailable</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Boolean</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Indicates if an exchange can be pushed or refunded using Public push &amp; refund endpoints.<a rel="noreferrer noopener nofollow" href="https://documenter.getpostman.com/view/8180765/TzJoFLtG#acf2515b-99c7-44bd-935c-dc42693b8026" target="_blank" url="https://documenter.getpostman.com/view/8180765/TzJoFLtG#acf2515b-99c7-44bd-935c-dc42693b8026">Read more</a></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromNetwork</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of the currency you want to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toNetwork</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of the currency you want to receive</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>expectedAmountFrom</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The amount you want to send</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>expectedAmountTo</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Estimated value that you will get based on the field <i>expectedAmountFrom</i>.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amountFrom</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Exchange amount of fromCurrency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amountTo</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Exchange amount of toCurrency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The wallet address that will recieve the exchanged funds</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID that you send when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundAddress</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund address (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundExtraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>ExtraId for refund (if you specified it)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>createdAt</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction creation date and time</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>updatedAt</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time of the last transaction update (e.g. status update)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>depositReceivedAt</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Deposit receiving date and time</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payinHash</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction hash in the blockchain of the currency which you specified in the fromCurrency field that you send when creating the transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payoutHash</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction hash in the blockchain of the currency which you specified in the toCurrency field. We generate it when creating a transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromLegacyTicker</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to exchange in an old format as it is specified in a response from<a rel="noreferrer noopener nofollow" href="#a44b3f19-3e57-4f39-9822-e2ca3cf1d566" target="_self" url="#a44b3f19-3e57-4f39-9822-e2ca3cf1d566">Currency info API-v1 endpoint</a></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toLegacyTicker</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency you want to receive in an old format as it is specified in a response from<a rel="noreferrer noopener nofollow" href="#a44b3f19-3e57-4f39-9822-e2ca3cf1d566" target="_self" url="#a44b3f19-3e57-4f39-9822-e2ca3cf1d566">Currency info API-v1 endpoint</a></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundHash</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Hash for the refund transaction</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refundAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Expected amount for the refund</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>userId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>A personal and permanent identifier under which information is stored in the database (If you would like to enable this field, please contact us at partners@changenow.io with the subject line "Special partner fields")</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><b>validUntil</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time before estimated amount would be freezed in case of using rateId. If you set param "useRateId" to true, you could use returned field "rateId" in next method for creating transaction to freeze estimated amount that you got in this method. Estimated amount would be valid until this date and time</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><b>relatedExchangesInfo</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Related Exchanges Info for original echange (id, status, createdAt, fromCurrency, amountFrom, amountTo, fromNetwork)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><b>repeatedExchangesInfo</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Repeated Exchanges Info for original echange (id, status, createdAt, fromCurrency, amountFrom, amountTo, fromNetwork)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><b>originalExchangeInfo</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String|null</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Original exchanges info for repeated or related exchanges</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name TransactionStatus2
     * @summary Transaction status
     * @request GET:/v2/exchange/by-id
     */
    transactionStatus2: (
      query?: {
        /**
         * (Required) Transaction ID from <a href="#3c8edfd0-ae3f-4738-a01c-de3e196bd761">Create transaction</a> request
         * @example "81cc9c3a9157a6"
         */
        id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example false */
          actionsAvailable?: boolean;
          /** @example 0.013 */
          amountFrom?: number;
          /** @example 7.41109355 */
          amountTo?: number;
          /** @example "2024-06-11T12:49:07.139Z" */
          createdAt?: string;
          /** @example "2024-06-11T12:50:47.122Z" */
          depositReceivedAt?: string;
          /** @example null */
          expectedAmountFrom?: any;
          /** @example 7.4050889 */
          expectedAmountTo?: number;
          /** @example "bnb" */
          fromCurrency?: string;
          /** @example "bnbbsc" */
          fromLegacyTicker?: string;
          /** @example "bsc" */
          fromNetwork?: string;
          /** @example "81cc9c3a9157a6" */
          id?: string;
          /** @example null */
          originalExchangeInfo?: any;
          /** @example "0x2915767890A6FbF031DCe70E1b80D987Dc3a2922" */
          payinAddress?: string;
          /** @example null */
          payinExtraId?: any;
          /** @example "0x6703a443898b26f4f7d10e5b05a68848a3b0fb598c54c50a5f23e0807dfc5cea" */
          payinHash?: string;
          /** @example "0x07e35e2fe54d341d526701bdbda7b632f620942d" */
          payoutAddress?: string;
          /** @example null */
          payoutExtraId?: any;
          /** @example "0xd3382cafd44dd6644336eb8290b400adffa42b4486e93f1bed1f845eceb56e60" */
          payoutHash?: string;
          /** @example null */
          refundAddress?: any;
          /** @example null */
          refundAmount?: any;
          /** @example null */
          refundExtraId?: any;
          /** @example null */
          refundHash?: any;
          /** @example [{"amountFrom":9,"amountTo":null,"createdAt":"2024-06-11T12:53:57.457","fromCurrency":"usdt","fromNetwork":"bsc","id":"2c0167b2979936","status":"sending"}] */
          relatedExchangesInfo?: {
            /** @example 9 */
            amountFrom?: number;
            /** @example null */
            amountTo?: any;
            /** @example "2024-06-11T12:53:57.457" */
            createdAt?: string;
            /** @example "usdt" */
            fromCurrency?: string;
            /** @example "bsc" */
            fromNetwork?: string;
            /** @example "2c0167b2979936" */
            id?: string;
            /** @example "sending" */
            status?: string;
          }[];
          /** @example [{"amountFrom":0.013,"amountTo":null,"createdAt":"2024-06-11T12:51:13.382","id":"cb11103dd7e6e9","status":"failed"}] */
          repeatedExchangesInfo?: {
            /** @example 0.013 */
            amountFrom?: number;
            /** @example null */
            amountTo?: any;
            /** @example "2024-06-11T12:51:13.382" */
            createdAt?: string;
            /** @example "cb11103dd7e6e9" */
            id?: string;
            /** @example "failed" */
            status?: string;
          }[];
          /** @example "finished" */
          status?: string;
          /** @example "usdt" */
          toCurrency?: string;
          /** @example "usdtbsc" */
          toLegacyTicker?: string;
          /** @example "bsc" */
          toNetwork?: string;
          /** @example "2024-06-11T12:52:15.759Z" */
          updatedAt?: string;
          /** @example null */
          userId?: any;
          /** @example null */
          validUntil?: any;
        },
        void | {
          /** @example "forbidden" */
          error?: string;
          /** @example "The transaction was made from another api key" */
          message?: string;
        }
      >({
        path: `/v2/exchange/by-id`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint validates the address with a checksum depending on a transferred network. The ‘result’ field in the response shows if the address is valid: True if valid, and False if the address is invalid. The ‘message’ field describes why the address is invalid. In case the address is valid, this field is null. An error may occur in case the request is incorrect: a cryptocurrency or an address are not indicated, or we do not support this network yet. <h3>Successful response:</h3> The response contains the ‘result’ and ‘message’ fields. <h5>Successful response fields</h5> <table><tbody><tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Description</b></td></tr><tr><td><i><b>result</b></i></td><td><i>Boolean</i></td><td>The validity of an address</td></tr><tr><td><i><b>message</b></i></td><td><i>String|null</i></td><td>Explains why the address is invalid</td></tr><tr><td><i><b>isActivated</b></i></td><td><i>Boolean</i></td><td>The activation of an address</td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name AddressValidation
     * @summary Address validation
     * @request GET:/v2/validate/address
     */
    addressValidation: (
      query?: {
        /**
         * (Required) The network of the address
         * @example "eth"
         */
        currency?: string;
        /**
         * (Required) Address for validation
         * @example "0x57f31ad4b64095347F87eDB1675566DAfF5EC886"
         */
        address?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example null */
          isActivated?: any;
          /** @example null */
          message?: string | null;
          /** @example true */
          result?: boolean;
        },
        any
      >({
        path: `/v2/validate/address`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This API endpoint returns a list of addresses bound to address name. <h3>Successful response:</h3> <p>The response contains an array of addresses bound to address name.</p> <h5>Successful response fields</h5> <table> <tr> <td><b>Name</b></td> <td><b>Type</b></td> <td><b>Description</b></td> </tr> <tr> <td><b><i>success</i></b></td> <td><i>Boolean</i></td> <td>Indicates if a request was processed successfully</td> </tr> <tr> <td><b><i>addresses</i></b></td> <td><i>Array</i></td> <td>Array of addresses for requested fio-address or unstoppable-domain</td> </tr> <tr> <td><b><i>currency</i></b></td> <td><i>String</i></td> <td>Currency ticker in naming space of his protocol</td> </tr> <tr> <td><b><i>chain</i></b></td> <td><i>String</i></td> <td>Currency chain in naming space of his protocol</td> </tr> <tr> <td><b><i>address</i></b></td> <td><i>String</i></td> <td>Real address for requested fio-address or unstoppable-domain</td> </tr> <tr> <td><b><i>protocol</i></b></td> <td><i>String</i></td> <td>Protocol of current address</td> </tr> </table> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name UserAddresses
     * @summary User addresses
     * @request GET:/v2/addresses-by-name
     */
    userAddresses: (
      query?: {
        /**
         * (Required) FIO address or Unstoppable domain as name.zil / name.crypto
         * @example "name@domain"
         */
        name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example [{"address":"FIO7ovybfe7jXMUMAcgzhcDos48TMvaLT2operxwstnXQZvvEGSmK","chain":"fio","currency":"fio","protocol":"fio"},{"address":"0x9021e9675b29abe5d5b1fb91b3d263a0ea0149ce","chain":"eth","currency":"eth","protocol":"fio"},{"address":"0x9021e9675b29abe5d5b1fb91b3d263a0ea0149ce","chain":"eth","currency":"usdc","protocol":"fio"},{"address":"0x9021e9675b29abe5d5b1fb91b3d263a0ea0149ce","chain":"eth","currency":"bat","protocol":"fio"},{"address":"0x9021e9675b29abe5d5b1fb91b3d263a0ea0149ce","chain":"eth","currency":"link","protocol":"fio"},{"address":"0x9021e9675b29abe5d5b1fb91b3d263a0ea0149ce","chain":"eth","currency":"usdt","protocol":"fio"},{"address":"38yScDZKW5Fk1uh7diuQJ5Ww9bdYZCB8PU","chain":"btc","currency":"btc","protocol":"fio"},{"address":"MW1DGxy5RzGTjuqGMt7qdXvNLpV7TSPB5P","chain":"ltc","currency":"ltc","protocol":"fio"},{"address":"XvhuFznkhn2VK1XZhVecFGXSdvHf9bDC67","chain":"dash","currency":"dash","protocol":"fio"},{"address":"19THL9ns15oJZJ9mRhU2PPN6w8JFXd3TEE","chain":"bsv","currency":"bsv","protocol":"fio"},{"address":"qrth56m90pr0q5d8j2evtcc8s8074pl2aqdzle82f8","chain":"bch","currency":"bch","protocol":"fio"},{"address":"Sfd5F2L4bdKrRBfRgKPUjbCcWPLSF15n6h","chain":"smart","currency":"smart","protocol":"fio"},{"address":"45t5DwpDV7WVNA4MzW8tst4KzEg8AMA8JTy8iu9GKeJeZzzsG7gqw8MAuxeWivu7kCL4iJUVqCLN45oeM7m6nZ3CEyki9fh","chain":"xmr","currency":"xmr","protocol":"fio"},{"address":"tz1bjPM8gM26m6UidsKKodUVkcbtrT7Fp6SY","chain":"xtz","currency":"xtz","protocol":"fio"},{"address":"RD7XsZ8y9Aow4dfRrfqC4NvrZT7S1VUnBZ","chain":"rvn","currency":"rvn","protocol":"fio"},{"address":"rwNcKej6SBivhEgcxXU7zyTTmTbdLSCmqx","chain":"xrp","currency":"xrp","protocol":"fio"},{"address":"nano_3ej8cp1myhsbr3rf3m8gxszpy3f9qq4g3aagrx6f3fuet9iuxjgomxa5mage","chain":"nano","currency":"nano","protocol":"fio"}] */
          addresses?: {
            /** @example "FIO7ovybfe7jXMUMAcgzhcDos48TMvaLT2operxwstnXQZvvEGSmK" */
            address?: string;
            /** @example "fio" */
            chain?: string;
            /** @example "fio" */
            currency?: string;
            /** @example "fio" */
            protocol?: string;
          }[];
          /** @example "not_found" */
          error?: string;
          /** @example "Address name is not found." */
          message?: string;
          /** @example true */
          success?: boolean;
        },
        any
      >({
        path: `/v2/addresses-by-name`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint provides an estimated value that will be spent on paying network fees during an exchange. This number is ALREADY included in the estimate. Access to this endpoint you can receive upon dedicated request to [](https://mailto:api@changenow.io)[partners@changenow.io](https://mailto:partners@changenow.io) ## SUCCESSFUL RESPONSE: The response contains the ‘estimatedFee’ object and 'deposit', 'withdrawal', 'totals', and 'converted' fields inside it. ### SUCCESSFUL RESPONSE FIELDS <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>estimatedFee</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Object</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Object that contains detailed info on the network fee estimation.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>deposit</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Object</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Object that contains detailed info on the deposit network fees.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>currency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Deposit currency's ticker.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>network</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Deposit currency's network.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network fee in the deposit currency.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>withdrawal</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Object</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Object that contains detailed info on the withdrawal network fees.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>currency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Withdrawal currency's ticker.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>network</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Withdrawal currency's network.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>amount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network fee in the withdrawal currency.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>totals</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Object</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Object that contains combined network fee in deposit or withdeawal currency.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>from</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Object</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Object that contains combined network fee estimated to the deposit currency.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>to</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Object</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Object that contains combined network fee estimated to the withdrawal currency.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>converted</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Object</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Object that contains detailed info on the network fee estimation in select currency.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>currency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network fee currency's ticker.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>network</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Network of currency's ticker.</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>deposit</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Deposit fee in the selected currency.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>withdrawal</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Withdrawal fee in the selected currency.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>total</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Combined network fee in selected currency.<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr></tr></tbody></table>
     *
     * @tags API v2
     * @name EstimatedExchangeNetworkFee
     * @summary Estimated exchange network fee
     * @request GET:/v2/exchange/network-fee
     * @secure
     */
    estimatedExchangeNetworkFee: (
      query?: {
        /**
         * (Required) Ticker of the currency you want to exchange
         * @example "usdt"
         */
        fromCurrency?: string;
        /**
         * (Required) Ticker of the currency you want to receive
         * @example "usdt"
         */
        toCurrency?: string;
        /**
         * (Optional) Used to disambiguate multichain currencies.
         * @example "eth"
         */
        fromNetwork?: string;
        /**
         * (Optional) Used to disambiguate multichain currencies.
         * @example "eth"
         */
        toNetwork?: string;
        /**
         * (Required if type is direct) Must be greater then 0.
         * @example "100"
         */
        fromAmount?: string;
        /**
         * (Optional) Ticker of the currency you want to convert
         * @example "usd"
         */
        convertedCurrency?: string;
        /**
         * (Optional) Used to disambiguate multichain currencies.
         * @example "usd"
         */
        convertedNetwork?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v2/exchange/network-fee`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description This API endpoint provides the direct and reverse market crypto-to-crypto, fiat-to-crypto or crypto-to-fiat estimated amounts. **Attention! Do not use this endpoint for financial aims, only for informational! These rates don't include any fees.** To work with this endpoint, provide your API key in the X-CHANGENOW-API-KEY title. To calculate the direct estimated amount, set: fromCurrency, toCurrency, fromAmount, type: direct To calculate the reverse estimated amount, set: fromCurrency, toCurrency, toAmount, type: reverse Access to this endpoint you can receive upon dedicated request to [partners@changenow.io](https://mailto:partners@changenow.io) <h3>Successful response:</h3> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>“From” currency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toCurrency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>“To” currency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>fromAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The amount of “from” currency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>toAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The amount of “to” currency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>type</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The type of the estimated amount — direct or reverse</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name MarketEstimateFiatAndCrypto
     * @summary Market estimate fiat and crypto
     * @request GET:/v2/markets/estimate
     */
    marketEstimateFiatAndCrypto: (
      query?: {
        /**
         * (Required) "From" currency
         * @example "usdt"
         */
        fromCurrency?: string;
        /**
         * (Required) "To" currency
         * @example "btc"
         */
        toCurrency?: string;
        /**
         * (Optional)  Set if this is a direct type of the estimated amount
         * @example "1000"
         */
        fromAmount?: string;
        /**
         * (Optional) Set if this is a reverse type of the estimated amount
         * @example ""
         */
        toAmount?: string;
        /**
         * (Optional) Valid values: [direct, reverse]
         * If the type is not set, ‘direct’ is used by default.
         * @example "direct"
         */
        type?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 20965.220097818812 */
          fromAmount?: number;
          /** @example "usdt" */
          fromCurrency?: string;
          /** @example 2 */
          toAmount?: number;
          /** @example "btc" */
          toCurrency?: string;
          /** @example "reverse" */
          type?: string;
        },
        {
          /** @example "bad_params" */
          error?: string;
          /** @example "toAmount is required if type is reverse" */
          message?: string;
        }
      >({
        path: `/v2/markets/estimate`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description The API endpoint returns a list of partner transactions according to the selected parameters. <h3>Successful response:</h3> <h5>Successful response fields</h5> <table><tbody><tr><td><div><b>Name</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Type</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><b>Description</b></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; count</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The number of exchanges found by the selected parameters</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>exchanges</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; createdAt</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time when the transaction was created</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; updatedAt</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time of the last transaction update (e.g. status update)</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; exchangeId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; requestId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Transaction ID</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction ID</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; status</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Transaction status:<br>waiting,<br>confirming,<br>exchanging,<br>sending,<br>finished,<br>failed,<br>refunded,<br>verifying<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; validUntil</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Date and time of transaction validity</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; flow</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Type of exchange flow:<br>standard<br>fixed-rate<br></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payin</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; currency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency sent by the user</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; address</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Generated wallet address to which the user sent the deposit</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; extraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID for currencies that require it</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; amount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The actual amount of the deposit sent by the user</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; expectedAmount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Initially indicated amount that the user plans to exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; hash</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The hash of the deposit transaction that the user sent to the payin address</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>payout</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr></tr><tr><td><div><i><b>&nbsp; &nbsp; currency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency for which the user exchanged his funds</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; address</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The wallet address to which the funds were received after the exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; extraId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID for currencies that require it</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; hash</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Hash of the transaction sending funds after the exchange</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>refund</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr></tr><tr><td><div><i><b>&nbsp; &nbsp; currency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency of refund</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; address</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Refund address</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; extra_id</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Extra ID for currencies that require it</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; hash</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>The hash of the transaction refunded to the user</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>partnerInfo</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; commission</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; &nbsp; &nbsp; currency</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Ticker of the currency sent by the user</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; &nbsp; &nbsp; amount</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Commission size in currency</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; &nbsp; &nbsp; percent</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Number</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Percentage of commission</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; userId</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>String</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>A personal and permanent identifier under which information is stored in the database (If you would like to enable this field, please contact us at <a rel="noreferrer noopener nofollow" href="https://mailto:partners@changenow.io" target="_blank" url="https://mailto:partners@changenow.io">partners@changenow.io</a> with the subject line "Special partner fields")</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr><tr><td><div><i><b>&nbsp; &nbsp; payload</b></i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div><i>Array</i></div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td><td><div>Object that can contain up to 5 arbitrary fields up to 64 characters long;<br>(If you would like to enable this field, please contact us at <a rel="noreferrer noopener nofollow" href="https://mailto:partners@changenow.io" target="_blank" url="mailto:partners@changenow.io">partners@changenow.io</a> with the subject line "Special partner fields")</div><div contenteditable="false"><div><div><div></div></div></div><div></div></div></td></tr></tbody></table> <p>You can find <b>examples of errors</b> in the Example request block (use the drop-down list).</p> <h3>Request Parameters:</h3>
     *
     * @tags API v2
     * @name Exchanges
     * @summary Exchanges
     * @request GET:/v2/exchanges
     * @secure
     */
    exchanges: (
      data: any,
      query?: {
        /**
         * (Optional) Limit of transactions to return (default: 100)
         *
         * Note:  You can only specify limit bigger than 0 and less than 100
         * @example "10"
         */
        limit?: string;
        /**
         * (Optional) Number of transactions to skip (default: 0)
         *
         * Note:  You can only specify offset bigger than 0
         * @example "0"
         */
        offset?: string;
        /**
         * (Optional) Sort ascending or descending. Enum: ["ASC",  "DESC"]
         * @example ""
         */
        sortDirection?: string;
        /**
         * (Optional) Sort by selected field. Enum: ["createdAt", "updatedAt"]
         * @example ""
         */
        sortField?: string;
        /**
         * (Optional) Sort by date. Enum: ["createdAt", "updatedAt"]
         * @example ""
         */
        dateField?: string;
        /**
         * (Optional) Set a date to filter transactions created after this specified date.
         *
         * Format: YYYY-MM-DDTHH:mm:ss.sssZ
         * @example ""
         */
        dateFrom?: string;
        /**
         * (Optional) Set a date to filter transactions created before this specified date.
         *
         * Format: YYYY-MM-DDTHH:mm:ss.sssZ
         * @example ""
         */
        dateTo?: string;
        /**
         * (Optional) Transaction ID.
         * @example ""
         */
        requestId?: string;
        /**
         * (Optional) Sort by userId
         * @example ""
         */
        userId?: string;
        /**
         * (Optional) Sort by payoutAddress
         * @example ""
         */
        payoutAddress?: string;
        /** @example "" */
        statuses?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v2/exchanges`,
        method: "GET",
        query: query,
        body: data,
        secure: true,
        type: ContentType.Text,
        ...params,
      }),
  };
}
