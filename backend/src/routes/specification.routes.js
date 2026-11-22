const express = require("express");
const specificationController = require("../controllers/specification.controller");
const {
  authenticate,
  requireAuthenticated,
} = require("../auth/middlewares/authentication.middleware");
const {
  requireRoles,
} = require("../auth/middlewares/authorization.middleware");
const { ROLES } = require("../auth/constants/roles");

const router = express.Router();

const requireRequestor = [
  authenticate,
  requireAuthenticated,
  requireRoles([ROLES.REQUESTOR]),
];
const requireApprovalUser = [authenticate, requireAuthenticated];

router.get("/", specificationController.getAllSpecifications);
router.post("/", ...requireRequestor, specificationController.createSpecificationDraft);
router.post("/:id/submit", ...requireRequestor, specificationController.submitSpecification);
router.post("/:id/resubmit", ...requireRequestor, specificationController.resubmitSpecification);
router.post("/:id/approval/approve", ...requireApprovalUser, specificationController.approveSpecification);
router.post("/:id/approval/reject", ...requireApprovalUser, specificationController.rejectSpecification);
router.post("/:id/approval/return", ...requireApprovalUser, specificationController.returnSpecification);
router.get("/:id/workflow", ...requireApprovalUser, specificationController.getWorkflow);
router.get("/:id", specificationController.getSpecificationById);
router.put("/:id", ...requireRequestor, specificationController.updateSpecificationDraft);

module.exports = router;
