import { handleMe } from 'lyzr-architect-pg'

export const dynamic = 'force-dynamic'
export const GET = (request: Request) => handleMe(request as any)
