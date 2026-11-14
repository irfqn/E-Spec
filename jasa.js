
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
    console.error(
      "Form kuesioner atau template cetak Jasa tidak ditemukan."
    );
    return;
  }

  // =====================================================
  // AMBIL DATA FORM
  // =====================================================

  function getFormData() {
    const data = {};
    const formData = new FormData(questionnaire);

    for (const [key, value] of formData.entries()) {

      // File belum disimpan ke localStorage/database
      // melalui mekanisme JSON ini.
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

    return data;
  }

  // =====================================================
  // STATUS DRAFT
  // =====================================================

  function setDraftStatus(message) {
    if (draftStatus) {
      draftStatus.textContent = message;
    }
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

      if (!saved) return;

      for (const [name, value] of Object.entries(saved)) {

        const fields = questionnaire.querySelectorAll(
          `[name="${CSS.escape(name)}"]`
        );

        fields.forEach((field) => {

          if (
            field.type === "checkbox" ||
            field.type === "radio"
          ) {
            field.checked = Array.isArray(value)
              ? value.includes(field.value)
              : value === field.value;

          } else if (field.type !== "file") {
            field.value = value ?? "";
          }

        });
      }

      setDraftStatus("Draft sebelumnya berhasil dipulihkan");

    } catch (error) {
      console.error("Gagal memulihkan draft:", error);
    }
  }

  // =====================================================
  // SINKRONISASI KUESIONER KE TEMPLATE CETAK
  // =====================================================

  function transferToPrint(data = getFormData()) {

    printForm.querySelectorAll("[name]").forEach((target) => {

      const value = data[target.name];

      if (
        target.type === "checkbox" ||
        target.type === "radio"
      ) {
        target.checked = Array.isArray(value)
          ? value.includes(target.value)
          : value === target.value;

      } else if (target.type !== "file") {
        target.value = value ?? "";
      }

    });
  }

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

  // Kembalikan tampilan setelah dialog cetak ditutup.
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

      // Masukkan data database ke template cetak.
      transferToPrint(data);

      // Beri waktu agar template selesai diperbarui.
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });

      window.print();

    } catch (error) {

      console.error(
        "Gagal mencetak dokumen Jasa:",
        error
      );

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
  // CETAK PDF DARI HALAMAN JASA
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

      questionnaire.querySelectorAll(
        "input, textarea, select"
      ).forEach((field) => {

        if (
          field.type === "checkbox" ||
          field.type === "radio"
        ) {
          field.checked = false;

        } else if (field.type !== "file") {
          field.value = "";
        }

      });

      localStorage.removeItem(STORAGE_KEY);

      transferToPrint({});

      setDraftStatus("Form telah dikosongkan");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      console.log(
        "Form Spesifikasi Jasa berhasil dikosongkan."
      );

    });

  }

  // =====================================================
  // SIMPAN KE DATABASE ADMIN
  // =====================================================

  if (saveBtn) {

    saveBtn.addEventListener("click", async () => {

      if (!questionnaire.reportValidity()) return;

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

        alert(
          "Spesifikasi Jasa berhasil disimpan ke Admin."
        );

        setDraftStatus(
          "Data berhasil disimpan ke Admin"
        );

      } catch (error) {

        console.error(
          "Gagal menyimpan spesifikasi Jasa:",
          error
        );

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
  // INISIALISASI HALAMAN
  // =====================================================

  const printId = new URLSearchParams(
    window.location.search
  ).get("printId");

  if (printId) {

    // Halaman dibuka dari tombol Cetak PDF di Admin.
    printSavedJasa(printId);

  } else {

    // Halaman dibuka secara normal.
    restoreDraft();

    transferToPrint();
  }

})();
