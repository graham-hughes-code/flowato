const template = document.createElement("template");
template.innerHTML = `
<label for="const_text">Value:</label>
<input type="text" id="const_text"/>
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

    const const_text = this.shadowRoot.getElementById("const_text");
    const_text.value = JSON.parse(this.data).value;
  }

  connectedCallback() {
    const filterFloat = function (value) {
      if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value))
        return Number(value);
      return NaN;
    };
    const const_text = this.shadowRoot.getElementById("const_text");
    if (this.data) {
      const_text.value = JSON.parse(this.data).value;
    }
    const_text.oninput = () => {
      this.data_callback({
        value: isNaN(filterFloat(const_text.value))
          ? const_text.value
          : filterFloat(const_text.value),
      });
    };
  }
}
