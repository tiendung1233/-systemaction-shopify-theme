import { LitElement, html } from "lit";
import { repeat } from "lit/directives/repeat.js";

export class RocketList extends LitElement {
  static get properties() {
    return {
      items: { type: String },
    };
  }

  constructor() {
    super();
  }

  // Render the UI as a function of component state
  render() {
    /*     console.log(this.items); */
    let lista = JSON.parse(this.items);
    return html`<ul>
      ${repeat(lista, (item) => html`<li>${item.title}</li>`)}
    </ul>`;
  }
}
customElements.define("rocket-list", RocketList);
