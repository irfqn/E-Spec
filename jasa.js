
(() => {
  "use strict";

  // =====================================================
  // E-SPEC JASA — QUESTIONNAIRE CONTROLLER
  // =====================================================

  const API_URL = "http://localhost:3000/api/documents";
  const STORAGE_KEY = "eSpecJasaQuestionnaire.v1";

  const questionnaire = document.getElementById("questionnaireJasaForm");
  const printForm = document.getElementById("printJasaForm");

  const pdfBtn = document.getElementById("pdfJasaBtn");
  const resetBtn = document.getElementById("resetJasaBtn");
  const saveBtn = document.getElementById("saveJasaAdminBtn");
  const submitBtn = document.getElementById("submitJasaBtn");
  const draftStatus = document.getElementById("draftStatus");

  if (!questionnaire || !printForm) {
    console.error("Form kuesioner atau template cetak Jasa tidak ditemukan.");
    return;
  }

  // =====================================================
  // DATA DEPARTMENT — SAMA DENGAN BARANG
  // =====================================================

  const plantData = {
    "1210 - Plant Gending": [
      "HRGA",
      "Fermentation - Decalcium",
      "Fermentation - Glucose",
      "Fermentation - Fermentation",
      "Isolation & Purification - Isolation/Purification",
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
      "Production - Dry/Wet",
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

  const plantSelect = questionnaire.querySelector('[name="plant"]');
  const deptSelect = questionnaire.querySelector('[name="department"]');

  // =====================================================
  // UTILITAS
  // =====================================================

  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function setDraftStatus(message) {
    if (draftStatus) {
      draftStatus.textContent = message;
    }
  }

  function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function normalizeName(name) {
    return name.replace(/\[\]$/, "");
  }

  function getFieldValue(data, name) {
    if (Object.prototype.hasOwnProperty.call(data, name)) {
      return data[name];
    }

    const normalized = normalizeName(name);

    if (Object.prototype.hasOwnProperty.call(data, normalized)) {
      return data[normalized];
    }

    return "";
  }

  // =====================================================
  // VERSION DAN CREATED DATE
  // =====================================================

  function initializeDocumentInfo() {
    const versionField = questionnaire.querySelector('[name="version"]');
    const createdDateField = questionnaire.querySelector('[name="createdDate"]');

    if (versionField && !versionField.value) {
      versionField.value = "00";
    }

    if (versionField) {
      versionField.readOnly = true;
    }

    if (createdDateField && !createdDateField.value) {
      createdDateField.value = getToday();
    }

    if (createdDateField) {
      createdDateField.readOnly = true;
    }
  }

  // =====================================================
  // DROPDOWN DEPARTMENT BERDASARKAN PLANT
  // =====================================================

  function populateDepartments(selectedDepartment = "") {
    if (!plantSelect || !deptSelect) return;

    const selectedPlant = plantSelect.value;

    deptSelect.innerHTML = "";

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = selectedPlant
      ? "-- Pilih Departemen --"
      : "Pilih Plant terlebih dahulu";

    deptSelect.appendChild(placeholder);

    const departments = plantData[selectedPlant] || [];

    departments.forEach((department) => {
      const option = document.createElement("option");

      option.value = department;
      option.textContent = department;

      deptSelect.appendChild(option);
    });

    if (selectedDepartment && departments.includes(selectedDepartment)) {
      deptSelect.value = selectedDepartment;
    } else {
      deptSelect.value = "";
    }
  }

  if (plantSelect && deptSelect) {
    plantSelect.addEventListener("change", () => {
      populateDepartments();

      saveDraft();
      transferToPrint();
    });
  }

  // =====================================================
  // AMBIL DATA FORM
  // =====================================================

  function getFormData() {
    const data = {};
    const formData = new FormData(questionnaire);

    for (const [key, value] of formData.entries()) {
      // File tidak dapat disimpan melalui JSON.
      if (value instanceof File) continue;

      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }

        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    // Simpan nama file lampiran berdasarkan nama field.
    const fileNames = {};

    questionnaire.querySelectorAll('input[type="file"]').forEach((field) => {
      if (field.files && field.files.length > 0) {
        if (!fileNames[field.name]) {
          fileNames[field.name] = [];
        }

        fileNames[field.name].push(
          ...Array.from(field.files).map((file) => file.name)
        );
      }
    });

    data._attachmentFileNames = fileNames;

    return data;
  }

  // =====================================================
  // AUTO SAVE DRAFT
  // =====================================================

  function saveDraft() {
    try {
      const data = getFormData();

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );

      setDraftStatus("Draft tersimpan otomatis di browser");

    } catch (error) {
      console.error("Gagal menyimpan draft:", error);

      setDraftStatus("Draft tidak dapat disimpan");
    }
  }

  // =====================================================
  // RESTORE DRAFT
  // =====================================================

  function restoreDraft() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "null"
      );

      if (!saved) {
        initializeDocumentInfo();

        if (plantSelect && deptSelect) {
          populateDepartments();
        }

        return;
      }

      // Pulihkan Plant terlebih dahulu.
      if (plantSelect && saved.plant !== undefined) {
        plantSelect.value = saved.plant;
      }

      // Buat pilihan Department berdasarkan Plant.
      if (plantSelect && deptSelect) {
        populateDepartments(saved.department || "");
      }

      // Pulihkan field lainnya.
      Object.entries(saved).forEach(([name, value]) => {
        if (name === "_attachmentFileNames") return;

        const fields = questionnaire.querySelectorAll(
          `[name="${CSS.escape(name)}"]`
        );

        fields.forEach((field) => {
          if (field.type === "file") return;

          if (field.type === "checkbox" || field.type === "radio") {
            field.checked = Array.isArray(value)
              ? value.includes(field.value)
              : value === field.value;

          } else if (field.name === "department") {
            return;

          } else if (field.name.endsWith("[]")) {
            const values = Array.isArray(value) ? value : [value];
            field.value = values[0] ?? "";

          } else {
            field.value = Array.isArray(value)
              ? value.join("\n")
              : value ?? "";
          }
        });
      });

      initializeDocumentInfo();

      setDraftStatus("Draft sebelumnya berhasil dipulihkan");

    } catch (error) {
      console.error("Gagal memulihkan draft:", error);

      initializeDocumentInfo();
    }
  }

  // =====================================================
  // SINKRONISASI KUESIONER KE TEMPLATE CETAK
  // =====================================================

  function transferToPrint(data = getFormData()) {
    printForm.querySelectorAll("[name]").forEach((target) => {
      const value = getFieldValue(data, target.name);

      if (target.type === "checkbox" || target.type === "radio") {
        target.checked = Array.isArray(value)
          ? value.includes(target.value)
          : value === target.value;

      } else if (target.type !== "file") {
        target.value = Array.isArray(value)
          ? value.join("\n")
          : value ?? "";
      }
    });

    // Tampilkan nama file lampiran pada template cetak.
    const fileNames = data._attachmentFileNames || {};

    Object.entries(fileNames).forEach(([name, names]) => {
      const target = printForm.querySelector(
        `[name="${CSS.escape(name)}"]`
      );

      if (target) {
        target.value = Array.isArray(names)
          ? names.join(", ")
          : names;
      }
    });
  }

  // =====================================================
  // TAMBAH TECHNICAL SPECIFICATION DAN KPI
  // =====================================================

  function addQuestion(container, name, placeholder) {
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.className = "dynamic-question-item";

    const textarea = document.createElement("textarea");
    textarea.name = name;
    textarea.placeholder = placeholder;
    textarea.rows = 3;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-question-btn";
    removeButton.textContent = "Hapus";

    removeButton.addEventListener("click", () => {
      wrapper.remove();

      saveDraft();
      transferToPrint();
    });

    textarea.addEventListener("input", () => {
      saveDraft();
      transferToPrint();
    });

    wrapper.appendChild(textarea);
    wrapper.appendChild(removeButton);

    container.appendChild(wrapper);
  }

  const technicalList = $("#technicalSpecificationList", questionnaire);
  const kpiList = $("#kpiList", questionnaire);

  const addTechnicalBtn = $("#addTechnicalSpecificationBtn", questionnaire);
  const addKpiBtn = $("#addKpiBtn", questionnaire);

  if (addTechnicalBtn) {
    addTechnicalBtn.addEventListener("click", () => {
      addQuestion(
        technicalList,
        "technicalSpecification[]",
        "Masukkan technical specification..."
      );
    });
  }

  if (addKpiBtn) {
    addKpiBtn.addEventListener("click", () => {
      addQuestion(
        kpiList,
        "kpi[]",
        "Masukkan KPI..."
      );
    });
  }

  // =====================================================
  // RESTORE FIELD DINAMIS
  // =====================================================

  function restoreDynamicQuestions(saved) {
    if (!saved) return;

    const dynamicFields = [
      {
        container: technicalList,
        key: "technicalSpecification[]",
        name: "technicalSpecification[]",
        placeholder: "Masukkan technical specification..."
      },
      {
        container: kpiList,
        key: "kpi[]",
        name: "kpi[]",
        placeholder: "Masukkan KPI..."
      }
    ];

    dynamicFields.forEach((item) => {
      if (!item.container) return;

      const values = saved[item.key];

      if (!values) return;

      const list = Array.isArray(values) ? values : [values];

      // Hapus field awal yang sudah ada di HTML.
      item.container.innerHTML = "";

      list.forEach((value) => {
        addQuestion(
          item.container,
          item.name,
          item.placeholder
        );

        const fields = item.container.querySelectorAll(
          `[name="${CSS.escape(item.name)}"]`
        );

        fields[fields.length - 1].value = value ?? "";
      });
    });
  }

  // =====================================================
  // SCOPE — PARAMETER & DYNAMIC DOCUMENT ROWS
  // =====================================================

  const attachmentDocumentList = $(
    "#attachmentDocumentList",
    questionnaire
  );

  const requiredDocumentList = $(
    "#requiredDocumentList",
    questionnaire
  );

  const addAttachmentDocumentBtn = $(
    "#addAttachmentDocumentBtn",
    questionnaire
  );

  const addRequiredDocumentBtn = $(
    "#addRequiredDocumentBtn",
    questionnaire
  );

  const scopeDocumentGroups = [
    {
      container: attachmentDocumentList,
      button: addAttachmentDocumentBtn,
      fieldName: "attachmentDocumentType[]"
    },
    {
      container: requiredDocumentList,
      button: addRequiredDocumentBtn,
      fieldName: "requiredDocumentType[]"
    }
  ];

  // Ambil semua baris dokumen pada suatu kelompok.
  function getScopeRows(container) {
    if (!container) return [];

    return Array.from(
      container.querySelectorAll(".scope-document-row")
    );
  }

  // Kosongkan isi baris.
  function clearScopeRow(row) {
    row.querySelectorAll("input, select, textarea").forEach((field) => {
      if (field.type === "file") {
        field.value = "";

      } else if (field.type === "checkbox" || field.type === "radio") {
        field.checked = false;

      } else if (field.tagName === "SELECT") {
        field.selectedIndex = 0;

      } else {
        field.value = "";
      }
    });
  }

  // Buat tombol hapus untuk baris tambahan.
  function createScopeRemoveButton(row) {
    if (!row || row.querySelector(".scope-remove-btn")) return;

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.className = "scope-remove-btn";
    removeButton.textContent = "Hapus";

    removeButton.addEventListener("click", () => {
      row.remove();

      saveDraft();
      transferToPrint();
    });

    row.appendChild(removeButton);
  }

  // Tambah satu baris dokumen.
  function addScopeDocumentRow(container, shouldSave = true) {
    if (!container) return null;

    const firstRow = getScopeRows(container)[0];

    if (!firstRow) {
      console.warn(
        "Baris awal Scope tidak ditemukan:",
        container.id
      );

      return null;
    }

    const newRow = firstRow.cloneNode(true);

    // Bersihkan nilai pada baris baru.
    clearScopeRow(newRow);

    // Hindari tombol hapus terduplikasi.
    const oldRemoveButton = newRow.querySelector(
      ".scope-remove-btn"
    );

    if (oldRemoveButton) {
      oldRemoveButton.remove();
    }

    createScopeRemoveButton(newRow);

    container.appendChild(newRow);

    if (shouldSave) {
      saveDraft();
      transferToPrint();
    }

    return newRow;
  }

  // Tombol tambah Attachment Documents.
  if (addAttachmentDocumentBtn) {
    addAttachmentDocumentBtn.addEventListener("click", () => {
      addScopeDocumentRow(attachmentDocumentList);
    });
  }

  // Tombol tambah Required Documents.
  if (addRequiredDocumentBtn) {
    addRequiredDocumentBtn.addEventListener("click", () => {
      addScopeDocumentRow(requiredDocumentList);
    });
  }

  // Pulihkan jumlah baris dan pilihan dropdown Scope.
  function restoreScopeDocumentRows(saved) {
    if (!saved) return;

    scopeDocumentGroups.forEach((group) => {
      const container = group.container;

      if (!container) return;

      const savedValue = saved[group.fieldName];

      if (savedValue === undefined || savedValue === null) {
        return;
      }

      const values = Array.isArray(savedValue)
        ? savedValue
        : [savedValue];

      if (values.length === 0) return;

      let rows = getScopeRows(container);

      if (rows.length === 0) return;

      // Kembali ke satu baris awal.
      rows.slice(1).forEach((row) => row.remove());

      // Tambahkan baris sesuai jumlah data tersimpan.
      while (getScopeRows(container).length < values.length) {
        const newRow = addScopeDocumentRow(
          container,
          false
        );

        if (!newRow) break;
      }

      rows = getScopeRows(container);

      // Pulihkan pilihan dropdown.
      rows.forEach((row, index) => {
        const select = row.querySelector("select");

        if (select) {
          select.value = values[index] ?? "";
        }

        // Baris tambahan harus memiliki tombol hapus.
        if (index > 0) {
          createScopeRemoveButton(row);
        }
      });
    });
  }

  // Reset Attachment dan Required Documents.
  function resetScopeDocumentRows() {
    scopeDocumentGroups.forEach((group) => {
      const container = group.container;

      if (!container) return;

      const rows = getScopeRows(container);

      // Hapus seluruh baris tambahan.
      rows.slice(1).forEach((row) => row.remove());

      // Kosongkan baris pertama.
      const firstRow = getScopeRows(container)[0];

      if (firstRow) {
        clearScopeRow(firstRow);

        const removeButton = firstRow.querySelector(
          ".scope-remove-btn"
        );

        if (removeButton) {
          removeButton.remove();
        }
      }
    });
  }

    // =====================================================
  // VALIDASI ATTACHMENT DOCUMENTS — PDF ONLY
  // =====================================================

  async function isValidPDF(file) {
    if (!file) return false;

    // Periksa ekstensi file.
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return false;
    }

    // Periksa signature PDF (%PDF-).
    try {
      const header = await file.slice(0, 5).arrayBuffer();
      const signature = new TextDecoder().decode(header);

      return signature === "%PDF-";
    } catch (error) {
      console.error("Gagal memeriksa file PDF:", error);
      return false;
    }
  }

  questionnaire.addEventListener("change", async (event) => {
    const input = event.target;

    if (
      !input.matches('input[name="attachmentDocumentFile[]"]') ||
      !input.files.length
    ) {
      return;
    }

    const file = input.files[0];
    const valid = await isValidPDF(file);

    if (!valid) {
      alert(
        "File tidak valid!\n\n" +
        "Attachment Documents hanya menerima file PDF yang valid."
      );

      input.value = "";
    }

    saveDraft();
    transferToPrint();
  });

  // =====================================================
  // MODE CETAK DOKUMEN DARI DATABASE ADMIN
  // =====================================================

  let databasePrintStyle = null;

  function cleanupDatabasePrintMode() {
    document.body.classList.remove("database-print-mode");

    if (databasePrintStyle) {
      databasePrintStyle.remove();
      databasePrintStyle = null;
    }
  }

  function activateDatabasePrintMode() {
    cleanupDatabasePrintMode();

    document.body.classList.add("database-print-mode");

    databasePrintStyle = document.createElement("style");

    databasePrintStyle.textContent = `
      body.database-print-mode .toolbar,
      body.database-print-mode .intro,
      body.database-print-mode .service-actions,
      body.database-print-mode #questionnaireJasaForm,
      body.database-print-mode .footnote {
        display: none !important;
      }

      body.database-print-mode #printJasaForm {
        display: block !important;
        visibility: visible !important;
      }
    `;

    document.head.appendChild(databasePrintStyle);
  }

  window.addEventListener("afterprint", () => {
    cleanupDatabasePrintMode();
  });

  // =====================================================
  // CETAK DOKUMEN JASA DARI DATABASE ADMIN
  // =====================================================

  async function printSavedJasa(documentId) {
    activateDatabasePrintMode();

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(documentId)}`
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          "Gagal mengambil data dokumen Jasa."
        );
      }

      const row = result.document ?? result;
      const savedData = row.form_data || {};

      const data = {
        ...savedData,

        docNo: row.doc_no ?? savedData.docNo ?? "",
        revision: row.revision ?? savedData.revision ?? "",
        requestor: row.requestor ?? savedData.requestor ?? "",
        department: row.department ?? savedData.department ?? ""
      };

      transferToPrint(data);

      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });

      window.print();

    } catch (error) {
      console.error("Gagal mencetak dokumen Jasa:", error);

      cleanupDatabasePrintMode();

      alert(
        "Gagal membuka dokumen Jasa untuk dicetak.\n\n" +
        error.message
      );
    }
  }

  // =====================================================
  // AUTO SAVE SAAT INPUT BERUBAH
  // =====================================================

  questionnaire.addEventListener("input", () => {
    saveDraft();
    transferToPrint();
  });

  questionnaire.addEventListener("change", () => {
    saveDraft();
    transferToPrint();
  });

  // =====================================================
  // CETAK PDF
  // =====================================================

  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
      if (!questionnaire.reportValidity()) return;

      saveDraft();
      transferToPrint();

      window.print();
    });
  }

  // =====================================================
  // RESET FORM JASA
  // =====================================================

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const confirmed = confirm(
        "Yakin ingin mengosongkan seluruh formulir spesifikasi Jasa?"
      );

      if (!confirmed) return;

      questionnaire.reset();

      // Reset baris dokumen pada bagian Scope.
      resetScopeDocumentRows();

      // Hapus field dinamis tambahan.
      if (technicalList) {
        const first = technicalList.querySelector(
          '[name="technicalSpecification[]"]'
        );

        technicalList.innerHTML = "";

        if (first) {
          addQuestion(
            technicalList,
            "technicalSpecification[]",
            "Masukkan technical specification..."
          );
        }
      }

      if (kpiList) {
        const first = kpiList.querySelector('[name="kpi[]"]');

        kpiList.innerHTML = "";

        if (first) {
          addQuestion(
            kpiList,
            "kpi[]",
            "Masukkan KPI..."
          );
        }
      }

      if (plantSelect && deptSelect) {
        populateDepartments();
      }

      localStorage.removeItem(STORAGE_KEY);

      initializeDocumentInfo();
      transferToPrint({});

      setDraftStatus("Form telah dikosongkan");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      console.log("Form Spesifikasi Jasa berhasil dikosongkan.");
    });
  }

    // =====================================================
  // VALIDASI MATERIAL CATEGORY
  // HANYA BOLEH MEMILIH SATU
  // =====================================================

  const materialCategoryFields = questionnaire.querySelectorAll(
    'input[name="materialCategory"]'
  );

  // Jika satu checkbox dipilih, lepaskan pilihan lainnya.
  materialCategoryFields.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        materialCategoryFields.forEach((otherCheckbox) => {
          if (otherCheckbox !== this) {
            otherCheckbox.checked = false;
          }
        });
      }

      saveDraft();
      transferToPrint();
    });
  });

  // Pastikan draft lama tidak memulihkan dua pilihan sekaligus.
  function enforceSingleMaterialCategory() {
    const checkedCategories = Array.from(materialCategoryFields)
      .filter((checkbox) => checkbox.checked);

    checkedCategories.slice(1).forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  // Validasi sebelum menyimpan.
  function validateMaterialCategory() {
    const categories = questionnaire.querySelectorAll(
      'input[name="materialCategory"]:checked'
    );

    if (categories.length === 0) {
      alert("Silakan pilih salah satu Material Category.");
      return false;
    }

    if (categories.length > 1) {
      alert("Material Category hanya boleh memilih satu pilihan.");
      return false;
    }

    return true;
  }

  // =====================================================
  // SIMPAN KE DATABASE ADMIN
  // =====================================================

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      if (!questionnaire.reportValidity()) return;
      if (!validateMaterialCategory()) return;

      const formData = getFormData();

      const payload = {
        specType: "Jasa",
        formData
      };

      saveBtn.disabled = true;

      const oldText = saveBtn.textContent;
      saveBtn.textContent = "Menyimpan...";

      try {
        const response = await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.message ||
            result.error ||
            "Gagal menyimpan data ke server."
          );
        }

        alert("Spesifikasi Jasa berhasil disimpan ke Admin.");

        setDraftStatus("Data berhasil disimpan ke Admin");

      } catch (error) {
        console.error("Gagal menyimpan spesifikasi Jasa:", error);

        alert(
          "Gagal menyimpan ke Admin. Pastikan server backend aktif.\n\n" +
          error.message
        );

      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = oldText;
      }
    });
  }

  // =====================================================
  // SUBMIT BUTTON
  // =====================================================
  // Belum dihubungkan ke proses approval.
  // Alur Submit perlu disamakan dengan mekanisme Barang.

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      alert(
        "Fitur Submit Jasa belum dihubungkan ke alur approval."
      );
    });
  }

  // =====================================================
  // INISIALISASI HALAMAN
  // =====================================================

  const printId = new URLSearchParams(
    window.location.search
  ).get("printId");

  if (printId) {
    printSavedJasa(printId);

  } else {
    initializeDocumentInfo();

    restoreDraft();

    // Pastikan Material Category hanya memiliki satu pilihan.
    enforceSingleMaterialCategory();

    // Pulihkan pertanyaan dinamis setelah draft dibaca.
    const savedDraft = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );

    if (savedDraft) {
      restoreDynamicQuestions(savedDraft);
      restoreScopeDocumentRows(savedDraft);
    }

    transferToPrint();
  }

})();
