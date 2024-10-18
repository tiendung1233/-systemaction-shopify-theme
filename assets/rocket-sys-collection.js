document.addEventListener("DOMContentLoaded", function () {
  new Ajaxinate({
    container: "#product-grid",
    pagination: "#AjaxinatePagination",
    offset: 0,
    method: "click",
    callback: function (e) {
      // Callback function
      window.history.pushState(null,'',  e.URL);
      document.dispatchEvent(
        new CustomEvent("ajaxinate:loaded", { detail: e })
      );
    },
  });
  if (!window.SwymCallbacks) {
    window.SwymCallbacks = [];
  }
  window.SwymCallbacks.push(collectionLoaded);

  function collectionLoaded(swat) {
    document.addEventListener("ajaxinate:loaded", function (e) {
      if (swat) {
        swat.initializeActionButtons("#product-grid");
      }
      restockInit();
    });
  }
  collectionLoaded();
});
