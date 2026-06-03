export type ToolStatus = 'live' | 'coming_soon'

export interface Tool {
  name: string
  description: string
  subdomain: string
  status: ToolStatus
}

export const tools: Tool[] = [
  {
    name: 'ReplyFlow',
    description: 'AI-powered customer service replies in seconds.',
    subdomain: 'https://replyflow.northsideintelligence.com',
    status: 'live',
  },
  {
    name: 'GrantBot',
    description: 'Grant discovery and application assistance for nonprofits.',
    subdomain: 'https://grantbot.northsideintelligence.com',
    status: 'coming_soon',
  },
]

export const liveTools = tools.filter((t) => t.status === 'live')
