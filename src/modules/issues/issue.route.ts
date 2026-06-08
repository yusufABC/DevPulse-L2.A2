import { Router } from "express";
import { issueController } from "./issue.controller.js";
import { auth, authorizeRoles } from "../../middleware/auth.js";
const router=Router()


router.post('/',auth,issueController.createIssues)
router.get('/',issueController.getIssueBySort)

router.get("/:id", issueController.getSingleIssue);

router.patch('/:id',auth,issueController.updateIssue)


 router.delete('/:id', auth, authorizeRoles('maintainer'), issueController.deleteIssue)
export const issueRouter=router