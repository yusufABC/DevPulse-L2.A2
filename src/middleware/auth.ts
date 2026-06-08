import type { NextFunction, Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse.js";
import { verifyToken } from "../utils/jwt.js";
import authService from "../modules/auth/auth.service.js";
import type { Role } from "../types/index.js";

export const auth=async (req:Request,res:Response,next:NextFunction)=>{
    const token=req.headers.authorization

    
      if(!token){
       return sendResponse(res,{message:'refresh token is missing',error: true },401)
      }

      
        const payload=verifyToken(token,'access')
      

        const user=await authService.getUserById(payload.id)
          if(!user){
            sendResponse(res,{message:'User not found'},401)
        
          }

          req.user=user
          next()
        
    
}



export const authorizeRoles = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendResponse(_res, { message: "Unauthorized", error: true }, 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendResponse(
        _res,
        { message: "Forbidden - you don't have permission", error: true },
        403,
      );
    }

    return next();
  };
};