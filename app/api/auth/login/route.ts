import { handleLogin } from 'lyzr-architect-pg'

export const POST = (request: Request) => handleLogin(request as any)
