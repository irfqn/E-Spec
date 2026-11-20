(() => {
  "use strict";

  // =====================================================
  // E-SPEC BARANG — QUESTIONNAIRE CONTROLLER
  // =====================================================

  const STORAGE_KEY = "eSpecBarangQuestionnaire.v2";
  const OLD_STORAGE_KEY = "eSpecBarangQuestionnaire.v1";
  const VERSION_STORAGE_KEY = "eSpecBarangVersion.v1";
  const HISTORY_KEY = "eSpecBarangTransactions.v1";

  const questionnaire = document.getElementById("questionnaireForm");
  const printForm = document.getElementById("printSpecForm");

  if (!questionnaire) {
    console.error("Form kuesioner Barang tidak ditemukan.");
    return;
  }

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const pdfBtn = $("#pdfBtn");
  const resetBtn = $("#resetBtn");
  const saveBtn = $("#saveAdminBtn");
  const draftStatus = $("#draftStatus");

  const plantSelect = $("#plantCodeSelect");
  const plantDesc = $("#plantDescInput");
  const deptSelect = $("#deptSelect");

  const reasonChoice = $("#reasonChoice");
  const reasonOther = $("#reasonOther");
  const reasonOthers = $("#reasonOthersBarang");
  const reasonFinal = $("#reasonFinal");

  const dimensionContainer = $("#dimensionRows");
  const drawingUpload = $("#questionDrawingUpload");
  const drawingPreview = $("#drawingPreview");

  const technicalContainer = $("#dynamicCustomTechnicalContainer");
  const uniqueContainer = $("#dynamicCustomUniqueContainer");

  // =====================================================
  // REQUIRED DOCUMENTS
  // =====================================================

  const requiredDocumentsContainer = $("#requiredDocumentsContainer");
  const addRequiredDocumentBtn = $("#addRequiredDocumentBtn");

  const requiredDocumentOptions = [
    ...$$(
      'input[type="hidden"][name^="document"]',
      questionnaire
    )
      .map(input => input.value.trim())
      .filter(Boolean)
  ];

  if (!requiredDocumentOptions.includes("Others")) {
    requiredDocumentOptions.push("Others");
  }

  const DIMENSION_OPTIONS = ["L", "W", "H", "T", "ID", "OD", "DN"];
  const DIMENSION_SYMBOLS = ["x", "~", "/", "±", "-"];

  const MECHANICAL_PARAMETERS = [
    "Capacity",
    "Pressure",
    "Flowrate",
    "Speed",
    "Tolerance"
  ];

  const MECHANICAL_SYMBOLS = ["x", "--", "~", "/", "±", "-"];

  const PLANT_DATA = {
    "1210 - Plant Gending": [
      "HRGA",
      "Fermentation - Decalcium",
      "Fermentation - Glucose",
      "Fermentation - Fermentation",
      "Isolation & Purification - Isolation",
      "Isolation & Purification - Purification",
      "Packing",
      "Polycello & Technic Packing",
      "Liquid Fertilizer Sales",
      "SCM - PPIC",
      "SCM - Inderect Sourcing",
      "Engineering & Technical Development",
      "Utility",
      "Electrical Instrument",
      "Mechanical & Maintenance",
      "Logistic & Warehouse",
      "QA & QC",
      "SHE",
      "IT",
      "Costing Associate"
    ],

    "1220 - Plant Cikarang": [
      "HRGA",
      "Production - Dry",
      "Production - Wet",
      "SCM - PPIC",
      "SCM - Inderect Sourcing",
      "Maintenance",
      "Project",
      "Warehouse",
      "QA & QC",
      "SHE",
      "IT",
      "Supply Chain Finance"
    ],

    "1230 - Plant Minahasa Selatan": [
      "Production - Opening & Processing",
      "Production - Production & TCA",
      "PPIC",
      "Indirect Sourcing",
      "Maintenance",
      "Utility",
      "Warehouse",
      "QA & QC",
      "SHE",
      "IT",
      "Plant Operation Controller"
    ]
  };

  const CATEGORY_MAPPING = {
    "Asset Barang": "Asset Barang",
    "Expense Barang Umum / Teknik": "Expense Barang General",
    "Expense Bahan Kimia / Sanitasi / Pelumas": "Expense Barang Kimia"
  };

  let drawingImage = "";
  let loadingDocument = false;
  let saving = false;

  // =====================================================
  // MATERIAL GROUP — OTHERS
  // =====================================================

  const materialGroupSelect = $("#materialGroup", questionnaire);
  const materialGroupOtherInput = $("#materialGroupOther", questionnaire);

  function updateMaterialGroupOther(clearValue = true) {
    if (!materialGroupSelect || !materialGroupOtherInput) return;

    const isOthers = materialGroupSelect.value === "Others";

    materialGroupOtherInput.hidden = !isOthers;
    materialGroupOtherInput.disabled = !isOthers;
    materialGroupOtherInput.required = isOthers;

    if (!isOthers && clearValue) {
      materialGroupOtherInput.value = "";
    }
  }



  // =====================================================
  // MATERIAL GROUP MATRIX — FULL SPECIFICATION
  //
  // * = Mandatory
  // O = Optional
  // "" = Hidden
  // =====================================================

  const MATERIAL_GROUP_MATRIX = {
    "BEARING": {
      materialDescription: "*",
      materialCode: "O",
      partNumber: "*",
      variant: "*",
      dimension: "*",
      brand: "*",
      catalogue: "O",
      uom: "*",
      packSize: "O",

      voltage: "",
      current: "",
      power: "",
      resistance: "",
      frequency: "",
      capacitance: "",
      phase: "",
      temperature: "",

      material: "O",
      capacity: "",
      connectionType: "",
      pressure: "",
      flowrate: "",
      speed: "",
      tolerance: "",

      concentration: "",
      viscosity: "",
      technicalOthers: "O",

      accessories: "O",
      uniqueOthers: "O"
    },

    "ELECTRIC": {
      materialDescription: "*",
      materialCode: "O",
      partNumber: "*",
      variant: "*",
      dimension: "O",
      brand: "*",
      catalogue: "O",
      uom: "*",
      packSize: "O",

      voltage: "*",
      current: "*",
      power: "*",
      resistance: "O",
      frequency: "O",
      capacitance: "O",
      phase: "O",
      temperature: "O",

      material: "",
      capacity: "",
      connectionType: "",
      pressure: "",
      flowrate: "",
      speed: "",
      tolerance: "",

      concentration: "",
      viscosity: "",
      technicalOthers: "O",

      accessories: "O",
      uniqueOthers: "O"
    },

    "PIPE": {
      materialDescription: "*",
      materialCode: "O",
      partNumber: "O",
      variant: "*",
      dimension: "*",
      brand: "O",
      catalogue: "O",
      uom: "*",
      packSize: "O",

      voltage: "",
      current: "",
      power: "",
      resistance: "",
      frequency: "",
      capacitance: "",
      phase: "",
      temperature: "",

      material: "*",
      capacity: "",
      connectionType: "O",
      pressure: "O",
      flowrate: "",
      speed: "",
      tolerance: "O",

      concentration: "",
      viscosity: "",
      technicalOthers: "O",

      accessories: "O",
      uniqueOthers: "O"
    },

    "EQUIPMENT": {
      materialDescription: "*",
      materialCode: "O",
      partNumber: "*",
      variant: "*",
      dimension: "*",
      brand: "O",
      catalogue: "O",
      uom: "*",
      packSize: "O",

      voltage: "",
      current: "",
      power: "",
      resistance: "",
      frequency: "",
      capacitance: "",
      phase: "",
      temperature: "O",

      material: "O",
      capacity: "O",
      connectionType: "",
      pressure: "",
      flowrate: "",
      speed: "",
      tolerance: "O",

      concentration: "",
      viscosity: "",
      technicalOthers: "O",

      accessories: "O",
      uniqueOthers: "O"
    },

    "BARANG UM": {
      materialDescription: "*",
      materialCode: "O",
      partNumber: "*",
      variant: "*",
      dimension: "O",
      brand: "O",
      catalogue: "O",
      uom: "*",
      packSize: "O",

      voltage: "",
      current: "",
      power: "",
      resistance: "",
      frequency: "",
      capacitance: "",
      phase: "",
      temperature: "",

      material: "O",
      capacity: "O",
      connectionType: "",
      pressure: "",
      flowrate: "",
      speed: "",
      tolerance: "O",

      concentration: "",
      viscosity: "",
      technicalOthers: "O",

      accessories: "O",
      uniqueOthers: "O"
    }
  };


  // =====================================================
  // GENERAL SPECIFICATION FIELDS
  // =====================================================

  const generalMatrixFields = {
    materialDescription: {
      wrapper: $('[name="materialDescription"]', questionnaire)?.closest(".q-field"),
      input: $('[name="materialDescription"]', questionnaire)
    },

    materialCode: {
      wrapper: $('[name="materialCode"]', questionnaire)?.closest(".q-field"),
      input: $('[name="materialCode"]', questionnaire)
    },

    partNumber: {
      wrapper: $('[name="partNumber"]', questionnaire)?.closest(".q-field"),
      input: $('[name="partNumber"]', questionnaire)
    },

    variant: {
      wrapper: $('[name="variant"]', questionnaire)?.closest(".q-field"),
      input: $('[name="variant"]', questionnaire)
    },

    dimension: {
      wrapper: $(".dimension-field", questionnaire),
      input: $("#dimensionFinal", questionnaire)
    },

    brand: {
      wrapper: $('[name="brand"]', questionnaire)?.closest(".q-field"),
      input: $('[name="brand"]', questionnaire)
    },

    catalogue: {
      wrapper: $('[name="catalogue"]', questionnaire)?.closest(".q-field"),
      input: $('[name="catalogue"]', questionnaire)
    },

    uom: {
      wrapper: $(".uom-field", questionnaire),
      input: $("#uomSelect", questionnaire)
    },

    packSize: {
      wrapper: $(".pack-size-field", questionnaire),
      input: $("#packSizeFinal", questionnaire)
    }
  };


  // =====================================================
  // TECHNICAL SPECIFICATION FIELDS
  // =====================================================

  const technicalMatrixFields = {

    // ELECTRICAL
    voltage: {
      wrapper: $('[data-electric-row="Voltage"]', questionnaire)
    },

    current: {
      wrapper: $('[data-electric-row="Current"]', questionnaire)
    },

    power: {
      wrapper: $('[data-electric-row="Power"]', questionnaire)
    },

    resistance: {
      wrapper: $('[data-electric-row="Resistance"]', questionnaire)
    },

    frequency: {
      wrapper: $('[data-electric-row="Frequency"]', questionnaire)
    },

    capacitance: {
      wrapper: $('[data-electric-row="Capacitance"]', questionnaire)
    },

    phase: {
      wrapper: $('[data-electric-row="Phase"]', questionnaire)
    },

    temperature: {
      wrapper: $('[data-electric-row="Temperature"]', questionnaire)
    },

    // MECHANICAL — MATERIAL
    material: {
      wrapper: $('[data-tech-label="Material"]', questionnaire)?.closest(".spec-field")
    },

    // MECHANICAL — CAPACITY
    capacity: {
      wrapper: $('[data-mechanical-row="Capacity"]', questionnaire)
    },

    // MECHANICAL — CONNECTION TYPE
    connectionType: {
      wrapper: $('[data-tech-label="Connection Type"]', questionnaire)?.closest(".spec-field")
    },

    pressure: {
      wrapper: $('[data-mechanical-row="Pressure"]', questionnaire)
    },

    flowrate: {
      wrapper: $('[data-mechanical-row="Flowrate"]', questionnaire)
    },

    speed: {
      wrapper: $('[data-mechanical-row="Speed"]', questionnaire)
    },

    tolerance: {
      wrapper: $('[data-mechanical-row="Tolerance"]', questionnaire)
    },

    // LIQUID
    concentration: {
      wrapper: $("#concentration", questionnaire)?.closest(".field")
    },

    viscosity: {
      wrapper: $("#viscosity", questionnaire)?.closest(".field")
    },

    // TECHNICAL OTHERS
    technicalOthers: {
      wrapper: $("#dynamicCustomTechnicalContainer", questionnaire)
        ?.closest(".q-technical-group")
    }
  };


  // =====================================================
  // UNIQUE SPECIFICATION FIELDS
  // =====================================================

  const uniqueMatrixFields = {
    accessories: {
      wrapper: $(".unique-accessories-field", questionnaire)
    },

    uniqueOthers: {
      wrapper: $("#dynamicCustomUniqueContainer", questionnaire)
    }
  };


  // =====================================================
  // COMBINE ALL MATRIX FIELDS
  // =====================================================

  const allMatrixFields = {
    ...generalMatrixFields,
    ...technicalMatrixFields,
    ...uniqueMatrixFields
  };


  // =====================================================
  // SAVE ORIGINAL FIELD STATES
  // =====================================================

  const matrixOriginalStates = new Map();

  Object.entries(allMatrixFields).forEach(([key, field]) => {
    if (!field.wrapper) return;

    matrixOriginalStates.set(key, {
      hidden: field.wrapper.hidden,
      required: field.input?.required ?? false,
      disabled: field.input?.disabled ?? false
    });
  });


  // =====================================================
  // SHOW HIDDEN ATTRIBUTE ELEMENTS
  // =====================================================

  const showHiddenToggle =
    $(".show-hidden-toggle input[type='checkbox']", document) ||
    $("#showHiddenAttribute", document);

  const showHiddenCounter =
    $(".show-hidden-info small", document);


  // =====================================================
  // GET CURRENT MATRIX STATUS
  // =====================================================

  function getCurrentMatrixStatus(fieldName) {
    const group = materialGroupSelect?.value || "";

    if (group === "Others") return "LEGACY";

    return MATERIAL_GROUP_MATRIX[group]?.[fieldName] || "";
  }


  // =====================================================
  // UPDATE SHOW HIDDEN COUNTER
  // =====================================================

  function updateShowHiddenCounter(hiddenCount = 0) {
    if (!showHiddenCounter) return;

    showHiddenCounter.textContent =
      `${hiddenCount} atribut tersembunyi`;
  }


  // =====================================================
  // RESTORE ORIGINAL MATRIX FIELD
  // =====================================================

  function restoreMatrixField(key) {
    const field = allMatrixFields[key];
    const original = matrixOriginalStates.get(key);

    if (!field?.wrapper || !original) return;

    field.wrapper.hidden = original.hidden;

    if (field.input) {
      field.input.required = original.required;
      field.input.disabled = original.disabled;
    }

    field.wrapper.removeAttribute("data-matrix-status");
    field.wrapper.removeAttribute("data-matrix-required");
  }


  // =====================================================
  // UPDATE CARD VISIBILITY
  // =====================================================

  function updateTechnicalCardVisibility() {
    const electricCard = $(".electric-spec-card", questionnaire);
    const mechanicalCard = $(".mechanical-spec-card", questionnaire);
    const liquidCard = $(".liquid-spec-card", questionnaire);

    if (electricCard) {
      const rows = $$("[data-electric-row]", electricCard);

      electricCard.hidden =
        rows.length > 0 && rows.every(row => row.hidden);
    }

    if (mechanicalCard) {
      const fields = [
        ...$$(".mechanical-basic-grid .spec-field", mechanicalCard),
        ...$$("[data-mechanical-row]", mechanicalCard)
      ];

      mechanicalCard.hidden =
        fields.length > 0 && fields.every(field => field.hidden);
    }

    if (liquidCard) {
      const fields = [
        $("#concentration", liquidCard)?.closest(".field"),
        $("#viscosity", liquidCard)?.closest(".field")
      ].filter(Boolean);

      liquidCard.hidden =
        fields.length > 0 && fields.every(field => field.hidden);
    }
  }


  // =====================================================
  // UPDATE MATERIAL GROUP MATRIX
  // =====================================================

  function updateMaterialGroupMatrix() {
    if (!materialGroupSelect) return;

    const group = materialGroupSelect.value;

    // Others atau belum memilih Material Group:
    // Kembalikan seluruh field ke kondisi awal.
    if (!MATERIAL_GROUP_MATRIX[group]) {
      Object.keys(allMatrixFields).forEach(restoreMatrixField);

      updateTechnicalCardVisibility();
      updateShowHiddenCounter(0);

      return;
    }

    const rules = MATERIAL_GROUP_MATRIX[group];
    const showHidden = Boolean(showHiddenToggle?.checked);

    let hiddenCount = 0;

    Object.entries(allMatrixFields).forEach(([key, field]) => {
      if (!field.wrapper) return;

      const status = rules[key] || "";

      field.wrapper.dataset.matrixStatus = status;

      if (status === "") {
        hiddenCount++;

        // Blank: hidden, kecuali toggle sedang aktif.
        field.wrapper.hidden = !showHidden;

        // Field yang muncul melalui toggle bersifat opsional.
        field.wrapper.removeAttribute("data-matrix-required");

        if (field.input) {
          field.input.required = false;
        }

        // Jangan disable dan jangan hapus nilai.
        return;
      }

      // * atau O: tampil.
      field.wrapper.hidden = false;

      if (status === "*") {
        field.wrapper.dataset.matrixRequired = "true";
      } else {
        field.wrapper.removeAttribute("data-matrix-required");
      }

      // Required pada General Specification.
      // Dimension dan Pack Size tetap memakai validasi khusus.
      if (field.input) {
        if (key === "dimension" || key === "packSize") {
          field.input.required = false;
        } else {
          field.input.required = status === "*";
        }
      }
    });

    updateTechnicalCardVisibility();
    updateShowHiddenCounter(hiddenCount);
  }


  // =====================================================
  // MATERIAL GROUP EVENTS
  // =====================================================

  materialGroupSelect?.addEventListener("change", () => {
    updateMaterialGroupOther();
    updateMaterialGroupMatrix();

    saveDraft();
    transferToPrint();
  });

  materialGroupOtherInput?.addEventListener("input", () => {
    saveDraft();
    transferToPrint();
  });


  // =====================================================
  // SHOW HIDDEN ATTRIBUTE EVENT
  // =====================================================

  showHiddenToggle?.addEventListener("change", () => {
    updateMaterialGroupMatrix();

    saveDraft();
    transferToPrint();
  });



  // =====================================================
  // UTILITIES
  // =====================================================

  function todayISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function setStatus(message) {
    if (draftStatus) draftStatus.textContent = message;
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function safeJSONParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function escapeSelector(value) {
    if (window.CSS?.escape) {
      return window.CSS.escape(String(value));
    }

    return String(value).replace(/["\\]/g, "\\$&");
  }

  function getVersionInput() {
    return $('[name="version"]', questionnaire);
  }

  function getCreatedDateInput() {
    return $('[name="createdDate"]', questionnaire);
  }

  // =====================================================
  // PLANT & DEPARTMENT
  // =====================================================

  function updateDepartment(restoreValue = "") {
    if (!plantSelect || !deptSelect) return;

    const selectedPlant = plantSelect.value;
    const description = selectedPlant.split(" - ")[1] || "";

    if (plantDesc) plantDesc.value = description;

    deptSelect.innerHTML =
      '<option value="">-- Pilih Departemen --</option>';

    (PLANT_DATA[selectedPlant] || []).forEach(department => {
      const option = document.createElement("option");
      option.value = department;
      option.textContent = department;
      deptSelect.appendChild(option);
    });

    if (restoreValue) deptSelect.value = restoreValue;
  }

  // =====================================================
  // MATERIAL CATEGORY — SINGLE SELECTION
  // =====================================================

  function getSelectedCategories() {
    return $$('[name="materialCategory"]:checked', questionnaire)
      .map(field => field.value);
  }

  function normalizeMaterialCategory() {
    const selected = $$(
      '[name="materialCategory"]:checked',
      questionnaire
    );

    selected.slice(1).forEach(field => {
      field.checked = false;
    });

    updateCategory();
  }

  function updateCategory() {
    const selected = getSelectedCategories();

    $$('[name="category"]', questionnaire).forEach(field => {
      field.checked = selected.some(
        category => CATEGORY_MAPPING[category] === field.value
      );
    });
  }

  questionnaire.addEventListener("change", event => {
    if (!event.target.matches('[name="materialCategory"]')) return;

    if (event.target.checked) {
      $$('[name="materialCategory"]', questionnaire).forEach(field => {
        if (field !== event.target) field.checked = false;
      });
    }

    updateCategory();
    saveDraft();
  });

  // =====================================================
  // REASON TO PROCURE
  // =====================================================

  function updateReason() {
    if (!reasonChoice || !reasonFinal) return;

    const isOthers = reasonChoice.value === "Others";

    if (reasonOthers) reasonOthers.hidden = !isOthers;

    if (reasonOther) {
      reasonOther.hidden = !isOthers;
      reasonOther.disabled = !isOthers;
      reasonOther.required = isOthers;

      if (!isOthers) reasonOther.value = "";
    }

    reasonFinal.value = isOthers
      ? (reasonOther?.value.trim() || "")
      : reasonChoice.value;
  }

  // =====================================================
  // MAIN UOM — OTHERS VISIBILITY
  // =====================================================

  const uomSelect = $("#uomSelect", questionnaire);
  const uomOther = $("#uomOther", questionnaire);

  function updateUomOther() {
    if (!uomSelect || !uomOther) return;

    const isOthers = uomSelect.value === "Others";

    uomOther.hidden = !isOthers;
    uomOther.disabled = !isOthers;
    uomOther.required = isOthers;

    if (!isOthers) uomOther.value = "";
  }

  // =====================================================
  // ELECTRICAL — OTHERS VISIBILITY
  // =====================================================

  function updateElectricalOthers(row) {
    if (!row) return;

    $$("[data-electric-unit]", row).forEach(select => {
      const position = select.dataset.electricUnit;

      const otherInput = $(
        `[data-electric-other="${position}"]`,
        row
      );

      if (!otherInput) return;

      const isOthers = select.value === "Others";

      otherInput.hidden = !isOthers;
      otherInput.disabled = !isOthers;
      otherInput.required = isOthers;

      otherInput.style.display = isOthers ? "block" : "none";

      if (!isOthers) {
        otherInput.value = "";
      }
    });
  }

  function updateAllElectricalOthers() {
    $$("[data-electric-row]", questionnaire).forEach(row => {
      updateElectricalOthers(row);
    });
  }

  function getElectricalEffectiveUnit(row, position) {
    const select = $(
      `[data-electric-unit="${position}"]`,
      row
    );

    const otherInput = $(
      `[data-electric-other="${position}"]`,
      row
    );

    if (!select) return "";

    if (select.value === "Others") {
      return otherInput?.value.trim() || "";
    }

    return select.value || "";
  }

  // =====================================================
  // DIMENSION
  // =====================================================

  function createDimensionRow(item = {}) {
    if (!dimensionContainer) return;

    if (dimensionContainer.querySelectorAll(".dimension-row").length >= 3) {
      return;
    }

    const row = document.createElement("div");
    row.className = "dimension-row";

    // DIMENSION
    const typeSelect = document.createElement("select");
    typeSelect.className = "dimension-type";

    const defaultType = document.createElement("option");
    defaultType.value = "";
    defaultType.textContent = "-- Pilih Dimension --";
    typeSelect.appendChild(defaultType);

    DIMENSION_OPTIONS.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      typeSelect.appendChild(option);
    });

    typeSelect.value = item.type || "";

    // DATA
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.className = "dimension-value";
    valueInput.placeholder = "Masukkan nilai";
    valueInput.value = item.value || "";

    // UOM
    const unitSelect = document.createElement("select");
    unitSelect.className = "dimension-unit";

    const defaultUnit = document.createElement("option");
    defaultUnit.value = "";
    defaultUnit.textContent = "-- Pilih UoM --";
    unitSelect.appendChild(defaultUnit);

    ["MM", "CM", "M", "INCH", "Others"].forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      unitSelect.appendChild(option);
    });

    unitSelect.value = item.unit || "";

    // INPUT UOM OTHERS
    const othersWrapper = document.createElement("div");
    othersWrapper.className = "dimension-unit-others";

    const othersInput = document.createElement("input");
    othersInput.type = "text";
    othersInput.className = "dimension-unit-other-input";
    othersInput.placeholder = "Masukkan satuan lainnya...";
    othersInput.value = item.otherUnit || "";

    othersWrapper.appendChild(othersInput);

    function toggleOthersInput() {
      const isOthers = unitSelect.value === "Others";

      othersWrapper.style.display = isOthers ? "block" : "none";
      othersInput.required = isOthers;

      if (!isOthers) {
        othersInput.value = "";
      }
    }

    unitSelect.addEventListener("change", () => {
      toggleOthersInput();
      saveDraft();
    });

    othersInput.addEventListener("input", saveDraft);

    // SYMBOL
    const symbolSelect = document.createElement("select");
    symbolSelect.className = "dimension-symbol";

    const defaultSymbol = document.createElement("option");
    defaultSymbol.value = "";
    defaultSymbol.textContent = "-- Pilih Simbol --";
    symbolSelect.appendChild(defaultSymbol);

    DIMENSION_SYMBOLS.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      symbolSelect.appendChild(option);
    });

    symbolSelect.value = item.symbol || "";

    // REMOVE BUTTON
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-dimension";
    removeButton.textContent = "×";
    removeButton.title = "Hapus";

    removeButton.addEventListener("click", () => {
      row.remove();
      updateDimension();
      saveDraft();
    });

    row.append(
      typeSelect,
      valueInput,
      unitSelect,
      symbolSelect,
      removeButton,
      othersWrapper
    );

    dimensionContainer.appendChild(row);

    toggleOthersInput();
    updateDimension();
  }

  function collectDimensionItems() {
    if (!dimensionContainer) return [];

    return $$(".dimension-row", dimensionContainer)
      .map(row => ({
        type: $(".dimension-type", row)?.value || "",
        value: $(".dimension-value", row)?.value.trim() || "",
        unit: $(".dimension-unit", row)?.value || "",
        otherUnit: $(".dimension-unit-other-input", row)?.value.trim() || "",
        symbol: $(".dimension-symbol", row)?.value || ""
      }))
      .filter(item => item.type && item.value);
  }

  function updateDimension() {
    if (!dimensionContainer) return;

    const totalRows = $$(".dimension-row", dimensionContainer).length;
    const addButton = $("#addDimensionBtn");

    if (addButton) addButton.disabled = totalRows >= 3;
  }

  // =====================================================
  // REQUIRED DOCUMENTS — DYNAMIC DROPDOWN + OTHERS
  // =====================================================

  function collectRequiredDocuments() {
    if (!requiredDocumentsContainer) return [];

    return $$(".required-document-row", requiredDocumentsContainer)
      .map(row => {
        const select = $(".required-document-select", row);
        const otherInput = $(".required-document-other", row);

        if (!select || !select.value) return "";

        if (select.value === "Others") {
          const detail = otherInput?.value.trim() || "";

          return detail
            ? `Others: ${detail}`
            : "Others";
        }

        return select.value;
      })
      .filter(Boolean);
  }

  function updateRequiredDocumentOptions() {
    if (!requiredDocumentsContainer) return;

    const rows = $$(".required-document-row", requiredDocumentsContainer);

    const selects = rows.map(row =>
      $(".required-document-select", row)
    );

    const selectedValues = selects.map(select => select.value);

    selects.forEach((select, index) => {
      const currentValue = select.value;

      select.innerHTML = "";

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Pilih Required Document --";
      select.appendChild(placeholder);

      requiredDocumentOptions.forEach(optionValue => {
        if (optionValue !== "Others") {
          const alreadySelected = selectedValues.some(
            (value, selectedIndex) =>
              selectedIndex !== index &&
              value === optionValue
          );

          if (alreadySelected) return;
        }

        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;

        select.appendChild(option);
      });

      select.value = currentValue;
    });

    rows.forEach(row => {
      const removeButton = $(".remove-required-document", row);

      if (removeButton) {
        removeButton.hidden = rows.length <= 1;
      }
    });
  }

  function createRequiredDocumentRow(value = "", otherValue = "") {
    if (!requiredDocumentsContainer) return;

    const selectedValues = $$(".required-document-select", requiredDocumentsContainer)
      .map(select => select.value)
      .filter(Boolean);

    const row = document.createElement("div");
    row.className = "required-document-row";

    // DROPDOWN REQUIRED DOCUMENT
    const select = document.createElement("select");
    select.className = "required-document-select";
    select.name = "requiredDocuments";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Pilih Required Document --";
    select.appendChild(placeholder);

    requiredDocumentOptions.forEach(optionValue => {
      if (
        optionValue !== "Others" &&
        selectedValues.includes(optionValue) &&
        optionValue !== value
      ) {
        return;
      }

      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;

      select.appendChild(option);
    });

    select.value = value;

    // CONTAINER OTHERS
    const otherContainer = document.createElement("div");
    otherContainer.className = "required-document-other-container";
    otherContainer.hidden = value !== "Others";

    // INPUT OTHERS
    const otherInput = document.createElement("input");
    otherInput.type = "text";
    otherInput.className = "required-document-other";
    otherInput.placeholder = "Masukkan keterangan lainnya...";
    otherInput.value = otherValue;

    otherContainer.appendChild(otherInput);

    // TOMBOL HAPUS
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-required-document";
    removeButton.textContent = "Hapus";
    removeButton.title = "Hapus dokumen";

    row.append(
      select,
      otherContainer,
      removeButton
    );

    requiredDocumentsContainer.appendChild(row);

    select.addEventListener("change", () => {
      const isOthers = select.value === "Others";

      otherContainer.hidden = !isOthers;

      if (!isOthers) {
        otherInput.value = "";
      }

      updateRequiredDocumentOptions();
      saveDraft();
    });

    otherInput.addEventListener("input", saveDraft);

    removeButton.addEventListener("click", () => {
      row.remove();

      if (
        !$$(".required-document-row", requiredDocumentsContainer).length
      ) {
        createRequiredDocumentRow();
      }

      updateRequiredDocumentOptions();
      saveDraft();
    });

    updateRequiredDocumentOptions();
  }

  function restoreRequiredDocuments(data) {
    if (!requiredDocumentsContainer) return;

    requiredDocumentsContainer.replaceChildren();

    const savedDocuments = Array.isArray(data.requiredDocuments)
      ? data.requiredDocuments
      : [];

    if (savedDocuments.length) {
      savedDocuments.forEach(item => {
        let value = item;
        let otherValue = "";

        if (
          typeof item === "string" &&
          item.startsWith("Others:")
        ) {
          value = "Others";
          otherValue = item.substring("Others:".length).trim();
        }

        if (requiredDocumentOptions.includes(value)) {
          createRequiredDocumentRow(value, otherValue);
        }
      });
    }

    if (!requiredDocumentsContainer.children.length) {
      createRequiredDocumentRow();
    }

    updateRequiredDocumentOptions();
  }

  // =====================================================
  // PACK SIZE
  // =====================================================

  function updatePackSizeOthers() {
    const packUom = $("#packUom", questionnaire);
    const packUomOther = $("#packUomOther", questionnaire);

    const packageUom = $("#packageUom", questionnaire);
    const packageUomOther = $("#packageUomOther", questionnaire);

    if (packUom && packUomOther) {
      const showPackOther = packUom.value === "Others";

      packUomOther.hidden = !showPackOther;
      packUomOther.disabled = !showPackOther;
      packUomOther.required = showPackOther;

      if (!showPackOther) {
        packUomOther.value = "";
      }
    }

    if (packageUom && packageUomOther) {
      const showPackageOther = packageUom.value === "Others";

      packageUomOther.hidden = !showPackageOther;
      packageUomOther.disabled = !showPackageOther;
      packageUomOther.required = showPackageOther;

      if (!showPackageOther) {
        packageUomOther.value = "";
      }
    }
  }

  function updatePackSize() {
    updatePackSizeOthers();

    const quantity =
      $("#packQuantity", questionnaire)?.value.trim() || "";

    const packUomSelect =
      $("#packUom", questionnaire);

    const packageUomSelect =
      $("#packageUom", questionnaire);

    const packUomOther =
      $("#packUomOther", questionnaire)?.value.trim() || "";

    const packageUomOther =
      $("#packageUomOther", questionnaire)?.value.trim() || "";

    const symbol =
      $("#packSymbol", questionnaire)?.value || "";

    const packUom =
      packUomSelect?.value === "Others"
        ? packUomOther
        : packUomSelect?.value || "";

    const packageUom =
      packageUomSelect?.value === "Others"
        ? packageUomOther
        : packageUomSelect?.value || "";

    const finalField =
      $("#packSizeFinal", questionnaire);

    if (!finalField) return;

    const firstPart = [quantity, packUom]
      .filter(Boolean)
      .join(" ");

    let result = firstPart;

    if (packageUom) {
      result += `${
        result && symbol
          ? ` ${symbol} `
          : result
            ? " "
            : ""
      }${packageUom}`;
    }

    finalField.value = result.trim();
  }

  $("#packUomOther", questionnaire)?.addEventListener(
    "input",
    updatePackSize
  );

  $("#packageUomOther", questionnaire)?.addEventListener(
    "input",
    updatePackSize
  );

  // =====================================================
  // MECHANICAL — SAP UOM DROPDOWN
  // =====================================================

  function initializeMechanicalUomOptions() {
    const uomOptions = {
      Capacity: ["L", "ML", "M3", "Others"],
      Pressure: ["Bar", "PA", "PSI", "Others"],
      Flowrate: ["M3H", "CFM", "KGS", "LMI", "LPH", "Others"],
      Speed: ["RPM", "RPS", "Others"],
      Tolerance: ["µM", "MM", "CM", "%", "Others"]
    };

    document.querySelectorAll("[data-mechanical-row]").forEach(row => {
      const parameter = row.dataset.mechanicalRow;
      const options = uomOptions[parameter];

      if (!options) return;

      row.querySelectorAll("select[data-mechanical-unit]").forEach(select => {
        const currentValue = select.value;

        select.innerHTML = `
          <option value="">-- Pilih UoM --</option>
        `;

        options.forEach(value => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        });

        select.value = options.includes(currentValue) ? currentValue : "";
      });
    });
  }

  // =====================================================
  // MECHANICAL — OTHERS VISIBILITY
  // =====================================================

  function updateMechanicalOthers(row) {
    if (!row) return;

    $$("[data-mechanical-unit]", row).forEach(select => {
      const position = select.dataset.mechanicalUnit;

      const otherInput = $(
        `[data-mechanical-unit-other="${position}"]`,
        row
      );

      if (!otherInput) return;

      const isOthers = select.value === "Others";

      otherInput.hidden = !isOthers;
      otherInput.disabled = !isOthers;

      if (!isOthers) otherInput.value = "";
    });

    const symbolSelect = $("[data-mechanical-symbol]", row);
    const symbolOther = $("[data-mechanical-symbol-other]", row);

    if (symbolSelect && symbolOther) {
      const isOthers = symbolSelect.value === "Others";

      symbolOther.hidden = !isOthers;
      symbolOther.disabled = !isOthers;

      if (!isOthers) symbolOther.value = "";
    }
  }

  function updateAllMechanicalOthers() {
    $$("[data-mechanical-row]", questionnaire).forEach(row => {
      updateMechanicalOthers(row);
    });
  }

  // =====================================================
  // MECHANICAL — COLLECT DATA
  // =====================================================

  function getMechanicalEffectiveUnit(row, position) {
    const select = $(`[data-mechanical-unit="${position}"]`, row);
    const otherInput = $(
      `[data-mechanical-unit-other="${position}"]`,
      row
    );

    if (!select) return "";

    if (select.value === "Others") {
      return otherInput?.value.trim() || "";
    }

    return select.value || "";
  }

  function getMechanicalEffectiveSymbol(row) {
    const select = $("[data-mechanical-symbol]", row);
    const otherInput = $("[data-mechanical-symbol-other]", row);

    if (!select) return "";

    if (select.value === "Others") {
      return otherInput?.value.trim() || "";
    }

    return select.value || "";
  }

  function collectMechanicalAttributes() {
    const result = [];

    $$("[data-mechanical-row]", questionnaire).forEach(row => {
      const label = row.dataset.mechanicalRow || "";

      const value1 =
        $('[data-mechanical-value="1"]', row)?.value.trim() || "";

      const value2 =
        $('[data-mechanical-value="2"]', row)?.value.trim() || "";

      const unit1 = getMechanicalEffectiveUnit(row, "1");
      const unit2 = getMechanicalEffectiveUnit(row, "2");

      const unitSelect1 = $('[data-mechanical-unit="1"]', row);
      const unitSelect2 = $('[data-mechanical-unit="2"]', row);

      const unitOther1 = $('[data-mechanical-unit-other="1"]', row);
      const unitOther2 = $('[data-mechanical-unit-other="2"]', row);

      const symbolSelect = $("[data-mechanical-symbol]", row);
      const symbolOther = $("[data-mechanical-symbol-other]", row);

      const symbol = getMechanicalEffectiveSymbol(row);

      const hasData =
        value1 || value2 || unit1 || unit2 || symbol;

      if (!hasData) return;

      const first = [value1, unit1].filter(Boolean).join(" ");
      const second = [value2, unit2].filter(Boolean).join(" ");

      let formattedValue = first;

      if (second) {
        formattedValue += `${
          first && symbol
            ? ` ${symbol} `
            : first
              ? " "
              : ""
        }${second}`;
      }

      result.push({
        category: "Mechanical",
        label,
        value: formattedValue,
        unit: "",

        data1: value1,
        unit1,
        unit1Selection: unitSelect1?.value || "",
        unit1Other: unitOther1?.value.trim() || "",

        data2: value2,
        unit2,
        unit2Selection: unitSelect2?.value || "",
        unit2Other: unitOther2?.value.trim() || "",

        symbol,
        symbolSelection: symbolSelect?.value || "",
        symbolOther: symbolOther?.value.trim() || ""
      });
    });

    return result;
  }

  // =====================================================
  // ELECTRICAL — COLLECT DATA
  // =====================================================

  function collectElectricalAttributes() {
    const result = [];

    $$("[data-electric-row]", questionnaire).forEach(row => {
      const label = row.dataset.electricRow || "";

      const value1 =
        $('[data-electric-value="1"]', row)?.value.trim() || "";

      const value2 =
        $('[data-electric-value="2"]', row)?.value.trim() || "";

      const unit1 = getElectricalEffectiveUnit(row, "1");
      const unit2 = getElectricalEffectiveUnit(row, "2");

      const unitSelect1 = $('[data-electric-unit="1"]', row);
      const unitSelect2 = $('[data-electric-unit="2"]', row);

      const unitOther1 = $('[data-electric-other="1"]', row);
      const unitOther2 = $('[data-electric-other="2"]', row);

      const symbol = $("[data-electric-symbol]", row)?.value || "/";

      if (!value1 && !value2 && !unit1 && !unit2) return;

      const first = [value1, unit1].filter(Boolean).join(" ");
      const second = [value2, unit2].filter(Boolean).join(" ");

      let formattedValue = first;

      if (second) {
        formattedValue += `${
          first && symbol
            ? ` ${symbol} `
            : first
              ? " "
              : ""
        }${second}`;
      }

      result.push({
        category: "Electric",
        label,
        value: formattedValue,
        unit: "",

        data1: value1,
        unit1,
        unit1Selection: unitSelect1?.value || "",
        unit1Other: unitOther1?.value.trim() || "",

        data2: value2,
        unit2,
        unit2Selection: unitSelect2?.value || "",
        unit2Other: unitOther2?.value.trim() || "",

        symbol
      });
    });

    return result;
  }

  // =====================================================
  // TECHNICAL SPECIFICATION
  // =====================================================

  function getTechnicalCategory(input) {
    const group = input.closest(".q-technical-group");
    const heading = $("h4", group)?.textContent.toLowerCase() || "";

    if (heading.includes("electric")) return "Electric";
    if (heading.includes("mechanical")) return "Mechanical";
    if (heading.includes("liquid")) return "Liquid";

    return "Other";
  }

  function collectTechnicalAttributes() {
    const attributes = [];

    // ELECTRICAL
    const electricalAttributes = collectElectricalAttributes();

    electricalAttributes.forEach(item => {
      attributes.push({
        category: "Electric",
        label: item.label,
        value: item.value,
        unit: ""
      });
    });

    // MATERIAL, CONNECTION TYPE, LIQUID
    $$("[data-tech-label]", questionnaire).forEach(input => {
      const label = input.dataset.techLabel || "";
      const value = input.value.trim();

      if (!label || !value) return;

      const unitInput = $$("[data-tech-unit]", questionnaire)
        .find(field => field.dataset.techUnit === label);

      attributes.push({
        category: getTechnicalCategory(input),
        label,
        value,
        unit: unitInput?.value.trim() || ""
      });
    });

    // MECHANICAL PARAMETERS
    collectMechanicalAttributes().forEach(item => {
      attributes.push({
        category: "Mechanical",
        label: item.label,
        value: item.value,
        unit: ""
      });
    });

    // CUSTOM TECHNICAL
    $$(".custom-tech-row", questionnaire).forEach(row => {
      const label =
        $("[data-custom-tech-name]", row)?.value.trim() || "";

      const value =
        $("[data-custom-tech-value]", row)?.value.trim() || "";

      if (label || value) {
        attributes.push({
          category: "Other",
          label,
          value,
          unit: ""
        });
      }
    });

    return attributes;
  }

  // =====================================================
  // LEGACY TECHNICAL FIELDS
  // =====================================================

  function updateLegacyTechnicalFields(attributes) {
    for (let index = 1; index <= 5; index++) {
      const item = attributes[index - 1];

      const labelField = $(`#technical${index}`, questionnaire);
      const valueField = $(`#technicalUnit${index}`, questionnaire);

      if (labelField) labelField.value = item?.label || "";

      if (valueField) {
        valueField.value = item
          ? [item.value, item.unit].filter(Boolean).join(" ")
          : "";
      }
    }
  }

  // =====================================================
  // UNIQUE SPECIFICATION
  // =====================================================

  function collectUniqueAttributes() {
    const attributes = [];

    const name1 =
      $('[name="unique1"]', questionnaire)?.value.trim() || "";

    const detail1 =
      $('[name="uniqueDetail1"]', questionnaire)?.value.trim() || "";

    const name2 =
      $('[name="unique2"]', questionnaire)?.value.trim() || "";

    const detail2 =
      $('[name="uniqueDetail2"]', questionnaire)?.value.trim() || "";

    if (name1 || detail1) attributes.push({ name: name1, detail: detail1 });
    if (name2 || detail2) attributes.push({ name: name2, detail: detail2 });

    $$(".custom-unique-row", questionnaire).forEach(row => {
      const name = $('input[name^="customUniqueName"]', row)
        ?.value.trim() || "";

      const detail = $('input[name^="customUniqueDetail"]', row)
        ?.value.trim() || "";

      if (name || detail) attributes.push({ name, detail });
    });

    return attributes;
  }

  // =====================================================
  // FORM DATA
  // =====================================================

  function getFormData() {
    updateReason();
    updateCategory();
    updateMaterialGroupMatrix();
    updateDimension();
    updatePackSize();
    updateAllElectricalOthers();
    updateAllMechanicalOthers();

    const electricalAttributes = collectElectricalAttributes();
    const technicalAttributes = collectTechnicalAttributes();
    const mechanicalAttributes = collectMechanicalAttributes();
    const uniqueAttributes = collectUniqueAttributes();

    updateLegacyTechnicalFields(technicalAttributes);

    const data = {};
    const fieldsByName = new Map();

    $$("[name]", questionnaire).forEach(field => {
      if (field.type === "file" || field.disabled) return;

      if (!fieldsByName.has(field.name)) {
        fieldsByName.set(field.name, []);
      }

      fieldsByName.get(field.name).push(field);
    });

    fieldsByName.forEach((fields, name) => {
      const first = fields[0];

      if (first.type === "checkbox") {
        if (fields.length > 1) {
          data[name] = fields
            .filter(field => field.checked)
            .map(field => field.value);
        } else {
          data[name] = first.checked;
        }

        return;
      }

      if (first.type === "radio") {
        data[name] = fields.find(field => field.checked)?.value || "";
        return;
      }

      data[name] = first.value ?? "";
    });

    data.materialCategory = getSelectedCategories();

    data.category = $$(
      '[name="category"]:checked',
      questionnaire
    ).map(field => field.value);

    data.electricalAttributes = electricalAttributes;
    data.technicalAttributes = technicalAttributes;
    data.mechanicalAttributes = mechanicalAttributes;
    data.uniqueAttributes = uniqueAttributes;

    // Tetap simpan Dimension meskipun field sedang disembunyikan.
    data.dimensionItems = collectDimensionItems();

    data.requiredDocuments = collectRequiredDocuments();
    data.drawingImage = drawingImage;
    data.specType = "Barang";

    return data;
  }


  // =====================================================
  // RESTORE FIELD VALUE
  // =====================================================

  function setFieldValue(name, value) {
    const fields = $$(
      `[name="${escapeSelector(name)}"]`,
      questionnaire
    );

    if (!fields.length) return;

    fields.forEach(field => {
      if (field.type === "checkbox") {
        if (Array.isArray(value)) {
          field.checked = value.includes(field.value);
        } else {
          field.checked = Boolean(value);
        }

        return;
      }

      if (field.type === "radio") {
        field.checked = field.value === value;
        return;
      }

      field.value = value ?? "";
    });
  }

  // =====================================================
  // RESTORE ELECTRICAL ATTRIBUTES
  // =====================================================

  function restoreElectricalAttributes(data) {
    if (!Array.isArray(data)) return;

    data.forEach(item => {
      if (!item?.label) return;

      const row = $$("[data-electric-row]", questionnaire)
        .find(element =>
          element.dataset.electricRow === item.label
        );

      if (!row) return;

      const value1 = $('[data-electric-value="1"]', row);
      const value2 = $('[data-electric-value="2"]', row);

      const unitSelect1 = $('[data-electric-unit="1"]', row);
      const unitSelect2 = $('[data-electric-unit="2"]', row);

      const unitOther1 = $('[data-electric-other="1"]', row);
      const unitOther2 = $('[data-electric-other="2"]', row);

      const symbolSelect = $("[data-electric-symbol]", row);

      if (value1) value1.value = item.data1 || "";
      if (value2) value2.value = item.data2 || "";

      if (unitSelect1) {
        unitSelect1.value =
          item.unit1Selection || item.unit1 || "";
      }

      if (unitOther1) unitOther1.value = item.unit1Other || "";

      if (unitSelect2) {
        unitSelect2.value =
          item.unit2Selection || item.unit2 || "";
      }

      if (unitOther2) unitOther2.value = item.unit2Other || "";

      if (symbolSelect && item.symbol) {
        symbolSelect.value = item.symbol;
      }

      updateElectricalOthers(row);
    });
  }

  // =====================================================
  // RESTORE MECHANICAL ATTRIBUTES
  // =====================================================

  function restoreMechanicalAttributes(data) {
    const savedAttributes = Array.isArray(data) ? data : [];

    savedAttributes.forEach(item => {
      if (!item?.label) return;

      const targetLabel =
        item.label === "Speed & Tolerance"
          ? "Speed"
          : item.label;

      const row = $$("[data-mechanical-row]", questionnaire)
        .find(element =>
          element.dataset.mechanicalRow === targetLabel
        );

      if (!row) return;

      const value1 = $('[data-mechanical-value="1"]', row);
      const value2 = $('[data-mechanical-value="2"]', row);

      const unitSelect1 = $('[data-mechanical-unit="1"]', row);
      const unitSelect2 = $('[data-mechanical-unit="2"]', row);

      const unitOther1 = $('[data-mechanical-unit-other="1"]', row);
      const unitOther2 = $('[data-mechanical-unit-other="2"]', row);

      const symbolSelect = $("[data-mechanical-symbol]", row);
      const symbolOther = $("[data-mechanical-symbol-other]", row);

      if (value1) value1.value = item.data1 || "";
      if (value2) value2.value = item.data2 || "";

      if (unitSelect1) {
        if (item.unit1Selection) {
          unitSelect1.value = item.unit1Selection;
        } else if (item.unit1) {
          unitSelect1.value = item.unit1;
        }
      }

      if (unitOther1) unitOther1.value = item.unit1Other || "";

      if (unitSelect2) {
        if (item.unit2Selection) {
          unitSelect2.value = item.unit2Selection;
        } else if (item.unit2) {
          unitSelect2.value = item.unit2;
        }
      }

      if (unitOther2) unitOther2.value = item.unit2Other || "";

      if (symbolSelect) {
        if (item.symbolSelection) {
          symbolSelect.value = item.symbolSelection;
        } else if (item.symbol) {
          symbolSelect.value = MECHANICAL_SYMBOLS.includes(item.symbol)
            ? item.symbol
            : "Others";
        }
      }

      if (symbolOther) symbolOther.value = item.symbolOther || "";

      updateMechanicalOthers(row);
    });
  }

  // =====================================================
  // RESTORE OLD MECHANICAL DATA
  // =====================================================

  function restoreOldMechanicalAttributes(data) {
    const attributes = data.technicalAttributes || [];

    attributes
      .filter(item =>
        item.category === "Mechanical" &&
        (
          MECHANICAL_PARAMETERS.includes(item.label) ||
          item.label === "Speed & Tolerance"
        )
      )
      .forEach(item => {
        const targetLabel =
          item.label === "Speed & Tolerance"
            ? "Speed"
            : item.label;

        const row = $$("[data-mechanical-row]", questionnaire)
          .find(element =>
            element.dataset.mechanicalRow === targetLabel
          );

        if (!row) return;

        const value1 = $('[data-mechanical-value="1"]', row);

        if (value1 && !value1.value) {
          value1.value = item.value || "";
        }
      });
  }

  // =====================================================
  // RESTORE DYNAMIC ATTRIBUTES
  // =====================================================

  function restoreDynamicAttributes(data) {
    technicalContainer?.replaceChildren();
    uniqueContainer?.replaceChildren();

    (data.technicalAttributes || [])
      .filter(item => item.category === "Other")
      .forEach(createCustomTechnicalRow);

    (data.uniqueAttributes || [])
      .slice(2)
      .forEach(createCustomUniqueRow);
  }

  // =====================================================
  // RESTORE FORM
  // =====================================================

  function restoreForm(data) {
    if (!data || typeof data !== "object") return;

    restoreDynamicAttributes(data);
    restoreRequiredDocuments(data);

    if (dimensionContainer) {
      dimensionContainer.replaceChildren();

      if (
        Array.isArray(data.dimensionItems) &&
        data.dimensionItems.length
      ) {
        data.dimensionItems.forEach(createDimensionRow);
      } else {
        createDimensionRow();
      }
    }

    Object.entries(data).forEach(([name, value]) => {
      if ([
        "electricalAttributes",
        "technicalAttributes",
        "mechanicalAttributes",
        "uniqueAttributes",
        "dimensionItems",
        "requiredDocuments",
        "drawingImage",
        "specType"
      ].includes(name)) {
        return;
      }

      setFieldValue(name, value);
    });

    normalizeMaterialCategory();

    if (Array.isArray(data.electricalAttributes)) {
      restoreElectricalAttributes(data.electricalAttributes);
    }

    if (Array.isArray(data.mechanicalAttributes)) {
      restoreMechanicalAttributes(data.mechanicalAttributes);
    } else {
      restoreOldMechanicalAttributes(data);
    }

    drawingImage = data.drawingImage || "";

    if (drawingPreview) {
      if (drawingImage) {
        drawingPreview.src = drawingImage;
        drawingPreview.style.display = "block";
      } else {
        drawingPreview.removeAttribute("src");
        drawingPreview.style.display = "none";
      }
    }

    if (plantSelect?.value) {
      updateDepartment(data.department || "");
    }

    updateReason();
    updateMaterialGroupOther(false);
    updateMaterialGroupMatrix();
    updateUomOther();
    updateElectricalOthersInAllRows();
    updateCategory();
    updateDimension();
    updatePackSize();
    updateAllMechanicalOthers();

    updateLegacyTechnicalFields(
      collectTechnicalAttributes()
    );
  }

  function updateElectricalOthersInAllRows() {
    updateAllElectricalOthers();
  }

  // =====================================================
  // VERSION & CREATED DATE
  // =====================================================

  function initializeDocumentInfo() {
    const versionInput = getVersionInput();
    const createdDateInput = getCreatedDateInput();

    if (!versionInput || !createdDateInput) return;

    const savedVersion = Number(
      localStorage.getItem(VERSION_STORAGE_KEY) || 0
    );

    versionInput.value = String(savedVersion).padStart(2, "0");

    if (!createdDateInput.value) {
      createdDateInput.value = todayISO();
    }
  }

  // =====================================================
  // AUTOSAVE
  // =====================================================

  function saveDraft() {
    if (loadingDocument) return;

    try {
      const data = getFormData();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      setStatus("Draft tersimpan otomatis di browser");
    } catch (error) {
      console.error("Gagal menyimpan draft:", error);

      setStatus(
        "Draft gagal disimpan. Periksa ukuran gambar atau penyimpanan browser."
      );
    }
  }

  function restoreDraft() {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem(OLD_STORAGE_KEY);

      if (!saved) return false;

      const data = safeJSONParse(saved, null);

      if (!data) return false;

      loadingDocument = true;
      restoreForm(data);
      loadingDocument = false;

      setStatus("Draft sebelumnya berhasil dipulihkan");

      return true;
    } catch (error) {
      loadingDocument = false;

      console.error("Gagal memulihkan draft:", error);
      setStatus("Draft sebelumnya gagal dipulihkan");

      return false;
    }
  }

  // =====================================================
  // DRAWING UPLOAD
  // =====================================================

  drawingUpload?.addEventListener("change", event => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      drawingImage = reader.result;

      if (drawingPreview) {
        drawingPreview.src = drawingImage;
        drawingPreview.style.display = "block";
      }

      saveDraft();
    };

    reader.onerror = () => alert("Gagal membaca gambar.");

    reader.readAsDataURL(file);
  });

  // =====================================================
  // VALIDATION
  // =====================================================

  function validateForm() {
    updateReason();
    updateCategory();
    updateMaterialGroupOther();
    updateMaterialGroupMatrix();

    if (!questionnaire.reportValidity()) return false;

    // VALIDASI DIMENSION
    if (
      getCurrentMatrixStatus("dimension") === "*" &&
      collectDimensionItems().length === 0
    ) {
      alert("Dimension wajib diisi untuk Material Group ini.");

      $(".dimension-type", dimensionContainer)?.focus();

      return false;
    }

    const categories = getSelectedCategories();

    if (categories.length !== 1) {
      alert("Pilih tepat satu Material Category.");

      $('[name="materialCategory"]', questionnaire)?.focus();

      return false;
    }

    if (
      reasonChoice?.value === "Others" &&
      !reasonOther?.value.trim()
    ) {
      alert("Reason Others wajib diisi.");
      reasonOther?.focus();
      return false;
    }

    return true;
  }

  // =====================================================
  // LOCAL TRANSACTION
  // =====================================================

  function saveTransactionLocally() {
    try {
      const data = getFormData();

      const versionInput = getVersionInput();
      const createdDateInput = getCreatedDateInput();

      const currentVersion = Number(versionInput?.value || 0);

      const history = safeJSONParse(
        localStorage.getItem(HISTORY_KEY),
        []
      );

      history.push({
        id: Date.now(),
        version: String(currentVersion).padStart(2, "0"),
        createdDate: createdDateInput?.value || todayISO(),
        submittedAt: new Date().toISOString(),
        formData: data
      });

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      const nextVersion = currentVersion + 1;

      localStorage.setItem(
        VERSION_STORAGE_KEY,
        String(nextVersion)
      );

      if (versionInput) {
        versionInput.value = String(nextVersion).padStart(2, "0");
      }

      saveDraft();

      return true;
    } catch (error) {
      console.error("Gagal menyimpan transaksi:", error);

      alert(
        "Transaksi gagal disimpan di browser. Periksa kapasitas penyimpanan."
      );

      return false;
    }
  }

  // =====================================================
  // PRINT DATA TRANSFER
  // =====================================================

  function transferToPrint(data = getFormData()) {
    if (!printForm) return;

    printForm.querySelectorAll("[name]").forEach(target => {
      const value = data[target.name];

      if (target.type === "checkbox") {
        target.checked = Array.isArray(value)
          ? value.includes(target.value)
          : Boolean(value);

        return;
      }

      if (target.type === "radio") {
        target.checked = target.value === value;
        return;
      }

      target.value = value ?? "";
    });

    // MATERIAL GROUP — OTHERS KE PDF
    const materialGroupPrint = $(
      '[name="materialGroup"]',
      printForm
    );

    if (materialGroupPrint) {
      materialGroupPrint.value =
        data.materialGroup === "Others"
          ? (data.materialGroupOther || "Others")
          : (data.materialGroup || "");
    }

    const categoryField = $(
      '[name="materialCategory"]',
      printForm
    );

    if (categoryField) {
      categoryField.value = (data.materialCategory || []).join(", ");
    }

    const revisionDate = $('[name="revisionDate"]', printForm);

    if (revisionDate && !revisionDate.value) {
      revisionDate.value = formatDate(data.createdDate);
    }

    const printDrawing = $("#drawingPreview", printForm);

    if (printDrawing) {
      if (data.drawingImage) {
        printDrawing.src = data.drawingImage;
        printDrawing.style.display = "block";
      } else {
        printDrawing.removeAttribute("src");
        printDrawing.style.display = "none";
      }
    }
  }

  // =====================================================
  // BUTTON EVENTS — REQUIRED DOCUMENTS
  // =====================================================

  addRequiredDocumentBtn?.addEventListener("click", () => {
    createRequiredDocumentRow();
    updateRequiredDocumentOptions();
    saveDraft();
  });

  // =====================================================
  // BUTTON EVENTS — DIMENSION
  // =====================================================

  $("#addDimensionBtn")?.addEventListener("click", () => {
    const totalRows = $$(".dimension-row", dimensionContainer).length;

    if (totalRows >= 3) {
      updateDimension();
      return;
    }

    createDimensionRow();
    updateDimension();
    saveDraft();
  });

  dimensionContainer?.addEventListener("click", event => {
    const button = event.target.closest(".remove-dimension");

    if (!button) return;

    const row = button.closest(".dimension-row");
    const rows = $$(".dimension-row", dimensionContainer);

    if (rows.length > 1) {
      row.remove();
    } else {
      $(".dimension-type", row).value = "";
      $(".dimension-value", row).value = "";
      $(".dimension-unit", row).value = "";
      $(".dimension-symbol", row).value = "";
    }

    updateDimension();
    saveDraft();
  });

  // =====================================================
  // BUTTON EVENTS — TECHNICAL & UNIQUE
  // =====================================================

