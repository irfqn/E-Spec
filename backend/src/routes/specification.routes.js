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

router.get("/", specificationController.getAllSpecifications);
router.post("/", ...requireRequestor, specificationController.createSpecificationDraft);
router.get("/:id", specificationController.getSpecificationById);
router.put("/:id", ...requireRequestor, specificationController.updateSpecificationDraft);

module.exports = router;
