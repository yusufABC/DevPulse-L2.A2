import config from "../config/index.js";
import type { RUser } from "../types/index.js";
import jwt, { type JwtPayload } from 'jsonwebtoken'
export const signToken = (payload:RUser) => {
    const accessToken=jwt.sign(payload,config.secret,{
        expiresIn:'1d'
    })
    const refreshToken=jwt.sign(payload,config.refreshSecret,{
        expiresIn:'7d'
    })

    

    return ({accessToken,refreshToken})

}


export const verifyToken=(token:string,type:'access'|'refresh')=>{
    const secret=type=== 'access'? config.secret : config.refreshSecret

   const decoded= jwt.verify(token,secret)

   return decoded as JwtPayload
}

// console.log(signToken({name:'hello',email:'hello@gmail.com',role:"contributor"}));