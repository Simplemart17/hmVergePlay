import { ApiResponse, ApisauceInstance, create } from "apisauce"

import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"

export interface XtreamLoginResponse {
  user_info: {
    username: string
    password: string
    message: string
    auth: number
    status: string
    exp_date: string
    is_trial: string
    active_cons: string
    created_at: string
    max_connections: string
    allowed_output_formats: string[]
  }
  server_info: {
    url: string
    port: string
    https_port: string
    server_protocol: string
    rtmp_port: string
    timezone: string
    timestamp_now: number
    time_now: string
  }
}

export class XtreamApi {
  apisauce: ApisauceInstance

  constructor(baseURL: string) {
    this.apisauce = create({
      baseURL,
      timeout: 15000,
      headers: {
        Accept: "application/json",
      },
    })
  }

  async authenticate(
    username: string,
    password: string,
  ): Promise<{ kind: "ok"; data: XtreamLoginResponse } | GeneralApiProblem> {
    const response: ApiResponse<XtreamLoginResponse> = await this.apisauce.get("player_api.php", {
      username,
      password,
    })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const data = response.data
      if (!data || !data.user_info) {
        return { kind: "bad-data" }
      }
      return { kind: "ok", data }
    } catch {
      return { kind: "bad-data" }
    }
  }

  async getLiveCategories(
    username: string,
    password: string,
  ): Promise<{ kind: "ok"; data: any[] } | GeneralApiProblem> {
    const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", {
      username,
      password,
      action: "get_live_categories",
    })

    if (!response.ok) return getGeneralApiProblem(response) || { kind: "unknown", temporary: true }

    return { kind: "ok", data: response.data || [] }
  }

  async getVODCategories(
    username: string,
    password: string,
  ): Promise<{ kind: "ok"; data: any[] } | GeneralApiProblem> {
    const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", {
      username,
      password,
      action: "get_vod_categories",
    })

    if (!response.ok) return getGeneralApiProblem(response) || { kind: "unknown", temporary: true }

    return { kind: "ok", data: response.data || [] }
  }

  async getSeriesCategories(
    username: string,
    password: string,
  ): Promise<{ kind: "ok"; data: any[] } | GeneralApiProblem> {
    const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", {
      username,
      password,
      action: "get_series_categories",
    })

    if (!response.ok) return getGeneralApiProblem(response) || { kind: "unknown", temporary: true }

    return { kind: "ok", data: response.data || [] }
  }

  async getLiveStreams(
    username: string,
    password: string,
    categoryId?: string,
  ): Promise<{ kind: "ok"; data: any[] } | GeneralApiProblem> {
    const params: any = {
      username,
      password,
      action: "get_live_streams",
    }
    if (categoryId) {
      params.category_id = categoryId
    }

    const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", params)

    if (!response.ok) return getGeneralApiProblem(response) || { kind: "unknown", temporary: true }

    return { kind: "ok", data: response.data || [] }
  }

  async getVODStreams(
    username: string,
    password: string,
    categoryId?: string,
  ): Promise<{ kind: "ok"; data: any[] } | GeneralApiProblem> {
    const params: any = {
      username,
      password,
      action: "get_vod_streams",
    }
    if (categoryId) {
      params.category_id = categoryId
    }

    const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", params)

    if (!response.ok) return getGeneralApiProblem(response) || { kind: "unknown", temporary: true }

    return { kind: "ok", data: response.data || [] }
  }

  async getSeries(
    username: string,
    password: string,
    categoryId?: string,
  ): Promise<{ kind: "ok"; data: any[] } | GeneralApiProblem> {
    const params: any = {
      username,
      password,
      action: "get_series",
    }
    if (categoryId) {
      params.category_id = categoryId
    }

    const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", params)

    if (!response.ok) return getGeneralApiProblem(response) || { kind: "unknown", temporary: true }

    return { kind: "ok", data: response.data || [] }
  }
  async getSeriesInfo(
    username: string,
    password: string,
    seriesId: number,
  ): Promise<{ kind: "ok"; data: any } | GeneralApiProblem> {
    const response: ApiResponse<any> = await this.apisauce.get("player_api.php", {
      username,
      password,
      action: "get_series_info",
      series_id: seriesId,
    })

    if (!response.ok) return getGeneralApiProblem(response) || { kind: "unknown", temporary: true }

    return { kind: "ok", data: response.data || {} }
  }
}
