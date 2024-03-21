class PlayerInventoryView extends HTMLElement implements Nabu.IPage {

    public static get observedAttributes() {
        return [];
    }

    private _loaded: boolean = false;
    private _shown: boolean = false;
    public get shown(): boolean {
        return this._shown;
    }

    public inventory: PlayerInventory;
    private _title: HTMLHeadingElement;
    private _containerFrame: HTMLDivElement;
    private _container: HTMLDivElement;
    private _backButton: HTMLButtonElement;

    private _onLoad: () => void;
    public get onLoad(): () => void {
        return this._onLoad;
    }
    public set onLoad(callback: () => void) {
        this._onLoad = callback;
        if (this._loaded) {
            this._onLoad();
        }
    }

    public connectedCallback(): void {
        this.style.display = "none";
        this.style.opacity = "0";

        this._title = document.createElement("h1");
        this._title.innerHTML = "INVENTORY";
        this.appendChild(this._title);

        this._containerFrame = document.createElement("div");
        this._containerFrame.classList.add("container-frame");
        this.appendChild(this._containerFrame);

        this._container = document.createElement("div");
        this._container.classList.add("container");
        this._containerFrame.appendChild(this._container);

        let a = document.createElement("a");
        a.href = "#home";
        this.appendChild(a);

        this._backButton = document.createElement("button");
        this._backButton.classList.add("back-button");
        this._backButton.innerText = "BACK";
        a.appendChild(this._backButton);
    }

    public attributeChangedCallback(name: string, oldValue: string, newValue: string) {}

    public async show(duration: number = 1): Promise<void> {
        this.createPage();
        return new Promise<void>((resolve) => {
            if (!this._shown) {
                this._shown = true;
                this.style.display = "block";
                let opacity0 = parseFloat(this.style.opacity);
                let opacity1 = 1;
                let t0 = performance.now();
                let step = () => {
                    let t = performance.now();
                    let dt = (t - t0) / 1000;
                    if (dt >= duration) {
                        this.style.opacity = "1";
                        resolve();
                    } else {
                        let f = dt / duration;
                        this.style.opacity = ((1 - f) * opacity0 + f * opacity1).toFixed(2);
                        requestAnimationFrame(step);
                    }
                };
                step();
            }
        });
    }

    public async hide(duration: number = 1): Promise<void> {
        if (duration === 0) {
            this._shown = false;
            this.style.display = "none";
            this.style.opacity = "0";
        } else {
            return new Promise<void>((resolve) => {
                if (this._shown) {
                    this._shown = false;
                    this.style.display = "block";
                    let opacity0 = parseFloat(this.style.opacity);
                    let opacity1 = 0;
                    let t0 = performance.now();
                    let step = () => {
                        let t = performance.now();
                        let dt = (t - t0) / 1000;
                        if (dt >= duration) {
                            this.style.display = "none";
                            this.style.opacity = "0";
                            resolve();
                        } else {
                            let f = dt / duration;
                            this.style.opacity = ((1 - f) * opacity0 + f * opacity1).toFixed(2);
                            requestAnimationFrame(step);
                        }
                    };
                    step();
                }
            });
        }
    }

    public setInventory(inventory: PlayerInventory): void {
        this.inventory = inventory;
    }

    public createPage(): void {
        this._container.innerHTML = "";

        for (let i = 0; i < this.inventory.items.length; i++) {
            let inventoryItem = this.inventory.items[i];

            let line = document.createElement("div");
            line.classList.add("line");
            this._container.appendChild(line);
    
            let label = document.createElement("div");
            label.classList.add("label");
            label.innerHTML = inventoryItem.name;
            label.style.display = "inline-block";
            label.style.marginLeft = "1%";
            label.style.marginRight = "1%";
            label.style.paddingLeft = "1.5%";
            label.style.paddingRight = "1.5%";
            label.style.width = "45%";
            line.appendChild(label);
    
            let countBlock = document.createElement("div");
            countBlock.classList.add("count-block");
            countBlock.innerHTML = inventoryItem.count.toFixed(0);
            countBlock.style.display = "inline-block";
            countBlock.style.marginLeft = "1%";
            countBlock.style.marginRight = "1%";
            countBlock.style.paddingLeft = "1.5%";
            countBlock.style.paddingRight = "1.5%";
            countBlock.style.width = "15%";
            line.appendChild(countBlock);
        }
    }
}

customElements.define("inventory-page", PlayerInventoryView);
