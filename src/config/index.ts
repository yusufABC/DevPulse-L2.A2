import dotenv from 'dotenv'
import path from 'path'
import { env } from 'process'
dotenv.config({
path:path.join(process.cwd(),'.env')
})


const config={
    port:env.PORT as string,
    database_string:env.DATABASE_STRING as string,
    node_env: env.NODE_ENV as string,
    secret:process.env.JWT_SECRET as string,
    refreshSecret:process.env.REFRESH_SECRET as string
}



export default config