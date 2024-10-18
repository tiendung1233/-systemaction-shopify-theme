import { LitElement, css, html } from "lit";

export class RocketNewsletter extends LitElement {
  static get properties() {
    return {
      bg_color: { type: String },
      id: { type: String },
      count: { type: String },
    };
  }
  // Define scoped styles right with your component, in plain CSS
  static styles = css``;

  constructor() {
    super();
    let imagen = this.querySelector(".col-md-4");
    imagen.addEventListener("click", (e) => this._alertMessage(e));
    this.count = 0;
  }

  _alertMessage(e) {
    alert("click en imagen");
    this.count++;
  }

  // Render the UI as a function of component state
  render() {
    this.querySelector(".newsletter-content").style["background-color"] =
      this.bg_color;
    // this.querySelector(".counter").innerHTML = this.count;
    /*     console.log(this.id); */
    return html`<slot name="${this.id}"></slot>`;
    // <p>Click count: ${this.count}</p>`;
  }
}
customElements.define("rocket-newsletter", RocketNewsletter);
