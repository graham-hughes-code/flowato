const template = document.createElement("template");
template.innerHTML = `
<div id="text">Value: </div>
`;

export class NodeFrontEnd extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static get observedAttributes() {
    return ["data", "data_callback"];
  }

  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return;
    this[property] = newValue;

    const const_text = this.shadowRoot.getElementById('text');
    const_text.innerText = "Value: " + JSON.parse(this.data);
  }

  connectedCallback() {
    const filterFloat = function (value) {
      if(/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
        .test(value))
      return Number(value);
      return NaN;
    };
    const const_text = this.shadowRoot.getElementById('text');
    if (this.data) {
      const_text.innerText = "Value: " + JSON.parse(this.data);
    }
  }
}
