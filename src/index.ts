import { ChangeNowClient } from './client'

/**
 *
 * @param changeNowApiKey - changenow API key
 */
export function createChangeNowSDK(changeNowApiKey: string) {
  const changeNowClient = new ChangeNowClient({
    baseApiParams: {
      headers: {
        'x-changenow-api-key': changeNowApiKey,
      },
    },
  })

  return {
    v1: {
      ...changeNowClient.v1,
    },
    v2: {
      ...changeNowClient.v2,
    },
  }
}
