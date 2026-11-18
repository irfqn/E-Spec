const specificationService = require("../services/specification.service");

const getAllSpecifications = async (req, res, next) => {
  try {
    const { specificationTypeId, status } = req.query;

    const specifications = await specificationService.getAllSpecifications({
      specificationTypeId,
      status,
    });

    return res.status(200).json({
      success: true,
      data: specifications,
      total: specifications.length,
    });
  } catch (error) {
    next(error);
  }
};

const getSpecificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "ID spesifikasi tidak valid.",
      });
    }

    const specification = await specificationService.getSpecificationById(
      Number(id)
    );

    return res.status(200).json({
      success: true,
      data: specification,
    });
  } catch (error) {
    next(error);
  }
};

const createSpecificationDraft = async (req, res, next) => {
  try {
    const specification = await specificationService.createSpecificationDraft(
      req.body
    );

    return res.status(201).json({
      success: true,
      data: specification,
      message: "Specification draft created successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const updateSpecificationDraft = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "ID spesifikasi tidak valid.",
      });
    }

    const specification = await specificationService.updateSpecificationDraft(
      Number(id),
      req.body
    );

    return res.status(200).json({
      success: true,
      data: specification,
      message: "Specification draft updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSpecifications,
  getSpecificationById,
  createSpecificationDraft,
  updateSpecificationDraft,
};
