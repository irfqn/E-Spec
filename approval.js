
(() => {
  "use strict";

  // =====================================================
  // E-SPEC — MY E-SPEC
  // FRONTEND VERSION (TANPA BACKEND)
  // =====================================================

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  let documents = [];
  let myEspecStatus = "all";

  // =====================================================
  // HELPER
  // =====================================================

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  // =====================================================
  // DOCUMENT NAME
  // =====================================================

  function getDocumentName(doc) {
    const data = doc.formData || doc;

    return (
      doc.materialDescription ||
      data.materialDescription ||
      data.serviceName ||
      data.serviceDescription ||
      data.serviceTitle ||
      data.namaJasa ||
      data.namaLayanan ||
      (doc.specType === "Jasa"
        ? "Tanpa nama jasa"
        : "Tanpa nama barang")
    );
  }

  // =====================================================
  // DOCUMENT STATUS
  // =====================================================

  function getApprovalStatus(doc) {
    const status = normalizeText(
      doc.status || doc.approvalStatus || "Draft"
    );

    if ([
      "approved",
      "disetujui",
      "completed",
      "complete",
      "selesai",
      "release",
      "released"
    ].includes(status)) {
      return "released";
    }

    if ([
      "revision",
      "revisi",
      "need revision",
      "perlu revisi",
      "returned",
      "dikembalikan"
    ].includes(status)) {
      return "revision";
    }

    if ([
      "rejected",
      "reject",
      "ditolak"
    ].includes(status)) {
      return "revision";
    }

    if (
      status.includes("waiting") ||
      status.includes("pending") ||
      status.includes("menunggu") ||
      status === "submitted" ||
      status === "diajukan"
    ) {
      return "pending";
    }

    return "draft";
  }

  // =====================================================
  // STATUS BADGE
  // =====================================================

  function getApprovalBadge(status) {
    const badges = {
      draft: `
        <span class="approval-status draft">
          Draft
        </span>
      `,

      pending: `
        <span class="approval-status pending">
          Waiting Approval
        </span>
      `,

      revision: `
        <span class="approval-status rejected">
          Need Revision
        </span>
      `,

      released: `
        <span class="approval-status approved">
          Released
        </span>
      `
    };

    return badges[status] || badges.draft;
  }

  // =====================================================
  // PROGRESS APPROVER / CATATAN REVISI
  // =====================================================

  function getProgressContent(doc, status) {
    const data = doc.formData || doc;

    const revisionNote =
      doc.revisionNote ||
      doc.revision_note ||
      doc.rejectionReason ||
      doc.rejection_reason ||
      data.revisionNote ||
      data.revision_note ||
      data.rejectionReason ||
      "";

    const approvalProgress =
      doc.approvalProgress ||
      doc.approval_progress ||
      data.approvalProgress ||
      data.approval_progress ||
      "";

    if (status === "draft") {
      return `
        <div class="my-espec-progress">
          Belum diajukan
          <small>Dokumen masih dalam tahap Draft</small>
        </div>
      `;
    }

    if (status === "pending") {
      return `
        <div class="my-espec-progress">
          ${escapeHTML(approvalProgress || "Menunggu approver")}
          <small>Proses persetujuan sedang berjalan</small>
        </div>
      `;
    }

    if (status === "revision") {
      return `
        <div class="my-espec-progress revision-note">
          ${escapeHTML(revisionNote || "Belum ada catatan revisi")}
          <small>Dokumen memerlukan perbaikan</small>
        </div>
      `;
    }

    if (status === "released") {
      return `
        <div class="my-espec-progress completed-note">
          Approval selesai
          <small>Dokumen telah Released</small>
        </div>
      `;
    }

    return `
      <div class="my-espec-progress">
        —
      </div>
    `;
  }

  // =====================================================
  // FILTER DOCUMENTS
  // =====================================================

  function getFilteredMyEspec() {
    const search = normalizeText(
      $("#myEspecSearch")?.value || ""
    );

    return documents.filter(doc => {
      const status = getApprovalStatus(doc);

      const matchesStatus =
        myEspecStatus === "all" ||
        (myEspecStatus === "draft" && status === "draft") ||
        (myEspecStatus === "pending" && status === "pending") ||
        (myEspecStatus === "revision" && status === "revision") ||
        (myEspecStatus === "released" && status === "released");

      const searchable = normalizeText([
        doc.docNo,
        doc.doc_no,
        doc.revision,
        getDocumentName(doc),
        doc.materialCode,
        doc.material_code
      ].join(" "));

      return matchesStatus && searchable.includes(search);
    });
  }

  // =====================================================
  // RENDER STATUS TABS
  // =====================================================

  function renderStatusTabs() {
    document.querySelectorAll("[data-my-status]").forEach(button => {
      const active = button.dataset.myStatus === myEspecStatus;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  // =====================================================
  // RENDER TABLE
  // =====================================================

  function renderMyEspec() {
    const rows = $("#myEspecRows");
    const empty = $("#myEspecEmptyState");
    const table = $(".my-espec-table-wrap");
    const footer = $(".my-espec-footer");

    if (!rows) return;

    const filtered = getFilteredMyEspec();

    if ($("#myEspecResultCount")) {
      $("#myEspecResultCount").textContent =
        `Menampilkan ${filtered.length} dokumen`;
    }

    // EMPTY STATE
    if (filtered.length === 0) {
      rows.innerHTML = "";

      if (table) table.style.display = "none";
      if (footer) footer.style.display = "none";

      if (empty) {
        empty.style.display = "block";

        const heading = $("h3", empty);
        const description = $("p", empty);

        if (documents.length === 0) {
          if (heading) {
            heading.textContent =
              "Belum ada dokumen E-Spec yang dibuat";
          }

          if (description) {
            description.innerHTML =
              'Klik tombol <strong>+ Buat Spesifikasi</strong> ' +
              'untuk membuat pengajuan spesifikasi baru.';
          }
        } else {
          if (heading) {
            heading.textContent = "Dokumen tidak ditemukan";
          }

          if (description) {
            description.textContent =
              "Coba ubah kata pencarian atau pilih status lainnya.";
          }
        }
      }

      return;
    }

    // SHOW TABLE
    if (empty) empty.style.display = "none";
    if (table) table.style.display = "block";
    if (footer) footer.style.display = "flex";

    rows.innerHTML = filtered.map(doc => {
      const status = getApprovalStatus(doc);

      const docNo =
        doc.docNo ||
        doc.doc_no ||
        "Belum ada nomor";

      const revision =
        doc.revision || "—";

      return `
        <tr>
          <td>
            <span class="doc-number">
              ${escapeHTML(docNo)}
            </span>

            <div class="secondary-text">
              Ver. ${escapeHTML(revision)}
            </div>
          </td>

          <td>
            <span class="document-name">
              ${escapeHTML(getDocumentName(doc))}
            </span>
          </td>

          <td>
            ${getApprovalBadge(status)}
          </td>

          <td>
            ${getProgressContent(doc, status)}
          </td>

          <td>
            <button
              type="button"
              class="table-action"
              data-espec-detail="${escapeHTML(doc.id)}">
              Detail
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // =====================================================
  // DOCUMENT DETAIL
  // =====================================================

  function showDocumentDetail(id) {
    const doc = documents.find(
      item => String(item.id) === String(id)
    );

    if (!doc) return;

    const status = getApprovalStatus(doc);

    const detail = [
      `Nomor Dokumen: ${doc.docNo || doc.doc_no || "—"}`,
      `Versi: ${doc.revision || "—"}`,
      `Nama Spesifikasi: ${getDocumentName(doc)}`,
      `Jenis: ${doc.specType || "—"}`,
      `Status: ${status}`,
      `Tanggal: ${formatDate(doc.savedAt || doc.createdAt || doc.created_at)}`,
      `Progress / Catatan: ${
        doc.revisionNote ||
        doc.revision_note ||
        doc.approvalProgress ||
        doc.approval_progress ||
        "—"
      }`
    ].join("\n");

    alert(detail);
  }

  // =====================================================
  // EVENTS
  // =====================================================

  function initializeEvents() {
    // SEARCH
    $("#myEspecSearch")?.addEventListener(
      "input",
      renderMyEspec
    );

    // STATUS TABS
    document.querySelectorAll("[data-my-status]").forEach(button => {
      button.addEventListener("click", () => {
        myEspecStatus = button.dataset.myStatus;

        renderStatusTabs();
        renderMyEspec();
      });
    });

    // DETAIL BUTTON
    $("#myEspecRows")?.addEventListener("click", event => {
      const button = event.target.closest("[data-espec-detail]");

      if (!button) return;

      showDocumentDetail(button.dataset.especDetail);
    });
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  document.addEventListener("DOMContentLoaded", () => {
    initializeEvents();
    renderStatusTabs();
    renderMyEspec();
  });

})();
