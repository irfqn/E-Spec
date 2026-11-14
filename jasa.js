
(() => {
  "use strict";

  // =============================================
  // E-SPEC JASA — QUESTIONNAIRE CONTROLLER
  // =============================================

  const STORAGE_KEY = "eSpecJasaQuestionnaire.v1";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const form = $("#serviceQuestionnaireForm");

  if (!form) return;


  // =============================================
  // MASTER DATA
  // =============================================

  // GANTI NAMA PLANT DAN DEPARTMENT DENGAN DATA ASLI.

  const departmentData = {
    "Plant 1": [],
    "Plant 2": [],
    "Plant 3": []
  };


  // Masukkan 35 Material Group resmi di array ini.
  // Format: "Kode - Nama Material Group"

  const materialGroups = [];


  // Daftar Reason to Procure.
  // Sementara daftar keduanya sama.
  // Bisa dibedakan sesuai kategori jika diperlukan.

  const reasonData = {
    "Asset Jasa": [
      "Facility Management & Maintenance",
      "General IT",
      "New Project",
      "Others"
    ],

    "Expense Jasa": [
      "Facility Management & Maintenance",
      "General IT",
      "New Project",
      "Others"
    ]
  };


  // =============================================
  // ELEMENTS
  // =============================================

  const plantSelect = $("#servicePlant");
  const departmentSelect = $("#serviceDepartment");
  const materialGroupSelect = $("#serviceMaterialGroup");
  const reasonSelect = $("#serviceReason");

  const reasonOtherWrapper = $("#serviceReasonOtherWrapper");
  const reasonOtherInput = $("#serviceReasonOther");

  const requiredOtherCheck = $("#serviceRequiredOtherCheck");
  const requiredOtherWrapper = $("#serviceRequiredOtherWrapper");
  const requiredOtherInput = $("#serviceRequiredOther");

  const technicalList = $("#serviceTechnicalList");
  const kpiList = $("#serviceKpiList");
  const attachmentList = $("#serviceAttachmentList");

  const draftStatus = $("#draftStatus");
  const formMessage = $("#serviceFormMessage");


  let restoring = false;


  // =============================================
  // DATE
  // =============================================

  function setCreatedDate() {
    const input = $("#serviceCreatedDate");

    if (!input.value) {
      input.value = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
  }


  // =============================================
  // MASTER DATA DROPDOWNS
  // =============================================

  function initializeMaterialGroups() {
    materialGroupSelect.innerHTML = `
      <option value="">-- Pilih Material Group --</option>
    `;

    materialGroups.forEach(group => {
      const option = document.createElement("option");

      option.value = group;
      option.textContent = group;

      materialGroupSelect.appendChild(option);
    });
  }


  function updateDepartment(selectedValue = "") {
    const plant = plantSelect.value;

    departmentSelect.innerHTML = "";

    if (!plant) {
      departmentSelect.innerHTML = `
        <option value="">-- Pilih Plant terlebih dahulu --</option>
      `;

      departmentSelect.disabled = true;
      return;
    }

    departmentSelect.disabled = false;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Pilih Department --";

    departmentSelect.appendChild(placeholder);

    const departments = departmentData[plant] || [];

    departments.forEach(department => {
      const option = document.createElement("option");

      option.value = department;
      option.textContent = department;

      departmentSelect.appendChild(option);
    });

    if (selectedValue && departments.includes(selectedValue)) {
      departmentSelect.value = selectedValue;
    }
  }


  function updateReasonOptions(selectedValue = "") {
    const category = $(
      'input[name="materialCategory"]:checked',
      form
    )?.value || "";

    reasonSelect.innerHTML = `
      <option value="">-- Pilih Reason to Procure --</option>
    `;

    const reasons = reasonData[category] || [];

    reasons.forEach(reason => {
      const option = document.createElement("option");

      option.value = reason;
      option.textContent = reason;

      reasonSelect.appendChild(option);
    });

    if (selectedValue && reasons.includes(selectedValue)) {
      reasonSelect.value = selectedValue;
    }

    updateReasonOther();
  }


  // =============================================
  // OTHERS INPUT
  // =============================================

  function updateReasonOther() {
    const isOthers = reasonSelect.value === "Others";

    reasonOtherWrapper.hidden = !isOthers;
    reasonOtherInput.disabled = !isOthers;
    reasonOtherInput.required = isOthers;

    if (!isOthers) {
      reasonOtherInput.value = "";
    }
  }


  function updateRequiredOther() {
    const isChecked = requiredOtherCheck.checked;

    requiredOtherWrapper.hidden = !isChecked;
    requiredOtherInput.disabled = !isChecked;
    requiredOtherInput.required = isChecked;

    if (!isChecked) {
      requiredOtherInput.value = "";
    }
  }


  // =============================================
  // DYNAMIC ROWS
  // =============================================

  function createDynamicRow(type, value = "") {
    const row = document.createElement("div");

    row.className = "service-dynamic-row";
    row.dataset.dynamicType = type;

    const isAttachment = type === "attachment";

    if (isAttachment) {
      row.innerHTML = `
        <div class="service-dynamic-row-heading">
          <strong>Dokumen Lampiran</strong>

          <button
            type="button"
            class="service-remove-btn"
            data-remove-row
          >
            Hapus
          </button>
        </div>

        <div class="service-grid">

          <div class="service-field">
            <label>Jenis Dokumen <span class="required-mark">*</span></label>

            <select data-attachment-type required>
              <option value="">-- Pilih Dokumen --</option>
              <option value="Spec Detail">Spec Detail</option>
              <option value="BQ">BQ</option>
              <option value="Gambar/Design">Gambar/Design</option>
              <option value="Timeline">Timeline</option>
              <option value="Others">Lainnya</option>
            </select>
          </div>

          <div class="service-field" data-attachment-other-wrapper hidden>
            <label>Nama Dokumen Lainnya <span class="required-mark">*</span></label>

            <input
              type="text"
              data-attachment-other
              placeholder="Masukkan nama dokumen"
              disabled
            >
          </div>

          <div class="service-field service-field-full">
            <label>Upload Dokumen <span class="required-mark">*</span></label>

            <input
              type="file"
              data-attachment-file
              required
            >

            <small data-file-name>Belum ada file dipilih.</small>
          </div>

        </div>
      `;
    } else {
      const title = type === "technical"
        ? "Technical Specification"
        : "KPI";

      const placeholder = type === "technical"
        ? "Masukkan detail spesifikasi teknis..."
        : "Masukkan indikator kinerja...";

      row.innerHTML = `
        <div class="service-dynamic-row-heading">
          <strong>${title}</strong>

          <button
            type="button"
            class="service-remove-btn"
            data-remove-row
          >
            Hapus
          </button>
        </div>

        <div class="service-field">
          <textarea
            data-dynamic-value
            rows="3"
            placeholder="${placeholder}"
          ></textarea>
        </div>
      `;

      row.querySelector("[data-dynamic-value]").value = value;
    }

    return row;
  }


  function addDynamicRow(type, value = "") {
    let target;

    if (type === "technical") {
      target = technicalList;
    } else if (type === "kpi") {
      target = kpiList;
    } else if (type === "attachment") {
      target = attachmentList;
    }

    if (!target) return;

    target.appendChild(createDynamicRow(type, value));

    saveDraft();
  }


  // =============================================
  // ATTACHMENT OTHER INPUT
  // =============================================

  function updateAttachmentRow(row) {
    const select = $("[data-attachment-type]", row);
    const wrapper = $("[data-attachment-other-wrapper]", row);
    const input = $("[data-attachment-other]", row);

    if (!select || !wrapper || !input) return;

    const isOthers = select.value === "Others";

    wrapper.hidden = !isOthers;
    input.disabled = !isOthers;
    input.required = isOthers;

    if (!isOthers) {
      input.value = "";
    }
  }


  // =============================================
  // COLLECT FORM DATA
  // =============================================

  function getFormData() {
    const data = {};

    const elements = $$(
      "input[name], select[name], textarea[name]",
      form
    );

    elements.forEach(element => {
      if (
        element.type === "file" ||
        element.type === "checkbox" ||
        element.type === "radio"
      ) {
        return;
      }

      data[element.name] = element.value;
    });


    // RADIO

    const category = $(
      'input[name="materialCategory"]:checked',
      form
    );

    data.materialCategory = category?.value || "";


    // CHECKBOXES

    data.requiredDocuments = $$(
      'input[name="requiredDocuments"]:checked',
      form
    ).map(input => input.value);


    // TECHNICAL SPECIFICATION

    data.technicalSpecifications = $$(
      '[data-dynamic-type="technical"]',
      technicalList
    ).map(row => $("[data-dynamic-value]", row).value);


    // KPI

    data.kpi = $$(
      '[data-dynamic-type="kpi"]',
      kpiList
    ).map(row => $("[data-dynamic-value]", row).value);


    // ATTACHMENT METADATA
    // File fisik tidak disimpan di localStorage.

    data.attachments = $$(
      '[data-dynamic-type="attachment"]',
      attachmentList
    ).map(row => ({
      type: $("[data-attachment-type]", row)?.value || "",
      otherName: $("[data-attachment-other]", row)?.value || "",
      fileName: $("[data-attachment-file]", row)?.files[0]?.name || ""
    }));

    return data;
  }


  // =============================================
  // SAVE DRAFT
  // =============================================

  function saveDraft() {
    if (restoring) return;

    const data = getFormData();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      draftStatus.textContent = "Draft tersimpan otomatis";
    } catch (error) {
      draftStatus.textContent = "Draft gagal disimpan";
      console.error("Gagal menyimpan draft:", error);
    }
  }


  // =============================================
  // RESTORE DRAFT
  // =============================================

  function restoreDraft() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      restoring = true;

      Object.entries(data).forEach(([name, value]) => {
        const element = form.elements.namedItem(name);

        if (!element) return;

        if (
          name === "materialCategory" ||
          name === "requiredDocuments" ||
          name === "technicalSpecifications" ||
          name === "kpi" ||
          name === "attachments"
        ) {
          return;
        }

        if (element instanceof RadioNodeList) {
          return;
        }

        if (
          element.type !== "file" &&
          element.type !== "checkbox" &&
          element.type !== "radio"
        ) {
          element.value = value ?? "";
        }
      });


      // PLANT AND DEPARTMENT

      updateDepartment(data.department || "");


      // MATERIAL GROUP

      if (data.materialGroup) {
        materialGroupSelect.value = data.materialGroup;
      }


      // CATEGORY

      if (data.materialCategory) {
        const categoryInput = $(
          `input[name="materialCategory"][value="${CSS.escape(data.materialCategory)}"]`,
          form
        );

        if (categoryInput) categoryInput.checked = true;
      }


      // REASON

      updateReasonOptions(data.reason || "");

      reasonOtherInput.value = data.reasonOther || "";
      updateReasonOther();


      // REQUIRED DOCUMENTS

      (data.requiredDocuments || []).forEach(value => {
        const checkbox = $$(
          'input[name="requiredDocuments"]',
          form
        ).find(input => input.value === value);

        if (checkbox) checkbox.checked = true;
      });

      updateRequiredOther();

      requiredOtherInput.value = data.requiredDocumentOther || "";


      // TECHNICAL

      technicalList.innerHTML = "";

      (data.technicalSpecifications || []).forEach(value => {
        technicalList.appendChild(
          createDynamicRow("technical", value)
        );
      });


      // KPI

      kpiList.innerHTML = "";

      (data.kpi || []).forEach(value => {
        kpiList.appendChild(
          createDynamicRow("kpi", value)
        );
      });


      // ATTACHMENTS

      attachmentList.innerHTML = "";

      (data.attachments || []).forEach(item => {
        const row = createDynamicRow("attachment");

        attachmentList.appendChild(row);

        $("[data-attachment-type]", row).value = item.type || "";
        $("[data-attachment-other]", row).value = item.otherName || "";

        updateAttachmentRow(row);

        if (item.fileName) {
          $("[data-file-name]", row).textContent =
            `File sebelumnya: ${item.fileName}. Silakan pilih ulang file.`;
        }
      });

    } catch (error) {
      console.error("Gagal memulihkan draft:", error);
    } finally {
      restoring = false;
    }
  }


  // =============================================
  // RESET FORM
  // =============================================

  function resetForm() {
    const confirmed = confirm(
      "Apakah kamu yakin ingin menghapus seluruh data form Jasa?"
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);

    form.reset();

    technicalList.innerHTML = "";
    kpiList.innerHTML = "";
    attachmentList.innerHTML = "";

    $("#serviceVersion").value = "00";
    $("#serviceCreatedDate").value = "";

    setCreatedDate();

    departmentSelect.innerHTML = `
      <option value="">-- Pilih Plant terlebih dahulu --</option>
    `;

    departmentSelect.disabled = true;

    updateReasonOptions();
    updateReasonOther();
    updateRequiredOther();

    draftStatus.textContent = "Draft baru";
    formMessage.textContent = "Form berhasil direset.";
  }


  // =============================================
  // VALIDATION
  // =============================================

  function validateForm() {
    updateReasonOther();
    updateRequiredOther();

    $$(".service-dynamic-row", form).forEach(row => {
      if (row.dataset.dynamicType === "attachment") {
        updateAttachmentRow(row);
      }
    });

    if (!form.checkValidity()) {
      form.reportValidity();

      formMessage.textContent =
        "Masih ada informasi wajib yang belum lengkap.";

      return false;
    }

    const category = $(
      'input[name="materialCategory"]:checked',
      form
    );

    if (!category) {
      formMessage.textContent =
        "Silakan pilih Material Category.";

      return false;
    }

    formMessage.textContent =
      "Form sudah memenuhi validasi isian. Data masih berupa draft lokal.";

    return true;
  }


  // =============================================
  // EVENT LISTENERS
  // =============================================

  plantSelect.addEventListener("change", () => {
    updateDepartment();
    saveDraft();
  });


  departmentSelect.addEventListener("change", saveDraft);

  materialGroupSelect.addEventListener("change", saveDraft);

  reasonSelect.addEventListener("change", () => {
    updateReasonOther();
    saveDraft();
  });


  $$('input[name="materialCategory"]', form).forEach(input => {
    input.addEventListener("change", () => {
      updateReasonOptions();
      saveDraft();
    });
  });


  requiredOtherCheck.addEventListener("change", () => {
    updateRequiredOther();
    saveDraft();
  });


  form.addEventListener("input", event => {
    if (event.target.type === "file") return;
    saveDraft();
  });


  form.addEventListener("change", event => {
    if (event.target.matches("[data-attachment-type]")) {
      updateAttachmentRow(
        event.target.closest("[data-dynamic-type]")
      );
    }

    if (event.target.matches("[data-attachment-file]")) {
      const row = event.target.closest("[data-dynamic-type]");
      const file = event.target.files[0];

      $("[data-file-name]", row).textContent =
        file ? file.name : "Belum ada file dipilih.";
    }

    saveDraft();
  });


  form.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-row]");

    if (addButton) {
      addDynamicRow(addButton.dataset.addRow);
      return;
    }

    const removeButton = event.target.closest("[data-remove-row]");

    if (removeButton) {
      removeButton.closest("[data-dynamic-type]").remove();
      saveDraft();
    }
  });


  form.addEventListener("submit", event => {
    event.preventDefault();
    validateForm();
  });


  $("#resetServiceBtn").addEventListener("click", resetForm);


  // =============================================
  // INITIALIZATION
  // =============================================

  function initialize() {
    initializeMaterialGroups();

    setCreatedDate();

    restoreDraft();

    updateDepartment(departmentSelect.value);

    updateReasonOptions(reasonSelect.value);

    updateReasonOther();

    updateRequiredOther();

    saveDraft();
  }

  initialize();

})();
