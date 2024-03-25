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
var KeyInput;
(function (KeyInput) {
    KeyInput[KeyInput["NULL"] = -1] = "NULL";
    KeyInput[KeyInput["ACTION_SLOT_0"] = 0] = "ACTION_SLOT_0";
    KeyInput[KeyInput["ACTION_SLOT_1"] = 1] = "ACTION_SLOT_1";
    KeyInput[KeyInput["ACTION_SLOT_2"] = 2] = "ACTION_SLOT_2";
    KeyInput[KeyInput["ACTION_SLOT_3"] = 3] = "ACTION_SLOT_3";
    KeyInput[KeyInput["ACTION_SLOT_4"] = 4] = "ACTION_SLOT_4";
    KeyInput[KeyInput["ACTION_SLOT_5"] = 5] = "ACTION_SLOT_5";
    KeyInput[KeyInput["ACTION_SLOT_6"] = 6] = "ACTION_SLOT_6";
    KeyInput[KeyInput["ACTION_SLOT_7"] = 7] = "ACTION_SLOT_7";
    KeyInput[KeyInput["ACTION_SLOT_8"] = 8] = "ACTION_SLOT_8";
    KeyInput[KeyInput["ACTION_SLOT_9"] = 9] = "ACTION_SLOT_9";
    KeyInput[KeyInput["PLAYER_ACTION"] = 10] = "PLAYER_ACTION";
    KeyInput[KeyInput["PLAYER_ACTION_EQUIP"] = 11] = "PLAYER_ACTION_EQUIP";
    KeyInput[KeyInput["PLAYER_ACTION_INC"] = 12] = "PLAYER_ACTION_INC";
    KeyInput[KeyInput["PLAYER_ACTION_DEC"] = 13] = "PLAYER_ACTION_DEC";
    KeyInput[KeyInput["INVENTORY"] = 14] = "INVENTORY";
    KeyInput[KeyInput["INVENTORY_PREV_CAT"] = 15] = "INVENTORY_PREV_CAT";
    KeyInput[KeyInput["INVENTORY_NEXT_CAT"] = 16] = "INVENTORY_NEXT_CAT";
    KeyInput[KeyInput["INVENTORY_EQUIP_ITEM"] = 17] = "INVENTORY_EQUIP_ITEM";
    KeyInput[KeyInput["ROTATE_SELECTED"] = 18] = "ROTATE_SELECTED";
    KeyInput[KeyInput["DELETE_SELECTED"] = 19] = "DELETE_SELECTED";
    KeyInput[KeyInput["MOVE_FORWARD"] = 20] = "MOVE_FORWARD";
    KeyInput[KeyInput["MOVE_LEFT"] = 21] = "MOVE_LEFT";
    KeyInput[KeyInput["MOVE_BACK"] = 22] = "MOVE_BACK";
    KeyInput[KeyInput["MOVE_RIGHT"] = 23] = "MOVE_RIGHT";
    KeyInput[KeyInput["JUMP"] = 24] = "JUMP";
    KeyInput[KeyInput["MAIN_MENU"] = 25] = "MAIN_MENU";
    KeyInput[KeyInput["WORKBENCH"] = 26] = "WORKBENCH";
})(KeyInput || (KeyInput = {}));
class GameConfiguration extends Nabu.Configuration {
    constructor(configName, game) {
        super(configName);
        this.game = game;
    }
    _buildElementsArray() {
        this.configurationElements = [
            new Nabu.ConfigurationElement("quality", Nabu.ConfigurationElementType.Enum, 0, Nabu.ConfigurationElementCategory.Graphic, {
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
            new Nabu.ConfigurationElement("renderDist", Nabu.ConfigurationElementType.Number, 8, Nabu.ConfigurationElementCategory.Graphic, {
                displayName: "Render Distance",
                min: 1,
                max: 15,
                toString: (v) => {
                    return v.toFixed(0);
                }
            }, (newValue) => {
                this.game.terrain.chunckManager.setDistance(newValue * this.game.terrain.chunckLengthIJ);
            }),
            new Nabu.ConfigurationElement("canLockPointer", Nabu.ConfigurationElementType.Boolean, 0, Nabu.ConfigurationElementCategory.Command, {
                displayName: "Can Lock Pointer"
            }),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "PLAYER_ACTION", KeyInput.PLAYER_ACTION, "GamepadBtn0"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "PLAYER_ACTION_DEC", KeyInput.PLAYER_ACTION_DEC, "GamepadBtn12"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "PLAYER_ACTION_INC", KeyInput.PLAYER_ACTION_INC, "GamepadBtn13"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY.0", KeyInput.INVENTORY, "GamepadBtn2"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY.1", KeyInput.INVENTORY, "KeyI"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY_PREV_CAT", KeyInput.INVENTORY_PREV_CAT, "GamepadBtn4"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY_NEXT_CAT", KeyInput.INVENTORY_NEXT_CAT, "GamepadBtn5"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "INVENTORY_EQUIP_ITEM", KeyInput.INVENTORY_EQUIP_ITEM, "GamepadBtn0"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ROTATE_SELECTED", KeyInput.ROTATE_SELECTED, "KeyR"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "DELETE_SELECTED", KeyInput.DELETE_SELECTED, "KeyX"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "MOVE_FORWARD", KeyInput.MOVE_FORWARD, "KeyW"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "MOVE_LEFT", KeyInput.MOVE_LEFT, "KeyA"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "MOVE_BACK", KeyInput.MOVE_BACK, "KeyS"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "MOVE_RIGHT", KeyInput.MOVE_RIGHT, "KeyD"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_0", KeyInput.ACTION_SLOT_0, "Digit0"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_1", KeyInput.ACTION_SLOT_1, "Digit1"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_2", KeyInput.ACTION_SLOT_2, "Digit2"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_3", KeyInput.ACTION_SLOT_3, "Digit3"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_4", KeyInput.ACTION_SLOT_4, "Digit4"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_5", KeyInput.ACTION_SLOT_5, "Digit5"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_6", KeyInput.ACTION_SLOT_6, "Digit6"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_7", KeyInput.ACTION_SLOT_7, "Digit7"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_8", KeyInput.ACTION_SLOT_8, "Digit8"),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_9", KeyInput.ACTION_SLOT_9, "Digit9"),
            new Nabu.ConfigurationElement("godMode", Nabu.ConfigurationElementType.Boolean, 0, Nabu.ConfigurationElementCategory.Dev, {
                displayName: "God Mode"
            }, (newValue) => {
                if (newValue === 1) {
                    this.game.freeCamera.speed = 1;
                }
                else {
                    this.game.freeCamera.speed = 0.2;
                }
            }),
            new Nabu.ConfigurationElement("showRenderDistDebug", Nabu.ConfigurationElementType.Boolean, 0, Nabu.ConfigurationElementCategory.Dev, {
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
        this.inputManager = new Nabu.InputManager(this.canvas, this.configuration);
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
        this.playerActionView = new PlayerActionView();
        this.playerInventoryView = document.getElementsByTagName("inventory-page")[0];
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
            //let debugTerrainPerf = new DebugTerrainPerf(this);
            //debugTerrainPerf.show();
            this.player = new Player(this);
            this.playerInventoryView.setInventory(this.player.inventory);
            this.player.position.copyFrom(this.freeCamera.position);
            let playerControler = new PlayerControler(this.player);
            this.player.playerActionManager = new PlayerActionManager(this.player, this);
            this.player.playerActionManager.initialize();
            this.inputManager.initialize();
            this.inputManager.initializeInputs(this.configuration);
            playerControler.initialize();
            this.player.inventory.addItem(new PlayerInventoryItem("Grass", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Grass", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Grass", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Grass", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Grass", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Grass", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Dirt", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Dirt", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Dirt", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Ice", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("Ice", InventoryCategory.Block));
            this.player.inventory.addItem(new PlayerInventoryItem("plate_1x1", InventoryCategory.Brick));
            this.player.inventory.addItem(new PlayerInventoryItem("plate_1x1", InventoryCategory.Brick));
            this.player.inventory.addItem(new PlayerInventoryItem("plate_2x1", InventoryCategory.Brick));
            this.player.inventory.addItem(new PlayerInventoryItem("brick_2x1", InventoryCategory.Brick));
            this.player.inventory.addItem(new PlayerInventoryItem("brick_2x1", InventoryCategory.Brick));
            this.player.inventory.addItem(new PlayerInventoryItem("brick_4x1", InventoryCategory.Brick));
            this.player.playerActionManager.linkAction(PlayerActionTemplate.CreateBlockAction(this.player, Kulla.BlockType.None), 1);
            this.player.playerActionManager.linkAction(PlayerActionTemplate.CreateBlockAction(this.player, Kulla.BlockType.Grass), 2);
            this.player.playerActionManager.linkAction(PlayerActionTemplate.CreateBlockAction(this.player, Kulla.BlockType.Dirt), 3);
            this.player.playerActionManager.linkAction(PlayerActionTemplate.CreateBlockAction(this.player, Kulla.BlockType.Rock), 4);
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
        if (this.player && this.terrain) {
            this.player.update(dt);
        }
        if (this.inputManager) {
            this.inputManager.update();
        }
        if (this.DEBUG_MODE) {
            let camPos = this.freeCamera.globalPosition;
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
        this.freeCamera.parent = undefined;
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
    generateTerrainBrick() {
        this.uiCamera.parent = this.freeCamera;
        this.arcCamera.detachControl();
        this.scene.activeCameras = [this.freeCamera, this.uiCamera];
        this.freeCamera.detachControl();
        this.freeCamera.parent = this.player.head;
        this.freeCamera.position.copyFromFloats(0, 0, 0);
        this.freeCamera.rotation.copyFromFloats(0, 0, 0);
        if (!(this.terrain && this.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFromMapSimple)) {
            if (this.terrain) {
                this.terrain.dispose();
            }
            this.terrain = new Kulla.Terrain({
                scene: this.scene,
                generatorProps: {
                    type: Kulla.GeneratorType.MapSimple,
                    altitude: 64,
                    blockType: Kulla.BlockType.Dirt
                },
                maxDisplayedLevel: 0,
                blockSizeIJ_m: 0.375,
                blockSizeK_m: 0.45,
                chunckLengthIJ: 24,
                chunckLengthK: 256,
                chunckCountIJ: 512,
                useAnalytics: true
            });
            this.terrain.initialize();
            this.terrainEditor = new Kulla.TerrainEditor(this.terrain);
        }
        let mat = new TerrainMaterial("terrain", this.scene);
        this.terrain.materials = [mat];
        mat.freeze();
        this.configuration.getElement("renderDist").forceInit();
        this.configuration.getElement("showRenderDistDebug").forceInit();
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
        if (this.shape instanceof Kulla.RawShapeBox) {
            this.childMesh = Mummu.CreateBeveledBox("box", {
                width: this.shape.w + 0.1,
                height: this.shape.h + 0.1,
                depth: this.shape.d + 0.1,
                flat: true,
                color: color
            });
            this.childMesh.position.copyFromFloats(this.shape.w * 0.5, this.shape.h * 0.5, this.shape.d * 0.5);
            this.childMesh.material = this.propEditor.propShapeMaterial;
            this.childMesh.parent = this;
        }
        else if (this.shape instanceof Kulla.RawShapeSphere) {
            this.childMesh = Mummu.CreateBeveledBox("box", {
                width: this.shape.rX * 2 + 1 + 0.1,
                height: this.shape.rY * 2 + 1 + 0.1,
                depth: this.shape.rZ * 2 + 1 + 0.1,
                flat: true,
                color: color
            });
            this.childMesh.position.copyFromFloats(0.5, 0.5, 0.5);
            this.childMesh.material = this.propEditor.propShapeMaterial;
            this.childMesh.parent = this;
        }
        else if (this.shape instanceof Kulla.RawShapeLine) {
            let pA = new BABYLON.Vector3(this.shape.Ai, this.shape.Ak, this.shape.Aj);
            let pB = new BABYLON.Vector3(this.shape.Bi, this.shape.Bk, this.shape.Bj);
            let dir = pB.subtract(pA);
            let l = dir.length();
            dir.scaleInPlace(1 / l);
            this.childMesh = Mummu.CreateBeveledBox("box", {
                width: 1 + 0.1,
                height: l + 0.1,
                depth: 1 + 0.1,
                flat: true,
                color: color
            });
            if (Math.abs(BABYLON.Vector3.Dot(dir, BABYLON.Axis.Z)) < 0.9) {
                this.childMesh.rotationQuaternion = Mummu.QuaternionFromYZAxis(dir, BABYLON.Axis.Z);
            }
            else {
                this.childMesh.rotationQuaternion = Mummu.QuaternionFromYZAxis(dir, BABYLON.Axis.X);
            }
            this.childMesh.position.copyFrom(pA).addInPlace(pB).scaleInPlace(0.5);
            this.childMesh.material = this.propEditor.propShapeMaterial;
            this.childMesh.parent = this;
            this.pointAMesh = Mummu.CreateBeveledBox("pointA", {
                width: 1.2,
                height: 1.2,
                depth: 1.2,
                flat: true,
                color: color
            });
            this.pointAMesh.position.copyFrom(pA).addInPlaceFromFloats(0.5, 0.5, 0.5);
            this.pointAMesh.material = this.propEditor.propShapeMaterial;
            this.pointAMesh.parent = this;
            this.pointAMesh.isVisible = false;
            this.pointBMesh = Mummu.CreateBeveledBox("pointB", {
                width: 1.2,
                height: 1.2,
                depth: 1.2,
                flat: true,
                color: color
            });
            this.pointBMesh.position.copyFrom(pB).addInPlaceFromFloats(0.5, 0.5, 0.5);
            this.pointBMesh.material = this.propEditor.propShapeMaterial;
            this.pointBMesh.parent = this;
            this.pointBMesh.isVisible = false;
        }
        this.updatePosition();
        this.updateVisibility();
    }
    select() {
        if (this.shape instanceof Kulla.RawShapeLine) {
            this.pointAMesh.isVisible = true;
            this.pointBMesh.isVisible = true;
        }
        else if (this.childMesh) {
            this.childMesh.material = this.propEditor.propShapeMaterialSelected;
        }
    }
    unselect() {
        if (this.shape instanceof Kulla.RawShapeLine) {
            this.pointAMesh.isVisible = false;
            this.pointBMesh.isVisible = false;
        }
        else if (this.childMesh) {
            this.childMesh.material = this.propEditor.propShapeMaterial;
        }
    }
    updatePosition() {
        if (this.childMesh) {
            this.position.x = this.shape.pi;
            this.position.z = this.shape.pj;
            this.position.y = this.shape.pk + this.propEditor.alt;
            this.computeWorldMatrix(true);
            this.childMesh.computeWorldMatrix(true);
            if (this.shape instanceof Kulla.RawShapeLine) {
                let pA = new BABYLON.Vector3(this.shape.Ai, this.shape.Ak, this.shape.Aj);
                let pB = new BABYLON.Vector3(this.shape.Bi, this.shape.Bk, this.shape.Bj);
                let dir = pB.subtract(pA);
                let l = dir.length();
                dir.scaleInPlace(1 / l);
                let data = Mummu.CreateBeveledBoxVertexData({
                    width: 1 + 0.1,
                    height: l - 0.5 + 0.1,
                    depth: 1 + 0.1,
                    flat: true
                });
                data.applyToMesh(this.childMesh);
                if (Math.abs(BABYLON.Vector3.Dot(dir, BABYLON.Axis.Z)) < 0.9) {
                    Mummu.QuaternionFromYZAxisToRef(dir, BABYLON.Axis.Z, this.childMesh.rotationQuaternion);
                }
                else {
                    Mummu.QuaternionFromYZAxisToRef(dir, BABYLON.Axis.X, this.childMesh.rotationQuaternion);
                }
                this.childMesh.position.copyFrom(pA).addInPlace(pB).scaleInPlace(0.5).addInPlaceFromFloats(0.5, 0.5, 0.5);
                this.pointAMesh.position.copyFrom(pA).addInPlaceFromFloats(0.5, 0.5, 0.5);
                this.pointBMesh.position.copyFrom(pB).addInPlaceFromFloats(0.5, 0.5, 0.5);
            }
        }
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
        else if (this.shape instanceof Kulla.RawShapeSphere) {
            let data = Mummu.CreateBeveledBoxVertexData({
                width: this.shape.rX * 2 + 1 + 0.1,
                height: this.shape.rY * 2 + 1 + 0.1,
                depth: this.shape.rZ * 2 + 1 + 0.1,
                flat: true
            });
            data.applyToMesh(this.childMesh);
            this.childMesh.position.copyFromFloats(0.5, 0.5, 0.5);
        }
    }
    updateVisibility() {
        if (this.childMesh) {
            this.childMesh.isVisible = this.propEditor.showSelectors;
        }
    }
}
var CursorMode;
(function (CursorMode) {
    CursorMode[CursorMode["Select"] = 0] = "Select";
    CursorMode[CursorMode["Box"] = 1] = "Box";
    CursorMode[CursorMode["Sphere"] = 2] = "Sphere";
    CursorMode[CursorMode["Dot"] = 3] = "Dot";
    CursorMode[CursorMode["Line"] = 4] = "Line";
})(CursorMode || (CursorMode = {}));
class PropEditor {
    constructor(game) {
        this.game = game;
        this.showSelectors = true;
        this.propShapeMeshes = [];
        this._shiftDown = false;
        this.currentBlockType = Kulla.BlockType.Grass;
        this._cursorMode = CursorMode.Select;
        this._draggedOffset = BABYLON.Vector3.Zero();
        this._draggedPoint = 0;
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
                if (pick.hit && pick.pickedMesh instanceof Arrow) {
                    this.setDraggedPropShape(pick.pickedMesh);
                    this._draggedOffset.copyFromFloats(0, 0, 0);
                }
                else if (pick.hit && pick.pickedMesh.parent === this._selectedPropShape) {
                    let point = 0;
                    let p = new BABYLON.Vector3(this._selectedPropShape.shape.pi, this._selectedPropShape.shape.pk + this.alt, this._selectedPropShape.shape.pj).addInPlaceFromFloats(0.5, 0.5, 0.5);
                    if (pick.pickedMesh.name === "pointA") {
                        if (this._selectedPropShape.shape instanceof Kulla.RawShapeLine) {
                            p = new BABYLON.Vector3(this._selectedPropShape.shape.Ai, this._selectedPropShape.shape.Ak, this._selectedPropShape.shape.Aj).addInPlaceFromFloats(0.5, 0.5, 0.5);
                        }
                        point = 1;
                    }
                    else if (pick.pickedMesh.name === "pointB") {
                        if (this._selectedPropShape.shape instanceof Kulla.RawShapeLine) {
                            p = new BABYLON.Vector3(this._selectedPropShape.shape.Bi, this._selectedPropShape.shape.Bk, this._selectedPropShape.shape.Bj).addInPlaceFromFloats(0.5, 0.5, 0.5);
                        }
                        point = 2;
                    }
                    this.setDraggedPropShape(this._selectedPropShape, point);
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
                        if (this._draggedPoint === 0) {
                            let di = i - this._draggedPropShape.shape.pi;
                            let dj = j - this._draggedPropShape.shape.pj;
                            let dk = k - this._draggedPropShape.shape.pk;
                            this.onMove(di, dj, dk);
                        }
                        else if (this._draggedPoint === 1) {
                            if (this._draggedPropShape.shape instanceof Kulla.RawShapeLine) {
                                let k = Math.floor(p.y);
                                let di = i - this._draggedPropShape.shape.Ai;
                                let dj = j - this._draggedPropShape.shape.Aj;
                                let dk = k - this._draggedPropShape.shape.Ak;
                                this._draggedPropShape.shape.Ai += di;
                                this._draggedPropShape.shape.Aj += dj;
                                this._draggedPropShape.shape.Ak += dk;
                                this.onMove(0, 0, 0);
                            }
                        }
                        else if (this._draggedPoint === 2) {
                            if (this._draggedPropShape.shape instanceof Kulla.RawShapeLine) {
                                let k = Math.floor(p.y);
                                let di = i - this._draggedPropShape.shape.Bi;
                                let dj = j - this._draggedPropShape.shape.Bj;
                                let dk = k - this._draggedPropShape.shape.Bk;
                                this._draggedPropShape.shape.Bi += di;
                                this._draggedPropShape.shape.Bj += dj;
                                this._draggedPropShape.shape.Bk += dk;
                                this.onMove(0, 0, 0);
                            }
                        }
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
                        if (!this._shiftDown) {
                            this.setCursorMode(CursorMode.Select);
                        }
                    }
                    else if (this._cursorMode === CursorMode.Sphere) {
                        newShape = new Kulla.RawShapeSphere(1, 1, 1, i, j, k);
                        if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                            this.game.terrain.chunckDataGenerator.prop.shapes.push(newShape);
                            this.game.terrain.chunckDataGenerator.prop.blocks.push(this.currentBlockType);
                        }
                        let propShapeMesh = new PropShapeMesh(this, newShape);
                        this.propShapeMeshes.push(propShapeMesh);
                        this.redraw();
                        if (!this._shiftDown) {
                            this.setCursorMode(CursorMode.Select);
                        }
                    }
                    else if (this._cursorMode === CursorMode.Line) {
                        let n = pick.getNormal();
                        n.x = Math.round(n.x);
                        n.y = Math.round(n.y);
                        n.z = Math.round(n.z);
                        newShape = new Kulla.RawShapeLine(i, j, k, i + n.x, j + n.z, k + n.y);
                        if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                            this.game.terrain.chunckDataGenerator.prop.shapes.push(newShape);
                            this.game.terrain.chunckDataGenerator.prop.blocks.push(this.currentBlockType);
                        }
                        let propShapeMesh = new PropShapeMesh(this, newShape);
                        this.propShapeMeshes.push(propShapeMesh);
                        this.redraw();
                        if (!this._shiftDown) {
                            this.setCursorMode(CursorMode.Select);
                        }
                    }
                    else if (this._cursorMode === CursorMode.Dot) {
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
            else if (ev.code === "ShiftLeft") {
                this._shiftDown = true;
            }
        };
        this.onKeyUp = (ev) => {
            if (ev.code === "ShiftLeft") {
                this._shiftDown = false;
            }
        };
        let mat = new BABYLON.StandardMaterial("prop-shape-material");
        mat.specularColor.copyFromFloats(0, 0, 0);
        mat.alpha = 0.2;
        this.propShapeMaterial = mat;
        let matSelected = new BABYLON.StandardMaterial("prop-shape-material");
        matSelected.diffuseColor.copyFromFloats(1, 1, 0);
        matSelected.specularColor.copyFromFloats(0, 0, 0);
        matSelected.alpha = 0.3;
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
        this.setCursorMode(CursorMode.Select);
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
    setDraggedPropShape(s, point = 0) {
        if (this._draggedPropShape != s || this._draggedPoint != point) {
            this._draggedPropShape = s;
            this._draggedPoint = point;
            if (this._draggedPropShape instanceof PropShapeMesh) {
                let axis = this.game.arcCamera.getDirection(BABYLON.Axis.Z);
                Mummu.GetClosestAxisToRef(axis, axis);
                axis.scaleInPlace(-1);
                Mummu.QuaternionFromYZAxisToRef(axis, BABYLON.Vector3.One(), this.gridMesh.rotationQuaternion);
                if (this._draggedPoint === 0) {
                    this.gridMesh.position.copyFrom(this._draggedPropShape.childMesh.absolutePosition);
                }
                else if (this._draggedPoint === 1) {
                    this.gridMesh.position.copyFrom(this._draggedPropShape.pointAMesh.absolutePosition);
                }
                else if (this._draggedPoint === 2) {
                    this.gridMesh.position.copyFrom(this._draggedPropShape.pointBMesh.absolutePosition);
                }
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
        this.lineButton = document.getElementById("prop-editor-line");
        this.lineButton.onclick = () => {
            if (this._cursorMode === CursorMode.Line) {
                this.setCursorMode(CursorMode.Select);
            }
            else {
                this.setCursorMode(CursorMode.Line);
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
            if (dW != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.w += dW;
                    this.wLeftArrow.initPos.x -= Math.sign(dW);
                    this.onMove(-dW, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rX += dW;
                    this.wLeftArrow.initPos.x -= Math.sign(dW);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        };
        this.wRightArrow = new Arrow(this, "wRightArrow", this.game, 0.5, BABYLON.Vector3.Right());
        this.wRightArrow.onMove = (delta) => {
            let dW = Math.round(delta.x);
            if (dW != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.w += dW;
                    this.wRightArrow.initPos.x += Math.sign(dW);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rX += dW;
                    this.wRightArrow.initPos.x += Math.sign(dW);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        };
        this.hBottomArrow = new Arrow(this, "hBottomArrow", this.game, 0.5, BABYLON.Vector3.Down());
        this.hBottomArrow.onMove = (delta) => {
            let dH = -Math.round(delta.y);
            if (dH != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.h += dH;
                    this.hBottomArrow.initPos.y -= Math.sign(dH);
                    this.onMove(0, 0, -dH);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rY += dH;
                    this.hBottomArrow.initPos.y -= Math.sign(dH);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        };
        this.hTopArrow = new Arrow(this, "hTopArrow", this.game, 0.5, BABYLON.Vector3.Up());
        this.hTopArrow.onMove = (delta, pos) => {
            let dH = Math.round(delta.y);
            if (dH != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.h += dH;
                    this.hTopArrow.initPos.y += Math.sign(dH);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rY += dH;
                    this.hTopArrow.initPos.y += Math.sign(dH);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        };
        this.dBackwardArrow = new Arrow(this, "dBackwardArrow", this.game, 0.5, BABYLON.Vector3.Backward());
        this.dBackwardArrow.onMove = (delta) => {
            let dD = -Math.round(delta.z);
            if (dD != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.d += dD;
                    this.dBackwardArrow.initPos.z -= Math.sign(dD);
                    this.onMove(0, -dD, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rZ += dD;
                    this.dBackwardArrow.initPos.z -= Math.sign(dD);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        };
        this.dForwardArrow = new Arrow(this, "dForwardArrow", this.game, 0.5, BABYLON.Vector3.Forward());
        this.dForwardArrow.onMove = (delta) => {
            let dD = Math.round(delta.z);
            if (dD != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.d += dD;
                    this.dForwardArrow.initPos.z += Math.sign(dD);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rZ += dD;
                    this.dForwardArrow.initPos.z += Math.sign(dD);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
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
        this.saveButton = document.querySelector("#prop-editor-save");
        this.saveButton.addEventListener("click", () => {
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                let data = this.game.terrain.chunckDataGenerator.prop.serialize();
                Nabu.download("new_prop.json", JSON.stringify(data));
            }
        });
        this.loadButton = document.querySelector("#prop-editor-load");
        this.loadButton.addEventListener("change", (event) => {
            console.log("alpha");
            let files = event.target.files;
            let file = files[0];
            if (file) {
                console.log("bravo");
                const reader = new FileReader();
                reader.addEventListener('load', (event) => {
                    console.log("charly");
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                        console.log("delta");
                        let data = JSON.parse(event.target.result);
                        this.game.terrain.chunckDataGenerator.prop.deserialize(data);
                        this.redraw();
                        this.regeneratePropMeshes();
                    }
                });
                reader.readAsText(file);
            }
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
        this.regeneratePropMeshes();
        this.updateArrows();
    }
    regeneratePropMeshes() {
        while (this.propShapeMeshes.length > 0) {
            this.propShapeMeshes.pop().dispose();
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
        else if (this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
            this.arrows.forEach(arrow => {
                arrow.isVisible = true;
            });
            this.wRightArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.wRightArrow.position.x += 1 + this._selectedPropShape.shape.rX;
            this.wLeftArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.wLeftArrow.position.x -= 1 + this._selectedPropShape.shape.rX;
            this.hTopArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.hTopArrow.position.y += 1 + this._selectedPropShape.shape.rY;
            this.hBottomArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.hBottomArrow.position.y -= 1 + this._selectedPropShape.shape.rY;
            this.dForwardArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.dForwardArrow.position.z += 1 + this._selectedPropShape.shape.rZ;
            this.dBackwardArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.dBackwardArrow.position.z -= 1 + this._selectedPropShape.shape.rZ;
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
        if (this._selectedPropShape && this.propShapeMeshes.length > 1) {
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
        this.setFloat("blockSize_m", 0.45);
        this.setTexture("noiseTexture", new BABYLON.Texture("./datas/textures/test-noise.png"));
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
class BrickMesh extends BABYLON.Mesh {
    constructor(brick) {
        super("brick");
        this.brick = brick;
    }
}
class Brick extends BABYLON.TransformNode {
    constructor(arg1, colorIndex) {
        super("brick");
        this.colorIndex = colorIndex;
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.index = Brick.BrickIdToIndex(arg1);
    }
    get isRoot() {
        return this.parent === undefined;
    }
    get root() {
        if (this.parent instanceof Brick) {
            return this.parent.root;
        }
        return this;
    }
    get brickName() {
        return BRICK_LIST[this.index];
    }
    static BrickIdToIndex(brickID) {
        if (typeof (brickID) === "number") {
            return brickID;
        }
        else {
            return BRICK_LIST.indexOf(brickID);
        }
    }
    dispose() {
        if (this.isRoot) {
            if (this.mesh) {
                this.mesh.dispose();
            }
        }
        else {
            let root = this.root;
            this.setParent(undefined);
            root.updateMesh();
        }
    }
    posWorldToLocal(pos) {
        let matrix = this.getWorldMatrix().invert();
        return BABYLON.Vector3.TransformCoordinates(pos, matrix);
    }
    async updateMesh() {
        if (this != this.root) {
            if (this.mesh) {
                this.mesh.dispose();
                this.mesh = undefined;
            }
            this.subMeshInfos = undefined;
            this.root.updateMesh();
            return;
        }
        this.computeWorldMatrix(true);
        let vDatas = [];
        this.subMeshInfos = [];
        await this.generateMeshVertexData(vDatas, this.subMeshInfos);
        let data = Brick.MergeVertexDatas(this.subMeshInfos, ...vDatas);
        Mummu.TranslateVertexDataInPlace(data, this.absolutePosition.scale(-1));
        Mummu.RotateVertexDataInPlace(data, this.absoluteRotationQuaternion.invert());
        if (!this.mesh) {
            this.mesh = new BrickMesh(this);
            this.mesh.position = this.position;
            this.mesh.rotationQuaternion = this.rotationQuaternion;
        }
        data.applyToMesh(this.mesh);
    }
    highlight() {
        if (this.mesh) {
            this.mesh.renderOutline = true;
            this.mesh.outlineColor = new BABYLON.Color3(0, 1, 1);
            this.mesh.outlineWidth = 0.01;
        }
    }
    unlight() {
        if (this.mesh) {
            this.mesh.renderOutline = false;
        }
    }
    async generateMeshVertexData(vDatas, subMeshInfos, depth = 0) {
        this.computeWorldMatrix(true);
        let template = await BrickTemplateManager.Instance.getTemplate(this.index);
        let vData = Mummu.CloneVertexData(template.vertexData);
        let colors = [];
        let color = Brick.depthColors[depth];
        for (let i = 0; i < vData.positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b, color.a);
        }
        vData.colors = colors;
        Mummu.RotateVertexDataInPlace(vData, this.absoluteRotationQuaternion);
        Mummu.TranslateVertexDataInPlace(vData, this.absolutePosition);
        vDatas.push(vData);
        subMeshInfos.push({ faceId: 0, brick: this });
        let children = this.getChildTransformNodes(true);
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child instanceof Brick) {
                await child.generateMeshVertexData(vDatas, subMeshInfos, depth + 1);
            }
        }
    }
    getBrickForFaceId(faceId) {
        for (let i = 0; i < this.subMeshInfos.length; i++) {
            if (this.subMeshInfos[i].faceId > faceId) {
                return this.subMeshInfos[i].brick;
            }
        }
    }
    static MergeVertexDatas(subMeshInfos, ...datas) {
        let mergedData = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let normals = [];
        let uvs = [];
        let colors = [];
        for (let i = 0; i < datas.length; i++) {
            let offset = positions.length / 3;
            positions.push(...datas[i].positions);
            indices.push(...datas[i].indices.map(index => { return index + offset; }));
            normals.push(...datas[i].normals);
            if (datas[i].uvs) {
                uvs.push(...datas[i].uvs);
            }
            if (datas[i].colors) {
                colors.push(...datas[i].colors);
            }
            subMeshInfos[i].faceId = indices.length / 3;
        }
        mergedData.positions = positions;
        mergedData.indices = indices;
        mergedData.normals = normals;
        if (uvs.length > 0) {
            mergedData.uvs = uvs;
        }
        if (colors.length > 0) {
            mergedData.colors = colors;
        }
        return mergedData;
    }
}
Brick.depthColors = [
    new BABYLON.Color4(1, 1, 1, 1),
    new BABYLON.Color4(1, 0, 0, 1),
    new BABYLON.Color4(0, 1, 0, 1),
    new BABYLON.Color4(0, 0, 1, 1),
    new BABYLON.Color4(1, 1, 0, 1),
    new BABYLON.Color4(0, 1, 1, 1),
    new BABYLON.Color4(1, 0, 1, 1),
    new BABYLON.Color4(1, 0.5, 0, 1),
    new BABYLON.Color4(0, 1, 0.5, 1),
    new BABYLON.Color4(0.5, 0, 1, 1),
    new BABYLON.Color4(1, 1, 0.5, 1),
    new BABYLON.Color4(0.5, 1, 1, 1),
    new BABYLON.Color4(1, 0.5, 1, 1),
    new BABYLON.Color4(0.2, 0.2, 0.2, 1)
];
var BRICK_LIST = [
    "plate_1x1",
    "plate_2x1",
    "plate_3x1",
    "plate_4x1",
    "brick_1x1",
    "brick_2x1",
    "brick_3x1",
    "brick_4x1",
];
class BrickTemplateManager {
    constructor(vertexDataLoader) {
        this.vertexDataLoader = vertexDataLoader;
        this._templates = [];
    }
    static get Instance() {
        if (!BrickTemplateManager._Instance) {
            BrickTemplateManager._Instance = new BrickTemplateManager(Game.Instance.vertexDataLoader);
        }
        return BrickTemplateManager._Instance;
    }
    async getTemplate(index) {
        if (!this._templates[index]) {
            this._templates[index] = await this.createTemplate(index);
        }
        return this._templates[index];
    }
    async createTemplate(index) {
        let template = new BrickTemplate(index, this);
        await template.load();
        return template;
    }
}
class BrickTemplate {
    constructor(index, brickTemplateManager) {
        this.index = index;
        this.brickTemplateManager = brickTemplateManager;
    }
    get name() {
        return BRICK_LIST[this.index];
    }
    async load() {
        //this.vertexData = (await this.brickTemplateManager.vertexDataLoader.get("./datas/meshes/plate_1x1.babylon"))[0];
        if (this.name.startsWith("brick_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetStuddedBoxVertexData(l, 3, w);
        }
        else if (this.name.startsWith("plate_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetStuddedBoxVertexData(l, 1, w);
        }
        else {
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(1, 1, 1);
        }
    }
}
var BRICK_S = 0.375;
var BRICK_H = 0.15;
class BrickVertexDataGenerator {
    static GetStudVertexData() {
        if (!BrickVertexDataGenerator._StudVertexData) {
            BrickVertexDataGenerator._StudVertexData = new BABYLON.VertexData();
            BrickVertexDataGenerator._StudVertexData.positions = [
                0, 0.079, 0.1125, 0.0795, 0, 0.0795, 0, 0, 0.1125, 0.1125, 0.079, 0, 0.0795, 0, -0.0795, 0.1125, 0, 0, 0, 0.079, -0.1125, -0.0795, 0, -0.0795, 0, 0, -0.1125, -0.1125, 0.079, 0, -0.0795, 0, 0.0795, -0.1125, 0, 0, 0.0795, 0.079, 0.0795, 0.0795, 0.079, -0.0795, -0.0795, 0.079, -0.0795, -0.0795, 0.079, 0.0795, -0.1125, 0.079, 0, 0, 0.079, 0, -0.0795, 0.079, 0.0795, 0.0795, 0.079,
                0.0795, 0.1125, 0.079, 0, 0.0795, 0.079, -0.0795, 0, 0.079, -0.1125, -0.0795, 0.079, -0.0795, 0, 0.079, 0.1125,
            ];
            BrickVertexDataGenerator._StudVertexData.normals = [0, 0, 1, 0.707, 0, 0.707, 0, 0, 1, 1, 0, 0, 0.707, 0, -0.707, 1, 0, 0, 0, 0, -1, -0.707, 0, -0.707, 0, 0, -1, -1, 0, 0, -0.707, 0, 0.707, -1, 0, 0, 0.707, 0, 0.707, 0.707, 0, -0.707, -0.707, 0, -0.707, -0.707, 0, 0.707, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
            BrickVertexDataGenerator._StudVertexData.uvs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            BrickVertexDataGenerator._StudVertexData.indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 1, 13, 8, 4, 14, 11, 7, 15, 2, 10, 16, 17, 18, 19, 17, 20, 21, 17, 22, 23, 17, 16, 18, 17, 24, 24, 17, 19, 20, 17, 21, 22, 17, 23, 0, 12, 1, 3, 13, 4, 6, 14, 7, 9, 15, 10, 12, 3, 5, 13, 6, 8, 14, 9, 11, 15, 0, 2];
        }
        return BrickVertexDataGenerator._StudVertexData;
    }
    static GetBoxVertexData(length, height, width) {
        let xMin = -BRICK_S * 0.5;
        let yMin = 0;
        let zMin = -BRICK_S * 0.5;
        let xMax = xMin + width * BRICK_S;
        let yMax = yMin + height * BRICK_H;
        let zMax = zMin + length * BRICK_S;
        let back = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMin, zMin),
            p2: new BABYLON.Vector3(xMax, yMin, zMin),
            p3: new BABYLON.Vector3(xMax, yMax, zMin),
            p4: new BABYLON.Vector3(xMin, yMax, zMin)
        });
        let right = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMin),
            p2: new BABYLON.Vector3(xMax, yMin, zMax),
            p3: new BABYLON.Vector3(xMax, yMax, zMax),
            p4: new BABYLON.Vector3(xMax, yMax, zMin)
        });
        let front = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMax),
            p2: new BABYLON.Vector3(xMin, yMin, zMax),
            p3: new BABYLON.Vector3(xMin, yMax, zMax),
            p4: new BABYLON.Vector3(xMax, yMax, zMax)
        });
        let left = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMin, zMax),
            p2: new BABYLON.Vector3(xMin, yMin, zMin),
            p3: new BABYLON.Vector3(xMin, yMax, zMin),
            p4: new BABYLON.Vector3(xMin, yMax, zMax)
        });
        let top = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMax, zMin),
            p2: new BABYLON.Vector3(xMax, yMax, zMin),
            p3: new BABYLON.Vector3(xMax, yMax, zMax),
            p4: new BABYLON.Vector3(xMin, yMax, zMax)
        });
        let bottom = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMin),
            p2: new BABYLON.Vector3(xMin, yMin, zMin),
            p3: new BABYLON.Vector3(xMin, yMin, zMax),
            p4: new BABYLON.Vector3(xMax, yMin, zMax)
        });
        return Mummu.MergeVertexDatas(back, right, front, left, top, bottom);
    }
    static GetStuddedBoxVertexData(length, height, width) {
        let boxData = BrickVertexDataGenerator.GetBoxVertexData(length, height, width);
        let yMax = height * BRICK_H;
        let studDatas = [];
        for (let z = 0; z < length; z++) {
            for (let x = 0; x < width; x++) {
                let studData = Mummu.CloneVertexData(BrickVertexDataGenerator.GetStudVertexData());
                Mummu.TranslateVertexDataInPlace(studData, new BABYLON.Vector3(x * BRICK_S, yMax, z * BRICK_S));
                studDatas.push(studData);
            }
        }
        return Mummu.MergeVertexDatas(boxData, ...studDatas);
    }
}
class Player extends BABYLON.Mesh {
    constructor(game) {
        super("player");
        this.game = game;
        this.mass = 2;
        this.height = 2;
        this.velocity = BABYLON.Vector3.Zero();
        this.frozen = true;
        this.speed = 3;
        this.rSpeed = Math.PI;
        this.inputZ = 0;
        this.inputX = 0;
        this.inputRY = 0;
        this.inputRX = 0;
        this.inputDeltaX = 0;
        this.inputDeltaY = 0;
        this.currentChuncks = [];
        let body = Mummu.CreateBeveledBox("body", { width: 1, height: this.height - 0.2, depth: 1 });
        body.isVisible = false;
        body.position.y = -this.height * 0.5 - 0.1;
        body.parent = this;
        this.head = new BABYLON.Mesh("head");
        this.head.parent = this;
        this.inventory = new PlayerInventory(this);
        this.defaultAction = PlayerActionDefault.Create(this);
    }
    get currentAction() {
        return this._currentAction;
    }
    set currentAction(action) {
        if (action) {
            console.log("set current action " + action.name);
        }
        else {
            console.log("set current action undefined");
        }
        if (this._currentAction && this._currentAction.onUnequip) {
            console.log("unequip " + ((this._currentAction != undefined) ? this._currentAction.name : "undefined"));
            this._currentAction.onUnequip();
        }
        else {
            console.log("no unequip callback");
        }
        this._currentAction = action;
        if (this._currentAction && this._currentAction.onEquip) {
            console.log("equip " + ((this._currentAction != undefined) ? this._currentAction.name : "undefined"));
            this._currentAction.onEquip();
        }
        else {
            console.log("no equip callback");
        }
    }
    update(dt) {
        if (this.controler) {
            this.controler.update(dt);
        }
        let currentChunck = this.game.terrain.getChunckAtPos(this.position, 0);
        if (currentChunck != this.currentChunck) {
            this.currentChunck = currentChunck;
            this.updateCurrentChuncks();
        }
        if (this.currentAction) {
            this.currentAction.onUpdate(this.currentChuncks);
        }
        else {
            this.defaultAction.onUpdate(this.currentChuncks);
        }
        let ray = new BABYLON.Ray(this.position, new BABYLON.Vector3(0, -1, 0));
        let bestPick;
        for (let i = 0; i < this.currentChuncks.length; i++) {
            let chunck = this.currentChuncks[i];
            if (chunck && chunck.mesh) {
                let pick = ray.intersectsMesh(chunck.mesh);
                if (pick.hit) {
                    bestPick = pick;
                    break;
                }
            }
        }
        this.velocity.x = 0;
        this.velocity.z = 0;
        let inputL = Math.sqrt(this.inputX * this.inputX + this.inputZ * this.inputZ);
        if (inputL > this.speed) {
            this.inputX /= inputL * this.speed;
            this.inputZ /= inputL * this.speed;
        }
        this.velocity.addInPlace(this.getDirection(BABYLON.Axis.X).scale(this.inputX).scale(this.speed));
        this.velocity.addInPlace(this.getDirection(BABYLON.Axis.Z).scale(this.inputZ).scale(this.speed));
        this.rotation.y += this.rSpeed * this.inputRY * dt;
        this.head.rotation.x += this.rSpeed * this.inputRX * dt;
        this.head.rotation.x = Nabu.MinMax(this.head.rotation.x, -Math.PI * 0.5, Math.PI * 0.5);
        if (this.inputDeltaX != 0) {
            this.rotation.y += this.inputDeltaX / 500;
            this.inputDeltaX = 0;
        }
        if (this.inputDeltaY != 0) {
            this.head.rotation.x += this.inputDeltaY / 500;
            this.inputDeltaY = 0;
        }
        if (bestPick && bestPick.hit) {
            if (bestPick.distance <= this.height) {
                this.velocity.y = (this.height - bestPick.distance);
            }
            else {
                this.velocity.y -= this.mass * 9.2 * dt;
            }
            this.position.addInPlace(this.velocity.scale(dt));
        }
        else {
            if (this.position.y < 100) {
                this.position.y += 0.1;
            }
            if (this.position.y < 0) {
                this.position.y = 100;
            }
        }
    }
    updateCurrentChuncks() {
        this.currentChuncks = [];
        if (this.currentChunck) {
            for (let i = 0; i <= 2; i++) {
                for (let j = 0; j <= 2; j++) {
                    this.currentChuncks[i + 3 * j] = this.game.terrain.getChunck(0, this.currentChunck.iPos - 1 + i, this.currentChunck.jPos - 1 + j);
                }
            }
        }
    }
}
class PlayerActionManager {
    constructor(player, game) {
        this.player = player;
        this.game = game;
        this.alwaysEquip = true;
        this.linkedActions = [];
        this.currentActionIndex = -1;
        this.update = () => {
        };
        player.playerActionManager = this;
    }
    get playerActionView() {
        return this.game.playerActionView;
    }
    prevActionIndex() {
        if (this.currentActionIndex === 1) {
            return -1;
        }
        if (this.currentActionIndex === 0) {
            return 9;
        }
        if (this.currentActionIndex === 10) {
            return 0;
        }
        return this.currentActionIndex - 1;
    }
    nextActionIndex() {
        if (this.currentActionIndex === -1) {
            return 1;
        }
        if (this.currentActionIndex === 9) {
            return 0;
        }
        if (this.currentActionIndex === 0) {
            return 10;
        }
        return this.currentActionIndex + 1;
    }
    initialize() {
        let savedPlayerActionString = window.localStorage.getItem("player-action-manager");
        if (savedPlayerActionString) {
            let savedPlayerAction = JSON.parse(savedPlayerActionString);
            this.deserializeInPlace(savedPlayerAction);
        }
        this.game.scene.onBeforeRenderObservable.add(this.update);
    }
    linkAction(action, slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.linkedActions[slotIndex] = action;
            this.playerActionView.onActionLinked(action, slotIndex);
            /*
            if (Config.saveConfiguration.useLocalStorage) {
                window.localStorage.setItem("player-action-manager", JSON.stringify(this.serialize()));
            }
            */
        }
    }
    unlinkAction(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.linkedActions[slotIndex] = undefined;
            this.playerActionView.onActionUnlinked(slotIndex);
            /*
            if (Config.saveConfiguration.useLocalStorage) {
                window.localStorage.setItem("player-action-manager", JSON.stringify(this.serialize()));
            }
            */
        }
    }
    setActionIndex(slotIndex) {
        this.playerActionView.unlight(this.currentActionIndex);
        this.currentActionIndex = Nabu.MinMax(slotIndex, -1, 10);
        if (this.alwaysEquip || this.player.currentAction) {
            this.unEquipAction();
            this.equipAction();
        }
        this.playerActionView.highlight(this.currentActionIndex);
    }
    toggleEquipAction() {
        if (this.player.currentAction) {
            this.unEquipAction();
        }
        else {
            this.equipAction();
        }
    }
    equipAction() {
        this.player.currentAction = this.linkedActions[this.currentActionIndex];
        if (this.player.currentAction) {
            this.playerActionView.onActionEquiped(this.currentActionIndex);
        }
        else {
            this.playerActionView.onActionEquiped(-1);
        }
    }
    unEquipAction() {
        if (this.player.currentAction) {
            this.player.currentAction = undefined;
            this.playerActionView.onActionEquiped(-1);
        }
    }
    serialize() {
        let linkedActionsNames = [];
        for (let i = 0; i < this.linkedActions.length; i++) {
            if (this.linkedActions[i]) {
                linkedActionsNames[i] = this.linkedActions[i].item.name;
            }
        }
        return {
            linkedItemNames: linkedActionsNames
        };
    }
    deserializeInPlace(data) {
        if (data && data.linkedItemNames) {
            for (let i = 0; i < data.linkedItemNames.length; i++) {
                let linkedItemName = data.linkedItemNames[i];
            }
        }
    }
}
class PlayerActionView {
    constructor() {
        this._tiles = [];
    }
    getTile(slotIndex) {
        if (slotIndex < 0 || slotIndex > 9) {
            return undefined;
        }
        if (!this._tiles[slotIndex]) {
            this._tiles[slotIndex] = document.querySelector("#action-" + slotIndex.toFixed(0));
        }
        return this._tiles[slotIndex];
    }
    highlight(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.classList.add("highlit");
            }
        }
    }
    unlight(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.classList.remove("highlit");
            }
        }
    }
    equip(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.classList.add("equiped");
            }
        }
    }
    unEquip(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.classList.remove("equiped");
            }
        }
    }
    onActionEquiped(slotIndex) {
        for (let i = 0; i <= 9; i++) {
            this.unEquip(i);
        }
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.equip(slotIndex);
        }
    }
    onHintStart(slotIndex) {
    }
    onHintEnd(slotIndex) {
    }
    onActionLinked(action, slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.style.backgroundColor = action.backgroundColor;
            }
        }
    }
    onActionUnlinked(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.style.backgroundColor = undefined;
            }
        }
    }
}
class PlayerAction {
    constructor(name, player) {
        this.name = name;
        this.player = player;
        this.backgroundColor = "#ffffff";
        this.r = 0;
    }
}
class PlayerControler {
    constructor(player) {
        this.player = player;
        this._pointerIsDown = false;
        this.gamepadInControl = false;
        this._pointerDown = (event) => {
            this._pointerDownTime = performance.now();
            if (!this.player.game.router.inPlayMode) {
                return;
            }
            this._pointerIsDown = true;
            if (this.player.currentAction) {
                if (event.button === 0) {
                    if (this.player.currentAction.onPointerDown) {
                        this.player.currentAction.onPointerDown(this.player.currentChuncks);
                    }
                }
                else if (event.button === 2) {
                    if (this.player.currentAction.onRightPointerDown) {
                        this.player.currentAction.onRightPointerDown(this.player.currentChuncks);
                    }
                }
            }
            else {
                if (event.button === 0) {
                    if (this.player.defaultAction.onPointerDown) {
                        this.player.defaultAction.onPointerDown(this.player.currentChuncks);
                    }
                }
                else if (event.button === 2) {
                    if (this.player.defaultAction.onRightPointerDown) {
                        this.player.defaultAction.onRightPointerDown(this.player.currentChuncks);
                    }
                }
            }
        };
        this._pointerMove = (event) => {
            if (!this.player.game.router.inPlayMode) {
                return;
            }
            if (this._pointerIsDown || this.inputManager.isPointerLocked) {
                this.gamepadInControl = false;
                this.player.inputDeltaX += event.movementX;
                this.player.inputDeltaY += event.movementY;
            }
        };
        this._pointerUp = (event) => {
            if (!this.player.game.router.inPlayMode) {
                return;
            }
            this._pointerIsDown = false;
            let duration = (performance.now() - this._pointerDownTime) / 1000;
            if (this.player.currentAction) {
                if (event.button === 0) {
                    if (this.player.currentAction.onPointerUp) {
                        this.player.currentAction.onPointerUp(duration, this.player.currentChuncks);
                    }
                }
                else if (event.button === 2) {
                    if (this.player.currentAction.onRightPointerUp) {
                        this.player.currentAction.onRightPointerUp(duration, this.player.currentChuncks);
                    }
                }
            }
            else {
                if (event.button === 0) {
                    if (this.player.defaultAction.onPointerUp) {
                        this.player.defaultAction.onPointerUp(duration, this.player.currentChuncks);
                    }
                }
                else if (event.button === 2) {
                    if (this.player.defaultAction.onRightPointerUp) {
                        this.player.defaultAction.onRightPointerUp(duration, this.player.currentChuncks);
                    }
                }
            }
        };
        player.controler = this;
        window.addEventListener("pointerdown", this._pointerDown);
        window.addEventListener("pointermove", this._pointerMove);
        window.addEventListener("pointerup", this._pointerUp);
        this.aim = document.createElement("canvas");
        this.aim.width = 21;
        this.aim.height = 21;
        document.body.appendChild(this.aim);
        let context = this.aim.getContext("2d");
        context.fillStyle = "#00ff00";
        context.fillRect(0, 10, 21, 1);
        context.fillRect(10, 0, 1, 21);
        this.aim.style.zIndex = "10";
        this.aim.style.position = "fixed";
        this.aim.style.pointerEvents = "none";
    }
    get inputManager() {
        return this.player.game.inputManager;
    }
    get playerActionView() {
        return this.player.game.playerActionView;
    }
    get playerInventoryView() {
        return this.player.game.playerInventoryView;
    }
    initialize() {
        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION, () => {
            if (!this.playerInventoryView.shown) {
                if (this.player.currentAction) {
                    this.player.currentAction.onPointerDown(this.player.currentChuncks);
                }
                else if (this.player.defaultAction.onPointerDown) {
                    this.player.defaultAction.onPointerDown(this.player.currentChuncks);
                }
            }
        });
        for (let slotIndex = 0; slotIndex < 10; slotIndex++) {
            this.inputManager.addMappedKeyDownListener(KeyInput.ACTION_SLOT_0 + slotIndex, () => {
                if (this.player.playerActionManager) {
                    if (slotIndex === this.player.playerActionManager.currentActionIndex) {
                        this.player.playerActionManager.toggleEquipAction();
                    }
                    else {
                        this.player.playerActionManager.setActionIndex(slotIndex);
                        this.player.playerActionManager.equipAction();
                    }
                }
            });
        }
        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_EQUIP, () => {
            if (!this.playerInventoryView.shown) {
                if (this.player.playerActionManager) {
                    this.player.playerActionManager.toggleEquipAction();
                }
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_DEC, () => {
            if (this.player.playerActionManager) {
                this.player.playerActionManager.setActionIndex(this.player.playerActionManager.prevActionIndex());
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION_INC, () => {
            if (this.player.playerActionManager) {
                this.player.playerActionManager.setActionIndex(this.player.playerActionManager.nextActionIndex());
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY, () => {
            if (this.playerInventoryView.shown) {
                this.playerInventoryView.hide(0.2);
            }
            else {
                this.playerInventoryView.show(0.2);
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_PREV_CAT, () => {
            if (this.playerInventoryView.shown) {
                this.playerInventoryView.setCurrentCategory(this.playerInventoryView.prevCategory);
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_NEXT_CAT, () => {
            if (this.playerInventoryView.shown) {
                this.playerInventoryView.setCurrentCategory(this.playerInventoryView.nextCategory);
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_EQUIP_ITEM, () => {
            if (this.playerInventoryView.shown) {
                let item = this.playerInventoryView.getCurrentItem();
                if (item) {
                    let action = item.getPlayerAction(this.player);
                    this.player.playerActionManager.linkAction(action, this.player.playerActionManager.currentActionIndex);
                    if (this.player.playerActionManager.alwaysEquip) {
                        this.player.playerActionManager.equipAction();
                    }
                }
            }
        });
    }
    update(dt) {
        this.player.inputX = 0;
        this.player.inputZ = 0;
        if (this.playerInventoryView.shown) {
            this.playerInventoryView.update(dt);
            this.gamepadInControl = false;
        }
        else if (this.player.game.router.inPlayMode) {
            if (this.inputManager.isKeyInputDown(KeyInput.MOVE_FORWARD)) {
                this.player.inputZ += 1;
                this.gamepadInControl = false;
            }
            if (this.inputManager.isKeyInputDown(KeyInput.MOVE_BACK)) {
                this.player.inputZ -= 1;
                this.gamepadInControl = false;
            }
            if (this.inputManager.isKeyInputDown(KeyInput.MOVE_RIGHT)) {
                this.player.inputX += 1;
                this.gamepadInControl = false;
            }
            if (this.inputManager.isKeyInputDown(KeyInput.MOVE_LEFT)) {
                this.player.inputX -= 1;
                this.gamepadInControl = false;
            }
            let gamepads = navigator.getGamepads();
            let gamepad = gamepads[0];
            if (gamepad) {
                let axis0 = Nabu.InputManager.DeadZoneAxis(gamepad.axes[0]);
                let axis1 = -Nabu.InputManager.DeadZoneAxis(gamepad.axes[1]);
                let axis2 = Nabu.InputManager.DeadZoneAxis(gamepad.axes[2]);
                let axis3 = Nabu.InputManager.DeadZoneAxis(gamepad.axes[3]);
                this.gamepadInControl = this.gamepadInControl || (axis0 != 0);
                this.gamepadInControl = this.gamepadInControl || (axis1 != 0);
                this.gamepadInControl = this.gamepadInControl || (axis2 != 0);
                this.gamepadInControl = this.gamepadInControl || (axis3 != 0);
                if (this.gamepadInControl) {
                    this.player.inputX = axis0;
                    this.player.inputZ = axis1;
                    this.player.inputRY = axis2;
                    this.player.inputRX = axis3;
                }
            }
        }
        else {
            this.gamepadInControl = false;
        }
        if (this.playerInventoryView.shown) {
            this.aim.style.display = "none";
            document.body.style.cursor = "auto";
        }
        else if (this.gamepadInControl || this.inputManager.isPointerLocked) {
            this.aim.style.top = (window.innerHeight * 0.5 - 10).toFixed(0) + "px";
            this.aim.style.left = (window.innerWidth * 0.5 - 10).toFixed(0) + "px";
            this.aim.style.display = "block";
            document.body.style.cursor = "none";
        }
        else {
            this.aim.style.display = "none";
            document.body.style.cursor = "auto";
        }
    }
}
var InventoryCategory;
(function (InventoryCategory) {
    InventoryCategory[InventoryCategory["Block"] = 0] = "Block";
    InventoryCategory[InventoryCategory["Brick"] = 1] = "Brick";
    InventoryCategory[InventoryCategory["Ingredient"] = 2] = "Ingredient";
    InventoryCategory[InventoryCategory["End"] = 3] = "End";
})(InventoryCategory || (InventoryCategory = {}));
class PlayerInventoryItem {
    constructor(name, category) {
        this.count = 1;
        this.name = name;
        this.category = category;
    }
    getPlayerAction(player) {
        if (this.category === InventoryCategory.Block) {
            let block = Kulla.BlockTypeNames.indexOf(this.name);
            if (block >= Kulla.BlockType.None && block < Kulla.BlockType.Unknown) {
                return PlayerActionTemplate.CreateBlockAction(player, block);
            }
        }
        else if (this.category === InventoryCategory.Brick) {
            return PlayerActionTemplate.CreateBrickAction(this.name, player);
        }
    }
}
class PlayerInventory {
    constructor(player) {
        this.player = player;
        this.items = [];
    }
    addItem(item) {
        let existingItem = this.items.find(it => { return it.name === item.name; });
        if (existingItem) {
            existingItem.count += item.count;
        }
        else {
            this.items.push(item);
        }
    }
}
class PlayerInventoryLine extends HTMLDivElement {
    constructor() {
        super();
    }
}
customElements.define("inventory-line", PlayerInventoryLine, { extends: "div" });
class PlayerInventoryView extends HTMLElement {
    constructor() {
        super(...arguments);
        this._loaded = false;
        this._shown = false;
        this.currentPointers = [0, 0, 0];
        this._currentCategory = InventoryCategory.Block;
        this._timer = 0;
    }
    static get observedAttributes() {
        return [];
    }
    get shown() {
        return this._shown;
    }
    get onLoad() {
        return this._onLoad;
    }
    set onLoad(callback) {
        this._onLoad = callback;
        if (this._loaded) {
            this._onLoad();
        }
    }
    currentPointerUp() {
        if (this._lines[this._currentCategory].length > 0) {
            this.setPointer((this.currentPointers[this._currentCategory] - 1 + this._lines[this._currentCategory].length) % this._lines[this._currentCategory].length);
        }
    }
    currentPointerDown() {
        if (this._lines[this._currentCategory].length > 0) {
            this.setPointer((this.currentPointers[this._currentCategory] + 1) % this._lines[this._currentCategory].length);
        }
    }
    setPointer(n, cat) {
        if (!isFinite(cat)) {
            cat = this._currentCategory;
        }
        if (this._lines[cat][this.currentPointers[cat]]) {
            this._lines[cat][this.currentPointers[cat]].classList.remove("highlit");
        }
        this.currentPointers[cat] = n;
        if (this._lines[cat][this.currentPointers[cat]]) {
            this._lines[cat][this.currentPointers[cat]].classList.add("highlit");
        }
    }
    setCurrentCategory(cat) {
        this._currentCategory = cat;
        for (let i = 0; i < this._categoryBtns.length; i++) {
            this._makeCategoryBtnInactive(this._categoryBtns[i]);
            this._containers[i].style.display = "none";
        }
        this._makeCategoryBtnActive(this._categoryBtns[this._currentCategory]);
        this._containers[this._currentCategory].style.display = "block";
    }
    getCurrentItem() {
        if (this._lines[this._currentCategory]) {
            if (this._lines[this._currentCategory][this.currentPointers[this._currentCategory]]) {
                return this._lines[this._currentCategory][this.currentPointers[this._currentCategory]].item;
            }
        }
    }
    get prevCategory() {
        return (this._currentCategory - 1 + InventoryCategory.End) % InventoryCategory.End;
    }
    get nextCategory() {
        return (this._currentCategory + 1) % InventoryCategory.End;
    }
    _makeCategoryBtnStyle(btn) {
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
    _makeCategoryBtnActive(btn) {
        btn.style.borderLeft = "2px solid white";
        btn.style.borderTop = "2px solid white";
        btn.style.borderRight = "2px solid white";
        btn.style.color = "#272b2e";
        btn.style.backgroundColor = "white";
        btn.style.fontWeight = "bold";
    }
    _makeCategoryBtnInactive(btn) {
        btn.style.borderLeft = "2px solid #7F7F7F";
        btn.style.borderTop = "2px solid #7F7F7F";
        btn.style.borderRight = "2px solid #7F7F7F";
        btn.style.borderBottom = "";
        btn.style.color = "#7F7F7F";
        btn.style.backgroundColor = "";
        btn.style.fontWeight = "";
    }
    connectedCallback() {
        this.style.display = "none";
        this.style.opacity = "0";
        this._title = document.createElement("h1");
        this._title.classList.add("inventory-page-title");
        this._title.innerHTML = "INVENTORY";
        this.appendChild(this._title);
        let categoriesContainer;
        categoriesContainer = document.createElement("div");
        this.appendChild(categoriesContainer);
        this._categoryBlocksBtn = document.createElement("div");
        this._categoryBlocksBtn.innerHTML = "BLOCKS";
        categoriesContainer.appendChild(this._categoryBlocksBtn);
        this._makeCategoryBtnStyle(this._categoryBlocksBtn);
        this._categoryBlocksBtn.onclick = () => {
            this.setCurrentCategory(InventoryCategory.Block);
        };
        this._categoryBricksBtn = document.createElement("div");
        this._categoryBricksBtn.innerHTML = "BRICKS";
        categoriesContainer.appendChild(this._categoryBricksBtn);
        this._makeCategoryBtnStyle(this._categoryBricksBtn);
        this._categoryBricksBtn.onclick = () => {
            this.setCurrentCategory(InventoryCategory.Brick);
        };
        this._categoryIngredientsBtn = document.createElement("div");
        this._categoryIngredientsBtn.innerHTML = "INGREDIENTS";
        categoriesContainer.appendChild(this._categoryIngredientsBtn);
        this._makeCategoryBtnStyle(this._categoryIngredientsBtn);
        this._categoryIngredientsBtn.onclick = () => {
            this.setCurrentCategory(InventoryCategory.Ingredient);
        };
        this._categoryBtns = [
            this._categoryBlocksBtn,
            this._categoryBricksBtn,
            this._categoryIngredientsBtn,
        ];
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
    attributeChangedCallback(name, oldValue, newValue) { }
    async show(duration = 1) {
        this.createPage();
        return new Promise((resolve) => {
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
                    }
                    else {
                        let f = dt / duration;
                        this.style.opacity = ((1 - f) * opacity0 + f * opacity1).toFixed(2);
                        requestAnimationFrame(step);
                    }
                };
                step();
            }
        });
    }
    async hide(duration = 1) {
        if (duration === 0) {
            this._shown = false;
            this.style.display = "none";
            this.style.opacity = "0";
        }
        else {
            return new Promise((resolve) => {
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
                        }
                        else {
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
    setInventory(inventory) {
        this.inventory = inventory;
    }
    createPage() {
        this._lines = [];
        for (let i = 0; i < this._containers.length; i++) {
            this._containers[i].innerHTML = "";
            this._lines[i] = [];
        }
        for (let i = 0; i < this.inventory.items.length; i++) {
            let inventoryItem = this.inventory.items[i];
            let line = document.createElement("div");
            line.setAttribute("is", "inventory-line");
            line.item = inventoryItem;
            line.classList.add("line");
            this._containers[inventoryItem.category].appendChild(line);
            this._lines[inventoryItem.category].push(line);
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
        this.setPointer(0, InventoryCategory.Block);
        this.setPointer(0, InventoryCategory.Brick);
        this.setPointer(0, InventoryCategory.Ingredient);
    }
    update(dt) {
        if (this._timer > 0) {
            this._timer -= dt;
        }
        let gamepads = navigator.getGamepads();
        let gamepad = gamepads[0];
        if (gamepad) {
            let axis1 = -Nabu.InputManager.DeadZoneAxis(gamepad.axes[1]);
            if (axis1 > 0.5) {
                if (this._timer <= 0) {
                    this.currentPointerUp();
                    this._timer = 0.5;
                }
            }
            else if (axis1 < -0.5) {
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
customElements.define("inventory-page", PlayerInventoryView);
class PlayerActionDefault {
    static Create(player) {
        let brickAction = new PlayerAction("default-action", player);
        brickAction.backgroundColor = "#FF00FF";
        brickAction.iconUrl = "";
        let aimedBrickRoot;
        let setAimedBrickRoot = (b) => {
            if (b != aimedBrickRoot) {
                if (aimedBrickRoot) {
                    aimedBrickRoot.unlight();
                }
                aimedBrickRoot = b;
                if (aimedBrickRoot) {
                    aimedBrickRoot.highlight();
                }
            }
        };
        let aimedBrick;
        let setAimedBrick = (b) => {
            if (b != aimedBrick) {
                aimedBrick = b;
            }
        };
        brickAction.onUpdate = () => {
            if (player.game.router.inPlayMode) {
                let x;
                let y;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(x, y, (mesh) => {
                    return mesh instanceof BrickMesh;
                });
                if (hit.hit && hit.pickedPoint) {
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let brickRoot = hit.pickedMesh.brick.root;
                        if (brickRoot) {
                            setAimedBrickRoot(brickRoot);
                            let brick = brickRoot.getBrickForFaceId(hit.faceId);
                            if (brick) {
                                setAimedBrick(brick);
                            }
                            return;
                        }
                    }
                }
            }
            setAimedBrickRoot(undefined);
            setAimedBrick(undefined);
        };
        brickAction.onPointerUp = () => {
            if (aimedBrickRoot) {
                player.currentAction = PlayerActionMoveBrick.Create(player, aimedBrickRoot);
            }
        };
        brickAction.onRightPointerUp = () => {
            if (aimedBrick) {
                let prevParent = aimedBrick.parent;
                if (prevParent instanceof Brick) {
                    aimedBrick.setParent(undefined);
                    aimedBrick.updateMesh();
                    prevParent.updateMesh();
                }
            }
        };
        brickAction.onUnequip = () => {
            setAimedBrickRoot(undefined);
        };
        return brickAction;
    }
}
class PlayerActionMoveBrick {
    static Create(player, brick) {
        let brickAction = new PlayerAction("move-brick-action", player);
        brickAction.backgroundColor = "#FF00FF";
        brickAction.iconUrl = "";
        let initPos = brick.root.position.clone();
        brickAction.onUpdate = () => {
            let terrain = player.game.terrain;
            if (player.game.router.inPlayMode) {
                let x;
                let y;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(x, y, (mesh) => {
                    return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || (mesh instanceof BrickMesh && mesh.brick != brick);
                });
                if (hit && hit.pickedPoint) {
                    let n = hit.getNormal(true).scaleInPlace(0.05);
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let root = hit.pickedMesh.brick.root;
                        let rootPosition = root.position;
                        let dp = hit.pickedPoint.add(n).subtract(rootPosition);
                        dp.x = terrain.blockSizeIJ_m * Math.round(dp.x / terrain.blockSizeIJ_m);
                        dp.y = (terrain.blockSizeK_m / 3) * Math.floor(dp.y / (terrain.blockSizeK_m / 3));
                        dp.z = terrain.blockSizeIJ_m * Math.round(dp.z / terrain.blockSizeIJ_m);
                        brick.root.position.copyFrom(dp);
                        brick.root.position.addInPlace(rootPosition);
                        return;
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            brick.root.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                            return;
                        }
                    }
                }
            }
        };
        brickAction.onPointerUp = (duration) => {
            let terrain = player.game.terrain;
            if (player.game.router.inPlayMode) {
                let x;
                let y;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(x, y, (mesh) => {
                    return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || (mesh instanceof BrickMesh && mesh.brick != brick);
                });
                if (hit && hit.pickedPoint) {
                    let n = hit.getNormal(true).scaleInPlace(0.05);
                    if (hit.pickedMesh instanceof BrickMesh) {
                        if (duration > 0.3) {
                            let root = hit.pickedMesh.brick.root;
                            let aimedBrick = root.getBrickForFaceId(hit.faceId);
                            brick.setParent(aimedBrick);
                            brick.updateMesh();
                        }
                        else {
                            let root = hit.pickedMesh.brick.root;
                            let rootPosition = root.position;
                            let dp = hit.pickedPoint.add(n).subtract(rootPosition);
                            dp.x = terrain.blockSizeIJ_m * Math.round(dp.x / terrain.blockSizeIJ_m);
                            dp.y = (terrain.blockSizeK_m / 3) * Math.floor(dp.y / (terrain.blockSizeK_m / 3));
                            dp.z = terrain.blockSizeIJ_m * Math.round(dp.z / terrain.blockSizeIJ_m);
                            brick.root.position.copyFrom(dp);
                            brick.root.position.addInPlace(rootPosition);
                        }
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            brick.root.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                        }
                    }
                }
            }
            player.currentAction = undefined;
        };
        let rotateBrick = () => {
            if (brick) {
                let quat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
                quat.multiplyToRef(brick.rotationQuaternion, brick.rotationQuaternion);
            }
        };
        let deleteBrick = () => {
            if (brick) {
                brick.dispose();
                player.currentAction = undefined;
            }
        };
        brickAction.onEquip = () => {
            player.game.inputManager.addMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
            player.game.inputManager.addMappedKeyDownListener(KeyInput.DELETE_SELECTED, deleteBrick);
        };
        brickAction.onUnequip = () => {
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.DELETE_SELECTED, deleteBrick);
        };
        return brickAction;
    }
}
var ACTIVE_DEBUG_PLAYER_ACTION = true;
var ADD_BRICK_ANIMATION_DURATION = 1000;
class PlayerActionTemplate {
    static async AddTmpObjectAction(player, tmpObjectName) {
        return undefined;
        /*
        let action = new PlayerAction(tmpObjectName, player);
        action.iconUrl = "/datas/images/qmark.png";

        let previewTmpObject: TmpObject;

        action.onUpdate = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    if (!previewTmpObject) {
                        previewTmpObject = new TmpObject(tmpObjectName, player.main);
                        previewTmpObject.planet = player.planet;
                        previewTmpObject.instantiate();
                    }
                    previewTmpObject.setPosition(hit.pickedPoint);
                    previewTmpObject.setTarget(player.position);
                    return;
                }
            }
            if (previewTmpObject) {
                previewTmpObject.dispose();
                previewTmpObject = undefined;
            }
        }

        action.onClick = () => {
            if (!player.inputManager.inventoryOpened) {
                let hit = player.inputManager.getPickInfo(player.meshes);
                if (hit && hit.pickedPoint) {
                    let tmpObject = new TmpObject(tmpObjectName, player.main);
                    tmpObject.planet = player.planet;
                    tmpObject.instantiate();
                    tmpObject.setPosition(hit.pickedPoint);
                    tmpObject.setTarget(player.position);
                }
            }
        }

        action.onUnequip = () => {
            if (previewTmpObject) {
                previewTmpObject.dispose();
                previewTmpObject = undefined;
            }
        }

        return action;
        */
    }
    static CreateBlockAction(player, blockType) {
        let action = new PlayerAction(Kulla.BlockTypeNames[blockType], player);
        action.backgroundColor = Kulla.BlockTypeColors[blockType].toHexString();
        let previewMesh;
        let previewBox;
        action.iconUrl = "/datas/images/block-icon-" + Kulla.BlockTypeNames[blockType] + "-miniature.png";
        let lastSize;
        let lastI;
        let lastJ;
        let lastK;
        action.onUpdate = () => {
            let terrain = player.game.terrain;
            if (player.game.router.inPlayMode) {
                let x;
                let y;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(x, y, (mesh) => {
                    return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                });
                if (hit && hit.pickedPoint) {
                    let n = hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? -0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, true);
                    if (chunckIJK) {
                        // Redraw block preview
                        if (!previewMesh) {
                            if (blockType === Kulla.BlockType.None) {
                                previewMesh = Mummu.CreateLineBox("preview", { width: 2 * terrain.blockSizeIJ_m, height: 2 * terrain.blockSizeK_m, depth: 2 * terrain.blockSizeIJ_m, color: new BABYLON.Color4(1, 0, 0, 1) });
                            }
                            else {
                                previewMesh = Mummu.CreateLineBox("preview", { width: 2 * terrain.blockSizeIJ_m, height: 2 * terrain.blockSizeK_m, depth: 2 * terrain.blockSizeIJ_m, color: new BABYLON.Color4(0, 1, 0, 1) });
                            }
                        }
                        let needRedrawMesh = false;
                        if (lastI != chunckIJK.ijk.i) {
                            lastI = chunckIJK.ijk.i;
                            needRedrawMesh = true;
                        }
                        if (lastJ != chunckIJK.ijk.j) {
                            lastJ = chunckIJK.ijk.j;
                            needRedrawMesh = true;
                        }
                        if (lastK != chunckIJK.ijk.k) {
                            lastK = chunckIJK.ijk.k;
                            needRedrawMesh = true;
                        }
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j) * terrain.blockSizeIJ_m);
                        previewMesh.parent = chunckIJK.chunck.mesh;
                        return;
                    }
                }
            }
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            if (previewBox) {
                previewBox.dispose();
                previewBox = undefined;
            }
        };
        action.onPointerDown = () => {
            if (player.game.router.inPlayMode) {
                let x;
                let y;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(x, y, (mesh) => {
                    return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                });
                if (hit && hit.pickedPoint) {
                    let n = hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? -0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, true);
                    if (chunckIJK) {
                        player.game.terrainEditor.doAction(chunckIJK.chunck, chunckIJK.ijk, {
                            brushSize: 2,
                            brushBlock: blockType,
                            saveToLocalStorage: true
                        });
                    }
                }
            }
        };
        action.onUnequip = () => {
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            if (previewBox) {
                previewBox.dispose();
                previewBox = undefined;
            }
            lastSize = undefined;
            lastI = undefined;
            lastJ = undefined;
            lastK = undefined;
        };
        return action;
    }
    static CreateBrickAction(brickId, player) {
        let brickAction = new PlayerAction("brick", player);
        brickAction.backgroundColor = "#000000";
        let previewMesh;
        brickAction.iconUrl = "/datas/images/brick-icon.png";
        let rotationQuaternion = BABYLON.Quaternion.Identity();
        brickAction.onUpdate = () => {
            let terrain = player.game.terrain;
            if (player.game.router.inPlayMode) {
                let x;
                let y;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(x, y, (mesh) => {
                    return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || mesh instanceof BrickMesh;
                });
                if (hit && hit.pickedPoint) {
                    let n = hit.getNormal(true).scaleInPlace(0.05);
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let root = hit.pickedMesh.brick.root;
                        if (root.mesh) {
                            let dp = hit.pickedPoint.add(n).subtract(root.position);
                            dp.x = terrain.blockSizeIJ_m * Math.round(dp.x / terrain.blockSizeIJ_m);
                            dp.y = (terrain.blockSizeK_m / 3) * Math.floor(dp.y / (terrain.blockSizeK_m / 3));
                            dp.z = terrain.blockSizeIJ_m * Math.round(dp.z / terrain.blockSizeIJ_m);
                            previewMesh.position.copyFrom(dp).addInPlace(root.position);
                            previewMesh.parent = undefined;
                            previewMesh.isVisible = true;
                            return;
                        }
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            previewMesh.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k + 0.5 / 3) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m);
                            previewMesh.parent = chunckIJK.chunck.mesh;
                            previewMesh.isVisible = true;
                            return;
                        }
                    }
                }
            }
            if (previewMesh) {
                previewMesh.isVisible = false;
            }
        };
        brickAction.onPointerDown = () => {
            let terrain = player.game.terrain;
            if (player.game.router.inPlayMode) {
                let x;
                let y;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(x, y, (mesh) => {
                    return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined || mesh instanceof BrickMesh;
                });
                if (hit && hit.pickedPoint) {
                    let n = hit.getNormal(true).scaleInPlace(0.05);
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let root = hit.pickedMesh.brick.root;
                        let aimedBrick = root.getBrickForFaceId(hit.faceId);
                        let rootPosition = root.position;
                        let dp = hit.pickedPoint.add(n).subtract(rootPosition);
                        dp.x = terrain.blockSizeIJ_m * Math.round(dp.x / terrain.blockSizeIJ_m);
                        dp.y = (terrain.blockSizeK_m / 3) * Math.floor(dp.y / (terrain.blockSizeK_m / 3));
                        dp.z = terrain.blockSizeIJ_m * Math.round(dp.z / terrain.blockSizeIJ_m);
                        let brick = new Brick(brickId, 0);
                        brick.position.copyFrom(dp).addInPlace(rootPosition);
                        brick.rotationQuaternion = rotationQuaternion.clone();
                        brick.computeWorldMatrix(true);
                        brick.setParent(aimedBrick);
                        brick.updateMesh();
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            let brick = new Brick(brickId, 0);
                            brick.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                            brick.rotationQuaternion = rotationQuaternion.clone();
                            brick.updateMesh();
                        }
                    }
                }
            }
        };
        let rotateBrick = () => {
            let quat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
            quat.multiplyToRef(rotationQuaternion, rotationQuaternion);
        };
        brickAction.onEquip = () => {
            previewMesh = new BABYLON.Mesh("brick-preview-mesh");
            let previewMat = new BABYLON.StandardMaterial("brick-preview-material");
            previewMat.alpha = 0.5;
            previewMat.specularColor.copyFromFloats(1, 1, 1);
            previewMesh.material = previewMat;
            previewMesh.rotationQuaternion = rotationQuaternion;
            BrickTemplateManager.Instance.getTemplate(Brick.BrickIdToIndex(brickId)).then(template => {
                template.vertexData.applyToMesh(previewMesh);
            });
            player.game.inputManager.addMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
        };
        brickAction.onUnequip = () => {
            if (previewMesh) {
                previewMesh.dispose();
            }
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
        };
        return brickAction;
    }
}
class GameRouter extends Nabu.Router {
    constructor(game) {
        super();
        this.game = game;
        this.inPlayMode = false;
    }
    onFindAllPages() {
        this.homePage = document.getElementById("home-page");
        this.optionPage = document.getElementById("option-page");
        this.propEditor = document.getElementById("prop-editor-ui");
        this.actionBar = document.getElementById("action-bar");
    }
    onUpdate() {
    }
    async onHRefChange(page) {
        this.inPlayMode = false;
        this.game.inputManager.deactivateAllKeyInputs = true;
        this.game.propEditor.dispose();
        if (page.startsWith("#game")) {
            this.hideAll();
            this.game.generateTerrainLarge();
        }
        else if (page.startsWith("#brick")) {
            this.inPlayMode = true;
            this.game.inputManager.deactivateAllKeyInputs = false;
            this.show(this.actionBar);
            this.game.generateTerrainBrick();
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
