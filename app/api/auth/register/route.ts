import { handleRegister } from 'lyzr-architect-pg'

export const POST = (request: Request) => handleRegister(request as any)
