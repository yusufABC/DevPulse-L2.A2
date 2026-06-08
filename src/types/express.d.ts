import type { RUser } from "./index.ts";

declare global{
    namespace Express{
        interface Request{
            user:RUser & {id:number}
        }
    }
}