// Konfirmasi sebelum menghapus data (fallback tambahan selain confirm() inline di template)
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("form.confirm-delete").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (!confirm("Yakin ingin menghapus data ini?")) {
        e.preventDefault();
      }
    });
  });
});
