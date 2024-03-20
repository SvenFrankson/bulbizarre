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
    KeyInput[KeyInput["INVENTORY"] = 11] = "INVENTORY";
    KeyInput[KeyInput["MOVE_FORWARD"] = 12] = "MOVE_FORWARD";
    KeyInput[KeyInput["MOVE_LEFT"] = 13] = "MOVE_LEFT";
    KeyInput[KeyInput["MOVE_BACK"] = 14] = "MOVE_BACK";
    KeyInput[KeyInput["MOVE_RIGHT"] = 15] = "MOVE_RIGHT";
    KeyInput[KeyInput["JUMP"] = 16] = "JUMP";
    KeyInput[KeyInput["MAIN_MENU"] = 17] = "MAIN_MENU";
    KeyInput[KeyInput["WORKBENCH"] = 18] = "WORKBENCH";
})(KeyInput || (KeyInput = {}));
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
            new Nabu.ConfigurationElement("canLockPointer", Nabu.ConfigurationElementType.Boolean, 1, {
                displayName: "Can Lock Pointer"
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
            }),
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "PLAYER_ACTION", KeyInput.PLAYER_ACTION, "GamepadBtn0"),
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
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "ACTION_SLOT_9", KeyInput.ACTION_SLOT_9, "Digit9")
        ];
    }
    getValue(property) {
        let configElement = this.configurationElements.find(e => { return e.property === property; });
        if (configElement) {
            return configElement.value;
        }
    }
}
var InventorySection;
(function (InventorySection) {
    InventorySection[InventorySection["Action"] = 0] = "Action";
    InventorySection[InventorySection["Cube"] = 1] = "Cube";
    InventorySection[InventorySection["Block"] = 2] = "Block";
    InventorySection[InventorySection["Brick"] = 3] = "Brick";
    InventorySection[InventorySection["TmpObject"] = 4] = "TmpObject";
    InventorySection[InventorySection["DriderBait"] = 5] = "DriderBait";
})(InventorySection || (InventorySection = {}));
class InventoryItem {
    constructor() {
        this.count = 1;
        this.size = 1;
        this.timeUse = 0;
    }
    static async Block(player, blockType) {
        return new Promise(async (resolve) => {
            let it = new InventoryItem();
            it.section = InventorySection.Block;
            it.name = Kulla.BlockTypeNames[blockType];
            it.size = 27;
            it.playerAction = await PlayerActionTemplate.CreateBlockAction(player, blockType);
            it.playerAction.item = it;
            it.iconUrl = "datas/images/block-icon-" + Kulla.BlockTypeNames[blockType] + "-miniature.png";
            resolve(it);
        });
    }
    static async TmpObject(player, tmpObjectName) {
        return new Promise(async (resolve) => {
            let it = new InventoryItem();
            it.section = InventorySection.TmpObject;
            it.name = tmpObjectName;
            it.size = 1;
            it.playerAction = await PlayerActionTemplate.AddTmpObjectAction(player, tmpObjectName);
            it.playerAction.item = it;
            it.iconUrl = "/datas/images/qmark.png";
            resolve(it);
        });
    }
}
var BrickSortingOrder;
(function (BrickSortingOrder) {
    BrickSortingOrder[BrickSortingOrder["Recent"] = 0] = "Recent";
    BrickSortingOrder[BrickSortingOrder["TypeAsc"] = 1] = "TypeAsc";
    BrickSortingOrder[BrickSortingOrder["TypeDesc"] = 2] = "TypeDesc";
    BrickSortingOrder[BrickSortingOrder["SizeAsc"] = 3] = "SizeAsc";
    BrickSortingOrder[BrickSortingOrder["SizeDesc"] = 4] = "SizeDesc";
    BrickSortingOrder[BrickSortingOrder["ColorAsc"] = 5] = "ColorAsc";
    BrickSortingOrder[BrickSortingOrder["ColorDesc"] = 6] = "ColorDesc";
})(BrickSortingOrder || (BrickSortingOrder = {}));
class Inventory {
    constructor(player) {
        this.player = player;
        this.items = [];
        this._brickSorting = BrickSortingOrder.TypeAsc;
        this.hintedSlotIndex = new Nabu.UniqueList();
        player.inventory = this;
    }
    async initialize() {
        let savedInventoryString = window.localStorage.getItem("player-inventory");
        if (savedInventoryString) {
            let savedInventory = JSON.parse(savedInventoryString);
            await this.deserializeInPlace(savedInventory);
        }
        else {
            this.addItem(await InventoryItem.Block(this.player, Kulla.BlockType.None));
        }
        this.update();
    }
    addItem(item) {
        let same = this.items.find(it => { return it.name === item.name; });
        if (same) {
            same.count++;
        }
        else {
            this.items.push(item);
        }
        let data = this.serialize();
        window.localStorage.setItem("player-inventory", JSON.stringify(data));
    }
    getCurrentSectionItems() {
        let sectionItems = [];
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].section === this.currentSection) {
                sectionItems.push(this.items[i]);
            }
        }
        return sectionItems;
    }
    getItemByName(name) {
        return this.items.find(it => { return it.name === name; });
    }
    getItemByPlayerActionName(playerActionName) {
        return this.items.find(it => { return it.playerAction.name === playerActionName; });
    }
    update() {
    }
    serialize() {
        let data = {
            items: []
        };
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            data.items.push({
                r: item.name,
                c: item.count
            });
        }
        return data;
    }
    async deserializeInPlace(input) {
        this.items = [];
        for (let i = 0; i < input.items.length; i++) {
            let data = input.items[i];
            let blockType = Kulla.BlockTypeNames.indexOf(data.r);
            if (blockType != -1) {
                let item = await InventoryItem.Block(this.player, blockType);
                item.count = data.c;
                this.items.push(item);
            }
            else {
                let item = await InventoryItem.TmpObject(this.player, data.r);
                item.count = data.c;
                this.items.push(item);
            }
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
            let debugTerrainPerf = new DebugTerrainPerf(this);
            debugTerrainPerf.show();
            this.player = new Player(this);
            this.player.position.copyFrom(this.freeCamera.position);
            let playerControler = new PlayerControler(this.player);
            this.player.playerActionManager = new PlayerActionManager(this.player, this);
            this.player.playerActionManager.initialize();
            this.player.inventory = new Inventory(this.player);
            this.playerActionBar = new PlayerActionView(this.player, this);
            this.playerActionBar.initialize();
            this.inputManager.initialize();
            this.inputManager.initializeInputs(this.configuration);
            playerControler.initialize();
            this.player.playerActionManager.linkAction(await PlayerActionTemplate.CreateBlockAction(this.player, Kulla.BlockType.None), 1);
            this.player.playerActionManager.linkAction(await PlayerActionTemplate.CreateBlockAction(this.player, Kulla.BlockType.Grass), 2);
            this.player.playerActionManager.linkAction(await PlayerActionTemplate.CreateBlockAction(this.player, Kulla.BlockType.Dirt), 3);
            this.player.playerActionManager.linkAction(await PlayerActionTemplate.CreateBlockAction(this.player, Kulla.BlockType.Rock), 4);
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
        if (this.terrain) {
            this.terrain.dispose();
        }
        this.uiCamera.parent = this.freeCamera;
        this.arcCamera.detachControl();
        this.scene.activeCameras = [this.freeCamera, this.uiCamera];
        this.freeCamera.detachControl();
        this.freeCamera.parent = this.player.head;
        this.freeCamera.position.copyFromFloats(0, 0, 0);
        this.freeCamera.rotation.copyFromFloats(0, 0, 0);
        this.terrain = new Kulla.Terrain({
            scene: this.scene,
            generatorProps: {
                type: Kulla.GeneratorType.Flat,
                altitude: 64,
                blockType: Kulla.BlockType.Dirt
            },
            maxDisplayedLevel: 0,
            blockSizeIJ_m: 0.78,
            blockSizeK_m: 0.96,
            chunckLengthIJ: 24,
            chunckLengthK: 256,
            chunckCountIJ: 512,
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
    static async CreateBlockAction(player, blockType) {
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
            if ( /*!player.game.inventoryView.isOpened*/true) {
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
        action.onClick = () => {
            if ( /*!player.inputManager.inventoryOpened*/true) {
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
                        let affectedChuncks = chunckIJK.chunck.setData(blockType, chunckIJK.ijk.i, chunckIJK.ijk.j, chunckIJK.ijk.k);
                        player.game.terrainEditor.doAction(chunckIJK.chunck, chunckIJK.ijk, {
                            brushSize: 2,
                            brushBlock: blockType,
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
}
class PlayerActionView {
    constructor(player, game) {
        this.player = player;
        this.game = game;
        this.isOpened = false;
        this._equipedSlotIndex = -1;
    }
    get scene() {
        return this.game.scene;
    }
    get inventory() {
        return this.player.inventory;
    }
    initialize() {
        this.tiles = [];
        for (let slotIndex = 0; slotIndex <= 9; slotIndex++) {
            this.tiles[slotIndex] = document.querySelector("#action-" + slotIndex.toFixed(0));
        }
    }
    highlight(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.tiles[slotIndex].style.border = "2px solid rgb(255, 255, 255)";
        }
    }
    unlit(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.tiles[slotIndex].style.border = "2px solid rgb(127, 127, 127)";
        }
    }
    onActionEquiped(action, slotIndex) {
        if (this._equipedSlotIndex >= 0 && this._equipedSlotIndex <= 9) {
            this.unlit(this._equipedSlotIndex);
        }
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.highlight(slotIndex);
            this._equipedSlotIndex = slotIndex;
        }
    }
    onActionUnequiped(action, slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.unlit(slotIndex);
        }
    }
    onHintStart(slotIndex) {
    }
    onHintEnd(slotIndex) {
    }
    onActionLinked(action, slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.tiles[slotIndex].style.backgroundColor = action.backgroundColor;
            /*
            this.hudLateralTileImageMeshes[slotIndex].isVisible = true;
            this.hudLateralTileImageMaterials[slotIndex].diffuseTexture = new BABYLON.Texture(action.iconUrl);
            this.hudLateralTileImageMaterials[slotIndex].diffuseTexture.hasAlpha = true;
            this.itemCountTexts[slotIndex].prop.text = action.item.count.toFixed(0);
            this.itemNameTexts[slotIndex].prop.text = action.item.name;
            this.slika.needRedraw = true;
            */
        }
    }
    onActionUnlinked(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.tiles[slotIndex].style.backgroundColor = undefined;
            /*
            this.hudLateralTileImageMeshes[slotIndex].isVisible = false;
            this.hudLateralTileImageMaterials[slotIndex].diffuseTexture = undefined;
            this.itemCountTexts[slotIndex].prop.text = "";
            this.itemNameTexts[slotIndex].prop.text = "";
            this.slika.needRedraw = true;
            */
        }
    }
    onPointerUp() {
        if (this.inventory.draggedItem) {
            //this.player.playerActionManager.linkAction(this.inventory.draggedItem.playerAction, index);
            this.inventory.draggedItem = undefined;
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
class PlayerActionManager {
    constructor(player, game) {
        this.player = player;
        this.game = game;
        this.linkedActions = [];
        this.update = () => {
        };
        player.playerActionManager = this;
    }
    get inventory() {
        return this.player.inventory;
    }
    get playerActionView() {
        return this.game.playerActionBar;
    }
    initialize() {
        let savedPlayerActionString = window.localStorage.getItem("player-action-manager");
        if (savedPlayerActionString) {
            let savedPlayerAction = JSON.parse(savedPlayerActionString);
            this.deserializeInPlace(savedPlayerAction);
        }
        this.game.scene.onBeforeRenderObservable.add(this.update);
        window.addEventListener("keydown", (ev) => {
            if (ev.code.startsWith("Digit")) {
                let slotIndex = parseInt(ev.code.replace("Digit", ""));
                if (slotIndex >= 0 && slotIndex < 10) {
                    this.startHint(slotIndex);
                }
            }
        });
        window.addEventListener("keydown", (ev) => {
            if (ev.code.startsWith("Digit")) {
                let slotIndex = parseInt(ev.code.replace("Digit", ""));
                if (slotIndex >= 0 && slotIndex < 10) {
                    this.stopHint(slotIndex);
                    this.equipAction(slotIndex);
                }
            }
        });
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
    equipAction(slotIndex) {
        if (slotIndex >= 0 && slotIndex < 10) {
            // Unequip current action
            if (this.player.currentAction) {
                if (this.player.currentAction.onUnequip) {
                    this.player.currentAction.onUnequip();
                }
                this.playerActionView.onActionUnequiped(this.player.currentAction, slotIndex);
            }
            if (this.linkedActions[slotIndex]) {
                // If request action was already equiped, remove it.
                if (this.player.currentAction === this.linkedActions[slotIndex]) {
                    this.player.currentAction = undefined;
                }
                // Otherwise, equip new action.
                else {
                    this.player.currentAction = this.linkedActions[slotIndex];
                    if (this.player.currentAction) {
                        //(document.querySelector("#player-action-" + slotIndex + " .background") as HTMLImageElement).src ="/datas/images/inventory-item-background-highlit.svg";
                        if (this.player.currentAction.onEquip) {
                            this.player.currentAction.onEquip();
                        }
                        this.playerActionView.onActionEquiped(this.player.currentAction, slotIndex);
                    }
                }
            }
            else {
                this.player.currentAction = undefined;
            }
        }
    }
    startHint(slotIndex) {
        this.inventory.hintedSlotIndex.push(slotIndex);
        setTimeout(() => {
            if (this.inventory.hintedSlotIndex.contains(slotIndex)) {
                this.playerActionView.onHintStart(slotIndex);
            }
        }, 200);
    }
    stopHint(slotIndex) {
        this.inventory.hintedSlotIndex.remove(slotIndex) >= 0;
        this.playerActionView.onHintEnd(slotIndex);
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
                let item = this.player.inventory.getItemByName(linkedItemName);
                if (item) {
                    this.linkAction(item.playerAction, i);
                    item.timeUse = (new Date()).getTime();
                }
            }
        }
    }
}
class PlayerControler {
    constructor(player) {
        this.player = player;
        this._pointerIsDown = false;
        this.gamepadInControl = false;
        this._pointerDown = (event) => {
            this._pointerIsDown = true;
            if (this.player.currentAction) {
                this.player.currentAction.onClick(this.player.currentChuncks);
            }
        };
        this._pointerMove = (event) => {
            if (this._pointerIsDown || this.player.game.inputManager.isPointerLocked) {
                this.gamepadInControl = false;
                this.player.inputDeltaX += event.movementX;
                this.player.inputDeltaY += event.movementY;
            }
        };
        this._pointerUp = (event) => {
            this._pointerIsDown = false;
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
    initialize() {
        this.player.game.inputManager.addMappedKeyDownListener(KeyInput.PLAYER_ACTION, () => {
            if (this.player.currentAction) {
                this.player.currentAction.onClick(this.player.currentChuncks);
            }
        });
    }
    testDeadZone(v, threshold = 0.1) {
        if (Math.abs(v) > threshold) {
            return (v - threshold * Math.sign(v)) / (1 - threshold);
        }
        return 0;
    }
    update(dt) {
        this.player.inputX = 0;
        this.player.inputZ = 0;
        if (this.player.game.inputManager.isKeyInputDown(KeyInput.MOVE_FORWARD)) {
            this.player.inputZ += 1;
            this.gamepadInControl = false;
        }
        if (this.player.game.inputManager.isKeyInputDown(KeyInput.MOVE_BACK)) {
            this.player.inputZ -= 1;
            this.gamepadInControl = false;
        }
        if (this.player.game.inputManager.isKeyInputDown(KeyInput.MOVE_RIGHT)) {
            this.player.inputX += 1;
            this.gamepadInControl = false;
        }
        if (this.player.game.inputManager.isKeyInputDown(KeyInput.MOVE_LEFT)) {
            this.player.inputX -= 1;
            this.gamepadInControl = false;
        }
        let gamepads = navigator.getGamepads();
        let gamepad = gamepads[0];
        if (gamepad) {
            let axis0 = this.testDeadZone(gamepad.axes[0]);
            let axis1 = -this.testDeadZone(gamepad.axes[1]);
            let axis2 = this.testDeadZone(gamepad.axes[2]);
            let axis3 = this.testDeadZone(gamepad.axes[3]);
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
        if (this.gamepadInControl || this.player.game.inputManager.isPointerLocked) {
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
        this.actionBar = document.getElementById("action-bar");
    }
    onUpdate() {
    }
    async onHRefChange(page) {
        this.game.propEditor.dispose();
        if (page.startsWith("#game")) {
            this.hideAll();
            this.game.generateTerrainLarge();
        }
        else if (page.startsWith("#brick")) {
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
