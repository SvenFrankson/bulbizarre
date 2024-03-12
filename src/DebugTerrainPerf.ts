class DebugTerrainPerf {
    
    private _initialized: boolean = false;
    public get initialized(): boolean {
        return this._initialized;
    }

    public debugContainer: HTMLDivElement;
    public container: HTMLDivElement;

    private _frameRate: Nabu.DebugDisplayFrameValue;
    private _checkDuration: Nabu.DebugDisplayFrameValue;
    private _chunckBuildTimeMin: Nabu.DebugDisplayTextValue;
    private _chunckBuildTimeD1: Nabu.DebugDisplayTextValue;
    private _chunckBuildTimeQ1: Nabu.DebugDisplayTextValue;
    private _chunckBuildTimeMedian: Nabu.DebugDisplayTextValue;
    private _chunckBuildTimeQ3: Nabu.DebugDisplayTextValue;
    private _chunckBuildTimeD9: Nabu.DebugDisplayTextValue;
    private _chunckBuildTimeMax: Nabu.DebugDisplayTextValue;
    private _chunckBuildCountAvg: Nabu.DebugDisplayTextValue;
    private _meshesCount: Nabu.DebugDisplayTextValue;
    private _registeredChuncks: Nabu.DebugDisplayTextValue;

    public get scene(): BABYLON.Scene {
        return this.main.scene;
    }

    constructor(public main: Game, private _showLayer: boolean = false) {

    }

    public initialize(): void {
        this.debugContainer = document.querySelector("#debug-container");
        if (!this.debugContainer) {
            this.debugContainer = document.createElement("div");
            this.debugContainer.id = "debug-container";
            document.body.appendChild(this.debugContainer);
        }

        this.container = document.querySelector("#debug-terrain-perf");
        if (!this.container) {
            this.container = document.createElement("div");
            this.container.id = "debug-terrain-perf";
            this.container.classList.add("debug", "hidden");
            this.debugContainer.appendChild(this.container);
        }
        
        let frameRateId = "#frame-rate";
        this._frameRate = document.querySelector(frameRateId) as Nabu.DebugDisplayFrameValue;
        if (!this._frameRate) {
            this._frameRate = document.createElement("debug-display-frame-value") as Nabu.DebugDisplayFrameValue;
            this._frameRate.id = frameRateId;
            this._frameRate.setAttribute("label", "Frame Rate fps");
            this._frameRate.setAttribute("min", "0");
            this._frameRate.setAttribute("max", "60");
            this.container.appendChild(this._frameRate);
        }
        
        let checkDurationId = "#check-duration";
        this._checkDuration = document.querySelector(checkDurationId) as Nabu.DebugDisplayFrameValue;
        if (!this._checkDuration) {
            this._checkDuration = document.createElement("debug-display-frame-value") as Nabu.DebugDisplayFrameValue;
            this._checkDuration.id = checkDurationId;
            this._checkDuration.setAttribute("label", "Check Duration");
            this._checkDuration.setAttribute("min", "0");
            this._checkDuration.setAttribute("max", "30");
            this.container.appendChild(this._checkDuration);
        }

        let chunckBuildTimeMinId = "#chunck-build-time-min";
        this._chunckBuildTimeMin = document.querySelector(chunckBuildTimeMinId) as Nabu.DebugDisplayTextValue;
        if (!this._chunckBuildTimeMin) {
            this._chunckBuildTimeMin = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._chunckBuildTimeMin.id = chunckBuildTimeMinId;
            this._chunckBuildTimeMin.setAttribute("label", "Build Time (MIN)");
            this.container.appendChild(this._chunckBuildTimeMin);
        }

        let chunckBuildTimeD1Id = "#chunck-build-time-d1";
        this._chunckBuildTimeD1 = document.querySelector(chunckBuildTimeD1Id) as Nabu.DebugDisplayTextValue;
        if (!this._chunckBuildTimeD1) {
            this._chunckBuildTimeD1 = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._chunckBuildTimeD1.id = chunckBuildTimeD1Id;
            this._chunckBuildTimeD1.setAttribute("label", "Build Time  (D1)");
            this.container.appendChild(this._chunckBuildTimeD1);
        }

        let chunckBuildTimeQ1Id = "#chunck-build-time-q1";
        this._chunckBuildTimeQ1 = document.querySelector(chunckBuildTimeQ1Id) as Nabu.DebugDisplayTextValue;
        if (!this._chunckBuildTimeQ1) {
            this._chunckBuildTimeQ1 = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._chunckBuildTimeQ1.id = chunckBuildTimeQ1Id;
            this._chunckBuildTimeQ1.setAttribute("label", "Build Time  (Q1)");
            this.container.appendChild(this._chunckBuildTimeQ1);
        }

        let chunckBuildTimeMedianId = "#chunck-build-time-median";
        this._chunckBuildTimeMedian = document.querySelector(chunckBuildTimeMedianId) as Nabu.DebugDisplayTextValue;
        if (!this._chunckBuildTimeMedian) {
            this._chunckBuildTimeMedian = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._chunckBuildTimeMedian.id = chunckBuildTimeMedianId;
            this._chunckBuildTimeMedian.setAttribute("label", "Build Time  (Q2)");
            this.container.appendChild(this._chunckBuildTimeMedian);
        }

        let chunckBuildTimeQ3Id = "#chunck-build-time-q3";
        this._chunckBuildTimeQ3 = document.querySelector(chunckBuildTimeQ3Id) as Nabu.DebugDisplayTextValue;
        if (!this._chunckBuildTimeQ3) {
            this._chunckBuildTimeQ3 = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._chunckBuildTimeQ3.id = chunckBuildTimeQ3Id;
            this._chunckBuildTimeQ3.setAttribute("label", "Build Time  (Q3)");
            this.container.appendChild(this._chunckBuildTimeQ3);
        }

        let chunckBuildTimeD9Id = "#chunck-build-time-d9";
        this._chunckBuildTimeD9 = document.querySelector(chunckBuildTimeD9Id) as Nabu.DebugDisplayTextValue;
        if (!this._chunckBuildTimeD9) {
            this._chunckBuildTimeD9 = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._chunckBuildTimeD9.id = chunckBuildTimeD9Id;
            this._chunckBuildTimeD9.setAttribute("label", "Build Time  (D9)");
            this.container.appendChild(this._chunckBuildTimeD9);
        }

        let chunckBuildTimeMaxId = "#chunck-build-time-max";
        this._chunckBuildTimeMax = document.querySelector(chunckBuildTimeMaxId) as Nabu.DebugDisplayTextValue;
        if (!this._chunckBuildTimeMax) {
            this._chunckBuildTimeMax = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._chunckBuildTimeMax.id = chunckBuildTimeMaxId;
            this._chunckBuildTimeMax.setAttribute("label", "Build Time (MAX)");
            this.container.appendChild(this._chunckBuildTimeMax);
        }

        let chunckBuildCountAvgId = "#chunck-build-count-avg";
        this._chunckBuildCountAvg = document.querySelector(chunckBuildCountAvgId) as Nabu.DebugDisplayTextValue;
        if (!this._chunckBuildCountAvg) {
            this._chunckBuildCountAvg = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._chunckBuildCountAvg.id = chunckBuildCountAvgId;
            this._chunckBuildCountAvg.setAttribute("label", "Build Count (AVG)");
            this.container.appendChild(this._chunckBuildCountAvg);
        }

        let meshesCountId = "#meshes-count";
        this._meshesCount = document.querySelector(meshesCountId) as Nabu.DebugDisplayTextValue;
        if (!this._meshesCount) {
            this._meshesCount = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._meshesCount.id = meshesCountId;
            this._meshesCount.setAttribute("label", "Meshes Count");
            this.container.appendChild(this._meshesCount);
        }

        let registeredChuncksId = "#registered-chuncks-count";
        this._registeredChuncks = document.querySelector(registeredChuncksId) as Nabu.DebugDisplayTextValue;
        if (!this._registeredChuncks) {
            this._registeredChuncks = document.createElement("debug-display-text-value") as Nabu.DebugDisplayTextValue;
            this._registeredChuncks.id = registeredChuncksId;
            this._registeredChuncks.setAttribute("label", "Registered Chuncks");
            this.container.appendChild(this._registeredChuncks);
        }

        this._initialized = true;
    }

    private _lastT: number;
    private _update = () => {
        let currT = performance.now();
        let dt = currT - this._lastT;
        this._lastT = currT;
        if (isNaN(dt)) {
            dt = 1000;
        }
        dt = dt / 1000;
        let fps = 1 / dt;
		this._frameRate.addValue(fps);
        if (this.main.terrain) {
            if (this.main.terrain.chunckManager) {
                this._checkDuration.addValue(this.main.terrain.chunckManager.checkDuration);
                this._registeredChuncks.setText(this.main.terrain.chunckManager.chuncks.length.toFixed(0));
            }
            this._chunckBuildTimeMin.setText(this.main.terrain.analytic.getChunckBuildTimeQuantile(0).toFixed(1) + " ms");
            this._chunckBuildTimeD1.setText(this.main.terrain.analytic.getChunckBuildTimeQuantile(0.1).toFixed(1) + " ms");
            this._chunckBuildTimeQ1.setText(this.main.terrain.analytic.getChunckBuildTimeQuantile(0.25).toFixed(1) + " ms");
            this._chunckBuildTimeMedian.setText(this.main.terrain.analytic.getChunckBuildTimeQuantile(0.5).toFixed(1) + " ms");
            this._chunckBuildTimeQ3.setText(this.main.terrain.analytic.getChunckBuildTimeQuantile(0.75).toFixed(1) + " ms");
            this._chunckBuildTimeD9.setText(this.main.terrain.analytic.getChunckBuildTimeQuantile(0.9).toFixed(1) + " ms");
            this._chunckBuildTimeMax.setText(this.main.terrain.analytic.getChunckBuildTimeQuantile(1).toFixed(1) + " ms");
            this._chunckBuildCountAvg.setText(this.main.terrain.analytic.getChunckBuildCountAverage().toFixed(2));
        }
        this._meshesCount.setText(this.main.scene.meshes.length.toFixed(0));
    }

    public show(): void {
        if (!this.initialized) {
            this.initialize();
        }
        this.container.classList.remove("hidden");
        this.scene.onBeforeRenderObservable.add(this._update);
    }

    public hide(): void {
        this.container.classList.add("hidden");
        this.scene.onBeforeRenderObservable.removeCallback(this._update);
    }
}