const pool = require("../config/database");

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 422;
  return error;
};

const resolveMasterData = async (client, specificationTypeId, formData) => {
  const [typeResult, plantResult] = await Promise.all([
    client.query(
      `SELECT id FROM specification_types WHERE id = $1 AND isactive = TRUE`,
      [specificationTypeId]
    ),
    client.query(`SELECT id FROM plants WHERE id = $1`, [formData.plant]),
  ]);

  if (!typeResult.rows[0]) {
    throw createValidationError("Tipe spesifikasi tidak aktif atau tidak ditemukan.");
  }

  if (!plantResult.rows[0]) {
    throw createValidationError("Plant tidak ditemukan.");
  }

  const references = [
    ["department", "departments", "departmentid"],
    ["materialCategory", "material_categories", "materialcategoryid"],
    ["materialGroup", "material_groups", "materialgroupid"],
  ];
  const resolved = { plantId: plantResult.rows[0].id };

  for (const [field, table, column] of references) {
    const value = formData[field];

    if (value === undefined || value === null || value === "") {
      resolved[field] = null;
      continue;
    }

    const result = await client.query(
      `SELECT id FROM ${table} WHERE id = $1`,
      [value]
    );

    if (!result.rows[0]) {
      throw createValidationError(`${field} tidak ditemukan.`);
    }

    resolved[field] = result.rows[0].id;
  }

  return resolved;
};

const resolveAttributes = async (client, specificationTypeId, attributeValues) => {
  const entries = Object.entries(attributeValues);

  if (!entries.length) return [];

  const codes = entries.map(([code]) => code);
  const result = await client.query(
    `
      SELECT sa.id, sa.attributecode, sa.supportsmultiplevalues
      FROM specification_attributes sa
      INNER JOIN specification_sections ss ON ss.id = sa.sectionid
      WHERE ss.specificationtypeid = $1
        AND ss.isactive = TRUE
        AND sa.isactive = TRUE
        AND sa.attributecode = ANY($2::text[])
    `,
    [specificationTypeId, codes]
  );
  const attributes = new Map(
    result.rows.map((attribute) => [attribute.attributecode, attribute])
  );

  const unresolved = codes.filter((code) => !attributes.has(code));

  if (unresolved.length) {
    throw createValidationError(
      `Atribut tidak didukung untuk tipe spesifikasi ini: ${unresolved.join(", ")}.`
    );
  }

  return entries.flatMap(([code, value]) => {
    const attribute = attributes.get(code);
    const values = Array.isArray(value) ? value : [value];

    if (!attribute.supportsmultiplevalues && values.length > 1) {
      throw createValidationError(`Atribut ${code} hanya menerima satu nilai.`);
    }

    return values.map((item, index) => ({
      attributeId: attribute.id,
      value: item,
      sortOrder: index,
    }));
  });
};

const insertValues = async (client, specificationId, values) => {
  for (const entry of values) {
    const value = entry.value;
    const isObject = value && typeof value === "object" && !Array.isArray(value);
    const valueText = isObject || typeof value === "boolean" || typeof value === "number"
      ? null
      : String(value ?? "");
    const valueNumber = typeof value === "number" ? value : null;
    const valueBoolean = typeof value === "boolean" ? value : null;
    const valueJson = isObject ? value : null;

    await client.query(
      `
        INSERT INTO specification_values (
          specificationid,
          attributeid,
          valuetext,
          valuenumber,
          valueboolean,
          valuejson,
          sortorder
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        specificationId,
        entry.attributeId,
        valueText,
        valueNumber,
        valueBoolean,
        valueJson,
        entry.sortOrder,
      ]
    );
  }
};

const findEditableById = async (id) => {
  const result = await pool.query(
    `SELECT id, specificationtypeid, status FROM specifications WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

const createDraft = async (payload) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const masterData = await resolveMasterData(
      client,
      payload.specificationTypeId,
      payload.formData
    );
    const values = await resolveAttributes(
      client,
      payload.specificationTypeId,
      payload.attributeValues
    );
    const insertResult = await client.query(
      `
        INSERT INTO specifications (
          documentno, specificationtypeid, plantid, departmentid,
          materialcategoryid, materialgroupid, requestor,
          materialdescription, materialcode, reasonprocure, formdata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, specificationtypeid AS specification_type_id, status
      `,
      [
        payload.documentNo,
        payload.specificationTypeId,
        masterData.plantId,
        masterData.department,
        masterData.materialCategory,
        masterData.materialGroup,
        String(payload.formData.requestor).trim(),
        String(payload.formData.materialDescription).trim(),
        payload.formData.materialCode || null,
        payload.formData.reasonToProcure || payload.formData.reason || null,
        payload.formData,
      ]
    );
    const specification = insertResult.rows[0];

    await insertValues(client, specification.id, values);
    await client.query("COMMIT");

    return specification;
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      throw createValidationError("Nomor dokumen sudah digunakan.");
    }

    throw error;
  } finally {
    client.release();
  }
};

