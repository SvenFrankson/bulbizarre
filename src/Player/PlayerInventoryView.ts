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
    private _containers: HTMLDivElement[];
    private _categoryAllBtn: HTMLDivElement;
    private _categoryBlocksBtn: HTMLDivElement;
    private _categoryBricksBtn: HTMLDivElement;
    private _categoryIngredientsBtn: HTMLDivElement;
    private _categoryBtns: HTMLDivElement[];

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

    private _currentCategory: InventoryCategory = InventoryCategory.Block;
    public setCurrentCategory(cat: InventoryCategory): void {
        this._currentCategory = cat;
        for (let i = 0; i < this._categoryBtns.length; i++) {
            this._makeCategoryBtnInactive(this._categoryBtns[i]);
            this._containers[i].style.display = "none";
        }
        this._makeCategoryBtnActive(this._categoryBtns[this._currentCategory]);
        this._containers[this._currentCategory].style.display = "block";
    }

    private _makeCategoryBtnStyle(btn: HTMLDivElement): void {
        btn.style.fontSize = "min(2svh, 2vw)";
        btn.style.display = "inline-block";
        btn.style.marginRight = "1%";
        btn.style.paddingTop = "0.5%";
        btn.style.paddingBottom = "0.5%";
        btn.style.width = "20%";
        btn.style.textAlign = "center";
        btn.style.borderLeft = "2px solid white";
        btn.style.borderTop = "2px solid white";
        btn.style.borderRight = "2px solid white";
        btn.style.borderTopLeftRadius = "10px";
        btn.style.borderTopRightRadius = "10px";
    }

    private _makeCategoryBtnActive(btn: HTMLDivElement): void {
        btn.style.borderLeft = "2px solid white";
        btn.style.borderTop = "2px solid white";
        btn.style.borderRight = "2px solid white";
        btn.style.color = "#272b2e";
        btn.style.backgroundColor = "white";
        btn.style.fontWeight = "bold";
    }

    private _makeCategoryBtnInactive(btn: HTMLDivElement): void {
        btn.style.borderLeft = "2px solid #7F7F7F";
        btn.style.borderTop = "2px solid #7F7F7F";
        btn.style.borderRight = "2px solid #7F7F7F";
        btn.style.borderBottom = "";
        btn.style.color = "#7F7F7F";
        btn.style.backgroundColor = "";
        btn.style.fontWeight = "";
    }

    public connectedCallback(): void {
        this.style.display = "none";
        this.style.opacity = "0";

        this._title = document.createElement("h1");
        this._title.classList.add("inventory-page-title");
        this._title.innerHTML = "INVENTORY";
        this.appendChild(this._title);

        let categoriesContainer: HTMLDivElement;
        categoriesContainer = document.createElement("div");
        this.appendChild(categoriesContainer);

        this._categoryBlocksBtn = document.createElement("div");
        this._categoryBlocksBtn.innerHTML = "BLOCKS";
        categoriesContainer.appendChild(this._categoryBlocksBtn);
        this._makeCategoryBtnStyle(this._categoryBlocksBtn);
        this._categoryBlocksBtn.onclick = () => {
            this.setCurrentCategory(InventoryCategory.Block);
        }
        
        this._categoryBricksBtn = document.createElement("div");
        this._categoryBricksBtn.innerHTML = "BRICKS";
        categoriesContainer.appendChild(this._categoryBricksBtn);
        this._makeCategoryBtnStyle(this._categoryBricksBtn);
        this._categoryBricksBtn.onclick = () => {
            this.setCurrentCategory(InventoryCategory.Brick);
        }
        
        this._categoryIngredientsBtn = document.createElement("div");
        this._categoryIngredientsBtn.innerHTML = "INGREDIENTS";
        categoriesContainer.appendChild(this._categoryIngredientsBtn);
        this._makeCategoryBtnStyle(this._categoryIngredientsBtn);
        this._categoryIngredientsBtn.onclick = () => {
            this.setCurrentCategory(InventoryCategory.Ingredient);
        }

        this._categoryBtns = [
            this._categoryBlocksBtn,
            this._categoryBricksBtn,
            this._categoryIngredientsBtn,
        ]

        this._containerFrame = document.createElement("div");
        this._containerFrame.classList.add("container-frame");
        this.appendChild(this._containerFrame);

        this._containers = [];
        for (let i = 0; i < InventoryCategory.End; i++) {
            this._containers[i] = document.createElement("div");
            this._containers[i].classList.add("container");
            this._containerFrame.appendChild(this._containers[i]);
        }

        let a = document.createElement("a");
        a.href = "#home";
        this.appendChild(a);

        this.setCurrentCategory(InventoryCategory.Block);
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
        for (let i = 0; i < this._containers.length; i++) {
            this._containers[i].innerHTML = "";
        }

        for (let i = 0; i < this.inventory.items.length; i++) {
            let inventoryItem = this.inventory.items[i];

            let line = document.createElement("div");
            line.classList.add("line");
            this._containers[inventoryItem.category].appendChild(line);
    
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