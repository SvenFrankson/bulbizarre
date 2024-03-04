class MainMenu extends HTMLElement implements IPage {

    public static get observedAttributes() {
        return [
            "file"
        ];
    }

    private _loaded: boolean = false;
    private _shown: boolean = false;
    private _animateShowInterval: number;

    public panels: MainMenuPanel[] = [];
    public xCount: number = 1;
    public yCount: number = 1;
    public animLineHeight: number = 2;

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
        let file = this.getAttribute("file");
        if (file) {
            this.attributeChangedCallback("file", "", file);
        }
    }

    public attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === "file") {
            if (this.isConnected) {
                const xhttp = new XMLHttpRequest();
                xhttp.onload = () => {
                    this.innerHTML = xhttp.responseText;
                    this.style.position = "fixed";
                    this.style.zIndex = "10";
                    this._shown = false;
                    this.resize();
                    this.hide(0);
                    this._loaded = true;
                    if (this._onLoad) {
                        this._onLoad();
                    }
                }
                xhttp.open("GET", newValue);
                xhttp.send();
            }
        }
    }

    public async show(duration: number = 1): Promise<void> {
        return new Promise<void>(resolve => {
            if (!this._shown) {
                clearInterval(this._animateShowInterval);
    
                this._shown = true;
                let outOfScreenLeft = 1.5 * Game.Instance.engine.getRenderWidth();
                for (let i = 0; i < this.panels.length; i++) {
                    let panel = this.panels[i];
                    let targetLeft = outOfScreenLeft;
                    if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                        targetLeft = - outOfScreenLeft;
                    }
                    panel.left = targetLeft + panel.computedLeft;
                    panel.style.display = "block";
                }
                let t0 = performance.now() / 1000;
                this._animateShowInterval = setInterval(() => {
                    let t = performance.now() / 1000 - t0;
                    if (t >= duration) {
                        clearInterval(this._animateShowInterval);
                        for (let i = 0; i < this.panels.length; i++) {
                            let panel = this.panels[i];
                            panel.left = panel.computedLeft;
                        }
                        resolve();
                    }
                    else {
                        let f = t / duration;
                        for (let i = 0; i < this.panels.length; i++) {
                            let panel = this.panels[i];
                            let targetLeft = outOfScreenLeft;
                            if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                                targetLeft = - outOfScreenLeft;
                            }
                            panel.left = (1 - f) * targetLeft + panel.computedLeft;
                        }
                    }
                }, 15);
            }
        });
    }

    public async hide(duration: number = 1): Promise<void> {
        if (duration === 0) {
            this._shown = false;
            let outOfScreenLeft = 1.5 * Game.Instance.engine.getRenderWidth();
            for (let i = 0; i < this.panels.length; i++) {
                let panel = this.panels[i];
                panel.left = outOfScreenLeft + panel.computedLeft;
                panel.style.display = "none";
            }
        }
        else {
            return new Promise<void>(resolve => {
                if (this._shown) {
                    clearInterval(this._animateShowInterval);
        
                    this._shown = false;
                    let outOfScreenLeft = 1.5 * Game.Instance.engine.getRenderWidth();
                    for (let i = 0; i < this.panels.length; i++) {
                        let panel = this.panels[i];
                        let targetLeft = outOfScreenLeft;
                        if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                            targetLeft = - outOfScreenLeft;
                        }
                        panel.left = targetLeft + panel.computedLeft;
                        panel.style.display = "block";
                    }
                    let t0 = performance.now() / 1000;
                    this._animateShowInterval = setInterval(() => {
                        let t = performance.now() / 1000 - t0;
                        if (t >= duration) {
                            clearInterval(this._animateShowInterval);
                            for (let i = 0; i < this.panels.length; i++) {
                                let panel = this.panels[i];
                                let targetLeft = outOfScreenLeft;
                                if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                                    targetLeft = - outOfScreenLeft;
                                }
                                panel.left = targetLeft + panel.computedLeft;
                                panel.style.display = "none";
                            }
                            resolve();
                        }
                        else {
                            let f = t / duration;
                            for (let i = 0; i < this.panels.length; i++) {
                                let panel = this.panels[i];
                                let targetLeft = outOfScreenLeft;
                                if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                                    targetLeft = - outOfScreenLeft;
                                }
                                panel.left = f * targetLeft + panel.computedLeft;
                            }
                        }
                    }, 15)
                }
            }); 
        }
    }

    public resize(): void {
        let requestedTileCount = 0;
        let requestedFullLines = 0;
        this.panels = [];
        let elements = this.querySelectorAll("menu-panel");
        for (let i = 0; i < elements.length; i++) {
            let panel = elements[i] as MainMenuPanel;
            this.panels[i] = panel;
            panel.w = parseInt(panel.getAttribute("w"));
            panel.h = parseInt(panel.getAttribute("h"));
            let area = panel.w * panel.h;
            requestedTileCount += area;
        }

        let rect = this.getBoundingClientRect();
        let containerW = rect.width;
        let containerH = rect.height;

        let kill = 0;
        let min = 0;
        let ok = false;
        let emptyLinesBottom = 0;
        while (!ok) {
            kill++;
            if (kill > 10) {
                return;
            }
            ok = true;
            min++;
            let bestValue: number = 0;
            for (let xC = min; xC <= 10; xC++) {
                for (let yC = min; yC <= 10; yC++) {
                    let count = xC * yC;
                    if (count >= requestedTileCount) {
                        let w = containerW / xC;
                        let h = containerH / (yC + requestedFullLines);
                        let area = w * h;
                        let squareness = Math.min(w / h, h / w);
                        let value = area * squareness;
                        if (value > bestValue) {
                            this.xCount = xC;
                            this.yCount = yC + requestedFullLines;
                            bestValue = value;
                        }
                    }
                }
            }

            let grid: boolean[][] = [];
            for (let y = 0; y <= this.yCount; y++) {
                grid[y] = [];
                for (let x = 0; x <= this.xCount; x++) {
                    grid[y][x] = (x < this.xCount && y < this.yCount);
                }
            }
            for (let n = 0; n < this.panels.length; n++) {
                let panel = this.panels[n] as MainMenuPanel;
                panel.x = -1;
                panel.y = -1;

                for (let line = 0; line < this.yCount && panel.x === -1; line++) {
                    for (let col = 0; col < this.xCount && panel.x === -1; col++) {
                        let fit = true;
                        for (let x = 0; x < panel.w; x++) {
                            for (let y = 0; y < panel.h; y++) {
                                fit = fit && grid[line + y][col + x];
                            }
                        }
                        if (fit) {
                            panel.x = col;
                            panel.y = line;
                            for (let x = 0; x < panel.w; x++) {
                                for (let y = 0; y < panel.h; y++) {
                                    grid[line + y][col + x] = false;
                                }
                            }
                        }
                    }
                }
                if (panel.x === -1) {
                    ok = false;
                }
            }
            if (ok) {
                let empty = true;
                emptyLinesBottom = 0;
                for (let y = this.yCount - 1; y > 0 && empty; y--) {
                    for (let x = 0; x < this.xCount && empty; x++) {
                        if (!grid[y][x]) {
                            empty = false;
                        }
                    }
                    if (empty) {
                        emptyLinesBottom++;
                    }
                }
            }
        }

        let tileW = containerW / this.xCount;
        let tileH = containerH / this.yCount;
        let m = Math.min(tileW, tileH) / 15;

        for (let i = 0; i < this.panels.length; i++) {
            let panel = this.panels[i];
            panel.style.display = "block";
            panel.style.width = (panel.w * tileW - 2 * m).toFixed(0) + "px";
            panel.style.height = (panel.h * tileH - 2 * m).toFixed(0) + "px";
            panel.style.position = "absolute";
            panel.computedLeft = (panel.x * tileW + m);
            if (panel.style.display != "none") {
                panel.style.left = panel.computedLeft.toFixed(0) + "px";
            }
            panel.computedTop = (panel.y * tileH + m + emptyLinesBottom * 0.5 * tileH);
            panel.style.top = panel.computedTop.toFixed(0) + "px";
            let label = (panel.querySelector(".label") as HTMLElement);
            if (label) {
                label.style.fontSize = (tileW / 4).toFixed(0) + "px";
            }
            let label2 = (panel.querySelector(".label-2") as HTMLElement);
            if (label2) {
                label2.style.fontSize = (tileW / 7).toFixed(0) + "px";
            }
        }
    }
}

customElements.define("menu-page", MainMenu);