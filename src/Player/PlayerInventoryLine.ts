class PlayerInventoryLine extends HTMLDivElement {

    public item: PlayerInventoryItem;
    
    constructor() {
        super();
    }
}

customElements.define("inventory-line", PlayerInventoryLine, { extends: "div" });