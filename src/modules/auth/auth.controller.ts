import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { isRole } from "../../types/index.js";
import { signToken, verifyToken } from "../../utils/jwt.js";
import authService from "./auth.service.js";

const createUser = async (req: Request, res: Response) => {
  const { role } = req.body;

  if (role && !isRole(role)) {
    sendResponse(res, { message: "Invalid role" }, 400);
    return;
  }

  const user = await authService.createUser(req.body);
  if (!user) {
    sendResponse(res, { message: "Failed to create user" }, 400);
    return;
  }

  sendResponse(res, { message: "User created successfully", data: user }, 201);
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await authService.validateUser(email, password);

  if (!user) {
    sendResponse(res, { message: "Invalid email or password " }, 401);
    return
  }
  const {accessToken,refreshToken}=signToken(user)

  const result={
    token:accessToken,
    user:user
    
  }

  res.cookie('refreshToken',refreshToken,{
    sameSite:"lax",
    httpOnly:true,
    secure:false

  })
 return sendResponse(res, { message: "Login successful", data: result }, 200);
  
};


const refresh=async (req:Request,res:Response)=>{
  const refreshToken=req.cookies?.refreshToken

  if(!refreshToken){
    sendResponse(res,{message:'refresh token is missing'},401)
  }

  const payload=verifyToken(refreshToken,'refresh')

  // console.log(payload);

  const user=await authService.getUserById(payload.id)
  if(!user){
    sendResponse(res,{message:'User not found'},401)

  }


  const {accessToken,refreshToken:newRefreshToken} =signToken(user)


  res.cookie('refreshToken',newRefreshToken,{
    sameSite:"lax",
    httpOnly:true,
    secure:false

  })

  sendResponse(res,{message:'Token Refreshed',data:{
    accessToken,
    newRefreshToken
  }})

}
 
export const authController = {
  createUser,
  loginUser,
  refresh
};
