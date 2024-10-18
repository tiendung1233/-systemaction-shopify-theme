if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");

        this.hideErrors = this.dataset.hideErrors === "true";
        setTimeout(() => {
          const restockRocketButtonCover = document.querySelector('.restock-rocket-button-cover')
          const btnBy = document.querySelector('.product-form__submit')
          if (restockRocketButtonCover && btnBy) {
            btnBy.style.display = 'none'
          } else {
            btnBy.style.display = 'block'
          }
        }, 1000)
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        /*         console.log("Drawer Event Started"); */
        /*         console.log(this.submitButton); */
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        this.handleErrorMessage();

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        /*     this.querySelector(".loading-overlay__spinner").classList.remove(
          "hidden"
        ); */

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              setTimeout(() => {
                const restockRocketButtonCover = document.querySelector('.restock-rocket-button-cover')
                const btnBy = document.querySelector('.product-form__submit')
                if (restockRocketButtonCover && btnBy) {
                  btnBy.style.display = 'none'
                } else {
                  btnBy.style.display = 'block'
                }
              }, 1000)
              console.log(response.description)
              publish(PUB_SUB_EVENTS.cartError, {
                source: "product-form",
                productVariantId: formData.get("id"),
                errors: response.errors || response.description,
                message: response.message,
              });
              
              this.handleErrorMessage(response.description);
              this.error = true;
              const soldOutMessage =
                this.submitButton.querySelector(".sold-out-message");
              if (!soldOutMessage) return;
              this.submitButton.setAttribute("aria-disabled", true);
              this.submitButton.querySelector("span").classList.add("hidden");
              soldOutMessage.classList.remove("hidden");
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: "product-form",
                productVariantId: formData.get("id"),
              });
            this.error = false;
            const quickAddModal = this.closest("quick-add-modal");
            if (quickAddModal) {
              document.body.addEventListener(
                "modalClosed",
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }

            // Coloca el código aquí para desactivar el botón en el cart-drawer si es necesario
            var trueFound = false;
            var falseFound = false;
            var cartItems = document.querySelectorAll(".cart-item");

            cartItems.forEach(function (item) {
              var teamStoreValue = item.getAttribute("data-team-store-drawer");
              if (teamStoreValue === "true") {
                trueFound = true;
              } else if (teamStoreValue === "false") {
                falseFound = true;
              }
            });

            if (trueFound && falseFound) {
              var button = document.getElementById("CartDrawer-Checkout");
              button.setAttribute("disabled", "disabled");
              var popup = document.getElementById("drawer-popup");
              popup.style.display = "block";
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            if (!this.error && this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("aria-disabled");
            this.querySelector(".loading-overlay__spinner").classList.add(
              "hidden"
            );
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;
        console.log(this.querySelector(".product-form__error-message-wrapper"))
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper") || document.querySelector("#PopupModal-Error");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );
     
        
        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
          if(this.errorMessageWrapper.id === "PopupModal-Error") {
          this.errorMessageWrapper.show()
            setTimeout( ()=> this.errorMessageWrapper.hide(), 5000)
          }
          
        }
        if(this.errorMessageWrapper.id != "PopupModal-Error") {
          this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        } 
      }
    }
  );
}
