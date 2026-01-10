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
    // Validate and normalize baseURL
    if (!baseURL || typeof baseURL !== "string") {
      throw new Error("Invalid baseURL provided to XtreamApi")
    }

    let normalizedBaseURL = baseURL.trim()

    // Remove any path components (Xtream API expects base URL only)
    // Handle URLs that might include player_api.php or other paths
    try {
      // If URL already has protocol, use it; otherwise add http://
      const urlToParse =
        normalizedBaseURL.startsWith("http://") || normalizedBaseURL.startsWith("https://")
          ? normalizedBaseURL
          : `http://${normalizedBaseURL}`

      const urlObj = new URL(urlToParse)

      // Reconstruct URL with only protocol, host, and port (no path, no query, no hash)
      // Use hostname instead of host to avoid issues, then manually add port if present
      normalizedBaseURL = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ""}`
    } catch (e) {
      // If URL parsing fails, try simple normalization
      console.warn("URL parsing failed, using simple normalization:", e, "Original URL:", baseURL)

      // Ensure URL has protocol
      if (!normalizedBaseURL.startsWith("http://") && !normalizedBaseURL.startsWith("https://")) {
        normalizedBaseURL = `http://${normalizedBaseURL}`
      }

      // Remove path components (everything after the first / that's not part of protocol)
      // Pattern: http:// or https:// followed by host:port (if port exists) or just host
      // Match: protocol://host:port or protocol://host
      const match = normalizedBaseURL.match(/^(https?:\/\/[^\/:]+(?::\d+)?)/)
      if (match) {
        normalizedBaseURL = match[1]
      } else {
        // Fallback: remove everything after first slash after protocol
        normalizedBaseURL = normalizedBaseURL.split("/").slice(0, 3).join("/")
      }
    }

    // Final validation - ensure URL is valid
    if (!normalizedBaseURL.match(/^https?:\/\/.+/)) {
      throw new Error(`Invalid normalized URL: ${normalizedBaseURL}`)
    }

    console.log("XtreamApi baseURL normalized:", normalizedBaseURL, "from:", baseURL)

    this.apisauce = create({
      baseURL: normalizedBaseURL,
      timeout: 20000, // Increased timeout for better reliability
      headers: {
        "Accept": "application/json",
        "User-Agent": "HMVergePlay/1.0",
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
    try {
      const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", {
        username,
        password,
        action: "get_vod_categories",
      })

      if (!response.ok) {
        const problem = getGeneralApiProblem(response)
        if (problem) {
          console.error("VOD Categories API Error:", {
            problem,
            status: response.status,
            problemType: response.problem,
            baseURL: this.apisauce.getBaseURL(),
          })
          return problem
        }
        return { kind: "unknown", temporary: true }
      }

      return { kind: "ok", data: response.data || [] }
    } catch (error: any) {
      console.error("VOD Categories API Exception:", error)
      return { kind: "cannot-connect", temporary: true }
    }
  }

  async getSeriesCategories(
    username: string,
    password: string,
  ): Promise<{ kind: "ok"; data: any[] } | GeneralApiProblem> {
    try {
      const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", {
        username,
        password,
        action: "get_series_categories",
      })

      if (!response.ok) {
        const problem = getGeneralApiProblem(response)
        if (problem) {
          console.error("Series Categories API Error:", {
            problem,
            status: response.status,
            problemType: response.problem,
            baseURL: this.apisauce.getBaseURL(),
          })
          return problem
        }
        return { kind: "unknown", temporary: true }
      }

      return { kind: "ok", data: response.data || [] }
    } catch (error: any) {
      console.error("Series Categories API Exception:", error)
      return { kind: "cannot-connect", temporary: true }
    }
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
    try {
      const params: any = {
        username,
        password,
        action: "get_vod_streams",
      }
      if (categoryId) {
        params.category_id = categoryId
      }

      const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", params)

      if (!response.ok) {
        const problem = getGeneralApiProblem(response)
        if (problem) {
          console.error("VOD Streams API Error:", {
            problem,
            status: response.status,
            problemType: response.problem,
            baseURL: this.apisauce.getBaseURL(),
          })
          return problem
        }
        return { kind: "unknown", temporary: true }
      }

      return { kind: "ok", data: response.data || [] }
    } catch (error: any) {
      console.error("VOD Streams Exception:", error)
      return { kind: "cannot-connect", temporary: true }
    }
  }

  async getSeries(
    username: string,
    password: string,
    categoryId?: string,
  ): Promise<{ kind: "ok"; data: any[] } | GeneralApiProblem> {
    try {
      const params: any = {
        username,
        password,
        action: "get_series",
      }
      if (categoryId) {
        params.category_id = categoryId
      }

      const response: ApiResponse<any[]> = await this.apisauce.get("player_api.php", params)

      if (!response.ok) {
        const problem = getGeneralApiProblem(response)
        if (problem) {
          console.error("Series API Error:", {
            problem,
            status: response.status,
            problemType: response.problem,
            baseURL: this.apisauce.getBaseURL(),
          })
          return problem
        }
        return { kind: "unknown", temporary: true }
      }

      return { kind: "ok", data: response.data || [] }
    } catch (error: any) {
      console.error("Series API Exception:", error)
      return { kind: "cannot-connect", temporary: true }
    }
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
