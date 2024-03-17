class Arrow extends BABYLON.Mesh {
    constructor(propEditor, name, game, baseSize = 0.1, dir) {
        super(name);
        this.propEditor = propEditor;
        this.game = game;
        this.baseSize = baseSize;
        this.dir = dir;
        this._update = () => {
        };
        this.initPos = BABYLON.Vector3.Zero();
        this.onPointerDown = () => {
            let axis = this.game.arcCamera.getDirection(BABYLON.Axis.Z);
            Mummu.GetClosestAxisToRef(axis, axis);
            axis.scaleInPlace(-1);
            if (Math.abs(BABYLON.Vector3.Dot(this.dir, axis)) > 0.9) {
                axis = this.game.arcCamera.getDirection(BABYLON.Axis.Y);
            }
            console.log(this.dir.toString() + " " + axis.toString());
            Mummu.QuaternionFromZYAxisToRef(this.dir, axis, this.propEditor.gridMesh.rotationQuaternion);
            this.propEditor.gridMesh.position.copyFrom(this.absolutePosition);
            this.propEditor.gridMesh.computeWorldMatrix(true);
            this.game.arcCamera.detachControl();
            this.initPos.copyFrom(this.position);
        };
        this.onPointerMove = () => {
            let pick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                return mesh === this.propEditor.gridMesh;
            });
            if (pick.hit) {
                this.onMove(pick.pickedPoint.subtract(this.initPos), pick.pickedPoint);
            }
        };
        this.onMove = (delta, pos) => { };
        this.onPointerUp = () => {
            let pick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                return mesh === this.propEditor.gridMesh;
            });
            if (pick.hit) {
                this.onEndMove(pick.pickedPoint.subtract(this.initPos));
            }
        };
        this.onEndMove = (delta) => { };
        let matCursor = new BABYLON.StandardMaterial("arrow-material");
        matCursor.diffuseColor.copyFromFloats(0, 1, 1);
        matCursor.specularColor.copyFromFloats(0, 0, 0);
        matCursor.alpha = 0.2;
        matCursor.freeze();
        this.material = matCursor;
        this.scaling.copyFromFloats(this.baseSize, this.baseSize, this.baseSize);
        if (this.dir) {
            this.rotationQuaternion = BABYLON.Quaternion.Identity();
        }
    }
    get size() {
        return this.scaling.x / this.baseSize;
    }
    set size(v) {
        let s = v * this.baseSize;
        this.scaling.copyFromFloats(s, s, s);
    }
    async instantiate() {
        Mummu.CreateBeveledBoxVertexData({ size: 1 }).applyToMesh(this);
        this.layerMask = 0x10000000;
        //this.game.scene.onBeforeRenderObservable.add(this._update);
    }
    highlight() {
        this.renderOutline = true;
        this.outlineColor = BABYLON.Color3.White();
        this.outlineWidth = 0.05 * this.size;
    }
    unlit() {
        this.renderOutline = false;
    }
    dispose() {
        super.dispose();
        //this.game.scene.onBeforeRenderObservable.removeCallback(this._update);
    }
}
class DebugTerrainPerf {
    constructor(main, _showLayer = false) {
        this.main = main;
        this._showLayer = _showLayer;
        this._initialized = false;
        this._update = () => {
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
        };
    }
    get initialized() {
        return this._initialized;
    }
    get scene() {
        return this.main.scene;
    }
    initialize() {
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
        this._frameRate = document.querySelector(frameRateId);
        if (!this._frameRate) {
            this._frameRate = document.createElement("debug-display-frame-value");
            this._frameRate.id = frameRateId;
            this._frameRate.setAttribute("label", "Frame Rate fps");
            this._frameRate.setAttribute("min", "0");
            this._frameRate.setAttribute("max", "60");
            this.container.appendChild(this._frameRate);
        }
        let checkDurationId = "#check-duration";
        this._checkDuration = document.querySelector(checkDurationId);
        if (!this._checkDuration) {
            this._checkDuration = document.createElement("debug-display-frame-value");
            this._checkDuration.id = checkDurationId;
            this._checkDuration.setAttribute("label", "Check Duration");
            this._checkDuration.setAttribute("min", "0");
            this._checkDuration.setAttribute("max", "30");
            this.container.appendChild(this._checkDuration);
        }
        let chunckBuildTimeMinId = "#chunck-build-time-min";
        this._chunckBuildTimeMin = document.querySelector(chunckBuildTimeMinId);
        if (!this._chunckBuildTimeMin) {
            this._chunckBuildTimeMin = document.createElement("debug-display-text-value");
            this._chunckBuildTimeMin.id = chunckBuildTimeMinId;
            this._chunckBuildTimeMin.setAttribute("label", "Build Time (MIN)");
            this.container.appendChild(this._chunckBuildTimeMin);
        }
        let chunckBuildTimeD1Id = "#chunck-build-time-d1";
        this._chunckBuildTimeD1 = document.querySelector(chunckBuildTimeD1Id);
        if (!this._chunckBuildTimeD1) {
            this._chunckBuildTimeD1 = document.createElement("debug-display-text-value");
            this._chunckBuildTimeD1.id = chunckBuildTimeD1Id;
            this._chunckBuildTimeD1.setAttribute("label", "Build Time  (D1)");
            this.container.appendChild(this._chunckBuildTimeD1);
        }
        let chunckBuildTimeQ1Id = "#chunck-build-time-q1";
        this._chunckBuildTimeQ1 = document.querySelector(chunckBuildTimeQ1Id);
        if (!this._chunckBuildTimeQ1) {
            this._chunckBuildTimeQ1 = document.createElement("debug-display-text-value");
            this._chunckBuildTimeQ1.id = chunckBuildTimeQ1Id;
            this._chunckBuildTimeQ1.setAttribute("label", "Build Time  (Q1)");
            this.container.appendChild(this._chunckBuildTimeQ1);
        }
        let chunckBuildTimeMedianId = "#chunck-build-time-median";
        this._chunckBuildTimeMedian = document.querySelector(chunckBuildTimeMedianId);
        if (!this._chunckBuildTimeMedian) {
            this._chunckBuildTimeMedian = document.createElement("debug-display-text-value");
            this._chunckBuildTimeMedian.id = chunckBuildTimeMedianId;
            this._chunckBuildTimeMedian.setAttribute("label", "Build Time  (Q2)");
            this.container.appendChild(this._chunckBuildTimeMedian);
        }
        let chunckBuildTimeQ3Id = "#chunck-build-time-q3";
        this._chunckBuildTimeQ3 = document.querySelector(chunckBuildTimeQ3Id);
        if (!this._chunckBuildTimeQ3) {
            this._chunckBuildTimeQ3 = document.createElement("debug-display-text-value");
            this._chunckBuildTimeQ3.id = chunckBuildTimeQ3Id;
            this._chunckBuildTimeQ3.setAttribute("label", "Build Time  (Q3)");
            this.container.appendChild(this._chunckBuildTimeQ3);
        }
        let chunckBuildTimeD9Id = "#chunck-build-time-d9";
        this._chunckBuildTimeD9 = document.querySelector(chunckBuildTimeD9Id);
        if (!this._chunckBuildTimeD9) {
            this._chunckBuildTimeD9 = document.createElement("debug-display-text-value");
            this._chunckBuildTimeD9.id = chunckBuildTimeD9Id;
            this._chunckBuildTimeD9.setAttribute("label", "Build Time  (D9)");
            this.container.appendChild(this._chunckBuildTimeD9);
        }
        let chunckBuildTimeMaxId = "#chunck-build-time-max";
        this._chunckBuildTimeMax = document.querySelector(chunckBuildTimeMaxId);
        if (!this._chunckBuildTimeMax) {
            this._chunckBuildTimeMax = document.createElement("debug-display-text-value");
            this._chunckBuildTimeMax.id = chunckBuildTimeMaxId;
            this._chunckBuildTimeMax.setAttribute("label", "Build Time (MAX)");
            this.container.appendChild(this._chunckBuildTimeMax);
        }
        let chunckBuildCountAvgId = "#chunck-build-count-avg";
        this._chunckBuildCountAvg = document.querySelector(chunckBuildCountAvgId);
        if (!this._chunckBuildCountAvg) {
            this._chunckBuildCountAvg = document.createElement("debug-display-text-value");
            this._chunckBuildCountAvg.id = chunckBuildCountAvgId;
            this._chunckBuildCountAvg.setAttribute("label", "Build Count (AVG)");
            this.container.appendChild(this._chunckBuildCountAvg);
        }
        let meshesCountId = "#meshes-count";
        this._meshesCount = document.querySelector(meshesCountId);
        if (!this._meshesCount) {
            this._meshesCount = document.createElement("debug-display-text-value");
            this._meshesCount.id = meshesCountId;
            this._meshesCount.setAttribute("label", "Meshes Count");
            this.container.appendChild(this._meshesCount);
        }
        let registeredChuncksId = "#registered-chuncks-count";
        this._registeredChuncks = document.querySelector(registeredChuncksId);
        if (!this._registeredChuncks) {
            this._registeredChuncks = document.createElement("debug-display-text-value");
            this._registeredChuncks.id = registeredChuncksId;
            this._registeredChuncks.setAttribute("label", "Registered Chuncks");
            this.container.appendChild(this._registeredChuncks);
        }
        this._initialized = true;
    }
    show() {
        if (!this.initialized) {
            this.initialize();
        }
        this.container.classList.remove("hidden");
        this.scene.onBeforeRenderObservable.add(this._update);
    }
    hide() {
        this.container.classList.add("hidden");
        this.scene.onBeforeRenderObservable.removeCallback(this._update);
    }
}
class GameConfiguration extends Nabu.Configuration {
    constructor(configName, game) {
        super(configName);
        this.game = game;
    }
    _buildElementsArray() {
        this.configurationElements = [
            new Nabu.ConfigurationElement("quality", Nabu.ConfigurationElementType.Enum, 0, {
                displayName: "Graphic Quality",
                min: 0,
                max: 2,
                toString: (v) => {
                    if (v === 0) {
                        return "LOW";
                    }
                    if (v === 1) {
                        return "MEDIUM";
                    }
                    if (v === 2) {
                        return "HIGH";
                    }
                }
            }),
            new Nabu.ConfigurationElement("renderDist", Nabu.ConfigurationElementType.Number, 0, {
                displayName: "Render Distance",
                min: 1,
                max: 15,
                toString: (v) => {
                    return v.toFixed(0);
                }
            }, (newValue) => {
                this.game.terrain.chunckManager.setDistance(newValue * this.game.terrain.chunckLengthIJ);
            }),
            new Nabu.ConfigurationElement("godMode", Nabu.ConfigurationElementType.Boolean, 0, {
                displayName: "God Mode"
            }, (newValue) => {
                if (newValue === 1) {
                    this.game.freeCamera.speed = 1;
                }
                else {
                    this.game.freeCamera.speed = 0.2;
                }
            }),
            new Nabu.ConfigurationElement("showRenderDistDebug", Nabu.ConfigurationElementType.Boolean, 0, {
                displayName: "Show Render Distance Debug"
            }, (newValue) => {
                if (newValue === 1) {
                    this.game.terrain.chunckManager.setShowDebugRenderDist(true);
                }
                else {
                    this.game.terrain.chunckManager.setShowDebugRenderDist(false);
                }
            })
        ];
    }
    getValue(property) {
        let configElement = this.configurationElements.find(e => { return e.property === property; });
        if (configElement) {
            return configElement.value;
        }
    }
}
/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/nabu/nabu.d.ts"/>
/// <reference path="../lib/mummu/mummu.d.ts"/>
/// <reference path="../lib/kulla-grid/kulla-grid.d.ts"/>
var Kulla = KullaGrid;
function addLine(text) {
    let e = document.createElement("div");
    e.classList.add("debug-log");
    e.innerText = text;
    document.body.appendChild(e);
}
class Game {
    constructor(canvasElement) {
        this.DEBUG_MODE = true;
        this.screenRatio = 1;
        Game.Instance = this;
        this.canvas = document.getElementById(canvasElement);
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.msRequestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
        this.engine = new BABYLON.Engine(this.canvas, true);
        BABYLON.Engine.ShadersRepository = "./shaders/";
    }
    getScene() {
        return this.scene;
    }
    async createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.configuration = new GameConfiguration("my-test-configuration", this);
        this.configuration.initialize();
        this.configuration.saveToLocalStorage();
        this.screenRatio = this.engine.getRenderWidth() / this.engine.getRenderHeight();
        this.vertexDataLoader = new Mummu.VertexDataLoader(this.scene);
        if (this.DEBUG_MODE) {
            this.scene.clearColor = BABYLON.Color4.FromHexString("#87CEEBFF");
        }
        else {
            this.scene.clearColor = BABYLON.Color4.FromHexString("#87CEEBFF");
        }
        this.light = new BABYLON.HemisphericLight("light", (new BABYLON.Vector3(2, 3, -2.5)).normalize(), this.scene);
        /*
        this.skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 / Math.sqrt(3) }, this.scene);
        let skyboxMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        let skyTexture = new BABYLON.CubeTexture(
            "./datas/skyboxes/skybox",
            this.scene,
            ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"]);
        skyboxMaterial.reflectionTexture = skyTexture;
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
        this.skybox.rotation.y = 0.16 * Math.PI;
        */
        this.freeCamera = new BABYLON.FreeCamera("camera", BABYLON.Vector3.Zero());
        this.freeCamera.speed = 0.2;
        let godMode = this.configuration.getValue("godMode");
        if (godMode === 1) {
            this.freeCamera.speed = 1;
        }
        this.freeCamera.minZ = 0.1;
        this.arcCamera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 3, 20, new BABYLON.Vector3(0, 10, 0));
        this.arcCamera.speed = 0.2;
        this.arcCamera.minZ = 0.1;
        this.uiCamera = new BABYLON.FreeCamera("background-camera", BABYLON.Vector3.Zero());
        this.uiCamera.parent = this.freeCamera;
        this.uiCamera.layerMask = 0x10000000;
        this.scene.activeCameras = [this.freeCamera, this.uiCamera];
        if (this.DEBUG_MODE) {
            if (window.localStorage.getItem("camera-position")) {
                let positionItem = JSON.parse(window.localStorage.getItem("camera-position"));
                let position = new BABYLON.Vector3(positionItem.x, positionItem.y, positionItem.z);
                this.freeCamera.position = position;
            }
            if (window.localStorage.getItem("camera-rotation")) {
                let rotationItem = JSON.parse(window.localStorage.getItem("camera-rotation"));
                let rotation = new BABYLON.Vector3(rotationItem.x, rotationItem.y, rotationItem.z);
                this.freeCamera.rotation = rotation;
            }
        }
        this.router = new GameRouter(this);
        this.propEditor = new PropEditor(this);
        Kulla.ChunckVertexData.InitializeData("./datas/meshes/chunck-parts.babylon").then(async () => {
            this.router.initialize();
            this.router.optionPage.setConfiguration(this.configuration);
            /*
            let masterSeed = MasterSeed.GetFor("Paulita");

            let seededMap = SeededMap.CreateFromMasterSeed(masterSeed, 4, 512);
            let terrainMap = new TerrainMapGenerator(seededMap, 2000);
            */
            /*
            await terrainMap.downloadAsPNG(0, 0, 2, 0);
            await terrainMap.downloadAsPNG(0, 0, 2, 1);
            await terrainMap.downloadAsPNG(0, 0, 2, 2);
            */
            /*
            let sorted = new Uint8ClampedArray(masterSeed).sort((a, b) => { return a - b; });
            console.log("#0 " + sorted[0]);
            for (let d = 10; d < 100; d += 10) {
                console.log("#" + d.toFixed(0) + " " + (sorted[Math.floor(d / 100 * L)] / 255 * 100).toFixed(2));
            }
            console.log("#100 " + sorted[L - 1]);
            console.log(masterSeed);
            */
            /*
            setInterval(() => {
                let p = new BABYLON.Vector3(- 1 + 2 * Math.random(), Math.random() * 0.5, - 1 + 2 * Math.random());
                p.normalize().scaleInPlace(24 + 4 * Math.random());
                let ijk = this.terrain.getChunckAndIJKAtPos(p, 0);
                if (ijk && ijk.chunck) {
                    this.terrainEditor.doAction(ijk.chunck, ijk.ijk, {
                        brushSize: 2,
                        brushBlock: Kulla.BlockType.Dirt,
                        mode: Kulla.TerrainEditionMode.Add
                    })
                }
            }, 50);
            */
            /*
            let debugTerrainPerf = new DebugTerrainPerf(this);
            debugTerrainPerf.show();
            */
            window.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    var a = document.createElement("a");
                    a.setAttribute("href", "#home");
                    a.style.display = "none";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            });
        });
    }
    animate() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.update();
            //this.camera.rotation.y += 0.2 * Math.PI * 0.015;
        });
        window.onresize = () => {
            this.screenRatio = this.engine.getRenderWidth() / this.engine.getRenderHeight();
            this.engine.resize();
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.screenRatio = this.engine.getRenderWidth() / this.engine.getRenderHeight();
                    this.engine.resize();
                });
            });
        };
    }
    async initialize() {
    }
    update() {
        let dt = this.scene.deltaTime / 1000;
        if (this.DEBUG_MODE) {
            let camPos = this.freeCamera.position;
            let camRot = this.freeCamera.rotation;
            window.localStorage.setItem("camera-position", JSON.stringify({ x: camPos.x, y: camPos.y, z: camPos.z }));
            window.localStorage.setItem("camera-rotation", JSON.stringify({ x: camRot.x, y: camRot.y, z: camRot.z }));
        }
    }
    generateTerrainLarge() {
        if (this.terrain) {
            this.terrain.dispose();
        }
        this.uiCamera.parent = this.freeCamera;
        this.arcCamera.detachControl();
        this.scene.activeCameras = [this.freeCamera, this.uiCamera];
        this.freeCamera.attachControl();
        this.terrain = new Kulla.Terrain({
            scene: this.scene,
            generatorProps: {
                type: Kulla.GeneratorType.Map
            },
            /*
            generatorProps: {
                type: Kulla.GeneratorType.PNG,
                url: "./datas/textures/test_terrain.png",
                squareSize: 2
            },
            */
            maxDisplayedLevel: 0,
            blockSizeIJ_m: 1,
            blockSizeK_m: 1,
            chunckLengthIJ: 24,
            chunckLengthK: 256,
            chunckCountIJ: 64,
            useAnalytics: true
        });
        let mat = new TerrainMaterial("terrain", this.scene);
        this.terrain.materials = [mat];
        mat.freeze();
        this.terrain.initialize();
        this.configuration.getElement("renderDist").forceInit();
        this.configuration.getElement("showRenderDistDebug").forceInit();
        this.terrainEditor = new Kulla.TerrainEditor(this.terrain);
    }
    generateTerrainSmall() {
        if (this.terrain) {
            this.terrain.dispose();
        }
        this.uiCamera.parent = this.arcCamera;
        this.freeCamera.detachControl();
        this.scene.activeCameras = [this.arcCamera, this.uiCamera];
        this.arcCamera.attachControl();
        this.terrain = new Kulla.Terrain({
            scene: this.scene,
            generatorProps: {
                type: Kulla.GeneratorType.Flat,
                altitude: 10,
                blockType: Kulla.BlockType.Grass
            },
            maxDisplayedLevel: 0,
            blockSizeIJ_m: 1,
            blockSizeK_m: 1,
            chunckLengthIJ: 24,
            chunckLengthK: 256,
            chunckCountIJ: 2,
            useAnalytics: true
        });
        let mat = new TerrainMaterial("terrain", this.scene);
        this.terrain.materials = [mat];
        mat.freeze();
        this.terrain.initialize();
        let prop = new KullaGrid.RawCoumpoundProp();
        prop.shapes = [new KullaGrid.RawShapeBox(3, 3, 3, -1, -1, 2), new KullaGrid.RawShapeBox(1, 5, 1, 0, 0, 5)];
        prop.blocks = [Kulla.BlockType.Basalt, Kulla.BlockType.Basalt];
        if (this.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
            this.terrain.chunckDataGenerator.prop = prop;
        }
        this.configuration.getElement("renderDist").forceInit();
        this.configuration.getElement("showRenderDistDebug").forceInit();
        this.terrainEditor = new Kulla.TerrainEditor(this.terrain);
    }
}
window.addEventListener("DOMContentLoaded", () => {
    //addLine("Kulla Test Scene");
    let main = new Game("render-canvas");
    main.createScene();
    main.initialize().then(() => {
        main.animate();
    });
});
class PropShapeMesh extends BABYLON.Mesh {
    constructor(propEditor, shape, color) {
        super("prop-shape-mesh");
        this.propEditor = propEditor;
        this.shape = shape;
        if (shape instanceof Kulla.RawShapeBox) {
            this.childMesh = Mummu.CreateBeveledBox("box", {
                width: shape.w + 0.1,
                height: shape.h + 0.1,
                depth: shape.d + 0.1,
                flat: true,
                color: color
            });
            this.childMesh.position.copyFromFloats(shape.w * 0.5, shape.h * 0.5, shape.d * 0.5);
            this.childMesh.material = this.propEditor.propShapeMaterial;
            this.childMesh.parent = this;
        }
        this.updatePosition();
        this.updateVisibility();
    }
    select() {
        this.childMesh.material = this.propEditor.propShapeMaterialSelected;
    }
    unselect() {
        this.childMesh.material = this.propEditor.propShapeMaterial;
    }
    updatePosition() {
        this.position.x = this.shape.pi;
        this.position.z = this.shape.pj;
        this.position.y = this.shape.pk + this.propEditor.alt;
        this.computeWorldMatrix(true);
        this.childMesh.computeWorldMatrix(true);
    }
    updateShape() {
        if (this.shape instanceof Kulla.RawShapeBox) {
            let data = Mummu.CreateBeveledBoxVertexData({
                width: this.shape.w + 0.1,
                height: this.shape.h + 0.1,
                depth: this.shape.d + 0.1,
                flat: true
            });
            data.applyToMesh(this.childMesh);
            this.childMesh.position.copyFromFloats(this.shape.w * 0.5, this.shape.h * 0.5, this.shape.d * 0.5);
        }
    }
    updateVisibility() {
        this.childMesh.isVisible = this.propEditor.showSelectors;
    }
}
var CursorMode;
(function (CursorMode) {
    CursorMode[CursorMode["Select"] = 0] = "Select";
    CursorMode[CursorMode["Box"] = 1] = "Box";
    CursorMode[CursorMode["Sphere"] = 2] = "Sphere";
    CursorMode[CursorMode["Dot"] = 3] = "Dot";
})(CursorMode || (CursorMode = {}));
class PropEditor {
    constructor(game) {
        this.game = game;
        this.showSelectors = true;
        this.propShapeMeshes = [];
        this.currentBlockType = Kulla.BlockType.Grass;
        this._cursorMode = CursorMode.Select;
        this._draggedOffset = BABYLON.Vector3.Zero();
        this._pointerDownX = 0;
        this._pointerDownY = 0;
        this.onPointerDown = () => {
            this._pointerDownX = this.game.scene.pointerX;
            this._pointerDownY = this.game.scene.pointerY;
            if (this._cursorMode === CursorMode.Select) {
                let pick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                    return mesh instanceof Arrow;
                });
                if (!pick.hit) {
                    pick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                        return mesh && mesh.parent instanceof PropShapeMesh;
                    });
                }
                console.log(pick.pickedMesh);
                if (pick.hit && pick.pickedMesh instanceof Arrow) {
                    this.setDraggedPropShape(pick.pickedMesh);
                    this._draggedOffset.copyFromFloats(0, 0, 0);
                }
                else if (pick.hit && pick.pickedMesh.parent === this._selectedPropShape) {
                    this.setDraggedPropShape(this._selectedPropShape);
                    let p = new BABYLON.Vector3(this._selectedPropShape.shape.pi, this._selectedPropShape.shape.pk + this.alt, this._selectedPropShape.shape.pj).addInPlaceFromFloats(0.5, 0.5, 0.5);
                    let gridPick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                        return mesh === this.gridMesh;
                    });
                    if (gridPick.hit) {
                        this._draggedOffset.copyFrom(gridPick.pickedPoint).subtractInPlace(p);
                    }
                    else {
                        this._draggedOffset.copyFromFloats(0, 0, 0);
                    }
                }
                else {
                    this.setDraggedPropShape(undefined);
                }
            }
        };
        this.onPointerMove = () => {
            if (this._cursorMode === CursorMode.Select) {
                if (this._draggedPropShape instanceof PropShapeMesh) {
                    let pick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                        return mesh === this.gridMesh;
                    });
                    if (pick.hit) {
                        let p = pick.pickedPoint.subtract(this._draggedOffset);
                        let i = Math.floor(p.x);
                        let j = Math.floor(p.z);
                        let k = Math.floor(p.y - this.alt);
                        let di = i - this._draggedPropShape.shape.pi;
                        let dj = j - this._draggedPropShape.shape.pj;
                        let dk = k - this._draggedPropShape.shape.pk;
                        this.onMove(di, dj, dk);
                    }
                }
                else if (this._draggedPropShape instanceof Arrow) {
                    this._draggedPropShape.onPointerMove();
                }
            }
            else {
                let pick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                    return mesh && mesh.parent instanceof PropShapeMesh;
                });
                if (pick.hit) {
                    let p = pick.pickedPoint.add(pick.getNormal(true).scale(0.5));
                    let i = Math.floor(p.x);
                    let j = Math.floor(p.z);
                    let k = Math.floor(p.y - this.alt);
                    this._cursorMesh.position.copyFromFloats(i, k + this.alt, j).addInPlaceFromFloats(0.5, 0.5, 0.5);
                }
            }
        };
        this.onPointerUp = () => {
            if (this._draggedPropShape instanceof Arrow) {
                this._draggedPropShape.onPointerUp();
                this.setDraggedPropShape(undefined);
                return;
            }
            let dX = this._pointerDownX - this.game.scene.pointerX;
            let dY = this._pointerDownY - this.game.scene.pointerY;
            let d = Math.sqrt(dX * dX + dY * dY);
            this.setDraggedPropShape(undefined);
            if (this._cursorMode === CursorMode.Select && d < 5) {
                let pick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                    if (mesh instanceof Arrow) {
                        return true;
                    }
                    return mesh && mesh.parent instanceof PropShapeMesh;
                });
                if (pick.hit && pick.pickedMesh.parent instanceof PropShapeMesh) {
                    this.setSelectedPropShape(pick.pickedMesh.parent);
                }
                else {
                    this.setSelectedPropShape(undefined);
                }
            }
            else {
                let pick = this.game.scene.pick(this.game.scene.pointerX, this.game.scene.pointerY, (mesh) => {
                    return mesh && mesh.parent instanceof PropShapeMesh;
                });
                if (pick.hit) {
                    let p = pick.pickedPoint.add(pick.getNormal(true).scale(0.5));
                    let i = Math.floor(p.x);
                    let j = Math.floor(p.z);
                    let k = Math.floor(p.y - this.alt);
                    let newShape;
                    if (this._cursorMode === CursorMode.Box) {
                        newShape = new Kulla.RawShapeBox(1, 1, 1, i, j, k);
                        if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                            this.game.terrain.chunckDataGenerator.prop.shapes.push(newShape);
                            this.game.terrain.chunckDataGenerator.prop.blocks.push(this.currentBlockType);
                        }
                        let propShapeMesh = new PropShapeMesh(this, newShape);
                        this.propShapeMeshes.push(propShapeMesh);
                        this.redraw();
                        this.setCursorMode(CursorMode.Select);
                    }
                }
            }
        };
        this.onKeyDown = (ev) => {
            if (ev.code === "KeyW") {
                this.onMove(0, 0, 1);
            }
            else if (ev.code === "KeyA") {
                this.onMove(-1, 0, 0);
            }
            else if (ev.code === "KeyS") {
                this.onMove(0, 0, -1);
            }
            else if (ev.code === "KeyD") {
                this.onMove(1, 0, 0);
            }
            else if (ev.code === "KeyQ") {
                this.onMove(0, -1, 0);
            }
            else if (ev.code === "KeyE") {
                this.onMove(0, 1, 0);
            }
            else if (ev.code === "KeyX") {
                this.onDelete();
            }
        };
        let mat = new BABYLON.StandardMaterial("prop-shape-material");
        mat.specularColor.copyFromFloats(0, 0, 0);
        mat.alpha = 0.1;
        this.propShapeMaterial = mat;
        let matSelected = new BABYLON.StandardMaterial("prop-shape-material");
        matSelected.diffuseColor.copyFromFloats(1, 1, 0);
        matSelected.specularColor.copyFromFloats(0, 0, 0);
        matSelected.alpha = 0.2;
        this.propShapeMaterialSelected = matSelected;
        let matCursor = new BABYLON.StandardMaterial("prop-shape-material");
        matCursor.diffuseColor.copyFromFloats(0, 1, 1);
        matCursor.specularColor.copyFromFloats(0, 0, 0);
        matCursor.alpha = 0.2;
        this._cursorMesh = Mummu.CreateBeveledBox("cursor", { size: 1 });
        this._cursorMesh.material = matCursor;
        this.gridMesh = Mummu.CreateQuad("grid-mesh", {
            p1: new BABYLON.Vector3(-100, 0, -100),
            p2: new BABYLON.Vector3(100, 0, -100),
            p3: new BABYLON.Vector3(100, 0, 100),
            p4: new BABYLON.Vector3(-100, 0, 100),
            sideOrientation: 2
        });
        this.gridMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.gridMesh.isVisible = false;
    }
    setCursorMode(mode) {
        this._cursorMode = mode;
        if (this._cursorMode === CursorMode.Select) {
            this._cursorMesh.isVisible = false;
        }
        else {
            this._cursorMesh.isVisible = true;
        }
    }
    setSelectedPropShape(s) {
        if (this._selectedPropShape != s) {
            if (this._selectedPropShape) {
                this._selectedPropShape.unselect();
            }
            this._selectedPropShape = s;
            if (this._selectedPropShape) {
                this._selectedPropShape.select();
            }
            this.updateArrows();
        }
    }
    setDraggedPropShape(s) {
        if (this._draggedPropShape != s) {
            this._draggedPropShape = s;
            if (this._draggedPropShape instanceof PropShapeMesh) {
                let axis = this.game.arcCamera.getDirection(BABYLON.Axis.Z);
                Mummu.GetClosestAxisToRef(axis, axis);
                axis.scaleInPlace(-1);
                Mummu.QuaternionFromYZAxisToRef(axis, BABYLON.Vector3.One(), this.gridMesh.rotationQuaternion);
                this.gridMesh.position.copyFrom(this._draggedPropShape.childMesh.absolutePosition);
                this.gridMesh.computeWorldMatrix(true);
                this.game.arcCamera.detachControl();
            }
            else if (this._draggedPropShape instanceof Arrow) {
                this._draggedPropShape.onPointerDown();
            }
            else {
                this.game.arcCamera.attachControl();
            }
        }
    }
    initialize() {
        if (this.game.terrain) {
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                this.alt = this.game.terrain.chunckDataGenerator.altitude;
            }
        }
        this.boxButton = document.getElementById("prop-editor-box");
        this.boxButton.onclick = () => {
            if (this._cursorMode === CursorMode.Box) {
                this.setCursorMode(CursorMode.Select);
            }
            else {
                this.setCursorMode(CursorMode.Box);
            }
        };
        this.sphereButton = document.getElementById("prop-editor-sphere");
        this.sphereButton.onclick = () => {
            if (this._cursorMode === CursorMode.Sphere) {
                this.setCursorMode(CursorMode.Select);
            }
            else {
                this.setCursorMode(CursorMode.Sphere);
            }
        };
        this.dotButton = document.getElementById("prop-editor-dot");
        this.dotButton.onclick = () => {
            if (this._cursorMode === CursorMode.Dot) {
                this.setCursorMode(CursorMode.Select);
            }
            else {
                this.setCursorMode(CursorMode.Dot);
            }
        };
        let toggleShowSelector = document.getElementById("show-selector-toggle");
        toggleShowSelector.setValue(true);
        toggleShowSelector.onChange = () => {
            this.showSelectors = toggleShowSelector.valueBool;
            this.propShapeMeshes.forEach(propShapeMesh => {
                propShapeMesh.updateVisibility();
            });
        };
        this.blockTypeButtons = [...document.querySelectorAll(".prop-blocktype-button")];
        this.blockTypeButtons.forEach((button, index) => {
            let blocktype = index;
            let name = Kulla.BlockTypeNames[index];
            let color = Kulla.BlockTypeColors[index];
            if (name && color) {
                button.style.backgroundColor = color.toHexString();
            }
            button.onclick = () => {
                this.currentBlockType = blocktype;
                if (this._selectedPropShape) {
                    let shapeIndex = this.propShapeMeshes.indexOf(this._selectedPropShape);
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                        this.game.terrain.chunckDataGenerator.prop.blocks[shapeIndex] = this.currentBlockType;
                    }
                    this.redraw();
                }
            };
        });
        this.wLeftArrow = new Arrow(this, "wLeftArrow", this.game, 0.5, BABYLON.Vector3.Left());
        this.wLeftArrow.onMove = (delta) => {
            let dW = -Math.round(delta.x);
            if (dW != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.w += dW;
                this.wLeftArrow.initPos.x -= Math.sign(dW);
                this.onMove(-dW, 0, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        };
        this.wRightArrow = new Arrow(this, "wRightArrow", this.game, 0.5, BABYLON.Vector3.Right());
        this.wRightArrow.onMove = (delta) => {
            let dW = Math.round(delta.x);
            if (dW != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.w += dW;
                this.wRightArrow.initPos.x += Math.sign(dW);
                this.onMove(0, 0, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        };
        this.hBottomArrow = new Arrow(this, "hBottomArrow", this.game, 0.5, BABYLON.Vector3.Down());
        this.hBottomArrow.onMove = (delta) => {
            let dH = -Math.round(delta.y);
            if (dH != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.h += dH;
                this.hBottomArrow.initPos.y -= Math.sign(dH);
                this.onMove(0, 0, -dH);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        };
        this.hTopArrow = new Arrow(this, "hTopArrow", this.game, 0.5, BABYLON.Vector3.Up());
        this.hTopArrow.onMove = (delta, pos) => {
            let dH = Math.round(delta.y);
            if (dH != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.h += dH;
                this.hTopArrow.initPos.y += Math.sign(dH);
                this.onMove(0, 0, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        };
        this.dBackwardArrow = new Arrow(this, "dBackwardArrow", this.game, 0.5, BABYLON.Vector3.Backward());
        this.dBackwardArrow.onMove = (delta) => {
            let dD = -Math.round(delta.z);
            if (dD != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.d += dD;
                this.dBackwardArrow.initPos.z -= Math.sign(dD);
                this.onMove(0, -dD, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        };
        this.dForwardArrow = new Arrow(this, "dForwardArrow", this.game, 0.5, BABYLON.Vector3.Forward());
        this.dForwardArrow.onMove = (delta) => {
            let dD = Math.round(delta.z);
            if (dD != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.d += dD;
                this.dForwardArrow.initPos.z += Math.sign(dD);
                this.onMove(0, 0, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        };
        this.arrows = [
            this.wLeftArrow,
            this.wRightArrow,
            this.hBottomArrow,
            this.hTopArrow,
            this.dBackwardArrow,
            this.dForwardArrow
        ];
        this.arrows.forEach(arrow => {
            arrow.instantiate();
        });
        this.game.canvas.addEventListener("keyup", this.onKeyDown);
        this.game.canvas.addEventListener("pointerdown", this.onPointerDown);
        this.game.canvas.addEventListener("pointermove", this.onPointerMove);
        this.game.canvas.addEventListener("pointerup", this.onPointerUp);
        if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
            let dataString = window.localStorage.getItem("current-prop");
            if (dataString) {
                let data = JSON.parse(dataString);
                this.game.terrain.chunckDataGenerator.prop.deserialize(data);
                this.redraw();
            }
        }
        this.propShapeMeshes = [];
        if (this.game.terrain) {
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                this.game.terrain.chunckDataGenerator.prop.shapes.forEach(shape => {
                    let propShapeMesh = new PropShapeMesh(this, shape);
                    this.propShapeMeshes.push(propShapeMesh);
                });
            }
        }
    }
    dispose() {
        while (this.propShapeMeshes.length > 0) {
            this.propShapeMeshes.pop().dispose();
        }
        this.game.canvas.removeEventListener("keydown", this.onKeyDown);
        this.game.canvas.removeEventListener("pointerup", this.onPointerUp);
    }
    updateArrows() {
        this.arrows.forEach(arrow => {
            arrow.isVisible = false;
        });
        if (this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
            this.arrows.forEach(arrow => {
                arrow.isVisible = true;
            });
            this.wRightArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.wRightArrow.position.x += 0.5 + this._selectedPropShape.shape.w * 0.5;
            this.wLeftArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.wLeftArrow.position.x -= 0.5 + this._selectedPropShape.shape.w * 0.5;
            this.hTopArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.hTopArrow.position.y += 0.5 + this._selectedPropShape.shape.h * 0.5;
            this.hBottomArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.hBottomArrow.position.y -= 0.5 + this._selectedPropShape.shape.h * 0.5;
            this.dForwardArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.dForwardArrow.position.z += 0.5 + this._selectedPropShape.shape.d * 0.5;
            this.dBackwardArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.dBackwardArrow.position.z -= 0.5 + this._selectedPropShape.shape.d * 0.5;
        }
    }
    redraw() {
        let chuncks = [
            this.game.terrain.getChunck(0, 0, 0),
            this.game.terrain.getChunck(0, 1, 0),
            this.game.terrain.getChunck(0, 1, 1),
            this.game.terrain.getChunck(0, 0, 1)
        ];
        chuncks.forEach(chunck => {
            if (chunck) {
                chunck.reset();
                chunck.redrawMesh(true);
            }
        });
        if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
            let data = this.game.terrain.chunckDataGenerator.prop.serialize();
            window.localStorage.setItem("current-prop", JSON.stringify(data));
        }
    }
    onMove(di = 0, dj = 0, dk = 0) {
        if (this._selectedPropShape) {
            this._selectedPropShape.shape.pi += di;
            this._selectedPropShape.shape.pj += dj;
            this._selectedPropShape.shape.pk += dk;
            this._selectedPropShape.updatePosition();
            this.redraw();
            this.updateArrows();
        }
    }
    onDelete() {
        if (this._selectedPropShape && this.propShapeMeshes.length > 0) {
            let mesh = this._selectedPropShape;
            let index = this.propShapeMeshes.indexOf(this._selectedPropShape);
            this.setSelectedPropShape(undefined);
            mesh.dispose();
            this.propShapeMeshes.splice(index, 1);
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                this.game.terrain.chunckDataGenerator.prop.shapes.splice(index, 1);
                this.game.terrain.chunckDataGenerator.prop.blocks.splice(index, 1);
            }
        }
        this.redraw();
    }
}
class TerrainMaterial extends BABYLON.ShaderMaterial {
    constructor(name, scene) {
        super(name, scene, {
            vertex: "terrainToon",
            fragment: "terrainToon",
        }, {
            attributes: ["position", "normal", "uv", "uv2", "color"],
            uniforms: [
                "world", "worldView", "worldViewProjection", "view", "projection",
                "lightInvDirW",
                "level"
            ]
        });
        this._lightInvDirW = BABYLON.Vector3.Up();
        this._level = 0;
        this.setLightInvDir(BABYLON.Vector3.One().normalize());
        this.setLevel(0);
        this.setFloat("blockSize_m", 1);
        this.setColor3Array("terrainColors", Kulla.BlockTypeColors);
    }
    getLightInvDir() {
        return this._lightInvDirW;
    }
    setLightInvDir(p) {
        this._lightInvDirW.copyFrom(p);
        this.setVector3("lightInvDirW", this._lightInvDirW);
    }
    getLevel() {
        return this._level;
    }
    setLevel(v) {
        this._level = v;
        this.setInt("level", this._level);
    }
}
class ToonMaterial extends BABYLON.ShaderMaterial {
    constructor(name, scene) {
        super(name, scene, {
            vertex: "toon",
            fragment: "toon",
        }, {
            attributes: ["position", "normal", "uv", "color"],
            uniforms: [
                "world", "worldView", "worldViewProjection", "view", "projection",
                "useVertexColor",
                "useLightFromPOV",
                "autoLight",
                "diffuseSharpness",
                "diffuse",
                "diffuseTexture",
                "viewPositionW",
                "viewDirectionW",
                "lightInvDirW",
                "alpha",
                "useFlatSpecular",
                "specularIntensity",
                "specularColor",
                "specularCount",
                "specularPower"
            ]
        });
        this._update = () => {
            let camera = this.getScene().activeCamera;
            let direction = camera.getForwardRay().direction;
            this.setVector3("viewPositionW", camera.position);
            this.setVector3("viewDirectionW", direction);
            let lights = this.getScene().lights;
            for (let i = 0; i < lights.length; i++) {
                let light = lights[i];
                if (light instanceof BABYLON.HemisphericLight) {
                    this.setVector3("lightInvDirW", light.direction);
                }
            }
        };
        this._useVertexColor = false;
        this._useLightFromPOV = false;
        this._autoLight = 0;
        this._diffuseSharpness = 0;
        this._diffuse = BABYLON.Color3.White();
        this._useFlatSpecular = false;
        this._specularIntensity = 0;
        this._specular = BABYLON.Color3.White();
        this._specularCount = 1;
        this._specularPower = 4;
        this._voidTexture = new BABYLON.Texture("./datas/textures/void-texture.png");
        this._voidTexture.wrapU = 1;
        this._voidTexture.wrapV = 1;
        this.updateUseVertexColor();
        this.updateUseLightFromPOV();
        this.updateAutoLight();
        this.updateDiffuseSharpness();
        this.updateDiffuse();
        this.updateDiffuseTexture();
        this.updateAlpha();
        this.updateUseFlatSpecular();
        this.updateSpecularIntensity();
        this.updateSpecular();
        this.updateSpecularCount();
        this.updateSpecularPower();
        this.setVector3("viewPositionW", BABYLON.Vector3.Zero());
        this.setVector3("viewDirectionW", BABYLON.Vector3.Up());
        this.setVector3("lightInvDirW", BABYLON.Vector3.Up());
        this.getScene().onBeforeRenderObservable.add(this._update);
    }
    dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh) {
        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }
    get useVertexColor() {
        return this._useVertexColor;
    }
    setUseVertexColor(b) {
        this._useVertexColor = b;
        this.updateUseVertexColor();
    }
    updateUseVertexColor() {
        this.setInt("useVertexColor", this._useVertexColor ? 1 : 0);
    }
    get useLightFromPOV() {
        return this._useLightFromPOV;
    }
    setUseLightFromPOV(b) {
        this._useLightFromPOV = b;
        this.updateUseLightFromPOV();
    }
    updateUseLightFromPOV() {
        this.setInt("useLightFromPOV", this._useLightFromPOV ? 1 : 0);
    }
    get autoLight() {
        return this._autoLight;
    }
    setAutoLight(v) {
        this._autoLight = v;
        this.updateAutoLight();
    }
    updateAutoLight() {
        this.setFloat("autoLight", this._autoLight);
    }
    get diffuseSharpness() {
        return this._diffuseSharpness;
    }
    setDiffuseSharpness(v) {
        this._diffuseSharpness = v;
        this.updateDiffuseSharpness();
    }
    updateDiffuseSharpness() {
        this.setFloat("diffuseSharpness", this._diffuseSharpness);
    }
    get diffuse() {
        return this._diffuse;
    }
    setDiffuse(c) {
        this._diffuse = c;
        this.updateDiffuse();
    }
    updateDiffuse() {
        this.setColor3("diffuse", this._diffuse);
    }
    get diffuseTexture() {
        return this._diffuseTexture;
    }
    setDiffuseTexture(t) {
        this._diffuseTexture = t;
        this.updateDiffuseTexture();
    }
    updateDiffuseTexture() {
        if (this._diffuseTexture) {
            this.setTexture("diffuseTexture", this._diffuseTexture);
        }
        else {
            this.setTexture("diffuseTexture", this._voidTexture);
        }
    }
    get alpha() {
        return this._alpha;
    }
    setAlpha(v) {
        this._alpha = v;
        this.updateAlpha();
    }
    updateAlpha() {
        if (this.alpha != 1) {
            this.alphaMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        }
        else {
            this.alphaMode = BABYLON.Material.MATERIAL_OPAQUE;
        }
        this.setFloat("alpha", this._alpha);
    }
    get useFlatSpecular() {
        return this._useFlatSpecular;
    }
    setUseFlatSpecular(b) {
        this._useFlatSpecular = b;
        this.updateUseFlatSpecular();
    }
    updateUseFlatSpecular() {
        this.setInt("useFlatSpecular", this._useFlatSpecular ? 1 : 0);
    }
    get specularIntensity() {
        return this._specularIntensity;
    }
    setSpecularIntensity(v) {
        this._specularIntensity = v;
        this.updateSpecularIntensity();
    }
    updateSpecularIntensity() {
        this.setFloat("specularIntensity", this._specularIntensity);
    }
    get specular() {
        return this._specular;
    }
    setSpecular(c) {
        this._specular = c;
        this.updateSpecular();
    }
    updateSpecular() {
        this.setColor3("specular", this._specular);
    }
    get specularCount() {
        return this._specularCount;
    }
    setSpecularCount(v) {
        this._specularCount = v;
        this.updateSpecularCount();
    }
    updateSpecularCount() {
        this.setFloat("specularCount", this._specularCount);
    }
    get specularPower() {
        return this._specularPower;
    }
    setSpecularPower(v) {
        this._specularPower = v;
        this.updateSpecularPower();
    }
    updateSpecularPower() {
        this.setFloat("specularPower", this._specularPower);
    }
}
class GameRouter extends Nabu.Router {
    constructor(game) {
        super();
        this.game = game;
    }
    onFindAllPages() {
        this.homePage = document.getElementById("home-page");
        this.optionPage = document.getElementById("option-page");
        this.propEditor = document.getElementById("prop-editor-ui");
    }
    onUpdate() {
    }
    async onHRefChange(page) {
        this.game.propEditor.dispose();
        if (page.startsWith("#game")) {
            this.hideAll();
            this.game.generateTerrainLarge();
        }
        else if (page.startsWith("#prop-creator")) {
            this.show(this.propEditor);
            this.game.generateTerrainSmall();
            this.game.propEditor.initialize();
        }
        else if (page.startsWith("#options")) {
            this.show(this.optionPage);
        }
        else if (page.startsWith("#home") || true) {
            this.show(this.homePage);
        }
    }
}
