export interface M3UChannel {
  id: string
  name: string
  group: string
  url: string
  logo?: string
  tvgId?: string
  tvgName?: string
}

export function parseM3U(content: string): M3UChannel[] {
  const lines = content.split(/\r?\n/)
  const channels: M3UChannel[] = []

  let currentChannel: Partial<M3UChannel> = {}

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith("#EXTINF:")) {
      // Parse EXTINF line
      // Example: #EXTINF:-1 tvg-id="" tvg-name="" tvg-logo="" group-title="",Channel Name

      const infoMatch = trimmedLine.match(/#EXTINF:(-?\d+)(.*),(.*)$/)
      if (infoMatch) {
        const attributes = infoMatch[2]
        const name = infoMatch[3].trim()

        currentChannel.name = name

        // Parse attributes
        const tvgIdMatch = attributes.match(/tvg-id="([^"]*)"/)
        if (tvgIdMatch) currentChannel.tvgId = tvgIdMatch[1]

        const tvgNameMatch = attributes.match(/tvg-name="([^"]*)"/)
        if (tvgNameMatch) currentChannel.tvgName = tvgNameMatch[1]

        const logoMatch = attributes.match(/tvg-logo="([^"]*)"/)
        if (logoMatch) currentChannel.logo = logoMatch[1]

        const groupMatch = attributes.match(/group-title="([^"]*)"/)
        currentChannel.group = groupMatch ? groupMatch[1] : "Uncategorized"
      }
    } else if (trimmedLine.length > 0 && !trimmedLine.startsWith("#")) {
      // This should be the URL
      if (currentChannel.name) {
        currentChannel.url = trimmedLine
        currentChannel.id = Math.random().toString(36).substr(2, 9) // Generate a temporary ID

        channels.push(currentChannel as M3UChannel)
        currentChannel = {}
      }
    }
  }

  return channels
}
