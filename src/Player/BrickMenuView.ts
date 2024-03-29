class BrickMenuView extends HTMLElement implements Nabu.IPage {

    public static get observedAttributes() {
        return [];
    }

    private _loaded: boolean = false;
    private _shown: boolean = false;
    public get shown(): boolean {
        return this._shown;
    }

    private _brick: Brick;
    private _player: Player;
    private _title: HTMLHeadingElement;
    private _anchorBtn: HTMLButtonElement;
    private _copyBtn: HTMLButtonElement;
    private _copyColorBtn: HTMLButtonElement;
    private _cancelBtn: HTMLButtonElement;
    private _options: HTMLButtonElement[];

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

    public currentPointers: number = 0;
    public currentPointerUp(): void {
        if (this._options.length > 0) {
            this.setPointer((this.currentPointers - 1 + this._options.length) % this._options.length);
        }
    }
    public currentPointerDown(): void {
        if (this._options.length > 0) {
            this.setPointer((this.currentPointers + 1) % this._options.length);
        }
    }
    public setPointer(n: number): void {
        if (this._options[this.currentPointers]) {
            this._options[this.currentPointers].classList.remove("highlit");
        }
        this.currentPointers = n;
        if (this._options[this.currentPointers]) {
            this._options[this.currentPointers].classList.add("highlit");
        }
    }

    private _makeCategoryBtnStyle(btn: HTMLButtonElement): void {
        btn.style.fontSize = "min(2svh, 2vw)";
        btn.style.display = "block";
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

    private _makeCategoryBtnActive(btn: HTMLButtonElement): void {
        btn.style.borderLeft = "2px solid white";
        btn.style.borderTop = "2px solid white";
        btn.style.borderRight = "2px solid white";
        btn.style.color = "#272b2e";
        btn.style.backgroundColor = "white";
        btn.style.fontWeight = "bold";
    }

    private _makeCategoryBtnInactive(btn: HTMLButtonElement): void {
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
        this._title.classList.add("brick-menu-title");
        this._title.innerHTML = "BRICK";
        this.appendChild(this._title);

        let categoriesContainer: HTMLDivElement;
        categoriesContainer = document.createElement("div");
        this.appendChild(categoriesContainer);

        this._anchorBtn = document.createElement("button");
        this._anchorBtn.innerHTML = "ANCHOR";
        categoriesContainer.appendChild(this._anchorBtn);
        this._anchorBtn.onclick = () => {
            if (this._brick) {
                this._brick.root.anchored = !this._brick.root.anchored;
            }
            this._brick.brickManager.saveToLocalStorage();
            this.hide(0.1);
        }

        this._copyBtn = document.createElement("button");
        this._copyBtn.innerHTML = "COPY";
        categoriesContainer.appendChild(this._copyBtn);
        this._copyBtn.onclick = () => {
            this._player.currentAction = PlayerActionTemplate.CreateBrickAction(this._player, this._brick.index, this._brick.colorIndex);
            this.hide(0.1);
        }
        
        this._copyColorBtn = document.createElement("button");
        this._copyColorBtn.innerHTML = "COPY COLOR";
        categoriesContainer.appendChild(this._copyColorBtn);
        this._copyColorBtn.onclick = () => {
            
        }
        
        this._cancelBtn = document.createElement("button");
        this._cancelBtn.innerHTML = "CANCEL";
        categoriesContainer.appendChild(this._cancelBtn);
        this._cancelBtn.onclick = () => {
            this.hide(0.1);
        }

        this._options = [
            this._anchorBtn,
            this._copyBtn,
            this._copyColorBtn,
            this._cancelBtn,
        ]
    }

    public attributeChangedCallback(name: string, oldValue: string, newValue: string) {}

    public async show(duration: number = 1): Promise<void> {
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

    public setPlayer(player: Player): void {
        this._player = player;
    }

    public setBrick(brick: Brick): void {
        this._brick = brick;
    }

    private _timer: number = 0;
    public update(dt: number): void {
        if (this._timer > 0) {
            this._timer -= dt;
        }
        let gamepads = navigator.getGamepads();
        let gamepad = gamepads[0];
        if (gamepad) {
            let axis1 = - Nabu.InputManager.DeadZoneAxis(gamepad.axes[1]);
            if (axis1 > 0.5) {
                if (this._timer <= 0) {
                    this.currentPointerUp();
                    this._timer = 0.5;
                }
            }
            else if (axis1 < - 0.5) {
                if (this._timer <= 0) {
                    this.currentPointerDown();
                    this._timer = 0.5;
                }
            }
            else {
                this._timer = 0;
            }
        }
    }
}

customElements.define("brick-menu", BrickMenuView);
