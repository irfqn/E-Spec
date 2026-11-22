const specificationRepository = require("../repositories/specification.repository");

const getAllSpecifications = async ({ specificationTypeId, status }) => {
  const filters = {};

  if (specificationTypeId !== undefined) {
    if (!/^[1-9]\d*$/.test(specificationTypeId)) {
      const error = new Error("specificationTypeId harus berupa angka positif.");
      error.statusCode = 400;
      throw error;
    }

    filters.specificationTypeId = Number(specificationTypeId);
  }

  if (status !== undefined) {
    const normalizedStatus = String(status).trim();

    if (!normalizedStatus) {
      const error = new Error("status tidak boleh kosong.");
      error.statusCode = 400;
      throw error;
    }

    filters.status = normalizedStatus;
  }

  return specificationRepository.findAll(filters);
};

const getSpecificationById = async (id) => {
  const specification = await specificationRepository.findById(id);

  if (!specification) {
    const error = new Error("Spesifikasi tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  return specification;
};

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeActor = (actor) => {
  if (
    !actor ||
    typeof actor !== "object" ||
    typeof actor.userId !== "string" ||
    !actor.userId.trim()
  ) {
    throw createHttpError("Autentikasi diperlukan.", 401);
  }

  return {
    userId: actor.userId.trim(),
    displayName: String(actor.displayName ?? actor.userId).trim() || actor.userId.trim(),
  };
};

const normalizePayload = (payload, existingTypeId) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createHttpError("Payload JSON tidak valid.", 400);
  }

  const { specificationTypeId, formData, documentNo, attributeValues } = payload;

  if (payload.status !== undefined || payload.revisionNo !== undefined) {
    throw createHttpError(
      "status dan revisionNo ditentukan oleh server.",
      422
    );
  }

  if (!formData || typeof formData !== "object" || Array.isArray(formData)) {
    throw createHttpError("formData wajib berupa object.", 400);
  }

  if (
    specificationTypeId !== undefined &&
    !/^[1-9]\d*$/.test(String(specificationTypeId))
  ) {
    throw createHttpError("specificationTypeId harus berupa angka positif.", 400);
  }

  const normalizedTypeId = specificationTypeId === undefined
    ? undefined
    : Number(specificationTypeId);

  if (
    existingTypeId !== undefined &&
    normalizedTypeId !== undefined &&
    normalizedTypeId !== existingTypeId
  ) {
    throw createHttpError("Tipe spesifikasi tidak dapat diubah.", 422);
  }

  const attributes = attributeValues === undefined ? {} : attributeValues;

  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    throw createHttpError("attributeValues wajib berupa object.", 422);
  }

  const requiredFields = ["plant", "requestor"];

  requiredFields.forEach((field) => {
    if (!String(formData[field] ?? "").trim()) {
      throw createHttpError(`formData.${field} wajib diisi.`, 422);
    }
  });

  const normalizedDocumentNo = String(
    documentNo ?? formData.docNo ?? ""
  ).trim();

  if (!normalizedDocumentNo) {
    throw createHttpError("documentNo atau formData.docNo wajib diisi.", 422);
  }

  return {
    specificationTypeId: existingTypeId ?? normalizedTypeId,
    documentNo: normalizedDocumentNo,
    formData,
    attributeValues: attributes,
  };
};

const createSpecificationDraft = async (payload, actor) => {
  const normalizedActor = normalizeActor(actor);
  const normalizedPayload = normalizePayload(payload);

  if (normalizedPayload.specificationTypeId === undefined) {
    throw createHttpError("specificationTypeId wajib diisi.", 422);
  }

  return specificationRepository.createDraft({
    ...normalizedPayload,
    creatorUserId: normalizedActor.userId,
    creatorDisplayName: normalizedActor.displayName,
  });
};

const updateSpecificationDraft = async (id, payload, actor) => {
  const normalizedActor = normalizeActor(actor);
  const existing = await specificationRepository.findEditableById(id);

  if (!existing) {
    throw createHttpError("Spesifikasi tidak ditemukan.", 404);
  }

  if (!["Draft", "Revision Required"].includes(existing.status)) {
    throw createHttpError("Spesifikasi tidak lagi dapat diubah.", 409);
  }

  if (
    !existing.createdbyuserid ||
    String(existing.createdbyuserid) !== normalizedActor.userId
  ) {
    throw createHttpError("Anda bukan pemilik Draft ini.", 403);
  }

  const normalizedPayload = normalizePayload(payload, existing.specificationtypeid);

  return specificationRepository.updateDraft(id, normalizedPayload, normalizedActor);
};

module.exports = {
  getAllSpecifications,
  getSpecificationById,
  createSpecificationDraft,
  updateSpecificationDraft,
};
