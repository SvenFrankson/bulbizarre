class VoxelizerMenuView extends HTMLElement implements Nabu.IPage {

    public static get observedAttributes() {
        return [];
    }

    private _loaded: boolean = false;
    private _shown: boolean = false;
    public get shown(): boolean {
        return this._shown;
    }

    private _voxelizer: Voxelizer;
    private _player: Player;
    private _title: HTMLHeadingElement;
    private _urlInput: HTMLInputElement;
    private _posX: HTMLInputElement;
    private _posY: HTMLInputElement;
    private _posZ: HTMLInputElement;
    private _rotX: HTMLInputElement;
    private _rotY: HTMLInputElement;
    private _rotZ: HTMLInputElement;
    private _size: HTMLInputElement;
    private _goBtn: HTMLButtonElement;
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
        this._title.classList.add("voxelizer-menu-title");
        this._title.innerHTML = "VOXELIZER";
        this.appendChild(this._title);

        let categoriesContainer: HTMLDivElement;
        categoriesContainer = document.createElement("div");
        this.appendChild(categoriesContainer);

        this._urlInput = document.createElement("input");
        this._urlInput.setAttribute("type", "file");
        this._urlInput.addEventListener("input", (event: Event) => {
            let files = (event.target as HTMLInputElement).files;
            let file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.addEventListener('load', (event) => {
                    this._voxelizer.url = "data:" + (event.target.result as string);
                    this._voxelizer.initialize();
                });
                reader.readAsText(file);
            }
        });
        categoriesContainer.appendChild(this._urlInput);

        let divX = document.createElement("div");
        categoriesContainer.appendChild(divX);
        
        let posXLabel = document.createElement("label");
        posXLabel.setAttribute("for", "posX");
        posXLabel.innerHTML = "X";
        divX.appendChild(posXLabel);

        this._posX = document.createElement("input");
        this._posX.id = "posX";
        this._posX.setAttribute("type", "number");
        this._posX.setAttribute("step", "0.1");
        this._posX.addEventListener("input", (ev: Event) => {
            this._voxelizer.meshInner.position.x = parseFloat(this._posX.value);
        })
        divX.appendChild(this._posX);

        let divY = document.createElement("div");
        categoriesContainer.appendChild(divY);

        let posYLabel = document.createElement("label");
        posYLabel.setAttribute("for", "posY");
        posYLabel.innerHTML = "Y";
        divY.appendChild(posYLabel);

        this._posY = document.createElement("input");
        this._posY.id = "posY";
        this._posY.setAttribute("type", "number");
        this._posY.setAttribute("step", "0.1");
        this._posY.addEventListener("input", (ev: Event) => {
            this._voxelizer.meshInner.position.y = parseFloat(this._posY.value);
        })
        divY.appendChild(this._posY);

        let divZ = document.createElement("div");
        categoriesContainer.appendChild(divZ);

        let posZLabel = document.createElement("label");
        posZLabel.setAttribute("for", "posZ");
        posZLabel.innerHTML = "Z";
        divZ.appendChild(posZLabel);

        this._posZ = document.createElement("input");
        this._posZ.id = "posZ";
        this._posZ.setAttribute("type", "number");
        this._posZ.setAttribute("step", "0.1");
        this._posZ.addEventListener("input", (ev: Event) => {
            this._voxelizer.meshInner.position.z = parseFloat(this._posZ.value);
        })
        divZ.appendChild(this._posZ);

        let divRX = document.createElement("div");
        categoriesContainer.appendChild(divRX);

        let rotXLabel = document.createElement("label");
        rotXLabel.setAttribute("for", "rotX");
        rotXLabel.innerHTML = "RX";
        divRX.appendChild(rotXLabel);

        this._rotX = document.createElement("input");
        this._rotX.id = "rotX";
        this._rotX.setAttribute("type", "number");
        this._rotX.setAttribute("step", "0.05");
        this._rotX.addEventListener("input", (ev: Event) => {
            this._voxelizer.meshInner.rotation.x = parseFloat(this._rotX.value);
        })
        divRX.appendChild(this._rotX);

        let divRY = document.createElement("div");
        categoriesContainer.appendChild(divRY);

        let rotYLabel = document.createElement("label");
        rotYLabel.setAttribute("for", "rotY");
        rotYLabel.innerHTML = "RY";
        divRY.appendChild(rotYLabel);

        this._rotY = document.createElement("input");
        this._rotY.id = "rotY";
        this._rotY.setAttribute("type", "number");
        this._rotY.setAttribute("step", "0.05");
        this._rotY.addEventListener("input", (ev: Event) => {
            this._voxelizer.meshInner.rotation.y = parseFloat(this._rotY.value);
        })
        divRY.appendChild(this._rotY);

        let divRZ = document.createElement("div");
        categoriesContainer.appendChild(divRZ);

        let rotZLabel = document.createElement("label");
        rotZLabel.setAttribute("for", "rotZ");
        rotZLabel.innerHTML = "RZ";
        divRZ.appendChild(rotZLabel);

        this._rotZ = document.createElement("input");
        this._rotZ.id = "rotZ";
        this._rotZ.setAttribute("type", "number");
        this._rotZ.setAttribute("step", "0.05");
        this._rotZ.addEventListener("input", (ev: Event) => {
            this._voxelizer.meshInner.rotation.z = parseFloat(this._rotZ.value);
        })
        divRZ.appendChild(this._rotZ);

        let divSize = document.createElement("div");
        categoriesContainer.appendChild(divSize);

        let sizeLabel = document.createElement("label");
        sizeLabel.setAttribute("for", "size");
        sizeLabel.innerHTML = "Size";
        divSize.appendChild(sizeLabel);

        this._size = document.createElement("input");
        this._size.id = "size";
        this._size.setAttribute("type", "number");
        this._size.setAttribute("step", "0.5");
        this._size.addEventListener("input", (ev: Event) => {
            let s = parseFloat(this._size.value);
            this._voxelizer.meshInner.scaling.copyFromFloats(s, s, s);
        })
        divSize.appendChild(this._size);
        
        this._goBtn = document.createElement("button");
        this._goBtn.innerHTML = "GO";
        categoriesContainer.appendChild(this._goBtn);
        this._goBtn.onclick = () => {
            this._voxelizer.ploufRasterize();
            this.hide(0.1);
        }
        
        this._cancelBtn = document.createElement("button");
        this._cancelBtn.innerHTML = "CANCEL";
        categoriesContainer.appendChild(this._cancelBtn);
        this._cancelBtn.onclick = () => {
            this.hide(0.1);
        }

        this._options = [
            this._cancelBtn,
        ]
    }

    public attributeChangedCallback(name: string, oldValue: string, newValue: string) {}

    public onNextHide: () => void;

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
                            if (this.onNextHide) {
                                this.onNextHide();
                                this.onNextHide = undefined;
                            }
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

    public setVoxelizer(voxelizer: Voxelizer): void {
        this._voxelizer = voxelizer;
        this._posX.value = voxelizer.meshInner.position.x.toFixed(2);
        this._posY.value = voxelizer.meshInner.position.y.toFixed(2);
        this._posZ.value = voxelizer.meshInner.position.z.toFixed(2);
        this._rotX.value = voxelizer.meshInner.rotation.x.toFixed(2);
        this._rotY.value = voxelizer.meshInner.rotation.y.toFixed(2);
        this._rotZ.value = voxelizer.meshInner.rotation.z.toFixed(2);
        this._size.value = voxelizer.meshInner.scaling.x.toFixed(2);
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

customElements.define("voxelizer-menu", VoxelizerMenuView);