const updateDraft = async (id, payload) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT specificationtypeid, status FROM specifications WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const current = locked.rows[0];

    if (!current) {
      const error = new Error("Spesifikasi tidak ditemukan.");
      error.statusCode = 404;
      throw error;
    }

    if (current.status !== "Draft") {
      const error = new Error("Spesifikasi tidak lagi dapat diubah.");
      error.statusCode = 409;
      throw error;
    }

    const masterData = await resolveMasterData(
      client,
      current.specificationtypeid,
      payload.formData
    );
    const values = await resolveAttributes(
      client,
      current.specificationtypeid,
      payload.attributeValues
    );

    const updateResult = await client.query(
      `
        UPDATE specifications
        SET documentno = $2,
            plantid = $3,
            departmentid = $4,
            materialcategoryid = $5,
            materialgroupid = $6,
            requestor = $7,
            materialdescription = $8,
            materialcode = $9,
            reasonprocure = $10,
            formdata = $11,
            updateddate = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, specificationtypeid AS specification_type_id, status
      `,
      [
        id,
        payload.documentNo,
        masterData.plantId,
        masterData.department,
        masterData.materialCategory,
        masterData.materialGroup,
        String(payload.formData.requestor).trim(),
        String(payload.formData.materialDescription).trim(),
        payload.formData.materialCode || null,
        payload.formData.reasonToProcure || payload.formData.reason || null,
        payload.formData,
      ]
    );

    await client.query(`DELETE FROM specification_values WHERE specificationid = $1`, [id]);
    await insertValues(client, id, values);
    await client.query("COMMIT");

    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      throw createValidationError("Nomor dokumen sudah digunakan.");
    }

    throw error;
  } finally {
    client.release();
  }
};

