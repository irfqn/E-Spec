const express = require("express");
const specificationController = require("../controllers/specification.controller");

const router = express.Router();

router.get("/", specificationController.getAllSpecifications);
router.post("/", specificationController.createSpecificationDraft);
router.get("/:id", specificationController.getSpecificationById);
router.put("/:id", specificationController.updateSpecificationDraft);

module.exports = router;