$("#addTechnicalBtn")?.addEventListener("click", () => {
  createCustomTechnicalRow();
  saveDraft();
});

  $("#addUniqueBtn")?.addEventListener("click", () => {
    createCustomUniqueRow();
    saveDraft();
  });

  questionnaire.addEventListener("click", event => {
    const removeButton = event.target.closest(".q-remove-button");

    if (!removeButton) return;

    const row = removeButton.closest(
      ".custom-tech-row, .custom-unique-row"
    );

    if (!row) return;

    row.remove();
    saveDraft();
  });

  // =====================================================
  // MECHANICAL SELECT EVENTS
  // =====================================================

  questionnaire.addEventListener("change", event => {
    const mechanicalRow = event.target.closest(
      "[data-mechanical-row]"
    );

    if (!mechanicalRow) return;

    if (
      event.target.matches(
        "[data-mechanical-unit], [data-mechanical-symbol]"
      )
    ) {
      updateMechanicalOthers(mechanicalRow);
      saveDraft();
    }
  });

  // =====================================================
  // ELECTRICAL SELECT EVENTS
  // =====================================================

  questionnaire.addEventListener("change", event => {
    const electricalRow = event.target.closest("[data-electric-row]");

    if (!electricalRow) return;

    if (event.target.matches("[data-electric-unit]")) {
      updateElectricalOthers(electricalRow);
      saveDraft();
    }
  });

  // =====================================================
  // INPUT EVENTS
  // =====================================================

  questionnaire.addEventListener("input", () => {
    updateReason();
    updateDimension();
    updatePackSize();
    updateCategory();
    saveDraft();
  });

  questionnaire.addEventListener("change", () => {
    updateReason();
    updateUomOther();
    updateAllElectricalOthers();
    updateDimension();
    updatePackSize();
    updateCategory();
    updateAllMechanicalOthers();
    saveDraft();
  });

  plantSelect?.addEventListener("change", () => {
    updateDepartment();
    saveDraft();
  });

  reasonChoice?.addEventListener("change", () => {
    updateReason();
    saveDraft();
  });

  // =====================================================
  // RESET
  // =====================================================

  resetBtn?.addEventListener("click", () => {
    const confirmed = confirm(
      "Yakin ingin mengosongkan seluruh jawaban spesifikasi barang?"
    );

    if (!confirmed) return;

    questionnaire.reset();

    updateMaterialGroupOther();
    updateMaterialGroupMatrix();

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OLD_STORAGE_KEY);

    drawingImage = "";

    if (drawingUpload) drawingUpload.value = "";

    if (drawingPreview) {
      drawingPreview.removeAttribute("src");
      drawingPreview.style.display = "none";
    }

    technicalContainer?.replaceChildren();
    uniqueContainer?.replaceChildren();

    requiredDocumentsContainer?.replaceChildren();
    createRequiredDocumentRow();

    if (dimensionContainer) {
      dimensionContainer.replaceChildren();
      createDimensionRow();
    }

    updateDepartment();
    initializeDocumentInfo();

    updateReason();
    updateUomOther();
    updateAllElectricalOthers();
    updateCategory();
    updateDimension();
    updatePackSize();
    updateAllMechanicalOthers();

    saveDraft();

    setStatus("Form berhasil direset");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  // =====================================================
  // SAVE FOR ADMIN
  // =====================================================

  saveBtn?.addEventListener("click", () => {
    if (saving) return;
    if (!validateForm()) return;

    saving = true;
    saveBtn.disabled = true;

    try {
      initializeDocumentInfo();

      if (!saveTransactionLocally()) return;

      alert(
        "Transaksi berhasil disimpan di browser!\n" +
        "Version berikutnya: " +
        (getVersionInput()?.value || "00")
      );
    } finally {
      saving = false;
      saveBtn.disabled = false;
    }
  });

  // =====================================================
  // LOAD DOCUMENT FROM DATABASE FOR PRINT
  // barang.html?printId=ID
  // =====================================================

  async function loadDocumentFromDatabase(id) {
    try {
      loadingDocument = true;

      setStatus("Mengambil dokumen dari database...");

      const response = await fetch(
        `http://localhost:3000/api/documents/${encodeURIComponent(id)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          "Dokumen tidak ditemukan."
        );
      }

      const row = result.document || result;

      let formData =
        row.form_data ||
        row.formData ||
        {};

      if (typeof formData === "string") {
        formData = safeJSONParse(formData, {});
      }

      const data = {
        ...formData,

        id: row.id,

        docNo:
          row.doc_no ??
          row.docNo ??
          "",

        revision: row.revision ?? "",

        plant:
          row.plant ??
          formData.plant ??
          "",

        requestor:
          row.requestor ??
          formData.requestor ??
          "",

        department:
          row.department ??
          formData.department ??
          "",

        materialDescription:
          row.material_description ??
          formData.materialDescription ??
          "",

        materialCode:
          row.material_code ??
          formData.materialCode ??
          "",

        specType: row.spec_type || "Barang"
      };

      restoreForm(data);
      transferToPrint(data);

      loadingDocument = false;

      setStatus("Dokumen berhasil dimuat dari database");

      setTimeout(() => window.print(), 500);

    } catch (error) {
      loadingDocument = false;

      console.error("Gagal mengambil dokumen:", error);

      setStatus("Gagal memuat dokumen dari database");

      alert(error.message);
    }
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  function initialize() {
    const params = new URLSearchParams(window.location.search);
    const printId = params.get("printId");

    initializeMechanicalUomOptions();

    if (requiredDocumentsContainer) {
      requiredDocumentsContainer.replaceChildren();
      createRequiredDocumentRow();
    }

    if (printId) {
      loadDocumentFromDatabase(printId);
      return;
    }

    updateDepartment();
    initializeDocumentInfo();

    const restored = restoreDraft();

    if (
      !restored &&
      dimensionContainer &&
      !$(".dimension-row", dimensionContainer)
    ) {
      createDimensionRow();
    }

    normalizeMaterialCategory();

    updateReason();
    updateMaterialGroupOther(false);
    updateMaterialGroupMatrix();
    updateUomOther();
    updateAllElectricalOthers();
    updateCategory();
    updateDimension();
    updatePackSize();
    updateAllMechanicalOthers();

    saveDraft();
  }

  // =====================================================
  // PDF BUTTON
  // =====================================================

  pdfBtn?.addEventListener("click", () => {
    if (!validateForm()) return;

    initializeDocumentInfo();

    const data = getFormData();

    saveDraft();
    transferToPrint(data);

    window.print();
  });

  // =====================================================
  // START APPLICATION
  // =====================================================

  initialize();

})();