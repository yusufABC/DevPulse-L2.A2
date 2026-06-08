import bcrypt from "bcryptjs";
import { pool } from "../../db/index.js";
import type { RUser, User } from "../../types/index.js";

class AuthService{
async createUser(payload:RUser & {password:string}){

    const {name,email,role,password}=payload


    const passwordHash=await bcrypt.hash(password,10)



    const response=await pool`
    INSERT INTO users(name,email,password_hash,role)
    VALUES (${name},${email},${passwordHash},COALESCE(${role},'contributor'))
    RETURNING  id,name,email,role,created_at,updated_at
    `
    return response[0]
}

async validateUser(email:string,password:string){

  const response= await pool`
  SELECT * FROM users WHERE email=${email}
  `
  if(response.length===0){
    return null
  }
  
  const {password_hash,...user}=response[0] as User

  const isValid=await bcrypt.compare(password,password_hash)


 return isValid ? user : null

   
}

async getUserById(id:string){
  const res=await pool`
  SELECT  id, name, email, role FROM users WHERE id=${id}
  `

  return res[0] as RUser & {id:number}
}


}

export default new AuthService()