const findAll = async ({ specificationTypeId, status }) => {
  const conditions = [];
  const values = [];

  if (specificationTypeId !== undefined) {
    values.push(specificationTypeId);
    conditions.push(`s.specificationtypeid = $${values.length}`);
  }

  if (status !== undefined) {
    values.push(status);
    conditions.push(`s.status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query(
    `
      SELECT
        s.id,
        s.documentno AS document_no,
        s.revisionno AS revision_no,
        s.specificationtypeid AS specification_type_id,
        st.typecode AS specification_type_code,
        st.typename AS specification_type_name,
        s.requestor,
        s.materialdescription AS material_description,
        s.materialcode AS material_code,
        s.reasonprocure AS reason_to_procure,
        s.status,
        s.submittedat AS submitted_at,
        s.createddate AS created_at,
        s.updateddate AS updated_at,
        latest_status.changed_at AS status_changed_at
      FROM specifications s
      INNER JOIN specification_types st
        ON st.id = s.specificationtypeid
      LEFT JOIN LATERAL (
        SELECT ssh.changedat AS changed_at
        FROM specification_status_history ssh
        WHERE ssh.specificationid = s.id
        ORDER BY ssh.changedat DESC, ssh.id DESC
        LIMIT 1
      ) latest_status ON TRUE
      ${whereClause}
      ORDER BY s.createddate DESC NULLS LAST, s.id DESC
    `,
    values
  );

  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    `
      SELECT
        s.id,
        s.documentno AS document_no,
        s.revisionno AS revision_no,
        s.specificationtypeid AS specification_type_id,
        st.typecode AS specification_type_code,
        st.typename AS specification_type_name,
        s.plantid AS plant_id,
        s.departmentid AS department_id,
        s.subdepartmentid AS sub_department_id,
        s.materialcategoryid AS material_category_id,
        s.materialgroupid AS material_group_id,
        s.requestor,
        s.materialdescription AS material_description,
        s.materialcode AS material_code,
        s.purchasegroupid AS purchase_group_id,
        s.reasonprocure AS reason_to_procure,
        s.status,
        s.formdata AS form_data,
        s.submittedat AS submitted_at,
        s.createdby AS created_by,
        s.createddate AS created_at,
        s.updatedby AS updated_by,
        s.updateddate AS updated_at,
        COALESCE(values_by_section.sections, '[]'::jsonb) AS sections,
        COALESCE(status_history.items, '[]'::jsonb) AS status_history
      FROM specifications s
      INNER JOIN specification_types st
        ON st.id = s.specificationtypeid
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', section_data.id,
            'code', section_data.code,
            'name', section_data.name,
            'sortOrder', section_data.sort_order,
            'attributes', section_data.attributes
          )
          ORDER BY section_data.sort_order, section_data.id
        ) AS sections
        FROM (
          SELECT
            ss.id,
            ss.sectioncode AS code,
            ss.sectionname AS name,
            ss.sortorder AS sort_order,
            jsonb_agg(
              jsonb_build_object(
                'id', attribute_data.id,
                'code', attribute_data.code,
                'name', attribute_data.name,
                'inputType', attribute_data.input_type,
                'sortOrder', attribute_data.sort_order,
                'values', attribute_data.values
              )
              ORDER BY attribute_data.sort_order, attribute_data.id
            ) AS attributes
          FROM specification_values sv
          INNER JOIN specification_attributes sa
            ON sa.id = sv.attributeid
          INNER JOIN specification_sections ss
            ON ss.id = sa.sectionid
          CROSS JOIN LATERAL (
            SELECT
              sa.id,
              sa.attributecode AS code,
              sa.attributename AS name,
              sa.inputtype AS input_type,
              sa.sortorder AS sort_order,
              jsonb_agg(
                jsonb_build_object(
                  'id', sv2.id,
                  'optionId', sv2.optionid,
                  'text', sv2.valuetext,
                  'number', sv2.valuenumber,
                  'boolean', sv2.valueboolean,
                  'json', sv2.valuejson,
                  'sortOrder', sv2.sortorder
                )
                ORDER BY sv2.sortorder, sv2.id
              ) AS values
            FROM specification_values sv2
            WHERE sv2.specificationid = s.id
              AND sv2.attributeid = sa.id
            GROUP BY sa.id, sa.attributecode, sa.attributename, sa.inputtype, sa.sortorder
          ) attribute_data
          WHERE sv.specificationid = s.id
          GROUP BY ss.id, ss.sectioncode, ss.sectionname, ss.sortorder
        ) section_data
      ) values_by_section ON TRUE
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ssh.id,
            'previousStatus', ssh.previousstatus,
            'newStatus', ssh.newstatus,
            'changedBy', ssh.changedby,
            'reason', ssh.changereason,
            'changedAt', ssh.changedat
          )
          ORDER BY ssh.changedat DESC, ssh.id DESC
        ) AS items
        FROM specification_status_history ssh
        WHERE ssh.specificationid = s.id
      ) status_history ON TRUE
      WHERE s.id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
};

module.exports = {
  findAll,
  findById,
  findEditableById,
  createDraft,
  updateDraft,
};
