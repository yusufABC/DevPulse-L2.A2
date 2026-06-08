import type { NextFunction, Request, Response } from "express";
import config from "../config/index.js";

export const globalErrorHanlder=(err:unknown,req:Request,res:Response,next:NextFunction)=>{
res.status(500).json({
    success:false,
    message:err instanceof Error ? err.message : 'Internal server error',
    stack:config.node_env === 'development' && err instanceof Error ? err.stack : undefined

})
}