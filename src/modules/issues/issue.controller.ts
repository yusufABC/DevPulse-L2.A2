import type { Request, Response } from "express";
import issueService from "./issue.service.js";
import { sendResponse } from "../../utils/sendResponse.js";

const createIssues=async (req:Request,res:Response)=>{
const reporterId=req.user.id
 const { title, description, type } = req.body;
const issue=await issueService.createIssue(
     title,
    description,
    type,
    reporterId,
)

return sendResponse(res, {
  message: "Issue created successfully",
  ...(issue ? { data: issue } : {}),
}, 201);
}


 const getIssueBySort = async (req: Request, res: Response) => {
     const { sort = 'newest', type, status } = req.query as {
         sort?: string
         type?: string
         status?: string
     }
 
     // Validate sort
     if (sort && sort !== 'newest' && sort !== 'oldest') {
         return sendResponse(res, { message: 'Invalid sort value' }, 400)
     }
 
     // Validate type
     if (type && type !== 'bug' && type !== 'feature_request') {
         return sendResponse(res, { message: 'Invalid type value' }, 400)
     }
 
     // Validate status
     if (status && status !== 'open' && status !== 'in_progress' && status !== 'resolved') {
         return sendResponse(res, { message: 'Invalid status value' }, 400)
     }
 
     const issues = await issueService.getAllIssue(
         sort as 'oldest' | 'newest',
         type,
         status
     )
 
     return sendResponse(res, {
         message: 'Issues retrived successfully',
         data: issues
     }, 200)
 }


 const getSingleIssue=async(req:Request,res:Response)=>{
       const id = req.params.id as string;

    const issue = await issueService.getSingleIssue(parseInt(id));

    sendResponse(
      res,
      { message: "Issue retrieved successfully", data: issue },
      200,
    );
 }


 const updateIssue=async(req:Request,res:Response)=>{
    const issueId=req.params.id as string
    // console.log(issueId);
    // const {title,description,type}=req.body
const issue=await issueService.updateIssue(
    parseInt(issueId),
    req.body,
    req.user
)
// console.log(req.user!);

  sendResponse(
      res,
      { message: "Issue updated successfully", data: issue },
      200,
    );

 }



  const deleteIssue = async (req: Request, res: Response) => {
     const issueId = req.params.id as string
     
     await issueService.deleteIssue(parseInt(issueId), req.user)
     
     sendResponse(res, { message: "Issue deleted successfully" }, 200)
 }


export const issueController={
    createIssues,
    getIssueBySort,
    getSingleIssue,
    updateIssue,
    deleteIssue
}