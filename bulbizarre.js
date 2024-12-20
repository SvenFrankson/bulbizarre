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
class ChunckGridMaterial extends BABYLON.ShaderMaterial {
    constructor(name, scene) {
        super(name, scene, {
            vertex: "chunckGrid",
            fragment: "chunckGrid",
        }, {
            attributes: ["position", "normal", "uv", "color"],
            uniforms: [
                "world", "worldView", "worldViewProjection", "view", "projection",
                "lightInvDirW",
                "alpha",
            ]
        });
        this._update = () => {
            let lights = this.getScene().lights;
            for (let i = 0; i < lights.length; i++) {
                let light = lights[i];
                if (light instanceof BABYLON.HemisphericLight) {
                    this.setVector3("lightInvDirW", light.direction);
                }
            }
        };
        this.alpha = 0.99;
        this.alphaMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        this.setVector3("lightInvDirW", BABYLON.Vector3.Up());
        this.getScene().onBeforeRenderObservable.add(this._update);
    }
    dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh) {
        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
        this.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }
}
class CubicNoiseTexture {
    constructor(scene) {
        this.scene = scene;
        this.size = 1;
        this._data = [[[0.5]]];
    }
    getData(i, j, k) {
        while (i < 0) {
            i += this.size;
        }
        while (j < 0) {
            j += this.size;
        }
        while (k < 0) {
            k += this.size;
        }
        i = i % this.size;
        j = j % this.size;
        k = k % this.size;
        return this._data[i][j][k];
    }
    setData(v, i, j, k) {
        while (i < 0) {
            i += this.size;
        }
        while (j < 0) {
            j += this.size;
        }
        while (k < 0) {
            k += this.size;
        }
        i = i % this.size;
        j = j % this.size;
        k = k % this.size;
        return this._data[i][j][k];
    }
    double() {
        let newSize = this.size * 2;
        let newData = [];
        for (let i = 0; i < newSize; i++) {
            newData[i] = [];
            for (let j = 0; j < newSize; j++) {
                newData[i][j] = [];
            }
        }
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                for (let k = 0; k < this.size; k++) {
                    let v = this._data[i][j][k];
                    newData[2 * i][2 * j][2 * k] = v;
                    newData[2 * i + 1][2 * j][2 * k] = v;
                    newData[2 * i + 1][2 * j + 1][2 * k] = v;
                    newData[2 * i][2 * j + 1][2 * k] = v;
                    newData[2 * i][2 * j][2 * k + 1] = v;
                    newData[2 * i + 1][2 * j][2 * k + 1] = v;
                    newData[2 * i + 1][2 * j + 1][2 * k + 1] = v;
                    newData[2 * i][2 * j + 1][2 * k + 1] = v;
                }
            }
        }
        this.size = newSize;
        this._data = newData;
    }
    smooth() {
        let newData = [];
        for (let i = 0; i < this.size; i++) {
            newData[i] = [];
            for (let j = 0; j < this.size; j++) {
                newData[i][j] = [];
            }
        }
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                for (let k = 0; k < this.size; k++) {
                    let val = 0;
                    let c = 0;
                    for (let ii = -1; ii <= 1; ii++) {
                        for (let jj = -1; jj <= 1; jj++) {
                            for (let kk = -1; kk <= 1; kk++) {
                                let d = Math.sqrt(ii * ii + jj * jj + kk * kk);
                                let w = 2 - d;
                                let v = this.getData(i + ii, j + jj, k + kk);
                                val += w * v;
                                c += w;
                            }
                        }
                    }
                }
            }
        }
    }
    noise() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                for (let k = 0; k < this.size; k++) {
                    this._data[i][j][k] = (this._data[i][j][k] + Math.random()) * 0.5;
                }
            }
        }
    }
    randomize() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                for (let k = 0; k < this.size; k++) {
                    this._data[i][j][k] = Math.random();
                }
            }
        }
    }
    get3DTexture() {
        let data = new Uint8ClampedArray(this.size * this.size * this.size);
        let min = 255;
        let max = 0;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                for (let k = 0; k < this.size; k++) {
                    data[i + j * this.size + k * this.size * this.size] = 256 * this._data[i][j][k];
                    min = Math.min(min, data[i + j * this.size + k * this.size * this.size]);
                    max = Math.max(max, data[i + j * this.size + k * this.size * this.size]);
                }
            }
        }
        console.log(min + " " + max);
        let tex = new BABYLON.RawTexture3D(data, this.size, this.size, this.size, BABYLON.Constants.TEXTUREFORMAT_R, this.scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);
        tex.wrapU = 1;
        tex.wrapV = 1;
        tex.wrapR = 1;
        return tex;
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
class DroneController {
    constructor(drone) {
        this.drone = drone;
        this.timer = Infinity;
        this.stop = false;
        this.debug = new BABYLON.Mesh("debug");
        //BABYLON.CreateSphereVertexData({ diameter: 0.1 }).applyToMesh(this.debug);
    }
    updateExplorerDestination() {
        this.destination = this.drone.game.player.absolutePosition;
        this.debug.position.copyFrom(this.destination);
        return true;
    }
    update() {
        if (this.stop) {
            this.drone.speed = 0;
            this.drone.rotationSpeed = 0;
            return;
        }
        let dt = this.drone.getScene().getEngine().getDeltaTime() / 1000;
        this.timer += dt;
        if (this.timer > 30) {
            if (this.updateExplorerDestination()) {
                this.timer = 0;
                return;
            }
        }
        if (!this.destination || !Mummu.IsFinite(this.destination)) {
            if (this.updateExplorerDestination()) {
                this.timer = 0;
            }
            return;
        }
        let dirDestination = this.destination.subtract(this.drone.position);
        let distDestination = dirDestination.length();
        if (distDestination < 2) {
            if (this.updateExplorerDestination()) {
                this.timer = 0;
                if (Math.random() > 0.5) {
                    this.stop = true;
                    setTimeout(() => {
                        this.stop = false;
                    }, Math.random() * 1000);
                }
                return;
            }
        }
        this.drone.speed = distDestination * 1;
        this.drone.speed = Math.max(Math.min(this.drone.speed, 2), 0);
        let alphaDestination = Mummu.AngleFromToAround(dirDestination, this.drone.forward, this.drone.up);
        this.drone.rotationSpeed = 0;
        if (alphaDestination > Math.PI / 64) {
            this.drone.rotationSpeed = -0.25;
        }
        else if (alphaDestination < -Math.PI / 64) {
            this.drone.rotationSpeed = 0.25;
        }
    }
}
class Drone extends Sumuqan.Polypode {
    constructor(game, props) {
        super("drone", props);
        this.game = game;
        this.destination = BABYLON.Vector3.Zero();
        this._updateDrone = () => {
            this.controller.update();
        };
        let povMaterial = new ToonMaterial("debug-pov-material", this.game.scene);
        povMaterial.setDiffuse(new BABYLON.Color3(0.5, 0.5, 1));
        povMaterial.setAlpha(0.4);
        povMaterial.setSpecularIntensity(0.5);
        let colliderMaterial = new ToonMaterial("body", this.game.scene);
        colliderMaterial.setDiffuse(new BABYLON.Color3(0.5, 1, 0.5));
        colliderMaterial.setAlpha(0.4);
        colliderMaterial.setSpecularIntensity(0.5);
        let colliderHitMaterial = new ToonMaterial("body", this.game.scene);
        colliderHitMaterial.setDiffuse(new BABYLON.Color3(1, 0.5, 0.5));
        colliderHitMaterial.setAlpha(0.4);
        colliderHitMaterial.setSpecularIntensity(0.5);
        this.terrain = [];
        if (this.game.player) {
            if (this.game.player.currentChuncks) {
                this.game.player.currentChuncks.forEach(chunck => {
                    if (chunck && chunck.mesh) {
                        this.terrain.push(chunck.mesh);
                    }
                });
            }
        }
        setInterval(() => {
            this.terrain = [];
            if (this.game.player) {
                if (this.game.player.currentChuncks) {
                    this.game.player.currentChuncks.forEach(chunck => {
                        if (chunck && chunck.mesh) {
                            this.terrain.push(chunck.mesh);
                        }
                    });
                }
            }
        }, 1000);
        this.controller = new DroneController(this);
        this.debugColliderMaterial = colliderMaterial;
        this.debugColliderHitMaterial = colliderHitMaterial;
        let headCollider = new Mummu.SphereCollider(new BABYLON.Vector3(0, 0, 0.1), 0.15, this.head);
        let assCollider = new Mummu.SphereCollider(new BABYLON.Vector3(0, 0, -0.2), 0.4, this.body);
        this.bodyColliders.push(headCollider, assCollider);
        this.updateBodyCollidersMeshes();
        this.debugPovMaterial = povMaterial;
        this.showCollisionDebug = true;
        if (this.showCollisionDebug) {
            BABYLON.CreateBoxVertexData({ width: 0.1, height: 0.8, depth: 0.1 }).applyToMesh(this);
            this.material = colliderHitMaterial;
        }
    }
    static async CreateDrone(game) {
        let infos = await game.vertexDataLoader.getInfos("./datas/meshes/drone.babylon");
        console.log(infos);
        let upperLegLength = BABYLON.Vector3.Distance(infos[0].position, infos[1].position);
        let lowerLegLength = BABYLON.Vector3.Distance(infos[1].position, infos[2].position);
        let props = {
            legPairsCount: 1,
            headAnchor: (new BABYLON.Vector3(0, 0.04, 0.25)),
            hipAnchors: [
                infos[0].position,
            ],
            footTargets: [
                new BABYLON.Vector3(0.3, -0.3, 0.2),
            ],
            footThickness: 0.1,
            upperLegLength: upperLegLength,
            lowerLegLength: lowerLegLength,
            stepHeight: 0.1,
            stepDuration: 1.3,
            bodyWorldOffset: new BABYLON.Vector3(0, 0.15, 0)
        };
        let drone = new Drone(game, props);
        drone.povRadiusMax = 2;
        drone.povOffset = new BABYLON.Vector3(0, 0, -0.1);
        drone.povAlpha = 2 * Math.PI;
        drone.rightLegs[0].kneeMode = Sumuqan.KneeMode.Walker;
        drone.leftLegs[0].kneeMode = Sumuqan.KneeMode.Walker;
        drone.showPOVDebug = true;
        return drone;
    }
    async initialize() {
        await super.initialize();
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.getScene().onBeforeRenderObservable.add(this._updateDrone);
    }
    async instantiate() {
        let datas = await Game.Instance.vertexDataLoader.get("./datas/meshes/drone.babylon");
        let droneMaterial = new ToonMaterial("drone-material", this.getScene());
        droneMaterial.setUseVertexColor(true);
        this.legs.forEach(leg => {
            datas[0].applyToMesh(leg.upperLeg);
            datas[1].applyToMesh(leg.lowerLeg);
            datas[2].applyToMesh(leg.foot);
            leg.upperLeg.material = droneMaterial;
            leg.lowerLeg.material = droneMaterial;
            leg.foot.material = droneMaterial;
        });
        datas[3].applyToMesh(this.body);
        datas[4].applyToMesh(this.head);
        this.body.material = droneMaterial;
        this.head.material = droneMaterial;
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
    KeyInput[KeyInput["NEXT_SHAPE"] = 18] = "NEXT_SHAPE";
    KeyInput[KeyInput["ROTATE_SELECTED"] = 19] = "ROTATE_SELECTED";
    KeyInput[KeyInput["DELETE_SELECTED"] = 20] = "DELETE_SELECTED";
    KeyInput[KeyInput["MOVE_FORWARD"] = 21] = "MOVE_FORWARD";
    KeyInput[KeyInput["MOVE_LEFT"] = 22] = "MOVE_LEFT";
    KeyInput[KeyInput["MOVE_BACK"] = 23] = "MOVE_BACK";
    KeyInput[KeyInput["MOVE_RIGHT"] = 24] = "MOVE_RIGHT";
    KeyInput[KeyInput["JUMP"] = 25] = "JUMP";
    KeyInput[KeyInput["MAIN_MENU"] = 26] = "MAIN_MENU";
    KeyInput[KeyInput["WORKBENCH"] = 27] = "WORKBENCH";
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
            new Nabu.ConfigurationElement("renderDist", Nabu.ConfigurationElementType.Number, 2, Nabu.ConfigurationElementCategory.Graphic, {
                displayName: "Render Distance",
                min: 1,
                max: 15,
                toString: (v) => {
                    return v.toFixed(0);
                }
            }, (newValue) => {
                this.game.terrain.chunckManager.setDistance(newValue * this.game.terrain.chunckLengthIJ);
            }),
            new Nabu.ConfigurationElement("canLockPointer", Nabu.ConfigurationElementType.Boolean, 1, Nabu.ConfigurationElementCategory.Control, {
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
            Nabu.ConfigurationElement.SimpleInput(this.game.inputManager, "NEXT_SHAPE", KeyInput.NEXT_SHAPE, "KeyZ"),
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
                this.game.player.godMode = newValue === 1 ? true : false;
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
/// <reference path="../lib/sumuqan/sumuqan.d.ts"/>
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
        this.light = new BABYLON.HemisphericLight("light", (new BABYLON.Vector3(1, 3, -2)).normalize(), this.scene);
        this.skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1500 }, this.scene);
        let skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        let skyTexture = new BABYLON.CubeTexture("./datas/skyboxes/skybox", this.scene, ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"]);
        skyboxMaterial.reflectionTexture = skyTexture;
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
        this.skybox.rotation.y = 0.252654824574367;
        /*
        this.skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", { diameter: 1000, sideOrientation: BABYLON.Mesh.BACKSIDE }, this.scene);
        let skyboxMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        let skyTexture = new BABYLON.Texture("./datas/skyboxes/blue.jpeg");
        skyboxMaterial.diffuseTexture = skyTexture;
        skyboxMaterial.emissiveColor = BABYLON.Color3.White();
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
        this.skybox.rotation.y = -2.142477796076939;
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
        this.orthoCamera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 3, 20, new BABYLON.Vector3(0, 10, 0));
        this.orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this.orthoCamera.speed = 0.2;
        this.orthoCamera.minZ = 0.1;
        this.uiCamera = new BABYLON.FreeCamera("background-camera", BABYLON.Vector3.Zero());
        this.uiCamera.parent = this.freeCamera;
        this.uiCamera.layerMask = 0x10000000;
        /*
        let sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 20 });
        sun.position.copyFrom(this.light.direction).scaleInPlace(500);
        let sunMat = new BABYLON.StandardMaterial("sun-material");
        sunMat.diffuseColor.copyFromFloats(1, 1, 1);
        sunMat.emissiveColor.copyFromFloats(1, 1, 0);
        sun.material = sunMat;
        */
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
        this.brickMenuView = document.getElementsByTagName("brick-menu")[0];
        this.voxelizerMenuView = document.getElementsByTagName("voxelizer-menu")[0];
        this.propEditor = new PropEditor(this);
        this.brickManager = new BrickManager(this);
        Kulla.ChunckVertexData.InitializeData("./datas/meshes/chunck-parts.babylon").then(async () => {
            await this.router.initialize();
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
            if (isFinite(this.freeCamera.position.x)) {
                this.player.position.copyFrom(this.freeCamera.position);
            }
            let playerControler = new PlayerControler(this.player);
            this.player.playerActionManager = new PlayerActionManager(this.player, this);
            this.player.playerActionManager.initialize();
            this.playerActionView.initialize(this.player);
            this.inputManager.initialize();
            this.inputManager.initializeInputs(this.configuration);
            playerControler.initialize();
            /*
            setTimeout(async () => {
                let phasm = await Drone.CreateDrone(this);
                phasm.initialize();
                phasm.instantiate();
                phasm.setPosition(this.player.absolutePosition);
            }, 4000);
            */
            this.player.inventory.addItem(new PlayerInventoryItem("None", InventoryCategory.Block));
            for (let b = Kulla.BlockType.Grass; b < Kulla.BlockType.Unknown; b++) {
                this.player.inventory.addItem(new PlayerInventoryItem(Kulla.BlockTypeNames[b], InventoryCategory.Block));
            }
            this.configuration.getElement("godMode").forceInit();
            for (let i = 0; i < BRICK_LIST.length; i++) {
                this.player.inventory.addItem(new PlayerInventoryItem(BRICK_LIST[i], InventoryCategory.Brick));
            }
            for (let i = 0; i < BRICK_COLORS.length; i++) {
                this.player.inventory.addItem(new PlayerInventoryItem(BRICK_COLORS[i].name, InventoryCategory.Paint));
            }
            this.player.playerActionManager.loadFromLocalStorage();
            this.player.playerActionManager.linkAction(PlayerActionTemplate.CreateMushroomAction(this.player), 8);
            this.player.playerActionManager.linkAction(PlayerActionVoxelizer.Create(this.player), 9);
            this.brickMenuView.setPlayer(this.player);
            this.voxelizerMenuView.setPlayer(this.player);
            this.brickManager.loadFromLocalStorage();
            this.router.start();
            window.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    var a = document.createElement("a");
                    a.setAttribute("href", "#home");
                    a.style.display = "none";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
                else if (event.code === "Backquote") {
                    debugger;
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
        if (!(dt > 0 && dt < 0.5)) {
            dt = 0.015;
        }
        if (this.player && this.terrain) {
            this.player.update(dt);
        }
        if (this.inputManager) {
            this.inputManager.update();
        }
        if (this.DEBUG_MODE) {
            let camPos = this.freeCamera.globalPosition;
            let camRot = this.freeCamera.rotation;
            if (isFinite(camPos.x) && isFinite(camPos.y) && isFinite(camPos.z)) {
                window.localStorage.setItem("camera-position", JSON.stringify({ x: camPos.x, y: camPos.y, z: camPos.z }));
                window.localStorage.setItem("camera-rotation", JSON.stringify({ x: camRot.x, y: camRot.y, z: camRot.z }));
            }
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
            generatorProps: {
                type: Kulla.GeneratorType.Map
            },
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
                generatorProps: {
                    type: Kulla.GeneratorType.MapSimple,
                    altitude: 64,
                    blockType: Kulla.BlockType.Dirt
                },
                maxDisplayedLevel: 0,
                blockSizeIJ_m: 0.4,
                blockSizeK_m: 0.4,
                chunckLengthIJ: 24,
                chunckLengthK: 256,
                chunckCountIJ: 512,
                useAnalytics: true
            });
            this.terrain.initialize();
            this.terrainEditor = new Kulla.TerrainEditor(this.terrain);
            this.terrain.sunDir.copyFrom(this.light.direction);
            setTimeout(async () => {
                let human = new Human(this);
                human.spinalCord.position.copyFrom(this.player.position).addInPlace(this.player.forward.scale(3));
                let update = () => {
                    human.brain.update();
                };
                this.scene.onBeforeRenderObservable.add(update);
                await human.instantiate();
                console.log(human);
            }, 3000);
            //this.playerInventoryView.show(0.2);
            //this.brickMenuView.show(0.1);
        }
        let noiseTexture = new CubicNoiseTexture(this.scene);
        noiseTexture.double();
        noiseTexture.double();
        noiseTexture.double();
        noiseTexture.double();
        noiseTexture.double();
        noiseTexture.double();
        noiseTexture.double();
        noiseTexture.randomize();
        noiseTexture.smooth();
        console.log(noiseTexture.size);
        let cubicTex = noiseTexture.get3DTexture();
        let mat = new TerrainMaterial("terrain", this.scene);
        mat.setLightInvDir(this.light.direction);
        this.terrain.materials = [mat];
        this.terrain.customChunckMaterialSet = (chunck) => {
            if (!(chunck.mesh.material instanceof TerrainMaterial)) {
                let mat = new TerrainMaterial("terrain", this.scene);
                mat.setLightInvDir(this.light.direction);
                mat.setTexture("noiseTexture", cubicTex);
                chunck.mesh.material = mat;
            }
            this.terrain.chunckManager.requestGlobalLightUpdate(chunck);
            chunck.adjacents.forEach(adj => {
                if (adj) {
                    this.terrain.chunckManager.requestGlobalLightUpdate(adj);
                }
            });
        };
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
    generateBrickMiniatures() {
        if (this.terrain) {
            this.terrain.dispose();
        }
        this.light.direction = (new BABYLON.Vector3(3, 1, -2)).normalize();
        this.uiCamera.parent = this.orthoCamera;
        this.freeCamera.detachControl();
        this.scene.activeCameras = [this.orthoCamera];
        this.orthoCamera.attachControl();
        this.canvas.style.top = "calc((100vh - min(100vh, 100vw)) * 0.5)";
        this.canvas.style.left = "calc((100vw - min(100vh, 100vw)) * 0.5)";
        this.canvas.style.width = "min(100vh, 100vw)";
        this.canvas.style.height = "min(100vh, 100vw)";
        requestAnimationFrame(() => {
            this.engine.resize();
            this.screenRatio = this.engine.getRenderWidth() / this.engine.getRenderHeight();
            this.orthoCamera.setTarget(BABYLON.Vector3.Zero());
            let bricks = [
                "plate-quarter_1x1",
                "brick-quarter_8x8",
            ];
            bricks = BRICK_LIST;
            let ground = Mummu.CreateQuad("ground", {
                p1: new BABYLON.Vector3(-100 * BRICK_S, 0, -100 * BRICK_S),
                p2: new BABYLON.Vector3(100 * BRICK_S, 0, -100 * BRICK_S),
                p3: new BABYLON.Vector3(100 * BRICK_S, 0, 100 * BRICK_S),
                p4: new BABYLON.Vector3(-100 * BRICK_S, 0, 100 * BRICK_S),
                uvInWorldSpace: true,
                uvSize: 4 * BRICK_S
            });
            ground.position.copyFromFloats(BRICK_S * 0.5, 0, BRICK_S * 0.5);
            let groundMaterial = new BABYLON.StandardMaterial("ground-material");
            groundMaterial.specularColor.copyFromFloats(0, 0, 0);
            groundMaterial.diffuseTexture = new BABYLON.Texture("./datas/textures/black_white_squares.png");
            groundMaterial.alpha = 0.05;
            ground.material = groundMaterial;
            let doMinis = async () => {
                for (let i = 0; i < bricks.length; i++) {
                    await this.makeScreenshot(bricks[i], i === bricks.length - 1);
                }
            };
            doMinis();
        });
    }
    async makeScreenshot(brickName, debugNoDelete = false) {
        this.scene.clearColor = BABYLON.Color4.FromHexString("#272B2EFF");
        return new Promise(resolve => {
            requestAnimationFrame(async () => {
                let previewMesh = new BABYLON.Mesh("brick-preview-mesh");
                let previewMat = new BABYLON.StandardMaterial("brick-preview-material");
                previewMat.specularColor.copyFromFloats(0, 0, 0);
                previewMesh.material = previewMat;
                let brickTemplate = await BrickTemplateManager.Instance.getTemplate(Brick.BrickIdToIndex(brickName));
                brickTemplate.vertexData.applyToMesh(previewMesh);
                previewMesh.refreshBoundingInfo();
                let bbox = previewMesh.getBoundingInfo().boundingBox;
                let w = bbox.maximumWorld.x - bbox.minimumWorld.x;
                let h = bbox.maximumWorld.y - bbox.minimumWorld.y;
                let d = bbox.maximumWorld.z - bbox.minimumWorld.z;
                this.orthoCamera.setTarget(bbox.maximumWorld.add(bbox.minimumWorld).scaleInPlace(0.5));
                this.orthoCamera.radius = 20;
                this.orthoCamera.alpha = -Math.PI / 6;
                this.orthoCamera.beta = Math.PI / 3;
                let hAngle = Math.PI * 0.5 + this.orthoCamera.alpha;
                let vAngle = Math.PI * 0.5 - this.orthoCamera.beta;
                let halfCamMinW = d * 0.5 * Math.sin(hAngle) + w * 0.5 * Math.cos(hAngle);
                let halfCamMinH = h * 0.5 * Math.cos(vAngle) + d * 0.5 * Math.cos(hAngle) * Math.sin(vAngle) + w * 0.5 * Math.sin(hAngle) * Math.sin(vAngle);
                let f = 1.1;
                if (halfCamMinW >= halfCamMinH) {
                    this.orthoCamera.orthoTop = halfCamMinW * f;
                    this.orthoCamera.orthoBottom = -halfCamMinW * f;
                    this.orthoCamera.orthoLeft = -halfCamMinW * f;
                    this.orthoCamera.orthoRight = halfCamMinW * f;
                }
                else {
                    this.orthoCamera.orthoTop = halfCamMinH * f;
                    this.orthoCamera.orthoBottom = -halfCamMinH * f;
                    this.orthoCamera.orthoLeft = -halfCamMinH * f;
                    this.orthoCamera.orthoRight = halfCamMinH * f;
                }
                setTimeout(async () => {
                    await Mummu.MakeScreenshot({ miniatureName: brickName, size: 256 });
                    if (!debugNoDelete) {
                        previewMesh.dispose();
                    }
                    resolve();
                }, 300);
            });
        });
    }
    generateBlockShapeMiniatures() {
        if (this.terrain) {
            this.terrain.dispose();
        }
        this.light.direction = (new BABYLON.Vector3(3, 1, -2)).normalize();
        this.uiCamera.parent = this.orthoCamera;
        this.freeCamera.detachControl();
        this.scene.activeCameras = [this.orthoCamera];
        this.orthoCamera.attachControl();
        this.canvas.style.top = "calc((100vh - min(100vh, 100vw)) * 0.5)";
        this.canvas.style.left = "calc((100vw - min(100vh, 100vw)) * 0.5)";
        this.canvas.style.width = "min(100vh, 100vw)";
        this.canvas.style.height = "min(100vh, 100vw)";
        requestAnimationFrame(async () => {
            this.engine.resize();
            this.screenRatio = this.engine.getRenderWidth() / this.engine.getRenderHeight();
            this.orthoCamera.setTarget(BABYLON.Vector3.Zero());
            for (let i = 0; i <= 10; i++) {
                await this.makeShapeScreenshot("pole", i);
                await this.makeShapeScreenshot("bar", i);
                await this.makeShapeScreenshot("wall", i);
                await this.makeShapeScreenshot("tile", i);
            }
        });
    }
    async makeShapeScreenshot(shapeName, size, debugNoDelete = false) {
        this.scene.clearColor.copyFromFloats(0, 0, 0, 0);
        return new Promise(resolve => {
            requestAnimationFrame(async () => {
                let previewW = 1;
                let previewH = 1;
                let previewD = 1;
                if (shapeName === "pole") {
                    previewH = size;
                }
                else if (shapeName === "bar") {
                    previewD = size;
                }
                else if (shapeName === "wall") {
                    previewD = size;
                    previewH = size;
                }
                else if (shapeName === "tile") {
                    previewW = size;
                    previewD = size;
                }
                let previewMesh = new BABYLON.Mesh("preview");
                let w = previewW;
                let h = previewH;
                let d = previewD;
                let bboxMax = new BABYLON.Vector3(previewW - 0.5, previewH - 0.5, previewD - 0.5);
                let bboxMin = new BABYLON.Vector3(-0.5, -0.5, -0.5);
                let mat = new BABYLON.StandardMaterial("mat");
                mat.specularColor.copyFromFloats(0, 0, 0);
                for (let x = 0; x < previewW; x++) {
                    for (let y = 0; y < previewH; y++) {
                        for (let z = 0; z < previewD; z++) {
                            let cube = BABYLON.MeshBuilder.CreateBox("box", { size: 0.8 });
                            cube.position.copyFromFloats(x, y, z);
                            cube.parent = previewMesh;
                            cube.material = mat;
                        }
                    }
                }
                this.orthoCamera.setTarget(bboxMax.add(bboxMin).scaleInPlace(0.5));
                this.orthoCamera.radius = 20;
                this.orthoCamera.alpha = -Math.PI / 6;
                this.orthoCamera.beta = Math.PI / 3;
                let hAngle = Math.PI * 0.5 + this.orthoCamera.alpha;
                let vAngle = Math.PI * 0.5 - this.orthoCamera.beta;
                let halfCamMinW = d * 0.5 * Math.sin(hAngle) + w * 0.5 * Math.cos(hAngle);
                let halfCamMinH = h * 0.5 * Math.cos(vAngle) + d * 0.5 * Math.cos(hAngle) * Math.sin(vAngle) + w * 0.5 * Math.sin(hAngle) * Math.sin(vAngle);
                let f = 1.1;
                if (halfCamMinW >= halfCamMinH) {
                    this.orthoCamera.orthoTop = halfCamMinW * f;
                    this.orthoCamera.orthoBottom = -halfCamMinW * f;
                    this.orthoCamera.orthoLeft = -halfCamMinW * f;
                    this.orthoCamera.orthoRight = halfCamMinW * f;
                }
                else {
                    this.orthoCamera.orthoTop = halfCamMinH * f;
                    this.orthoCamera.orthoBottom = -halfCamMinH * f;
                    this.orthoCamera.orthoLeft = -halfCamMinH * f;
                    this.orthoCamera.orthoRight = halfCamMinH * f;
                }
                setTimeout(async () => {
                    await Mummu.MakeScreenshot({ miniatureName: shapeName + "_" + size.toFixed(0), size: 256, outlineWidth: 1 });
                    if (!debugNoDelete) {
                        previewMesh.dispose();
                    }
                    resolve();
                }, 300);
            });
        });
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
class PhasmController {
    constructor(phasm) {
        this.phasm = phasm;
        this.timer = Infinity;
        this.stop = false;
        this.debug = new BABYLON.Mesh("debug");
        //BABYLON.CreateSphereVertexData({ diameter: 0.1 }).applyToMesh(this.debug);
    }
    updateExplorerDestination() {
        this.destination = this.phasm.game.player.absolutePosition;
        this.debug.position.copyFrom(this.destination);
        return true;
    }
    update() {
        if (this.stop) {
            this.phasm.speed = 0;
            this.phasm.rotationSpeed = 0;
            return;
        }
        let dt = this.phasm.getScene().getEngine().getDeltaTime() / 1000;
        this.timer += dt;
        if (this.timer > 30) {
            if (this.updateExplorerDestination()) {
                this.timer = 0;
                return;
            }
        }
        if (!this.destination || !Mummu.IsFinite(this.destination)) {
            if (this.updateExplorerDestination()) {
                this.timer = 0;
            }
            return;
        }
        let dirDestination = this.destination.subtract(this.phasm.position);
        let distDestination = dirDestination.length();
        if (distDestination < 0.4) {
            if (this.updateExplorerDestination()) {
                this.timer = 0;
                if (Math.random() > 0.5) {
                    this.stop = true;
                    setTimeout(() => {
                        this.stop = false;
                    }, Math.random() * 15000);
                }
                return;
            }
        }
        this.phasm.speed = distDestination * 0.5;
        this.phasm.speed = Math.max(Math.min(this.phasm.speed, 0.5), 0);
        let alphaDestination = Mummu.AngleFromToAround(dirDestination, this.phasm.forward, this.phasm.up);
        this.phasm.rotationSpeed = 0;
        if (alphaDestination > Math.PI / 64) {
            this.phasm.rotationSpeed = -0.25;
        }
        else if (alphaDestination < -Math.PI / 64) {
            this.phasm.rotationSpeed = 0.25;
        }
    }
}
class Phasm extends Sumuqan.Polypode {
    constructor(game) {
        super("phasm", {
            legPairsCount: 3,
            headAnchor: (new BABYLON.Vector3(0, 0.04, 0.25)),
            hipAnchors: [
                new BABYLON.Vector3(0.12, 0.026, -0.217),
                new BABYLON.Vector3(0.08, 0, 0),
                new BABYLON.Vector3(0.037, 0.028, 0.22)
            ],
            footTargets: [
                new BABYLON.Vector3(0.25, -.2, -0.5),
                new BABYLON.Vector3(0.32, -.2, 0),
                new BABYLON.Vector3(0.15, -.2, 0.5)
            ],
            footThickness: 0,
            upperLegLength: 0.27,
            lowerLegLength: 0.31,
            legScales: [1.1, 0.9, 1],
            stepHeight: 0.15,
            stepDuration: 0.3,
            bodyWorldOffset: new BABYLON.Vector3(0, -0.05, 0),
            antennaAnchor: new BABYLON.Vector3(0.045, 0.041, 0.065),
            antennaLength: 0.5,
            scorpionTailProps: {
                length: 7,
                dist: 0.11,
                distGeometricFactor: 0.9,
                anchor: new BABYLON.Vector3(0, 0.035, -0.28)
            }
        });
        this.game = game;
        this.destination = BABYLON.Vector3.Zero();
        this._updateDrone = () => {
            this.controller.update();
        };
        this.rightLegs[0].kneeMode = Sumuqan.KneeMode.Backward;
        this.leftLegs[0].kneeMode = Sumuqan.KneeMode.Backward;
        this.rightLegs[2].kneeMode = Sumuqan.KneeMode.Outward;
        this.leftLegs[2].kneeMode = Sumuqan.KneeMode.Outward;
        let povMaterial = new ToonMaterial("debug-pov-material", this.game.scene);
        povMaterial.setDiffuse(new BABYLON.Color3(0.5, 0.5, 1));
        povMaterial.setAlpha(0.4);
        povMaterial.setSpecularIntensity(0.5);
        let colliderMaterial = new ToonMaterial("body", this.game.scene);
        colliderMaterial.setDiffuse(new BABYLON.Color3(0.5, 1, 0.5));
        colliderMaterial.setAlpha(0.4);
        colliderMaterial.setSpecularIntensity(0.5);
        let colliderHitMaterial = new ToonMaterial("body", this.game.scene);
        colliderHitMaterial.setDiffuse(new BABYLON.Color3(1, 0.5, 0.5));
        colliderHitMaterial.setAlpha(0.4);
        colliderHitMaterial.setSpecularIntensity(0.5);
        this.terrain = [];
        if (this.game.player) {
            if (this.game.player.currentChuncks) {
                this.game.player.currentChuncks.forEach(chunck => {
                    if (chunck && chunck.mesh) {
                        this.terrain.push(chunck.mesh);
                    }
                });
            }
        }
        setInterval(() => {
            this.terrain = [];
            if (this.game.player) {
                if (this.game.player.currentChuncks) {
                    this.game.player.currentChuncks.forEach(chunck => {
                        if (chunck && chunck.mesh) {
                            this.terrain.push(chunck.mesh);
                        }
                    });
                }
            }
            console.log(this.terrain.length);
        }, 1000);
        this.controller = new PhasmController(this);
        this.debugColliderMaterial = colliderMaterial;
        this.debugColliderHitMaterial = colliderHitMaterial;
        let headCollider = new Mummu.SphereCollider(new BABYLON.Vector3(0, 0, 0.1), 0.15, this.head);
        let assCollider = new Mummu.SphereCollider(new BABYLON.Vector3(0, 0, -0.2), 0.2, this.body);
        this.bodyColliders.push(headCollider, assCollider);
        let tailEndCollider = new Mummu.SphereCollider(BABYLON.Vector3.Zero(), 0.15, this.tail.tailSegments[6]);
        this.tail.tailCollider = tailEndCollider;
        this.updateBodyCollidersMeshes();
        this.debugPovMaterial = povMaterial;
        this.showCollisionDebug = true;
        if (this.showCollisionDebug) {
            BABYLON.CreateBoxVertexData({ width: 0.1, height: 0.8, depth: 0.1 }).applyToMesh(this);
            this.material = colliderHitMaterial;
        }
    }
    async initialize() {
        await super.initialize();
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.getScene().onBeforeRenderObservable.add(this._updateDrone);
    }
    async instantiate() {
        let datas = await Game.Instance.vertexDataLoader.get("./datas/meshes/phasm.babylon");
        let droneMaterial = new ToonMaterial("drone-material", this.getScene());
        let color = BABYLON.Color3.FromHexString("#9e6120");
        color.r *= 0.7 + 0.6 * Math.random();
        color.g *= 0.7 + 0.6 * Math.random();
        color.b *= 0.7 + 0.6 * Math.random();
        droneMaterial.setDiffuse(color);
        droneMaterial.setUseVertexColor(false);
        this.legs.forEach(leg => {
            datas[0].applyToMesh(leg.upperLeg);
            datas[1].applyToMesh(leg.lowerLeg);
            leg.upperLeg.material = droneMaterial;
            leg.lowerLeg.material = droneMaterial;
        });
        datas[2].applyToMesh(this.body);
        datas[3].applyToMesh(this.head);
        datas[11].applyToMesh(this.antennas[0]);
        datas[11].applyToMesh(this.antennas[1]);
        for (let i = 0; i < 7; i++) {
            datas[4 + i].applyToMesh(this.tail.tailSegments[i]);
            this.tail.tailSegments[i].material = droneMaterial;
        }
        this.body.material = droneMaterial;
        this.head.material = droneMaterial;
        this.antennas[0].material = droneMaterial;
        this.antennas[1].material = droneMaterial;
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
            let files = event.target.files;
            let file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.addEventListener('load', (event) => {
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
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
                "level",
                "noiseTexture",
                "terrainColors",
                "lightTexture",
                "debugColor",
                "blockSize_m",
                "blockHeight_m"
            ]
        });
        this._lightInvDirW = BABYLON.Vector3.Up();
        this._level = 0;
        this._debugColor = BABYLON.Color3.White();
        let w = 2;
        let h = 2;
        let d = 2;
        let data = new Uint8ClampedArray(w * h * d);
        data.fill(255);
        let myTestRaw3DTexture = new BABYLON.RawTexture3D(data, w, h, d, BABYLON.Constants.TEXTUREFORMAT_R, this.getScene(), false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE);
        myTestRaw3DTexture.wrapU = 1;
        myTestRaw3DTexture.wrapV = 1;
        myTestRaw3DTexture.wrapR = 1;
        this.setTexture("lightTexture", myTestRaw3DTexture);
        this.setLightInvDir(BABYLON.Vector3.One().normalize());
        this.setFloat("blockSize_m", 0.4);
        this.setFloat("blockHeight_m", 0.4);
        this.setColor3Array("terrainColors", Kulla.BlockTypeColors);
        this.setTexture("barkTexture", new BABYLON.Texture("./datas/textures/bark.png"));
        this.setTexture("leavesTexture", new BABYLON.Texture("./datas/textures/leaves_2.png"));
        this.setTexture("dirtTexture", new BABYLON.Texture("./datas/textures/dirt.png"));
        this.setTexture("grassTexture", new BABYLON.Texture("./datas/textures/grass.png"));
        this.setTexture("grassSparseTexture", new BABYLON.Texture("./datas/textures/grassSparse.png"));
        this.setTexture("rockTexture", new BABYLON.Texture("./datas/textures/concrete.png"));
        this.setTexture("iceTexture", new BABYLON.Texture("./datas/textures/ice.png"));
        this.setTexture("asphaltTexture", new BABYLON.Texture("./datas/textures/asphalt.png"));
        this.setTexture("rustTexture", new BABYLON.Texture("./datas/textures/rust.png"));
        this.updateDebugColor();
    }
    getLightInvDir() {
        return this._lightInvDirW;
    }
    setLightInvDir(p) {
        this._lightInvDirW.copyFrom(p);
        this.setVector3("lightInvDirW", this._lightInvDirW);
    }
    get debugColor() {
        return this._debugColor;
    }
    setDebugColor(c) {
        this._debugColor = c;
        this.updateDebugColor();
    }
    updateDebugColor() {
        this.setColor3("debugColor", this._debugColor);
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
                "normalTexture",
                "viewPositionW",
                "viewDirectionW",
                "lightInvDirW",
                "alpha",
                "useFlatSpecular",
                "specularIntensity",
                "specularColor",
                "specularCount",
                "specularPower"
            ],
            defines: ["#define INSTANCES"]
        });
        this._update = () => {
            let camera = this.getScene().activeCamera;
            let direction = camera.getForwardRay().direction;
            this.setVector3("viewPositionW", camera.globalPosition);
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
        this._whiteTexture = new BABYLON.Texture("./datas/textures/void-texture.png");
        this._whiteTexture.wrapU = 1;
        this._whiteTexture.wrapV = 1;
        this._blackTexture = new BABYLON.Texture("./datas/textures/black-texture.png");
        this._blackTexture.wrapU = 1;
        this._blackTexture.wrapV = 1;
        this.updateUseVertexColor();
        this.updateUseLightFromPOV();
        this.updateAutoLight();
        this.updateDiffuseSharpness();
        this.updateDiffuse();
        this.updateDiffuseTexture();
        this.updateNormalTexture();
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
            this.setTexture("diffuseTexture", this._whiteTexture);
        }
    }
    get normalTexture() {
        return this._normalTexture;
    }
    setNormalTexture(t) {
        this._normalTexture = t;
        this.updateNormalTexture();
    }
    updateNormalTexture() {
        if (this._normalTexture) {
            this.setTexture("normalTexture", this._normalTexture);
        }
        else {
            this.setTexture("normalTexture", this._blackTexture);
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
    constructor(brickManager, arg1, colorIndex, parent) {
        super("brick");
        this.brickManager = brickManager;
        this.colorIndex = colorIndex;
        this.anchored = false;
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.index = Brick.BrickIdToIndex(arg1);
        if (parent) {
            this.parent = parent;
        }
        else {
            this.brickManager.registerBrick(this);
        }
    }
    get isRoot() {
        return !(this.parent instanceof Brick);
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
    static BrickIdToName(brickID) {
        if (typeof (brickID) === "string") {
            return brickID;
        }
        else {
            return BRICK_LIST[brickID];
        }
    }
    setParent(node, preserveScalingSign, updatePivot) {
        if (node instanceof Brick) {
            this.anchored = false;
            this.brickManager.unregisterBrick(this);
        }
        else {
            this.brickManager.registerBrick(this);
        }
        return super.setParent(node, preserveScalingSign, updatePivot);
    }
    dispose() {
        if (this.isRoot) {
            this.brickManager.unregisterBrick(this);
            if (this.mesh) {
                this.mesh.dispose();
            }
            this.brickManager.saveToLocalStorage();
        }
        else {
            let root = this.root;
            this.setParent(undefined);
            root.updateMesh();
        }
    }
    cloneWithChildren() {
        let clone = new Brick(this.brickManager, this.index, this.colorIndex);
        let data = this.serialize();
        clone.deserialize(data);
        return clone;
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
            this.mesh.layerMask |= 0x20000000;
            this.mesh.position = this.position;
            this.mesh.rotationQuaternion = this.rotationQuaternion;
            let brickMaterial = new BABYLON.StandardMaterial("brick-material");
            brickMaterial.specularColor.copyFromFloats(0, 0, 0);
            brickMaterial.bumpTexture = new BABYLON.Texture("./datas/textures/test-steel-normal-dx.png", undefined, undefined, true);
            brickMaterial.invertNormalMapX = true;
            //brickMaterial.diffuseTexture = new BABYLON.Texture("./datas/textures/red-white-squares.png");
            let steelMaterial = new ToonMaterial("steel", this.mesh._scene);
            steelMaterial.setDiffuse(BABYLON.Color3.FromHexString("#868b8a"));
            steelMaterial.setSpecularIntensity(1);
            steelMaterial.setSpecularCount(4);
            steelMaterial.setSpecularPower(32);
            steelMaterial.setUseVertexColor(true);
            let logoMaterial = new ToonMaterial("logo", this.mesh._scene);
            logoMaterial.setDiffuse(BABYLON.Color3.FromHexString("#262b2a"));
            logoMaterial.setSpecularIntensity(0.5);
            logoMaterial.setSpecularCount(1);
            logoMaterial.setSpecularPower(16);
            logoMaterial.setUseLightFromPOV(true);
            logoMaterial.setUseFlatSpecular(true);
            this.mesh.material = steelMaterial;
            this.mesh.computeWorldMatrix(true);
            this.mesh.refreshBoundingInfo();
        }
        data.applyToMesh(this.mesh);
    }
    highlight() {
        if (this != this.root) {
            return this.root.highlight();
        }
        if (this.mesh) {
            this.mesh.renderOutline = true;
            this.mesh.outlineColor = new BABYLON.Color3(0, 1, 1);
            this.mesh.outlineWidth = 0.01;
        }
    }
    unlight() {
        if (this != this.root) {
            return this.root.unlight();
        }
        if (this.mesh) {
            this.mesh.renderOutline = false;
        }
    }
    async generateMeshVertexData(vDatas, subMeshInfos, depth = 0) {
        this.computeWorldMatrix(true);
        let template = await BrickTemplateManager.Instance.getTemplate(this.index);
        let vData = Mummu.CloneVertexData(template.vertexData);
        let colors = [];
        let color = BABYLON.Color3.FromHexString(BRICK_COLORS[this.colorIndex].hex);
        for (let i = 0; i < vData.positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b, 1);
        }
        vData.colors = colors;
        let a = 2 * Math.PI * Math.random();
        a = 0;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);
        let dU = Math.random();
        dU = 0;
        let dV = Math.random();
        dV = 0;
        let uvs = vData.uvs;
        for (let i = 0; i < uvs.length / 2; i++) {
            let u = uvs[2 * i];
            let v = uvs[2 * i + 1];
            uvs[2 * i] = cosa * u - sina * v + dU;
            uvs[2 * i + 1] = sina * u + cosa * v + dV;
        }
        vData.uvs = uvs;
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
    serialize() {
        let data = {
            id: this.index,
            col: this.colorIndex /*,
            qx: this.rotationQuaternion.x,
            qy: this.rotationQuaternion.y,
            qz: this.rotationQuaternion.z,
            qw: this.rotationQuaternion.w,*/
        };
        if (this.isRoot) {
            data.x = this.position.x;
            data.y = this.position.y;
            data.z = this.position.z;
        }
        else {
            data.p = [];
            data.p[0] = Math.round(this.position.x / BRICK_S);
            data.p[1] = Math.round(this.position.y / BRICK_H);
            data.p[2] = Math.round(this.position.z / BRICK_S);
        }
        let dir = BABYLON.Vector3.Forward().applyRotationQuaternion(this.rotationQuaternion);
        let a = Mummu.AngleFromToAround(BABYLON.Axis.Z, dir, BABYLON.Axis.Y);
        data.d = Math.round(a / (Math.PI * 0.5));
        if (this.anchored) {
            data.anc = this.anchored;
        }
        let children = this.getChildTransformNodes(true);
        if (children.length > 0) {
            data.c = [];
        }
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child instanceof Brick) {
                data.c[i] = child.serialize();
            }
        }
        return data;
    }
    deserialize(data) {
        this.index = data.id;
        this.colorIndex = isFinite(data.col) ? data.col : 0;
        if (data.p) {
            this.position.copyFromFloats(data.p[0] * BRICK_S, data.p[1] * BRICK_H, data.p[2] * BRICK_S);
        }
        else {
            this.position.copyFromFloats(data.x, data.y, data.z);
        }
        console.log(this.position);
        if (isFinite(data.d)) {
            BABYLON.Quaternion.RotationAxisToRef(BABYLON.Axis.Y, data.d * Math.PI * 0.5, this.rotationQuaternion);
        }
        else {
            this.rotationQuaternion.copyFromFloats(data.qx, data.qy, data.qz, data.qw);
        }
        console.log(this.rotationQuaternion);
        if (data.anc) {
            this.anchored = true;
        }
        if (data.c) {
            for (let i = 0; i < data.c.length; i++) {
                let child = new Brick(this.brickManager, 0, 0, this);
                child.deserialize(data.c[i]);
            }
        }
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
var ALLBRICKS = [];
var BRICK_LIST = [
    "tile_1x1",
    "tile_2x1",
    "tile_3x1",
    "tile_4x1",
    "tile_5x1",
    "tile_6x1",
    "tile_7x1",
    "tile_8x1",
    "tile_9x1",
    "tile_10x1",
    "tile_11x1",
    "tile_12x1",
    "tile_13x1",
    "tile_14x1",
    "tile_15x1",
    "tile_16x1",
    "tile_2x2",
    "tile_3x2",
    "tile_4x2",
    "tile_5x2",
    "tile_6x2",
    "tile_7x2",
    "tile_8x2",
    "tile_9x2",
    "tile_10x2",
    "tile_11x2",
    "tile_12x2",
    "tile_13x2",
    "tile_14x2",
    "tile_15x2",
    "tile_16x2",
    "tile_3x3",
    "tile_4x4",
    "tile_5x5",
    "tile_6x6",
    "tile_7x7",
    "tile_8x8",
    "tile_9x9",
    "tile_10x10",
    "tile_11x11",
    "tile_12x12",
    "tile_13x13",
    "tile_14x14",
    "tile_15x15",
    "tile_16x16",
    "brick_1x1",
    "brick_2x1",
    "brick_3x1",
    "brick_4x1",
    "brick_5x1",
    "brick_6x1",
    "brick_7x1",
    "brick_8x1",
    "brick_9x1",
    "brick_10x1",
    "brick_11x1",
    "brick_12x1",
    "brick_13x1",
    "brick_14x1",
    "brick_15x1",
    "brick_16x1",
    "brick-corner-round_1x1",
    "brick-round_1x1",
    "brick-round_2x1",
    "brick-round_3x1",
    "brick-round_4x1",
    "brick-round_5x1",
    "brick-round_6x1",
    "brick-round_7x1",
    "brick-round_8x1",
    "brick-round_9x1",
    "brick-round_10x1",
    "brick-round_11x1",
    "brick-round_12x1",
    "brick-round_13x1",
    "brick-round_14x1",
    "brick-round_15x1",
    "brick-round_16x1",
    "tile-corner-curved_2x1",
    "tile-corner-curved_3x1",
    "tile-corner-curved_4x1",
    "tile-corner-curved_5x1",
    "tile-corner-curved_6x1",
    "tile-corner-curved_7x1",
    "tile-corner-curved_8x1",
    "tile-corner-curved_3x2",
    "tile-corner-curved_4x2",
    "tile-corner-curved_5x2",
    "tile-corner-curved_6x2",
    "tile-corner-curved_7x2",
    "tile-corner-curved_8x2",
    "brick-corner-curved_2x1",
    "brick-corner-curved_3x1",
    "brick-corner-curved_4x1",
    "brick-corner-curved_5x1",
    "brick-corner-curved_6x1",
    "brick-corner-curved_7x1",
    "brick-corner-curved_8x1",
    "window-frame_2x2",
    "window-frame_2x3",
    "window-frame_3x2",
    "window-frame_3x3",
    "window-frame_4x2",
    "window-frame_4x3",
    "window-frame-corner-curved_3x2",
    "window-frame-corner-curved_3x3",
    "window-frame-corner-curved_3x4",
    "plate-quarter_1x1",
    "plate-quarter_2x2",
    "plate-quarter_3x3",
    "plate-quarter_4x4",
    "plate-quarter_5x5",
    "plate-quarter_6x6",
    "plate-quarter_7x7",
    "plate-quarter_8x8",
    "brick-quarter_1x1",
    "brick-quarter_2x2",
    "brick-quarter_3x3",
    "brick-quarter_4x4",
    "brick-quarter_5x5",
    "brick-quarter_6x6",
    "brick-quarter_7x7",
    "brick-quarter_8x8",
];
var BRICK_COLORS = [
    { name: "White", hex: "#FFFFFF" },
    { name: "Black", hex: "#05131D" },
    { name: "Reddish Brown", hex: "#582A12" },
    { name: "Sand Green", hex: "#A0BCAC" },
    { name: "Rust", hex: "#B31004" },
    { name: "Tan", hex: "#E4CD9E" },
    { name: "Dark Bluish Gray", hex: "#6C6E68" }
];
class BrickManager {
    constructor(game) {
        this.game = game;
        this.bricks = new Nabu.UniqueList();
    }
    registerBrick(brick) {
        this.bricks.push(brick);
        console.log("BrickManager holds " + this.bricks.length + " bricks");
    }
    unregisterBrick(brick) {
        this.bricks.remove(brick);
        console.log("BrickManager holds " + this.bricks.length + " bricks");
    }
    serialize() {
        let data = {
            bricks: []
        };
        for (let i = 0; i < this.bricks.length; i++) {
            data.bricks[i] = this.bricks.get(i).serialize();
        }
        return data;
    }
    deserialize(data) {
        while (this.bricks.length > 0) {
            this.bricks.get(0).dispose();
        }
        for (let i = 0; i < data.bricks.length; i++) {
            let brick = new Brick(this, 0, 0);
            brick.deserialize(data.bricks[i]);
            brick.updateMesh();
        }
    }
    saveToLocalStorage() {
        let data = this.serialize();
        window.localStorage.setItem("brick-manager", JSON.stringify(data));
    }
    loadFromLocalStorage() {
        let dataString = window.localStorage.getItem("brick-manager");
        if (dataString) {
            let data = JSON.parse(dataString);
            if (data) {
                this.deserialize(data);
            }
        }
    }
}
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
    async load(lod = 0) {
        //this.vertexData = (await this.brickTemplateManager.vertexDataLoader.get("./datas/meshes/plate_1x1.babylon"))[0];
        if (this.name.startsWith("brick_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(l, 3, w, lod);
        }
        else if (this.name.startsWith("plate-corner-cut_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            let cut = 1;
            if (l >= 4) {
                cut = 2;
            }
            this.vertexData = await BrickVertexDataGenerator.GetStuddedCutBoxVertexData(cut, l, 1, w, lod);
        }
        else if (this.name.startsWith("wall_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(l, 12, w, lod);
        }
        else if (this.name.startsWith("plate_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(l, 1, w, lod);
        }
        else if (this.name.startsWith("tile_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(l, 1, w, lod);
        }
        else if (this.name.startsWith("window-frame_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let h = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = await BrickVertexDataGenerator.GetWindowFrameVertexData(l, h, lod);
        }
        else if (this.name.startsWith("window-frame-corner-curved_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let h = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = await BrickVertexDataGenerator.GetWindowFrameCornerCurvedVertexData(l, h, lod);
        }
        else if (this.name.startsWith("tile-corner-curved_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = await BrickVertexDataGenerator.GetBoxCornerCurvedVertexData(l, 1, w, lod);
        }
        else if (this.name.startsWith("brick-corner-curved_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            let w = parseInt(this.name.split("_")[1].split("x")[1]);
            this.vertexData = await BrickVertexDataGenerator.GetBoxCornerCurvedVertexData(l, 3, w, lod);
        }
        else if (this.name.startsWith("plate-quarter_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            this.vertexData = await BrickVertexDataGenerator.GetBoxQuarterVertexData(l, 1, lod);
        }
        else if (this.name.startsWith("brick-quarter_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            this.vertexData = await BrickVertexDataGenerator.GetBoxQuarterVertexData(l, 3, lod);
        }
        else if (this.name.startsWith("brick-round_")) {
            let l = parseInt(this.name.split("_")[1].split("x")[0]);
            this.vertexData = await BrickVertexDataGenerator.GetBrickRoundVertexData(l, lod);
        }
        else if (this.name.startsWith("brick-corner-round_1x1")) {
            this.vertexData = (await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/brick-corner-round_1x1.babylon"))[0];
            BrickVertexDataGenerator.AddMarginInPlace(this.vertexData);
        }
        else if (this.name === "tile-round-quarter_1x1") {
            this.vertexData = (await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/tile-round-quarter_1x1.babylon"))[0];
            BrickVertexDataGenerator.AddMarginInPlace(this.vertexData);
        }
        else if (this.name === "tile-triangle_2x2") {
            this.vertexData = (await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/tile-triangle_2x2.babylon"))[0];
            BrickVertexDataGenerator.AddMarginInPlace(this.vertexData);
        }
        else {
            this.vertexData = BrickVertexDataGenerator.GetBoxVertexData(1, 1, 1);
        }
    }
}
var BRICK_S = 0.375;
var BRICK_H = 0.15;
var UV_S = 0.75;
class BrickVertexDataGenerator {
    static GetStudVertexDataKill(lod) {
        if (!BrickVertexDataGenerator._StudVertexData[lod]) {
            BrickVertexDataGenerator._StudVertexData[lod] = new BABYLON.VertexData();
            if (lod === 0) {
                BrickVertexDataGenerator._StudVertexData[lod].positions = [
                    -0.0795, 0, 0.0795, -0.1039, 0.079, 0.0431, -0.0795, 0.079, 0.0795, 0.0795, 0, -0.0795, 0.1039, 0.079, -0.0431, 0.0795, 0.079, -0.0795, -0.1039, 0, -0.0431, -0.1125, 0.079, 0, -0.1125, 0, 0, 0.1125, 0, 0, 0.1039, 0.079, 0.0431, 0.1125, 0.079, 0, -0.0795, 0, -0.0795, -0.0431, 0.079, -0.1039, -0.0795, 0.079, -0.0795, 0.0795, 0, 0.0795, 0.0431, 0.079, 0.1039, 0.0795, 0.079,
                    0.0795, 0.0431, 0, -0.1039, 0, 0.079, -0.1125, 0, 0, -0.1125, -0.0431, 0, 0.1039, 0, 0.079, 0.1125, 0, 0, 0.1125, 0.1039, 0, -0.0431, 0.0431, 0, 0.1039, -0.1039, 0.079, -0.0431, 0.0431, 0.079, -0.1039, 0.1039, 0, 0.0431, -0.0431, 0.079, 0.1039, -0.1039, 0, 0.0431, -0.0431, 0, -0.1039, -0.1039, 0.079, 0.0431, -0.1125, 0.079, 0, 0, 0.079, 0, 0.0795, 0.079, 0.0795, 0.0431, 0.079,
                    0.1039, -0.0795, 0.079, -0.0795, -0.0431, 0.079, -0.1039, 0.1039, 0.079, -0.0431, 0.1125, 0.079, 0, 0.0431, 0.079, -0.1039, 0, 0.079, -0.1125, -0.1039, 0.079, -0.0431, -0.0795, 0.079, 0.0795, 0, 0.079, 0.1125, -0.0431, 0.079, 0.1039, 0.1039, 0.079, 0.0431, 0.0795, 0.079, -0.0795,
                ];
                BrickVertexDataGenerator._StudVertexData[lod].normals = [
                    -0.707, 0, 0.707, -0.924, 0, 0.383, -0.707, 0, 0.707, 0.707, 0, -0.707, 0.924, 0, -0.383, 0.707, 0, -0.707, -0.924, 0, -0.383, -1, 0, 0, -1, 0, 0, 1, 0, 0, 0.924, 0, 0.383, 1, 0, 0, -0.707, 0, -0.707, -0.383, 0, -0.924, -0.707, 0, -0.707, 0.707, 0, 0.707, 0.383, 0, 0.924, 0.707, 0, 0.707, 0.383, 0, -0.924, 0, 0, -1, 0, 0, -1, -0.383, 0, 0.924, 0, 0, 1, 0, 0, 1, 0.924, 0,
                    -0.383, 0.383, 0, 0.924, -0.924, 0, -0.383, 0.383, 0, -0.924, 0.924, 0, 0.383, -0.383, 0, 0.924, -0.924, 0, 0.383, -0.383, 0, -0.924, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
                ];
                BrickVertexDataGenerator._StudVertexData[lod].uvs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                BrickVertexDataGenerator._StudVertexData[lod].indices = [
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 11, 4, 25, 22, 16, 12, 26, 6, 3, 27, 18, 15, 10, 28, 0, 29, 21, 30, 7, 1, 31, 19, 13, 32, 33, 34, 35, 36, 34, 37, 38, 34, 39, 40, 34, 41, 34, 42, 37, 34, 43, 38, 42, 34, 44, 32, 34, 36, 45, 34, 46, 34, 45, 44, 34, 46, 35, 34, 47, 48, 39, 34, 48, 34, 41, 47, 34, 40, 43, 34, 33, 0, 30, 1, 3,
                    24, 4, 6, 26, 7, 9, 28, 10, 12, 31, 13, 15, 25, 16, 18, 27, 19, 21, 29, 22, 24, 9, 11, 25, 23, 22, 12, 14, 26, 3, 5, 27, 15, 17, 10, 0, 2, 29, 30, 8, 7, 31, 20, 19,
                ];
            }
            else {
                BrickVertexDataGenerator._StudVertexData[lod].positions = [
                    0, 0.079, 0.1125, 0.0795, 0, 0.0795, 0, 0, 0.1125, 0.1125, 0.079, 0, 0.0795, 0, -0.0795, 0.1125, 0, 0, 0, 0.079, -0.1125, -0.0795, 0, -0.0795, 0, 0, -0.1125, -0.1125, 0.079, 0, -0.0795, 0, 0.0795, -0.1125, 0, 0, 0.0795, 0.079, 0.0795, 0.0795, 0.079, -0.0795, -0.0795, 0.079, -0.0795, -0.0795, 0.079, 0.0795, -0.1125, 0.079, 0, 0, 0.079, 0, -0.0795, 0.079, 0.0795, 0.0795, 0.079,
                    0.0795, 0.1125, 0.079, 0, 0.0795, 0.079, -0.0795, 0, 0.079, -0.1125, -0.0795, 0.079, -0.0795, 0, 0.079, 0.1125,
                ];
                BrickVertexDataGenerator._StudVertexData[lod].normals = [0, 0, 1, 0.707, 0, 0.707, 0, 0, 1, 1, 0, 0, 0.707, 0, -0.707, 1, 0, 0, 0, 0, -1, -0.707, 0, -0.707, 0, 0, -1, -1, 0, 0, -0.707, 0, 0.707, -1, 0, 0, 0.707, 0, 0.707, 0.707, 0, -0.707, -0.707, 0, -0.707, -0.707, 0, 0.707, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
                BrickVertexDataGenerator._StudVertexData[lod].uvs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                BrickVertexDataGenerator._StudVertexData[lod].indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 1, 13, 8, 4, 14, 11, 7, 15, 2, 10, 16, 17, 18, 19, 17, 20, 21, 17, 22, 23, 17, 16, 18, 17, 24, 24, 17, 19, 20, 17, 21, 22, 17, 23, 0, 12, 1, 3, 13, 4, 6, 14, 7, 9, 15, 10, 12, 3, 5, 13, 6, 8, 14, 9, 11, 15, 0, 2];
            }
        }
        return BrickVertexDataGenerator._StudVertexData[lod];
    }
    static GetBoxVertexData(length, height, width, lod = 1) {
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
            p4: new BABYLON.Vector3(xMin, yMax, zMin),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let right = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMin),
            p2: new BABYLON.Vector3(xMax, yMin, zMax),
            p3: new BABYLON.Vector3(xMax, yMax, zMax),
            p4: new BABYLON.Vector3(xMax, yMax, zMin),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let front = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMax),
            p2: new BABYLON.Vector3(xMin, yMin, zMax),
            p3: new BABYLON.Vector3(xMin, yMax, zMax),
            p4: new BABYLON.Vector3(xMax, yMax, zMax),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let left = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMin, yMin, zMax),
            p2: new BABYLON.Vector3(xMin, yMin, zMin),
            p3: new BABYLON.Vector3(xMin, yMax, zMin),
            p4: new BABYLON.Vector3(xMin, yMax, zMax),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let top = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMax, zMin),
            p2: new BABYLON.Vector3(xMax, yMax, zMax),
            p3: new BABYLON.Vector3(xMin, yMax, zMax),
            p4: new BABYLON.Vector3(xMin, yMax, zMin),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let bottom = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(xMax, yMin, zMin),
            p2: new BABYLON.Vector3(xMin, yMin, zMin),
            p3: new BABYLON.Vector3(xMin, yMin, zMax),
            p4: new BABYLON.Vector3(xMax, yMin, zMax),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let data = Mummu.MergeVertexDatas(back, right, front, left, top, bottom);
        BrickVertexDataGenerator.AddMarginInPlace(data);
        return data;
    }
    static async GetBoxCornerCurvedVertexData(length, height, width, lod = 1) {
        let innerR = (length - width) * BRICK_S;
        let outterR = length * BRICK_S;
        let y = height * BRICK_H;
        let back = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(innerR, 0, 0),
            p2: new BABYLON.Vector3(outterR, 0, 0),
            p3: new BABYLON.Vector3(outterR, y, 0),
            p4: new BABYLON.Vector3(innerR, y, 0),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let right = Mummu.CreateCylinderSliceVertexData({
            alphaMin: 0,
            alphaMax: Math.PI * 0.5,
            radius: outterR,
            yMin: 0,
            yMax: y,
            tesselation: 5,
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let front = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(0, 0, outterR),
            p2: new BABYLON.Vector3(0, 0, innerR),
            p3: new BABYLON.Vector3(0, y, innerR),
            p4: new BABYLON.Vector3(0, y, outterR),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let left = Mummu.CreateCylinderSliceVertexData({
            alphaMin: 0,
            alphaMax: Math.PI * 0.5,
            radius: innerR,
            yMin: 0,
            yMax: y,
            sideOrientation: BABYLON.Mesh.BACKSIDE,
            tesselation: 5,
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let top = Mummu.CreateDiscSliceVertexData({
            alphaMin: 0,
            alphaMax: Math.PI * 0.5,
            innerRadius: innerR,
            outterRadius: outterR,
            y: y,
            tesselation: 5,
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let bottom = Mummu.CreateDiscSliceVertexData({
            alphaMin: 0,
            alphaMax: Math.PI * 0.5,
            innerRadius: innerR,
            outterRadius: outterR,
            y: 0,
            sideOrientation: BABYLON.Mesh.BACKSIDE,
            tesselation: 5,
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let data = Mummu.MergeVertexDatas(back, right, front, left, top, bottom);
        Mummu.TranslateVertexDataInPlace(data, new BABYLON.Vector3(-innerR - BRICK_S * 0.5, 0, -BRICK_S * 0.5));
        BrickVertexDataGenerator.AddMarginInPlace(data);
        return data;
    }
    static async GetBoxQuarterVertexData(length, height, lod = 1) {
        let radius = length * BRICK_S;
        let y = height * BRICK_H;
        let back = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(0, 0, 0),
            p2: new BABYLON.Vector3(radius, 0, 0),
            p3: new BABYLON.Vector3(radius, y, 0),
            p4: new BABYLON.Vector3(0, y, 0),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let right = Mummu.CreateCylinderSliceVertexData({
            alphaMin: 0,
            alphaMax: Math.PI * 0.5,
            radius: radius,
            yMin: 0,
            yMax: y,
            tesselation: 5,
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let front = Mummu.CreateQuadVertexData({
            p1: new BABYLON.Vector3(0, 0, radius),
            p2: new BABYLON.Vector3(0, 0, 0),
            p3: new BABYLON.Vector3(0, y, 0),
            p4: new BABYLON.Vector3(0, y, radius),
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let top = Mummu.CreateDiscVertexData({
            alphaMin: 0,
            alphaMax: Math.PI * 0.5,
            radius: radius,
            y: y,
            tesselation: 5,
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let bottom = Mummu.CreateDiscVertexData({
            alphaMin: 0,
            alphaMax: Math.PI * 0.5,
            radius: radius,
            y: 0,
            sideOrientation: BABYLON.Mesh.BACKSIDE,
            tesselation: 5,
            uvInWorldSpace: true,
            uvSize: UV_S
        });
        let data = Mummu.MergeVertexDatas(back, right, front, top, bottom);
        Mummu.TranslateVertexDataInPlace(data, new BABYLON.Vector3(-BRICK_S * 0.5, 0, -BRICK_S * 0.5));
        BrickVertexDataGenerator.AddMarginInPlace(data);
        return data;
    }
    static async GetStuddedCutBoxVertexData(cut, length, height, width, lod = 1) {
        let datas = await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/plate-corner-cut.babylon");
        let cutBoxRawData = Mummu.CloneVertexData(datas[0]);
        let dx = (width - 2) * BRICK_S;
        let dxCut = (cut - 1) * BRICK_S;
        let dy = (height - 1) * BRICK_H;
        let dz = (length - 2) * BRICK_S;
        let dzCut = (cut - 1) * BRICK_S;
        let positions = cutBoxRawData.positions;
        for (let i = 0; i < positions.length / 3; i++) {
            let x = positions[3 * i];
            let y = positions[3 * i + 1];
            let z = positions[3 * i + 2];
            if (x > BRICK_S) {
                x += dx;
            }
            else if (x > 0) {
                x += dxCut;
            }
            if (y > BRICK_H * 0.5) {
                y += dy;
            }
            if (z > BRICK_S) {
                z += dz;
            }
            else if (z > 0) {
                z += dzCut;
            }
            positions[3 * i] = x;
            positions[3 * i + 1] = y;
            positions[3 * i + 2] = z;
        }
        cutBoxRawData.positions = positions;
        let normals = [];
        BABYLON.VertexData.ComputeNormals(cutBoxRawData.positions, cutBoxRawData.indices, normals);
        cutBoxRawData.normals = normals;
        cutBoxRawData.colors = undefined;
        BrickVertexDataGenerator.AddMarginInPlace(cutBoxRawData);
        return cutBoxRawData;
    }
    static async GetWindowFrameVertexData(length, height, lod = 1) {
        let datas = await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/window-frame_2x2.babylon");
        let cutBoxRawData = Mummu.CloneVertexData(datas[0]);
        let dy = (height - 2) * BRICK_H * 3;
        let dz = (length - 2) * BRICK_S;
        let positions = cutBoxRawData.positions;
        let normals = cutBoxRawData.normals;
        let uvs = cutBoxRawData.uvs;
        for (let i = 0; i < positions.length / 3; i++) {
            let nx = normals[3 * i];
            let ny = normals[3 * i + 1];
            let nz = normals[3 * i + 2];
            let x = positions[3 * i];
            let y = positions[3 * i + 1];
            let z = positions[3 * i + 2];
            let face = 0;
            if (nx > 0.9) {
                face = 1;
            }
            else if (nx < -0.9) {
                face = 1;
            }
            else if (y < 0.001 && ny < -0.9) {
                face = 2;
            }
            else if (y > 6 * BRICK_H - 0.001 && ny > 0.9) {
                face = 2;
            }
            else if (z < -0.5 * BRICK_S + 0.01 && nz < -0.9) {
                face = 3;
            }
            else if (z > BRICK_S * 1.5 - 0.01 && nz > 0.9) {
                face = 3;
            }
            else {
                if (y > BRICK_H * 3 && z > BRICK_S * 0.5) {
                    // do nothing
                    if (uvs[2 * i] > 1) {
                        uvs[2 * i] += 2 * dy + 2 * dz;
                    }
                }
                else if (y < BRICK_H * 3 && z > BRICK_S * 0.5) {
                    uvs[2 * i] += dy;
                }
                else if (y < BRICK_H * 3 && z < BRICK_S * 0.5) {
                    uvs[2 * i] += dy + dz;
                }
                else if (y > BRICK_H * 3 && z < BRICK_S * 0.5) {
                    uvs[2 * i] += 2 * dy + dz;
                }
            }
            if (y > BRICK_H * 3) {
                y += dy;
            }
            if (z > BRICK_S * 0.5) {
                z += dz;
            }
            if (face === 1) {
                uvs[2 * i] = z;
                uvs[2 * i + 1] = y;
            }
            else if (face === 2) {
                uvs[2 * i] = z;
                uvs[2 * i + 1] = x;
            }
            else if (face === 3) {
                uvs[2 * i] = x;
                uvs[2 * i + 1] = y;
            }
            uvs[2 * i] /= UV_S;
            uvs[2 * i + 1] /= UV_S;
            positions[3 * i + 1] = y;
            positions[3 * i + 2] = z;
        }
        cutBoxRawData.positions = positions;
        cutBoxRawData.uvs = uvs;
        BABYLON.VertexData.ComputeNormals(cutBoxRawData.positions, cutBoxRawData.indices, normals);
        cutBoxRawData.normals = normals;
        cutBoxRawData.colors = undefined;
        BrickVertexDataGenerator.AddMarginInPlace(cutBoxRawData);
        return cutBoxRawData;
    }
    static async GetWindowFrameCornerCurvedVertexData(length, height, lod = 1) {
        let datas = await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/window-frame-corner_" + length + ".babylon");
        let index = height - 2;
        let data = Mummu.CloneVertexData(datas[index]);
        if (data) {
            let uvs = data.uvs;
            for (let i = 0; i < uvs.length; i++) {
                uvs[i] = uvs[i] / UV_S;
            }
            data.uvs = uvs;
            BrickVertexDataGenerator.AddMarginInPlace(data);
            return data;
        }
        return undefined;
    }
    static async GetBrickRoundVertexData(length, lod = 1) {
        let datas = await BrickTemplateManager.Instance.vertexDataLoader.get("./datas/meshes/brick-round_1x1.babylon");
        let cutBoxRawData = Mummu.CloneVertexData(datas[0]);
        let dz = (length - 1) * BRICK_S;
        let positions = cutBoxRawData.positions;
        let normals = cutBoxRawData.normals;
        let uvs = cutBoxRawData.uvs;
        for (let i = 0; i < positions.length / 3; i++) {
            let nx = normals[3 * i];
            let ny = normals[3 * i + 1];
            let nz = normals[3 * i + 2];
            let x = positions[3 * i];
            let y = positions[3 * i + 1];
            let z = positions[3 * i + 2];
            if (z > 0) {
                z += dz;
            }
            if (ny < -0.9) {
                uvs[2 * i] = z;
                uvs[2 * i + 1] = x;
            }
            else if (nx < -0.9) {
                uvs[2 * i] = z;
                uvs[2 * i + 1] = y;
            }
            else if (nz < -0.9 || nz > 0.9) {
            }
            else {
                if (z > 0) {
                    uvs[2 * i] += dz;
                }
            }
            positions[3 * i + 2] = z;
        }
        cutBoxRawData.positions = positions;
        cutBoxRawData.uvs = uvs;
        cutBoxRawData.colors = undefined;
        BrickVertexDataGenerator.AddMarginInPlace(cutBoxRawData);
        return cutBoxRawData;
    }
    static AddMarginInPlace(vertexData, margin = 0.001, cx = 0, cy = BRICK_H * 0.5, cz = 0) {
        let positions = vertexData.positions;
        for (let i = 0; i < positions.length / 3; i++) {
            let x = positions[3 * i];
            let y = positions[3 * i + 1];
            let z = positions[3 * i + 2];
            if (x > cx) {
                x -= margin;
            }
            else {
                x += margin;
            }
            if (y > cy) {
                y -= margin;
            }
            else {
                y += margin;
            }
            if (z > cz) {
                z -= margin;
            }
            else {
                z += margin;
            }
            positions[3 * i] = x;
            positions[3 * i + 1] = y;
            positions[3 * i + 2] = z;
        }
    }
}
BrickVertexDataGenerator._StudVertexData = [];
class Human {
    constructor(game) {
        this.game = game;
        this.body = new HumanBody(this);
        this.spinalCord = new HumanSpinalCord(this);
        this.brain = new HumanBrain(this);
    }
    async instantiate() {
        await this.body.instantiate();
        await this.spinalCord.instantiate();
    }
    update() {
    }
}
class HumanBody extends BABYLON.Mesh {
    constructor(human) {
        super("human");
        this.human = human;
        this.rootAlt = 0.8;
        this.rootLength = 0.4;
        this.torsoLength = 0.4;
        this.hipPos = BABYLON.Vector3.Zero();
        this.upperLegLength = 0.4;
        this.lowerLegLength = 0.4;
        this.shoulderPos = BABYLON.Vector3.Zero();
        this.upperArmLength = 0.4;
        this.lowerArmLength = 0.4;
        this.handLength = 0.15;
        this.totalArmLength = 0.95;
        this._instantiated = false;
        this._update = () => {
        };
    }
    get game() {
        return this.human.game;
    }
    get engine() {
        return this._scene.getEngine();
    }
    async instantiate() {
        return new Promise(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "datas/meshes/scientist.babylon", "", this._scene, (meshes, particlesSystems, skeletons) => {
                meshes.forEach(mesh => {
                    if (mesh instanceof BABYLON.Mesh) {
                        this.mesh = mesh;
                        this.mesh.alwaysSelectAsActiveMesh = true;
                        let toonMat = new BABYLON.StandardMaterial("toon-material", this.game.scene);
                        toonMat.specularColor.copyFromFloats(0, 0, 0);
                        mesh.material = toonMat;
                    }
                });
                skeletons.forEach(skeleton => {
                    console.log(skeleton);
                    this.root = skeleton.bones.find(bone => { return bone.name === "ass"; });
                    this.head = skeleton.bones.find(bone => { return bone.name === "head"; });
                    this.head.parent = undefined;
                    this.torso = skeleton.bones.find(bone => { return bone.name === "torso"; });
                    console.log("torso");
                    console.log(this.torso);
                    console.log(this.torso.getAbsolutePosition());
                    console.log(this.torso.rotationQuaternion);
                    console.log(BABYLON.Quaternion.Identity());
                    console.log("- - -");
                    this.upperLegL = skeleton.bones.find(bone => { return bone.name === "upper-leg-left"; });
                    this.upperLegR = skeleton.bones.find(bone => { return bone.name === "upper-leg-right"; });
                    this.lowerLegL = skeleton.bones.find(bone => { return bone.name === "leg-left"; });
                    this.lowerLegR = skeleton.bones.find(bone => { return bone.name === "leg-right"; });
                    this.footL = skeleton.bones.find(bone => { return bone.name === "foot-left"; });
                    this.footR = skeleton.bones.find(bone => { return bone.name === "foot-right"; });
                    this.upperArmL = skeleton.bones.find(bone => { return bone.name === "upper-arm-left"; });
                    this.upperArmR = skeleton.bones.find(bone => { return bone.name === "upper-arm-right"; });
                    this.lowerArmL = skeleton.bones.find(bone => { return bone.name === "lower-arm-left"; });
                    this.lowerArmR = skeleton.bones.find(bone => { return bone.name === "lower-arm-right"; });
                    this.handL = skeleton.bones.find(bone => { return bone.name === "hand-left"; });
                    this.handR = skeleton.bones.find(bone => { return bone.name === "hand-right"; });
                    this.thumbL = skeleton.bones.find(bone => { return bone.name === "thumb-left"; });
                    this.thumbR = skeleton.bones.find(bone => { return bone.name === "thumb-right"; });
                    this.rootLength = BABYLON.Vector3.Distance(this.root.getAbsolutePosition(), this.torso.getAbsolutePosition());
                    this.torsoLength = BABYLON.Vector3.Distance(this.torso.getAbsolutePosition(), this.head.getAbsolutePosition());
                    this.upperArmLength = BABYLON.Vector3.Distance(this.upperArmR.getAbsolutePosition(), this.lowerArmR.getAbsolutePosition());
                    this.lowerArmLength = BABYLON.Vector3.Distance(this.lowerArmR.getAbsolutePosition(), this.handR.getAbsolutePosition());
                    this.upperLegLength = BABYLON.Vector3.Distance(this.upperLegR.getAbsolutePosition(), this.lowerLegR.getAbsolutePosition());
                    this.lowerLegLength = BABYLON.Vector3.Distance(this.lowerLegR.getAbsolutePosition(), this.footR.getAbsolutePosition());
                    this.rootAlt = this.upperLegLength + this.lowerLegLength;
                    this.hipPos = this.root.getLocalPositionFromAbsolute(this.upperLegR.getAbsolutePosition());
                    let deltaShoulder = this.upperArmR.getAbsolutePosition().subtract(this.torso.getAbsolutePosition());
                    this.shoulderPos.x = BABYLON.Vector3.Dot(deltaShoulder, this.torso.getDirection(BABYLON.Axis.X));
                    this.shoulderPos.y = BABYLON.Vector3.Dot(deltaShoulder, this.torso.getDirection(BABYLON.Axis.Y));
                    this.shoulderPos.z = -BABYLON.Vector3.Dot(deltaShoulder, this.torso.getDirection(BABYLON.Axis.Z));
                    this.totalArmLength = this.upperArmLength + this.lowerArmLength + this.handLength;
                    this.upperArmR.setParent(undefined, true);
                    this.upperArmL.setParent(undefined, true);
                    console.log(this.rootAlt);
                    console.log(this.hipPos);
                    console.log(this.shoulderPos);
                    skeleton.bones.forEach(bone => {
                        if (!bone.parent) {
                            console.log(bone.name + " no parent");
                        }
                        else {
                            console.log(bone.name + " " + bone.parent.name);
                        }
                    });
                    console.log(this.root);
                });
                this._instantiated = true;
                resolve();
            });
        });
    }
}
var BrainMode;
(function (BrainMode) {
    BrainMode[BrainMode["Idle"] = 0] = "Idle";
    BrainMode[BrainMode["Travel"] = 1] = "Travel";
})(BrainMode || (BrainMode = {}));
class BrainTask {
    constructor(brain) {
        this.brain = brain;
    }
}
class LookAtTask extends BrainTask {
    constructor(brain, target) {
        super(brain);
        this.target = target;
    }
    async run() {
        return new Promise(resolve => {
            this.brain.human.spinalCord.targetPosition = undefined;
            this.brain.human.spinalCord.targetLook = this.target;
            this.brain.human.spinalCord.handMode = HandMode.Look;
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }
}
class TravelToTask extends BrainTask {
    constructor(brain, target) {
        super(brain);
        this.target = target;
    }
    async run() {
        return new Promise(resolve => {
            this.brain.human.spinalCord.targetPosition = this.target;
            this.brain.human.spinalCord.targetLook = this.target.add(new BABYLON.Vector3(0, 1, 0));
            this.brain.human.spinalCord.handMode = HandMode.None;
            let step = () => {
                let dx = this.brain.human.spinalCord.position.x - this.brain.human.spinalCord.targetPosition.x;
                let dz = this.brain.human.spinalCord.position.z - this.brain.human.spinalCord.targetPosition.z;
                if (Math.sqrt(dx * dx + dz * dz) < 0.1) {
                    resolve();
                }
                else {
                    requestAnimationFrame(step);
                }
            };
            step();
        });
    }
}
class HumanBrain {
    constructor(human) {
        this.human = human;
        this.mode = BrainMode.Idle;
        this.working = false;
    }
    update() {
        if (this.working) {
            return;
        }
        else {
            let task;
            if (Math.random() < 0.3) {
                let rayOrigin = this.human.spinalCord.position.clone();
                rayOrigin.y += 10;
                rayOrigin.x += -10 + 20 * Math.random();
                rayOrigin.z += -10 + 20 * Math.random();
                let ray = new BABYLON.Ray(rayOrigin, new BABYLON.Vector3(0, -1, 0));
                let hit = this.human.game.scene.pickWithRay(ray, (mesh) => {
                    return mesh.name === "ground" || mesh.name.startsWith("chunck");
                });
                if (hit.hit) {
                    task = new TravelToTask(this, hit.pickedPoint);
                    console.log("TravelToTask");
                }
            }
            else {
                let targetLook = this.human.spinalCord.position.clone();
                targetLook.addInPlace(this.human.spinalCord.forward.scale(20));
                targetLook.addInPlaceFromFloats(-10 + 20 * Math.random(), -20 + 40 * Math.random(), -10 + 20 * Math.random());
                task = new LookAtTask(this, targetLook);
                console.log("LookAtTask");
            }
            if (task) {
                this.working = true;
                task.run().then(() => { this.working = false; });
            }
        }
    }
}
var HandMode;
(function (HandMode) {
    HandMode[HandMode["None"] = 0] = "None";
    HandMode[HandMode["Show"] = 1] = "Show";
    HandMode[HandMode["Look"] = 2] = "Look";
})(HandMode || (HandMode = {}));
class HumanSpinalCord extends BABYLON.Mesh {
    constructor(human) {
        super("human");
        this.human = human;
        this.currentSpeed = 0;
        this.currentRotSpeed = 0;
        this.handMode = HandMode.None;
        this._instantiated = false;
        this.groundedFeet = new Nabu.UniqueList();
        this.targetGravityAdvance = BABYLON.Vector3.Zero();
        this._steping = false;
        this.walkingUpdate = () => {
            let dt = this.engine.getDeltaTime() / 1000;
            let deltaFootR = BABYLON.Vector3.Dot(this.footR.position.subtract(this.root.position), this.forward);
            let deltaFootL = BABYLON.Vector3.Dot(this.footL.position.subtract(this.root.position), this.forward);
            if (this.handMode === HandMode.None) {
                let p = this.up.scale(-1).add(this.right.scale(0.2));
                p.normalize().scaleInPlace(this.humanBody.totalArmLength);
                Mummu.RotateInPlace(p, this.right, deltaFootR * Math.PI / 2.7);
                p.addInPlace(this.shoulderR.absolutePosition);
                this.stepHandToP(this.handR, this.shoulderR, p);
                Mummu.QuaternionFromYZAxisToRef(this.right, this.handR.position.subtract(this.elbowR.position), this.handR.rotationQuaternion);
            }
            else if (this.handMode === HandMode.Look) {
                let p = this.head.absolutePosition.add(this.head.forward.scale(0.2)).add(this.head.up.scale(0.27));
                this.stepHandToP(this.handR, this.shoulderR, p);
                Mummu.QuaternionFromYZAxisToRef(this.head.up.add(this.right.scale(0.2)), this.handR.position.subtract(this.elbowR.position), this.handR.rotationQuaternion);
            }
            let p = this.up.scale(-1).add(this.right.scale(-0.2));
            p.normalize().scaleInPlace(this.humanBody.totalArmLength);
            Mummu.RotateInPlace(p, this.right, deltaFootL * Math.PI / 2.7);
            p.addInPlace(this.shoulderL.absolutePosition);
            this.stepHandToP(this.handL, this.shoulderL, p);
            Mummu.QuaternionFromYZAxisToRef(this.right.scale(-1), this.handL.position.subtract(this.elbowL.position), this.handL.rotationQuaternion);
            if (this.targetPosition) {
                let dirToTarget = this.targetPosition.subtract(this.position).normalize();
                let angleToTargetPosition = Mummu.AngleFromToAround(this.forward, dirToTarget, BABYLON.Axis.Y);
                if (angleToTargetPosition > Math.PI / 32) {
                    this.currentRotSpeed = 0.5 * this.currentRotSpeed + 0.5 * Math.PI;
                    this.rotation.y += dt * this.currentRotSpeed;
                }
                else if (angleToTargetPosition < -Math.PI / 32) {
                    this.currentRotSpeed = 0.5 * this.currentRotSpeed - 0.5 * Math.PI;
                    this.rotation.y += dt * this.currentRotSpeed;
                }
                else {
                    this.currentRotSpeed = 0.5 * this.currentRotSpeed;
                }
                let targetSpeed = 1.1 * (1 - Math.abs(angleToTargetPosition / Math.PI));
                if (BABYLON.Vector3.Distance(this.targetPosition, this.position) > 0) {
                    this.currentSpeed = 0.95 * this.currentSpeed + 0.05 * targetSpeed;
                    this.position.addInPlace(this.forward.scale(this.currentSpeed * dt));
                    BABYLON.Vector3.LerpToRef(this.targetGravityAdvance, this.forward.scale(0.2), 0.1, this.targetGravityAdvance);
                }
            }
            else {
                this.currentRotSpeed = 0.5 * this.currentRotSpeed;
                this.currentSpeed = 0.95 * this.currentSpeed;
                BABYLON.Vector3.LerpToRef(this.targetGravityAdvance, BABYLON.Vector3.Zero(), 0.1, this.targetGravityAdvance);
            }
            if (!this._steping) {
                let footTargetR = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0.06 + 0.05 * Math.abs(this.currentRotSpeed), 0, 0), this.getWorldMatrix());
                let rayR = new BABYLON.Ray(footTargetR.add(new BABYLON.Vector3(0, 2, 0)), new BABYLON.Vector3(0, -1, 0));
                let hitR = this._scene.pickWithRay(rayR, (mesh) => {
                    return mesh.name === "ground" || mesh.name.startsWith("chunck");
                });
                if (hitR.hit) {
                    footTargetR = hitR.pickedPoint;
                }
                let footTargetL = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-0.06 - 0.05 * Math.abs(this.currentRotSpeed), 0, 0), this.getWorldMatrix());
                let rayL = new BABYLON.Ray(footTargetL.add(new BABYLON.Vector3(0, 2, 0)), new BABYLON.Vector3(0, -1, 0));
                let hitL = this._scene.pickWithRay(rayL, (mesh) => {
                    return mesh.name === "ground" || mesh.name.startsWith("chunck");
                });
                if (hitL.hit) {
                    footTargetL = hitL.pickedPoint;
                }
                let dL = BABYLON.Vector3.Distance(this.footL.absolutePosition, footTargetL);
                let dR = BABYLON.Vector3.Distance(this.footR.absolutePosition, footTargetR);
                if (dL > dR) {
                    if (dL > 0.01) {
                        this._steping = true;
                        this.groundedFeet.remove(this.footL);
                        Mummu.DrawDebugPoint(footTargetL, 60, BABYLON.Color3.Red(), 0.5);
                        this.step(this.footL, footTargetL, 1, () => {
                            this._steping = false;
                            this.groundedFeet.push(this.footL);
                        });
                    }
                }
                else {
                    if (dR > 0.01) {
                        this._steping = true;
                        this.groundedFeet.remove(this.footR);
                        Mummu.DrawDebugPoint(footTargetL, 60, BABYLON.Color3.Red(), 0.5);
                        this.step(this.footR, footTargetR, 1, () => {
                            this._steping = false;
                            this.groundedFeet.push(this.footR);
                        });
                    }
                }
            }
        };
        this._timer = 0;
        this._update = () => {
            let dt = this.engine.getDeltaTime() / 1000;
            this._timer += dt;
            let q = BABYLON.Quaternion.Identity();
            let footCenter = this.footL.position.add(this.footR.position).scaleInPlace(0.5);
            let torsoDir = this.up.add(this.head.up).add(this.forward.scale(this.currentSpeed * 0.1)).subtract(this.forward.scale(0.2));
            torsoDir.normalize();
            let targetRoot = footCenter.clone();
            //targetRoot.addInPlace(this.forward.scale(this.currentSpeed * 0.2))
            targetRoot.y += this.humanBody.rootAlt;
            while (targetRoot.y > this.footR.position.y && BABYLON.Vector3.Distance(this.footR.position, targetRoot) > this.humanBody.rootAlt * 1) {
                targetRoot.y -= 0.01;
            }
            while (targetRoot.y > this.footL.position.y && BABYLON.Vector3.Distance(this.footL.position, targetRoot) > this.humanBody.rootAlt * 1) {
                targetRoot.y -= 0.01;
            }
            let f = Nabu.Easing.smooth025Sec(1 / dt);
            this.root.position.y = this.root.position.y * f + targetRoot.y * (1 - f);
            f = 0;
            this.root.position.x = this.root.position.x * f + targetRoot.x * (1 - f);
            this.root.position.z = this.root.position.z * f + targetRoot.z * (1 - f);
            let torsoHeight = this.humanBody.rootLength + 0.005 * Math.cos(this._timer / 3 * 2 * Math.PI);
            // Shake that ass
            let footDir = this.footR.position.subtract(this.footL.position).normalize();
            footDir.addInPlace(this.right.scale(4)).normalize();
            //footDir = this.right;
            Mummu.QuaternionFromXYAxisToRef(footDir, torsoDir.add(BABYLON.Vector3.Up()), this.root.rotationQuaternion);
            // Alpha shouldering
            let handDir = this.handR.position.subtract(this.handL.position).normalize();
            handDir.addInPlace(this.right.scale(4)).normalize();
            Mummu.QuaternionFromXYAxisToRef(handDir, torsoDir, this.torso.rotationQuaternion);
            let shoulderForward = BABYLON.Vector3.Cross(this.head.absolutePosition.subtract(this.torso.absolutePosition), handDir).normalize();
            let footForward = BABYLON.Vector3.Cross(this.torso.absolutePosition.subtract(this.root.absolutePosition), footDir).normalize();
            this.torso.position = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, torsoHeight, 0), this.root.getWorldMatrix());
            this.head.position = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, this.humanBody.torsoLength, 0), this.torso.getWorldMatrix());
            if (this.targetLook) {
                let dir = this.targetLook.subtract(this.head.position);
                let alpha = Mummu.Angle(this.forward, dir);
                if (alpha > Math.PI * 0.4) {
                    BABYLON.Vector3.SlerpToRef(this.forward, dir, Math.PI * 0.4 / alpha, dir);
                }
                Mummu.QuaternionFromZYAxisToRef(dir, BABYLON.Axis.Y, q);
            }
            else {
                Mummu.QuaternionFromZYAxisToRef(this.forward, BABYLON.Axis.Y, q);
            }
            let fHead = Nabu.Easing.smooth05Sec(1 / dt);
            BABYLON.Quaternion.SlerpToRef(this.head.rotationQuaternion, q, 1 - fHead, this.head.rotationQuaternion);
            // Arm Left
            let wristLPosition = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, -this.humanBody.handLength), this.handL.getWorldMatrix());
            this.elbowL.position.copyFrom(wristLPosition).subtractInPlace(this.forward.scale(this.humanBody.lowerArmLength)).subtractInPlace(this.right.scale(this.humanBody.lowerArmLength)).subtractInPlace(this.up.scale(this.humanBody.lowerArmLength));
            let upperArmLZ = BABYLON.Vector3.Zero();
            let lowerArmLZ = BABYLON.Vector3.Zero();
            for (let i = 0; i < 3; i++) {
                lowerArmLZ.copyFrom(wristLPosition).subtractInPlace(this.elbowL.position).normalize().scaleInPlace(this.humanBody.lowerArmLength);
                this.elbowL.position.copyFrom(wristLPosition).subtractInPlace(lowerArmLZ);
                upperArmLZ.copyFrom(this.elbowL.position).subtractInPlace(this.shoulderL.absolutePosition).normalize().scaleInPlace(this.humanBody.upperArmLength);
                this.elbowL.position.copyFrom(this.shoulderL.absolutePosition).addInPlace(upperArmLZ);
            }
            Mummu.ForceDistanceFromOriginInPlace(this.elbowL.position, this.shoulderL.absolutePosition, this.humanBody.upperArmLength);
            Mummu.ForceDistanceFromOriginInPlace(wristLPosition, this.elbowL.absolutePosition, this.humanBody.lowerArmLength);
            // Arm Right
            let wristRPosition = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, -this.humanBody.handLength), this.handR.getWorldMatrix());
            this.elbowR.position.copyFrom(wristRPosition).addInPlace(this.shoulderR.absolutePosition).scaleInPlace(0.5);
            this.elbowR.position.addInPlace(this.right.scale(this.humanBody.lowerArmLength * 0.3));
            this.elbowR.position.subtractInPlace(this.up.scale(this.humanBody.lowerArmLength * 0.3));
            let upperArmRZ = BABYLON.Vector3.Zero();
            let lowerArmRZ = BABYLON.Vector3.Zero();
            for (let i = 0; i < 3; i++) {
                lowerArmRZ.copyFrom(wristRPosition).subtractInPlace(this.elbowR.position).normalize().scaleInPlace(this.humanBody.lowerArmLength);
                this.elbowR.position.copyFrom(wristRPosition).subtractInPlace(lowerArmRZ);
                upperArmRZ.copyFrom(this.elbowR.position).subtractInPlace(this.shoulderR.absolutePosition).normalize().scaleInPlace(this.humanBody.upperArmLength);
                this.elbowR.position.copyFrom(this.shoulderR.absolutePosition).addInPlace(upperArmRZ);
            }
            Mummu.ForceDistanceFromOriginInPlace(this.elbowR.position, this.shoulderR.absolutePosition, this.humanBody.upperArmLength);
            Mummu.ForceDistanceFromOriginInPlace(wristRPosition, this.elbowR.absolutePosition, this.humanBody.lowerArmLength);
            // Leg Left
            this.kneeL.position.copyFrom(this.hipL.absolutePosition).addInPlace(this.footL.position).scaleInPlace(0.5);
            this.kneeL.position.addInPlace(this.forward.scale(0.1)).addInPlace(this.right.scale(0));
            let upperLegLZ = BABYLON.Vector3.Zero();
            let lowerLegLZ = BABYLON.Vector3.Zero();
            for (let i = 0; i < 5; i++) {
                lowerLegLZ.copyFrom(this.footL.position).subtractInPlace(this.kneeL.position).normalize().scaleInPlace(this.humanBody.lowerLegLength);
                this.kneeL.position.copyFrom(this.footL.position).subtractInPlace(lowerLegLZ);
                upperLegLZ.copyFrom(this.kneeL.position).subtractInPlace(this.hipL.absolutePosition).normalize().scaleInPlace(this.humanBody.upperLegLength);
                this.kneeL.position.copyFrom(this.hipL.absolutePosition).addInPlace(upperLegLZ);
            }
            // Leg Right
            this.kneeR.position.copyFrom(this.hipR.absolutePosition).addInPlace(this.footR.position).scaleInPlace(0.5);
            this.kneeR.position.addInPlace(this.forward.scale(0.1)).addInPlace(this.right.scale(0));
            let upperLegRZ = BABYLON.Vector3.Zero();
            let lowerLegRZ = BABYLON.Vector3.Zero();
            for (let i = 0; i < 5; i++) {
                lowerLegRZ.copyFrom(this.footR.position).subtractInPlace(this.kneeR.position).normalize().scaleInPlace(this.humanBody.lowerLegLength);
                this.kneeR.position.copyFrom(this.footR.position).subtractInPlace(lowerLegRZ);
                upperLegRZ.copyFrom(this.kneeR.position).subtractInPlace(this.hipR.absolutePosition).normalize().scaleInPlace(this.humanBody.upperLegLength);
                this.kneeR.position.copyFrom(this.hipR.absolutePosition).addInPlace(upperLegRZ);
            }
            this.humanBody.root.setPosition(this.root.absolutePosition);
            Mummu.QuaternionFromYZAxisToRef(this.torso.absolutePosition.subtract(this.root.absolutePosition).scale(-1), footForward, q);
            this.humanBody.root.setRotationQuaternion(q.normalize());
            this.humanBody.torso.setPosition(this.torso.absolutePosition);
            Mummu.QuaternionFromYZAxisToRef(this.head.absolutePosition.subtract(this.torso.absolutePosition).scale(-1), shoulderForward, q);
            this.humanBody.torso.setRotationQuaternion(q.normalize());
            this.humanBody.head.setPosition(this.head.absolutePosition);
            Mummu.QuaternionFromYZAxisToRef(this.head.up.scale(-1), this.head.forward.scale(-1), q);
            this.humanBody.head.setRotationQuaternion(q.normalize());
            this.humanBody.upperLegR.setPosition(this.hipR.absolutePosition.clone());
            Mummu.QuaternionFromYZAxisToRef(this.kneeR.position.subtract(this.hipR.absolutePosition).scale(-1), this.forward.add(this.up), q);
            this.humanBody.upperLegR.setRotationQuaternion(q.normalize());
            this.humanBody.lowerLegR.setPosition(this.kneeR.absolutePosition.clone());
            Mummu.QuaternionFromYZAxisToRef(this.footR.position.subtract(this.kneeR.absolutePosition).scale(-1), this.forward, q);
            this.humanBody.lowerLegR.setRotationQuaternion(q.normalize());
            this.humanBody.upperLegL.setPosition(this.hipL.absolutePosition.clone());
            Mummu.QuaternionFromYZAxisToRef(this.kneeL.position.subtract(this.hipL.absolutePosition).scale(-1), this.forward.add(this.up), q);
            this.humanBody.upperLegL.setRotationQuaternion(q.normalize());
            this.humanBody.lowerLegL.setPosition(this.kneeL.absolutePosition.clone());
            Mummu.QuaternionFromYZAxisToRef(this.footL.position.subtract(this.kneeL.absolutePosition).scale(-1), this.forward, q);
            this.humanBody.lowerLegL.setRotationQuaternion(q.normalize());
            let elbowRUp = BABYLON.Vector3.Cross(this.shoulderR.absolutePosition.subtract(this.elbowR.absolutePosition), wristRPosition.subtract(this.elbowR.absolutePosition)).normalize();
            let upperArmRUpF = 1 - Mummu.Angle(this.shoulderR.absolutePosition.subtract(this.elbowR.absolutePosition), wristRPosition.subtract(this.elbowR.absolutePosition)) / Math.PI;
            this.humanBody.upperArmR.setPosition(this.shoulderR.absolutePosition);
            Mummu.QuaternionFromYZAxisToRef(this.elbowR.position.subtract(this.shoulderR.absolutePosition).scale(-1), this.up.scale(1 - upperArmRUpF).add(elbowRUp.scale(upperArmRUpF)), q);
            this.humanBody.upperArmR.setRotationQuaternion(q.normalize());
            this.humanBody.lowerArmR.setPosition(this.elbowR.absolutePosition.clone());
            Mummu.QuaternionFromYZAxisToRef(wristRPosition.subtract(this.elbowR.absolutePosition).scale(-1), this.handR.up.scale(0.5).add(elbowRUp.scale(0.5)), q);
            this.humanBody.lowerArmR.setRotationQuaternion(q.normalize());
            this.humanBody.handR.setPosition(wristRPosition.clone());
            this.humanBody.handR.setRotationQuaternion(this.handR.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(-Math.PI * 0.5, 0, 0)).normalize());
            this.humanBody.upperArmL.setPosition(this.shoulderL.absolutePosition);
            Mummu.QuaternionFromYZAxisToRef(this.elbowL.position.subtract(this.shoulderL.absolutePosition).scale(-1), this.up, q);
            this.humanBody.upperArmL.setRotationQuaternion(q.normalize());
            this.humanBody.lowerArmL.setPosition(this.elbowL.absolutePosition.clone());
            Mummu.QuaternionFromYZAxisToRef(wristLPosition.subtract(this.elbowL.absolutePosition).scale(-1), this.handL.up, q);
            this.humanBody.lowerArmL.setRotationQuaternion(q.normalize());
            this.humanBody.handL.setPosition(wristLPosition.clone());
            this.humanBody.handL.setRotationQuaternion(this.handL.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(-Math.PI * 0.5, 0, 0)).normalize());
            let dy = this.position.y;
            this.position.y = this.position.y * 0.9 + this.root.position.y * 0.1;
            dy = this.position.y - dy;
            let maxDist = 1.2;
            if (BABYLON.Vector3.DistanceSquared(this.position, this.root.position) > maxDist * maxDist) {
                Mummu.ForceDistanceFromOriginInPlace(this.position, this.root.position, maxDist);
            }
        };
        BABYLON.CreateBoxVertexData({ width: 0.01, height: 3, depth: 0.01 }).applyToMesh(this);
    }
    get game() {
        return this.human.game;
    }
    get engine() {
        return this.game.engine;
    }
    get humanBody() {
        return this.human.body;
    }
    async instantiate() {
        this.root = new BABYLON.Mesh("root");
        this.root = BABYLON.CreateBox("root", { width: 1, height: 0.02, depth: 0.02 });
        this.root.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.torso = new BABYLON.Mesh("torso");
        this.torso.rotationQuaternion = BABYLON.Quaternion.Identity();
        //this.torso.material = Main.TestRedMaterial;
        this.head = new BABYLON.Mesh("head");
        this.head.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.shoulderL = Mummu.DrawDebugPoint(BABYLON.Vector3.Zero(), Infinity, BABYLON.Color3.Red(), 0.4);
        this.shoulderL.parent = this.torso;
        this.shoulderL.position = this.humanBody.shoulderPos.multiplyByFloats(-1, 1, 1);
        this.elbowL = new BABYLON.Mesh("elbowL");
        this.handL = BABYLON.MeshBuilder.CreateBox("handL", { size: 0.01 });
        this.shoulderR = Mummu.DrawDebugPoint(BABYLON.Vector3.Zero(), Infinity, BABYLON.Color3.Green(), 0.4);
        this.shoulderR.parent = this.torso;
        this.shoulderR.position = this.humanBody.shoulderPos.multiplyByFloats(1, 1, 1);
        this.elbowR = new BABYLON.Mesh("elbowR");
        this.handR = BABYLON.MeshBuilder.CreateBox("handR", { size: 0.01 });
        this.hipL = new BABYLON.Mesh("hipL");
        this.hipL.parent = this.root;
        this.hipL.position = this.humanBody.hipPos.multiplyByFloats(-1, 1, 1);
        this.kneeL = BABYLON.MeshBuilder.CreateBox("kneeL", { width: 0.01, height: 0.01, depth: 0.01 });
        this.footL = BABYLON.MeshBuilder.CreateBox("footL", { width: 0.01, height: 0.01, depth: 0.01 });
        this.hipR = new BABYLON.Mesh("hipR");
        this.hipR.parent = this.root;
        this.hipR.position = this.humanBody.hipPos.multiplyByFloats(1, 1, 1);
        this.kneeR = BABYLON.MeshBuilder.CreateBox("kneeR", { width: 0.01, height: 0.01, depth: 0.01 });
        this.footR = BABYLON.MeshBuilder.CreateBox("footR", { width: 0.01, height: 0.01, depth: 0.01 });
        this.handL.position.copyFrom(this.position);
        this.handL.position.x -= 0.5;
        this.handL.position.y += 0.8;
        this.handL.position.z += 0.2;
        this.handL.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.handR.position.copyFrom(this.position);
        this.handR.position.x += 0.5;
        this.handR.position.y += 0.8;
        this.handR.position.z += 0.2;
        this.handR.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.footL.position.copyFrom(this.position);
        this.footL.position.x -= 0.12;
        this.footL.position.z -= 0.1;
        this.footR.position.copyFrom(this.position);
        this.footR.position.x += 0.12;
        this.footR.position.z += 0.1;
        this.groundedFeet.push(this.footR, this.footL);
        /*
        this.m16 = new BABYLON.Mesh("m16");
        this.m16.rotationQuaternion = BABYLON.Quaternion.Identity();
        BABYLON.SceneLoader.ImportMesh("", "datas/meshes/m16.babylon", "", this._scene, (meshes) => {
            meshes.forEach(mesh => {
                if (mesh instanceof BABYLON.Mesh) {
                    let material = mesh.material;
                    if (material instanceof BABYLON.PBRMaterial) {
                        
                        let toonMat = new ToonMaterial(material.name + "-3-toon", this._scene);
                        toonMat.setDiffuseColor(material.albedoColor);
                        mesh.material = toonMat;
                        
                    }
                    this.m16 = mesh;
                    //this.m16.isVisible = false;
                    this.m16.rotationQuaternion = BABYLON.Quaternion.Identity();
                }
            });
        });
        */
        this._scene.onBeforeRenderObservable.add(this._update);
        this._scene.onBeforeRenderObservable.add(this.walkingUpdate);
    }
    getContactPoint() {
        let contactPoint = BABYLON.Vector3.Zero();
        let count = 0;
        this.groundedFeet.forEach(f => {
            contactPoint.addInPlace(f.position);
            count++;
        });
        if (count > 0) {
            contactPoint.scaleInPlace(1 / count);
        }
        else {
            contactPoint.copyFrom(this.root.position);
        }
        return contactPoint;
    }
    getGravityCenter() {
        let gravityCenter = BABYLON.Vector3.Zero();
        gravityCenter.addInPlace(this.root.position);
        gravityCenter.addInPlace(this.torso.position);
        gravityCenter.addInPlace(this.head.position);
        gravityCenter.addInPlace(this.footR.position);
        gravityCenter.addInPlace(this.footL.position);
        gravityCenter.addInPlace(this.handR.position);
        gravityCenter.addInPlace(this.handL.position);
        gravityCenter.scaleInPlace(1 / 7);
        return gravityCenter;
    }
    stepHandToP(hand, shoulder, p) {
        let dt = this.engine.getDeltaTime() / 1000;
        Mummu.StepToRef(hand.position, p, 2 * dt, hand.position);
        let pouet = shoulder.absolutePosition.subtract(shoulder.forward.scale(0.3));
        if (BABYLON.Vector3.Distance(hand.position, pouet) < 0.6) {
            Mummu.ForceDistanceFromOriginInPlace(hand.position, pouet, 0.6);
        }
    }
    stepHandToP3(hand, shoulder, p) {
        let dt = this.engine.getDeltaTime() / 1000;
        let exterior = shoulder.right.clone();
        if (hand === this.handL) {
            exterior.scaleInPlace(-1);
        }
        let currentHandP = hand.position.subtract(shoulder.absolutePosition);
        let targetHandP = p.subtract(shoulder.absolutePosition);
        let currentHandDist = currentHandP.length();
        if (currentHandDist > (this.humanBody.totalArmLength)) {
            currentHandDist = this.humanBody.totalArmLength;
        }
        let targetHandDist = targetHandP.length();
        let axis = exterior;
        let angle = Mummu.Angle(currentHandP, targetHandP);
        if (angle > 0 && angle < Math.PI) {
            axis = BABYLON.Vector3.Cross(currentHandP, targetHandP);
            if (BABYLON.Vector3.Dot(axis, exterior) < 0) {
                axis.scaleInPlace(-1);
            }
            angle = Mummu.AngleFromToAround(currentHandP, targetHandP, axis);
        }
        angle = Nabu.Step(0, angle, Math.PI * dt);
        hand.position.copyFrom(currentHandP);
        hand.position.normalize().scaleInPlace(Nabu.Step(currentHandDist, targetHandDist, 1 * dt));
        Mummu.RotateInPlace(hand.position, axis, angle);
        hand.position.addInPlace(shoulder.absolutePosition);
    }
    stepHandToP2(hand, shoulder, p) {
        let dt = this.engine.getDeltaTime() / 1000;
        let currentHandP = hand.position.subtract(shoulder.absolutePosition);
        let currentHandDist = currentHandP.length();
        if (currentHandDist > (this.humanBody.totalArmLength)) {
            currentHandDist = this.humanBody.totalArmLength;
        }
        let currentHandAlpha = Mummu.AngleFromToAround(shoulder.forward, currentHandP, shoulder.right);
        let currentHandBeta = Mummu.AngleFromToAround(shoulder.forward, Mummu.Rotate(currentHandP, shoulder.right, -currentHandAlpha), shoulder.up);
        if (currentHandBeta < -Math.PI * 0.5) {
            currentHandBeta += Math.PI;
        }
        if (currentHandBeta > Math.PI * 0.5) {
            currentHandBeta -= Math.PI;
        }
        Mummu.DrawDebugPoint(p, 1, BABYLON.Color3.Blue(), 0.3);
        let targetHandP = p.subtract(shoulder.absolutePosition);
        let targetHandDist = targetHandP.length();
        let targetHandAlpha = Mummu.AngleFromToAround(shoulder.forward, targetHandP, shoulder.right);
        let targetHandBeta = Mummu.AngleFromToAround(shoulder.forward, Mummu.Rotate(targetHandP, shoulder.right, -currentHandAlpha), shoulder.up);
        if (targetHandBeta < -Math.PI * 0.5) {
            targetHandBeta += Math.PI;
        }
        if (targetHandBeta > Math.PI * 0.5) {
            targetHandBeta -= Math.PI;
        }
        targetHandDist = Nabu.Step(currentHandDist, targetHandDist, 1 * dt);
        targetHandAlpha = Nabu.Step(currentHandAlpha, targetHandAlpha, Math.PI * dt);
        targetHandBeta = Nabu.Step(currentHandBeta, targetHandBeta, Math.PI * dt);
        hand.position.copyFrom(shoulder.forward).scaleInPlace(targetHandDist);
        Mummu.RotateInPlace(hand.position, shoulder.up, targetHandBeta);
        Mummu.RotateInPlace(hand.position, shoulder.right, targetHandAlpha);
        hand.position.addInPlace(shoulder.absolutePosition);
    }
    async step(foot, target, nearEndCallbackF = 0.9, nearEndCallback) {
        return new Promise(resolve => {
            let origin = foot.position.clone();
            let destination = target.clone();
            let dy = Math.abs(destination.y - origin.y);
            dy = Math.min(dy, 0.15);
            let d = BABYLON.Vector3.Distance(origin, destination);
            let h = Math.min(d, 0.1) + dy;
            let up = this.up;
            let duration = 0.8;
            let t = 0;
            let animationCB = () => {
                t += this._scene.getEngine().getDeltaTime() / 1000;
                let f = t / duration;
                if (nearEndCallback && f >= nearEndCallbackF) {
                    nearEndCallback();
                    nearEndCallback = undefined;
                }
                if (f < 1) {
                    //f = 1 * Nabu.Easing.easeInSine(f) + 0 * f;
                    let p = origin.scale(1 - f).addInPlace(destination.scale(f));
                    p.addInPlace(up.scale(h * Math.sin(f * Math.PI)));
                    foot.position.copyFrom(p);
                }
                else {
                    if (nearEndCallback) {
                        nearEndCallback();
                        nearEndCallback = undefined;
                    }
                    foot.position.copyFrom(destination);
                    this._scene.onBeforeRenderObservable.removeCallback(animationCB);
                    resolve();
                }
            };
            this._scene.onBeforeRenderObservable.add(animationCB);
        });
    }
}
class Mushroom {
    constructor(game) {
        this.game = game;
        this.height = 10;
        this.radius = 5;
        this.age = 0;
        this.maxAge = 10;
        this.doStep = () => {
            if (this.ijk && this.chunck) {
                if (!this.currentHeadPos) {
                    this.currentHeadPos = { i: this.ijk.i, j: this.ijk.j, k: this.ijk.k - 1 };
                }
                if (!this.headCone) {
                    this.headCone = new Kulla.Cone(this.chunck.terrain, {});
                }
                if (this.age < this.maxAge) {
                    if (this.age > 0) {
                        this.headCone.draw(this.chunck, this.currentHeadPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.Erase);
                    }
                    this.age++;
                    this.currentHeadPos.k++;
                    this.headCone.props.rFunc = (f) => {
                        return 1 + Math.cos(Math.PI * 0.5 * f - Math.PI * 0.15) * (1 + Math.floor(this.age / 2));
                    };
                    this.headCone.props.length = 2 + Math.floor(this.age / 4);
                    if (Math.random() < 0.3) {
                        if (Math.random() < 0.5) {
                            this.currentHeadPos.i++;
                        }
                        else {
                            this.currentHeadPos.i--;
                        }
                    }
                    else if (Math.random() < 0.2) {
                        if (Math.random() < 0.5) {
                            this.currentHeadPos.j++;
                        }
                        else {
                            this.currentHeadPos.j--;
                        }
                    }
                    this.headCone.draw(this.chunck, this.currentHeadPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.AddIfEmpty, true);
                    this.game.terrainEditor.doAction(this.chunck, this.currentHeadPos, { brushBlock: Kulla.BlockType.Wood, brushSize: 2, mode: Kulla.TerrainEditionMode.Add, saveToLocalStorage: true });
                }
                else {
                    clearInterval(this._debugStepInterval);
                }
            }
        };
    }
    instantiate() {
        this._debugStepInterval = setInterval(this.doStep, 2000);
    }
}
class TreeBranch {
    constructor(terrain, pos) {
        this.pos = pos;
        this.age = 0;
        this.currentPos = { i: pos.i, j: pos.j, k: pos.k };
        let a = Math.random() * Math.PI * 2;
        this.dir = new BABYLON.Vector3(Math.cos(a), 3 * (Math.random() - 0.5), Math.sin(a));
        this.dir.normalize();
        let stepCount = 10;
        let tests = [];
        this.sequence = [0, 0, 0];
        if (this.dir.x != 0) {
            tests.push(new BABYLON.Vector3(Math.sign(this.dir.x), 0, 0));
            this.sequence[0] = tests[0].x;
        }
        if (this.dir.y != 0) {
            tests.push(new BABYLON.Vector3(0, Math.sign(this.dir.y), 0));
            this.sequence[1] = tests[1].y;
        }
        if (this.dir.z != 0) {
            tests.push(new BABYLON.Vector3(0, 0, Math.sign(this.dir.z)));
            this.sequence[2] = tests[2].z;
        }
        let tmpV = BABYLON.Vector3.Zero();
        for (let n = 1; n < stepCount; n++) {
            let bestAngle = Infinity;
            for (let t = 0; t < tests.length; t++) {
                tmpV.x = this.sequence[3 * (n - 1)];
                tmpV.y = this.sequence[3 * (n - 1) + 1];
                tmpV.z = this.sequence[3 * (n - 1) + 2];
                tmpV.addInPlace(tests[t]);
                let a = Mummu.Angle(this.dir, tmpV);
                if (a < bestAngle) {
                    this.sequence[3 * n] = tmpV.x;
                    this.sequence[3 * n + 1] = tmpV.y;
                    this.sequence[3 * n + 2] = tmpV.z;
                    bestAngle = a;
                }
            }
        }
        console.log(this.sequence);
        this.leaves = new Kulla.Sphere(terrain, { diameter: 3 });
    }
    incAge() {
        if (this.age < this.sequence.length / 3) {
            this.currentPos.i = this.pos.i + this.sequence[3 * this.age];
            this.currentPos.j = this.pos.j + this.sequence[3 * this.age + 2];
            this.currentPos.k = this.pos.k + this.sequence[3 * this.age + 1];
        }
        this.age++;
    }
}
class Tree {
    constructor(game) {
        this.game = game;
        this.height = 10;
        this.radius = 5;
        this.age = 0;
        this.maxAge = 15;
        this.branches = [];
        this.doStep = () => {
            if (this.ijk && this.chunck) {
                if (!this.currentHeadPos) {
                    this.currentHeadPos = { i: this.ijk.i, j: this.ijk.j, k: this.ijk.k - 1 };
                }
                if (!this.headCone) {
                    this.headCone = new Kulla.Cone(this.chunck.terrain, {});
                }
                if (this.age < this.maxAge) {
                    if (this.age > 0) {
                        this.headCone.draw(this.chunck, this.currentHeadPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.Erase);
                        this.branches.forEach(branch => {
                            branch.leaves.draw(this.chunck, branch.currentPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.Erase);
                        });
                    }
                    this.age++;
                    this.branches.forEach(branch => {
                        branch.incAge();
                    });
                    this.currentHeadPos.k++;
                    this.headCone.props.rFunc = (f) => {
                        return 1 + Math.cos(Math.PI * 0.5 * f - Math.PI * 0.15) * (1 + Math.floor(this.age / 2));
                    };
                    this.headCone.props.length = 2 + Math.floor(this.age / 4);
                    if (Math.random() < 0.3) {
                        if (Math.random() < 0.5) {
                            this.currentHeadPos.i++;
                        }
                        else {
                            this.currentHeadPos.i--;
                        }
                    }
                    else if (Math.random() < 0.2) {
                        if (Math.random() < 0.5) {
                            this.currentHeadPos.j++;
                        }
                        else {
                            this.currentHeadPos.j--;
                        }
                    }
                    if (Math.random() < 0.3) {
                        let branch = new TreeBranch(this.game.terrain, { i: this.currentHeadPos.i, j: this.currentHeadPos.j, k: this.currentHeadPos.k });
                        this.branches.push(branch);
                    }
                    this.headCone.draw(this.chunck, this.currentHeadPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.AddIfEmpty, true);
                    this.game.terrainEditor.doAction(this.chunck, this.currentHeadPos, { brushBlock: Kulla.BlockType.Wood, brushSize: 2, mode: Kulla.TerrainEditionMode.Add, saveToLocalStorage: true });
                    this.branches.forEach(branch => {
                        branch.leaves.draw(this.chunck, branch.currentPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.AddIfEmpty, true);
                        this.game.terrainEditor.doAction(this.chunck, branch.currentPos, { brushBlock: Kulla.BlockType.Wood, brushSize: 1, mode: Kulla.TerrainEditionMode.Add, saveToLocalStorage: true });
                    });
                }
                else {
                    clearInterval(this._debugStepInterval);
                }
            }
        };
    }
    instantiate() {
        this._debugStepInterval = setInterval(this.doStep, 2000);
    }
}
class TreeNode {
    constructor(tree, position, parent) {
        this.tree = tree;
        this.position = position;
        this.parent = parent;
        this.children = [];
        this.depth = 0;
        this.dir = BABYLON.Vector3.Up();
        if (parent) {
            this.depth = parent.depth + 1;
            this.dir.copyFrom(this.position).subtractInPlace(parent.position).normalize();
        }
    }
    isConnected(other) {
        return this.parent === other || other.parent === this;
    }
    getAllChildren() {
        let children = [];
        this.addWithChildren(children);
        return children;
    }
    addWithChildren(children) {
        children.push(this);
        this.children.forEach(child => {
            child.addWithChildren(children);
        });
    }
    draw() {
        if (this.parent) {
            Mummu.DrawDebugLine(this.position, this.parent.position, Infinity, this.depth % 2 === 0 ? BABYLON.Color3.Red() : BABYLON.Color3.Blue());
        }
    }
    generateChildren() {
        if (this.depth < this.tree.length) {
            let f = this.depth / this.tree.length;
            let childCount = 1;
            if (this.tree.splits.indexOf(this.depth) > -1) {
                childCount = 2;
            }
            childCount = Nabu.MinMax(childCount, 1, 2);
            let l = this.tree.nodeDistBottom * (1 - f) + this.tree.nodeDistTop * f;
            l *= 0.9 + 0.2 * Math.random();
            let dir = this.dir.clone();
            dir.addInPlaceFromFloats((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
            dir.y += 0.2 * l;
            dir.normalize().scaleInPlace(l);
            if (childCount === 1) {
                let child = new TreeNode(this.tree, this.position.add(dir), this);
                this.children.push(child);
                child.generateChildren();
            }
            else if (childCount === 2) {
                let a = Math.PI * 0.4 + Math.random() * Math.PI * 0.4;
                let axis = new BABYLON.Vector3(-0.5 + Math.random(), -0.5 + Math.random(), -0.5 + Math.random());
                axis = BABYLON.Vector3.Cross(dir, axis).normalize();
                let dir1 = Mummu.Rotate(dir, axis, a * 0.5);
                let child1 = new TreeNode(this.tree, this.position.add(dir1), this);
                this.children.push(child1);
                child1.generateChildren();
                let dir2 = Mummu.Rotate(dir, axis, -a * 0.5);
                let child2 = new TreeNode(this.tree, this.position.add(dir2), this);
                this.children.push(child2);
                child2.generateChildren();
            }
        }
    }
}
class Tree2 {
    constructor(game) {
        this.game = game;
        this.nodeDistBottom = 1.2;
        this.nodeDistTop = 1.2;
        this.sizeBottom = 3;
        this.sizeTop = 0.5;
        this.length = 15;
        this.age = 0;
        this.splits = [6, 8, 10, 12];
        this.doStep = () => {
            this.age++;
            if (this.age > this.length) {
                clearInterval(this.doStepInterval);
                return;
            }
            let affectedChuncks = new Nabu.UniqueList();
            let line = new Kulla.FatLine(this.game.terrain);
            let children = this.root.getAllChildren();
            children.forEach(child => {
                if (child.parent) {
                    if (child.parent.depth <= this.age) {
                        let fAge = this.age / this.length * 0.8 + 0.2;
                        let f = child.parent.depth / this.age;
                        line.size = fAge * this.sizeBottom * (1 - f) + this.sizeTop * f;
                        line.p0 = child.position;
                        line.p1 = child.parent.position;
                        let chuncks = line.draw(Kulla.BlockType.Wood, false, true);
                        chuncks.forEach((chunck) => {
                            affectedChuncks.push(chunck);
                        });
                        if (child.parent.depth > this.length * 0.6) {
                            let up = BABYLON.Vector3.Up();
                            let forward = child.parent.position.subtract(child.position);
                            let right = BABYLON.Vector3.Cross(up, forward);
                            up = BABYLON.Vector3.Cross(forward, right).normalize();
                            up.y += 1;
                            up.normalize().scaleInPlace(2 * fAge);
                            line.p0 = child.position.add(up);
                            line.p1 = child.parent.position.add(up);
                            line.size = 3 * fAge;
                            chuncks = line.draw(Kulla.BlockType.Leaf, false, true);
                            chuncks.forEach((chunck) => {
                                affectedChuncks.push(chunck);
                            });
                        }
                    }
                }
            });
            for (let i = 0; i < affectedChuncks.length; i++) {
                let chunck = affectedChuncks.get(i);
                for (let k = 0; k < chunck.dataSizeK; k++) {
                    chunck.updateIsEmptyIsFull(k);
                }
                chunck.redrawMesh(true);
                chunck.saveToLocalStorage();
            }
        };
    }
    instantiate() {
        let pos = this.chunck.getPosAtIJK(this.ijk);
        this.root = new TreeNode(this, pos);
        this.root.generateChildren();
        this.age = this.length - 1;
        this.doStepInterval = setInterval(this.doStep, 1500);
        this.doStep();
    }
}
class BrickMenuView extends HTMLElement {
    constructor() {
        super(...arguments);
        this._loaded = false;
        this._shown = false;
        this.currentPointers = 0;
        this._timer = 0;
    }
    static get observedAttributes() {
        return [];
    }
    get loaded() {
        return this._loaded;
    }
    waitLoaded() {
        return new Promise(resolve => {
            let step = () => {
                if (this.loaded) {
                    resolve();
                }
                else {
                    requestAnimationFrame(step);
                }
            };
            step();
        });
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
        if (this._options.length > 0) {
            this.setPointer((this.currentPointers - 1 + this._options.length) % this._options.length);
        }
    }
    currentPointerDown() {
        if (this._options.length > 0) {
            this.setPointer((this.currentPointers + 1) % this._options.length);
        }
    }
    setPointer(n) {
        if (this._options[this.currentPointers]) {
            this._options[this.currentPointers].classList.remove("highlit");
        }
        this.currentPointers = n;
        if (this._options[this.currentPointers]) {
            this._options[this.currentPointers].classList.add("highlit");
        }
    }
    _makeCategoryBtnStyle(btn) {
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
        this._title.classList.add("brick-menu-title");
        this._title.innerHTML = "BRICK";
        this.appendChild(this._title);
        let categoriesContainer;
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
        };
        this._copyBrickBtn = document.createElement("button");
        this._copyBrickBtn.innerHTML = "COPY BRICK";
        categoriesContainer.appendChild(this._copyBrickBtn);
        this._copyBrickBtn.onclick = () => {
            this._player.currentAction = PlayerActionTemplate.CreateBrickAction(this._player, this._brick.index, this._brick.colorIndex);
            this.hide(0.1);
        };
        this._copyWithChildrenBtn = document.createElement("button");
        this._copyWithChildrenBtn.innerHTML = "COPY FULL";
        categoriesContainer.appendChild(this._copyWithChildrenBtn);
        this._copyWithChildrenBtn.onclick = () => {
            let clone = this._brick.cloneWithChildren();
            clone.updateMesh();
            this._player.currentAction = PlayerActionMoveBrick.Create(this._player, clone);
            this.hide(0.1);
        };
        this._copyColorBtn = document.createElement("button");
        this._copyColorBtn.innerHTML = "COPY COLOR";
        categoriesContainer.appendChild(this._copyColorBtn);
        this._copyColorBtn.onclick = () => {
            this._player.currentAction = PlayerActionTemplate.CreatePaintAction(this._player, this._brick.colorIndex);
            this.hide(0.1);
        };
        this._cancelBtn = document.createElement("button");
        this._cancelBtn.innerHTML = "CANCEL";
        categoriesContainer.appendChild(this._cancelBtn);
        this._cancelBtn.onclick = () => {
            this.hide(0.1);
        };
        this._options = [
            this._anchorBtn,
            this._copyBrickBtn,
            this._copyColorBtn,
            this._cancelBtn,
        ];
    }
    attributeChangedCallback(name, oldValue, newValue) { }
    async show(duration = 1) {
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
                            if (this.onNextHide) {
                                this.onNextHide();
                                this.onNextHide = undefined;
                            }
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
    setPlayer(player) {
        this._player = player;
    }
    setBrick(brick) {
        this._brick = brick;
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
customElements.define("brick-menu", BrickMenuView);
class Player extends BABYLON.Mesh {
    constructor(game) {
        super("player");
        this.game = game;
        this.godMode = true;
        this.mass = 2;
        this.height = 2;
        this.velocity = BABYLON.Vector3.Zero();
        this.frozen = true;
        this.speed = 5;
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
        if (this._currentAction && this._currentAction.onUnequip) {
            this._currentAction.onUnequip();
        }
        this._currentAction = action;
        if (this._currentAction && this._currentAction.onEquip) {
            this._currentAction.onEquip();
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
        if (!this.currentChunck) {
            return;
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
        if (this.godMode) {
            this.velocity.y = 0;
        }
        this.velocity.z = 0;
        let inputL = Math.sqrt(this.inputX * this.inputX + this.inputZ * this.inputZ);
        if (inputL > this.speed) {
            this.inputX /= inputL * this.speed;
            this.inputZ /= inputL * this.speed;
        }
        if (this.godMode) {
            this.velocity.addInPlace(this.head.getDirection(BABYLON.Axis.X).scale(this.inputX).scale(this.speed));
            this.velocity.addInPlace(this.head.getDirection(BABYLON.Axis.Z).scale(this.inputZ).scale(this.speed));
        }
        else {
            this.velocity.addInPlace(this.getDirection(BABYLON.Axis.X).scale(this.inputX).scale(this.speed));
            this.velocity.addInPlace(this.getDirection(BABYLON.Axis.Z).scale(this.inputZ).scale(this.speed));
        }
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
        if (this.godMode || bestPick && bestPick.hit) {
            if (!this.godMode) {
                if (bestPick.distance <= this.height) {
                    this.velocity.y = 10 * (this.height - bestPick.distance);
                }
                else {
                    this.velocity.y -= this.mass * 9.2 * dt;
                }
            }
            if (!Mummu.IsFinite(this.velocity)) {
                this.velocity.copyFromFloats(0, 0, 0);
            }
            this.position.addInPlace(this.velocity.scale(dt));
        }
        else if (!this.godMode) {
            if (this.position.y < 80) {
                this.position.y += 0.1;
            }
            if (this.position.y > 255) {
                this.position.y -= 0.1;
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
        this.unlinkAction(slotIndex);
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.linkedActions[slotIndex] = action;
            this.playerActionView.onActionLinked(action, slotIndex);
            this.saveToLocalStorage();
        }
    }
    unlinkAction(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            this.linkedActions[slotIndex] = undefined;
            this.playerActionView.onActionUnlinked(slotIndex);
            this.saveToLocalStorage();
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
    saveToLocalStorage() {
        let data = this.serialize();
        window.localStorage.setItem("player-action-manager", JSON.stringify(data));
    }
    loadFromLocalStorage() {
        let dataString = window.localStorage.getItem("player-action-manager");
        if (dataString) {
            let data = JSON.parse(dataString);
            this.deserializeInPlace(data);
        }
    }
    serialize() {
        let linkedActionsNames = [];
        for (let i = 0; i < this.linkedActions.length; i++) {
            if (this.linkedActions[i]) {
                linkedActionsNames[i] = this.linkedActions[i].name;
            }
            else {
                linkedActionsNames[i] = undefined;
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
                if (linkedItemName) {
                    if (linkedItemName.startsWith("block_")) {
                        // "block_" + Kulla.BlockTypeNames[blockType] + "_" + shapeName + "_" + size
                        let props = linkedItemName.replace("block_", "");
                        let blockName = props.split("_")[0];
                        let blockType = Kulla.BlockTypeNames.indexOf(blockName);
                        if (blockType >= Kulla.BlockType.None && blockType < Kulla.BlockType.Unknown) {
                            let shape = props.split("_")[1];
                            let size = parseInt(props.split("_")[2]);
                            this.linkAction(PlayerActionBlockShape.Create(this.player, blockType, shape, size), i);
                        }
                    }
                    else if (linkedItemName.startsWith("paint_")) {
                        let paintName = linkedItemName.replace("paint_", "");
                        let paintIndex = BRICK_COLORS.findIndex(c => { return c.name === paintName; });
                        this.linkAction(PlayerActionTemplate.CreatePaintAction(this.player, paintIndex), i);
                    }
                    else if (linkedItemName === "mushroom") {
                        this.linkAction(PlayerActionTemplate.CreateMushroomAction(this.player), i);
                    }
                    else if (linkedItemName === "voxelizer") {
                        this.linkAction(PlayerActionVoxelizer.Create(this.player), i);
                    }
                    else if (linkedItemName) {
                        this.linkAction(PlayerActionTemplate.CreateBrickAction(this.player, linkedItemName), i);
                    }
                }
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
    initialize(player) {
        this.player = player;
        for (let i = 0; i <= 9; i++) {
            let slotIndex = i;
            let tile = this.getTile(i);
            tile.onclick = () => {
                if (this.player.playerActionManager) {
                    if (slotIndex === this.player.playerActionManager.currentActionIndex) {
                        this.player.playerActionManager.toggleEquipAction();
                    }
                    else {
                        this.player.playerActionManager.setActionIndex(slotIndex);
                        this.player.playerActionManager.equipAction();
                    }
                }
            };
        }
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
                if (action.iconUrl) {
                    tile.style.background = "url(" + action.iconUrl + ")";
                    tile.style.backgroundSize = "contain";
                    tile.style.backgroundRepeat = "no-repeat";
                    tile.style.backgroundPosition = "center";
                    tile.style.backgroundColor = action.backgroundColor;
                }
                else {
                    tile.style.background = undefined;
                    tile.style.backgroundColor = action.backgroundColor;
                }
                action._onIconUrlChanged = () => {
                    tile.style.background = "url(" + action.iconUrl + ")";
                    tile.style.backgroundSize = "contain";
                    tile.style.backgroundRepeat = "no-repeat";
                    tile.style.backgroundPosition = "center";
                    tile.style.backgroundColor = action.backgroundColor;
                };
            }
        }
    }
    onActionUnlinked(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 9) {
            let tile = this.getTile(slotIndex);
            if (tile) {
                tile.style.background = undefined;
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
    get iconUrl() {
        return this._iconUrl;
    }
    set iconUrl(url) {
        this._iconUrl = url;
        if (this._onIconUrlChanged) {
            this._onIconUrlChanged();
        }
    }
}
var PlayMode;
(function (PlayMode) {
    PlayMode[PlayMode["Menu"] = 0] = "Menu";
    PlayMode[PlayMode["Inventory"] = 1] = "Inventory";
    PlayMode[PlayMode["Playing"] = 2] = "Playing";
})(PlayMode || (PlayMode = {}));
class PlayerControler {
    constructor(player) {
        this.player = player;
        this._pointerDownX = -100;
        this._pointerDownY = -100;
        this._pointerIsDown = false;
        this.gamepadInControl = false;
        this.lastUsedPaintIndex = 0;
        this._pointerDown = (event) => {
            this._pointerDownTime = performance.now();
            this._pointerDownX = event.clientX;
            this._pointerDownY = event.clientY;
            this._pointerIsDown = true;
            if (this.playMode === PlayMode.Playing) {
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
            }
        };
        this._pointerMove = (event) => {
            if (this.playMode === PlayMode.Playing) {
                if (this._pointerIsDown || this.inputManager.isPointerLocked) {
                    this.gamepadInControl = false;
                    this.player.inputDeltaX += event.movementX;
                    this.player.inputDeltaY += event.movementY;
                }
            }
        };
        this._pointerUp = (event) => {
            this._pointerIsDown = false;
            let dX = this._pointerDownX - event.clientX;
            let dY = this._pointerDownY - event.clientY;
            let distance = Math.sqrt(dX * dX + dY * dY);
            let duration = (performance.now() - this._pointerDownTime) / 1000;
            if (this.playMode === PlayMode.Playing) {
                if (this.player.currentAction) {
                    if (event.button === 0) {
                        if (this.player.currentAction.onPointerUp) {
                            this.player.currentAction.onPointerUp(duration, distance, this.player.currentChuncks);
                        }
                    }
                    else if (event.button === 2) {
                        if (this.player.currentAction.onRightPointerUp) {
                            this.player.currentAction.onRightPointerUp(duration, distance, this.player.currentChuncks);
                        }
                    }
                }
                else {
                    if (event.button === 0) {
                        if (this.player.defaultAction.onPointerUp) {
                            this.player.defaultAction.onPointerUp(duration, distance, this.player.currentChuncks);
                        }
                    }
                    else if (event.button === 2) {
                        if (this.player.defaultAction.onRightPointerUp) {
                            this.player.defaultAction.onRightPointerUp(duration, distance, this.player.currentChuncks);
                        }
                    }
                }
            }
        };
        this._wheel = (event) => {
            if (this.player.currentAction) {
                if (this.player.currentAction.onWheel) {
                    this.player.currentAction.onWheel(event);
                }
            }
            else {
                if (this.player.defaultAction.onWheel) {
                    this.player.defaultAction.onWheel(event);
                }
            }
        };
        player.controler = this;
        window.addEventListener("pointerdown", this._pointerDown);
        window.addEventListener("pointermove", this._pointerMove);
        window.addEventListener("pointerup", this._pointerUp);
        window.addEventListener("wheel", this._wheel);
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
    get playMode() {
        if (this.player.game.playerInventoryView.shown) {
            return PlayMode.Inventory;
        }
        /*
        if (this.player.game.brickMenuView.shown) {
            return PlayMode.Menu;
        }
        if (this.player.game.voxelizerMenuView.shown) {
            return PlayMode.Menu;
        }
        */
        if (this.player.game.router.inPlayMode) {
            return PlayMode.Playing;
        }
        return PlayMode.Menu;
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
            if (this.playMode === PlayMode.Playing) {
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
            if (this.playMode === PlayMode.Playing) {
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
                if (this.inputManager.isPointerLocked) {
                    document.exitPointerLock();
                    this.playerInventoryView.onNextHide = () => {
                        this.player.game.canvas.requestPointerLock();
                    };
                }
                this.playerInventoryView.show(0.2);
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_PREV_CAT, () => {
            if (this.playMode === PlayMode.Inventory) {
                this.playerInventoryView.setCurrentCategory(this.playerInventoryView.prevCategory);
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_NEXT_CAT, () => {
            if (this.playMode === PlayMode.Inventory) {
                this.playerInventoryView.setCurrentCategory(this.playerInventoryView.nextCategory);
            }
        });
        this.inputManager.addMappedKeyDownListener(KeyInput.INVENTORY_EQUIP_ITEM, () => {
            if (this.playMode === PlayMode.Inventory) {
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
        if (this.playMode === PlayMode.Inventory) {
            this.playerInventoryView.update(dt);
            this.gamepadInControl = false;
        }
        else if (this.playMode === PlayMode.Playing) {
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
    InventoryCategory[InventoryCategory["Paint"] = 2] = "Paint";
    InventoryCategory[InventoryCategory["Ingredient"] = 3] = "Ingredient";
    InventoryCategory[InventoryCategory["End"] = 4] = "End";
})(InventoryCategory || (InventoryCategory = {}));
class PlayerInventoryItem {
    constructor(name, category) {
        this.count = 1;
        this.name = name;
        this.category = category;
        this.icon = "/datas/icons/empty.png";
        if (this.category === InventoryCategory.Brick) {
            this.icon = "/datas/icons/bricks/" + name + ".png";
        }
    }
    getPlayerAction(player) {
        if (this.category === InventoryCategory.Block) {
            let block = Kulla.BlockTypeNames.indexOf(this.name);
            if (block >= Kulla.BlockType.None && block < Kulla.BlockType.Unknown) {
                return PlayerActionBlockShape.Create(player, block);
            }
        }
        else if (this.category === InventoryCategory.Brick) {
            return PlayerActionTemplate.CreateBrickAction(player, this.name);
        }
        else if (this.category === InventoryCategory.Paint) {
            let colorIndex = BRICK_COLORS.findIndex(c => { return c.name === this.name; });
            if (colorIndex >= 0) {
                return PlayerActionTemplate.CreatePaintAction(player, colorIndex);
            }
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
    get loaded() {
        return this._loaded;
    }
    waitLoaded() {
        return new Promise(resolve => {
            let step = () => {
                if (this.loaded) {
                    resolve();
                }
                else {
                    requestAnimationFrame(step);
                }
            };
            step();
        });
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
        this._categoryPaintsBtn = document.createElement("div");
        this._categoryPaintsBtn.innerHTML = "PAINTS";
        categoriesContainer.appendChild(this._categoryPaintsBtn);
        this._makeCategoryBtnStyle(this._categoryPaintsBtn);
        this._categoryPaintsBtn.onclick = () => {
            this.setCurrentCategory(InventoryCategory.Paint);
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
            this._categoryPaintsBtn,
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
                            if (this.onNextHide) {
                                this.onNextHide();
                                this.onNextHide = undefined;
                            }
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
            let icon = document.createElement("img");
            icon.classList.add("inventory-icon");
            icon.setAttribute("src", inventoryItem.icon);
            icon.style.display = "inline-block";
            icon.style.verticalAlign = "top";
            icon.style.marginLeft = "1%";
            icon.style.marginRight = "1%";
            icon.style.marginTop = "0";
            icon.style.marginBottom = "0";
            icon.style.height = "85%";
            icon.style.outline = "1px solid white";
            icon.style.borderRadius = "4px";
            line.appendChild(icon);
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
            let equipButton = document.createElement("button");
            equipButton.classList.add("equip-button");
            equipButton.innerHTML = "EQUIP";
            equipButton.style.display = "inline-block";
            equipButton.style.marginLeft = "1%";
            equipButton.style.marginRight = "1%";
            equipButton.style.paddingLeft = "1.5%";
            equipButton.style.paddingRight = "1.5%";
            equipButton.style.width = "15%";
            line.appendChild(equipButton);
            equipButton.onclick = () => {
                let action = inventoryItem.getPlayerAction(this.inventory.player);
                this.inventory.player.playerActionManager.linkAction(action, this.inventory.player.playerActionManager.currentActionIndex);
                if (this.inventory.player.playerActionManager.alwaysEquip) {
                    this.inventory.player.playerActionManager.equipAction();
                }
            };
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
class VoxelizerMenuView extends HTMLElement {
    constructor() {
        super(...arguments);
        this._loaded = false;
        this._shown = false;
        this.currentPointers = 0;
        this._timer = 0;
    }
    static get observedAttributes() {
        return [];
    }
    get loaded() {
        return this._loaded;
    }
    waitLoaded() {
        return new Promise(resolve => {
            let step = () => {
                if (this.loaded) {
                    resolve();
                }
                else {
                    requestAnimationFrame(step);
                }
            };
            step();
        });
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
        if (this._options.length > 0) {
            this.setPointer((this.currentPointers - 1 + this._options.length) % this._options.length);
        }
    }
    currentPointerDown() {
        if (this._options.length > 0) {
            this.setPointer((this.currentPointers + 1) % this._options.length);
        }
    }
    setPointer(n) {
        if (this._options[this.currentPointers]) {
            this._options[this.currentPointers].classList.remove("highlit");
        }
        this.currentPointers = n;
        if (this._options[this.currentPointers]) {
            this._options[this.currentPointers].classList.add("highlit");
        }
    }
    _makeCategoryBtnStyle(btn) {
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
        this._title.classList.add("voxelizer-menu-title");
        this._title.innerHTML = "VOXELIZER";
        this.appendChild(this._title);
        let categoriesContainer;
        categoriesContainer = document.createElement("div");
        this.appendChild(categoriesContainer);
        this._urlInput = document.createElement("input");
        this._urlInput.setAttribute("type", "file");
        this._urlInput.addEventListener("input", (event) => {
            let files = event.target.files;
            let file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.addEventListener('load', (event) => {
                    this._voxelizer.url = "data:" + event.target.result;
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
        this._posX.addEventListener("input", (ev) => {
            this._voxelizer.meshInner.position.x = parseFloat(this._posX.value);
        });
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
        this._posY.addEventListener("input", (ev) => {
            this._voxelizer.meshInner.position.y = parseFloat(this._posY.value);
        });
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
        this._posZ.addEventListener("input", (ev) => {
            this._voxelizer.meshInner.position.z = parseFloat(this._posZ.value);
        });
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
        this._rotX.addEventListener("input", (ev) => {
            this._voxelizer.meshInner.rotation.x = parseFloat(this._rotX.value);
        });
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
        this._rotY.addEventListener("input", (ev) => {
            this._voxelizer.meshInner.rotation.y = parseFloat(this._rotY.value);
        });
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
        this._rotZ.addEventListener("input", (ev) => {
            this._voxelizer.meshInner.rotation.z = parseFloat(this._rotZ.value);
        });
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
        this._size.addEventListener("input", (ev) => {
            let s = parseFloat(this._size.value);
            this._voxelizer.meshInner.scaling.copyFromFloats(s, s, s);
        });
        divSize.appendChild(this._size);
        let divBlock = document.createElement("div");
        categoriesContainer.appendChild(divBlock);
        let blockDataList = document.createElement("datalist");
        blockDataList.id = "blocktypes";
        blockDataList.innerHTML = "";
        Kulla.BlockTypeNames.forEach(blockTypeName => {
            blockDataList.innerHTML += `<option value="` + blockTypeName + `">`;
        });
        divBlock.appendChild(blockDataList);
        let blockLabel = document.createElement("label");
        blockLabel.setAttribute("for", "size");
        blockLabel.innerHTML = "Block";
        divBlock.appendChild(blockLabel);
        this._block = document.createElement("input");
        this._block.id = "size";
        this._block.setAttribute("list", "blocktypes");
        this._block.setAttribute("placeholder", "Rock");
        this._block.addEventListener("input", (ev) => {
            let b = Kulla.BlockTypeNames.indexOf(this._block.value);
            this._voxelizer.blocktype = b;
        });
        divBlock.appendChild(this._block);
        this._goBtn = document.createElement("button");
        this._goBtn.innerHTML = "Run (Raycast)";
        categoriesContainer.appendChild(this._goBtn);
        this._goBtn.onclick = () => {
            this._voxelizer.plouf();
            this.hide(0.1);
        };
        this._goRasterizeBtn = document.createElement("button");
        this._goRasterizeBtn.innerHTML = "Run (Rasterize)";
        categoriesContainer.appendChild(this._goRasterizeBtn);
        this._goRasterizeBtn.onclick = () => {
            this._voxelizer.ploufRasterize();
            this.hide(0.1);
        };
        this._cancelBtn = document.createElement("button");
        this._cancelBtn.innerHTML = "Cancel";
        categoriesContainer.appendChild(this._cancelBtn);
        this._cancelBtn.onclick = () => {
            this.hide(0.1);
        };
        this._options = [
            this._cancelBtn,
        ];
    }
    attributeChangedCallback(name, oldValue, newValue) { }
    async show(duration = 1) {
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
                            if (this.onNextHide) {
                                this.onNextHide();
                                this.onNextHide = undefined;
                            }
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
    setPlayer(player) {
        this._player = player;
    }
    setVoxelizer(voxelizer) {
        this._voxelizer = voxelizer;
        this._urlInput.value = "";
        this._block.value = "";
        this._posX.value = voxelizer.meshInner.position.x.toFixed(2);
        this._posY.value = voxelizer.meshInner.position.y.toFixed(2);
        this._posZ.value = voxelizer.meshInner.position.z.toFixed(2);
        this._rotX.value = voxelizer.meshInner.rotation.x.toFixed(2);
        this._rotY.value = voxelizer.meshInner.rotation.y.toFixed(2);
        this._rotZ.value = voxelizer.meshInner.rotation.z.toFixed(2);
        this._size.value = voxelizer.meshInner.scaling.x.toFixed(2);
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
customElements.define("voxelizer-menu", VoxelizerMenuView);
class PlayerActionBlockShape {
    static Create(player, blockType, shapeName = "pole", size = 1) {
        let shape;
        let previewW = 1;
        let previewH = 1;
        let previewD = 1;
        let previewOffset = BABYLON.Vector3.Zero();
        let dir = 0;
        let targetIJK = { i: 0, j: 0, k: 0 };
        let targetChunck;
        let action = new PlayerAction("block_" + Kulla.BlockTypeNames[blockType] + "_" + shapeName + "_" + size, player);
        action.backgroundColor = Kulla.BlockTypeColors[blockType].toHexString();
        let previewMesh;
        let previewGrid;
        action.iconUrl = "/datas/icons/shapes/" + shapeName + "_" + size.toFixed(0) + ".png";
        action.onUpdate = () => {
            if (player.controler.playMode === PlayMode.Playing) {
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
                    if (mesh === previewGrid) {
                        return true;
                    }
                    return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                });
                if (hit && hit.pickedPoint) {
                    let n = hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? -0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, shape instanceof Kulla.Sphere && size % 2 === 0);
                    if (chunckIJK) {
                        if (!previewMesh) {
                            if (blockType === Kulla.BlockType.None) {
                                previewMesh = new BABYLON.Mesh("preview");
                                let boxData = BABYLON.CreateBoxVertexData({ width: previewW + 0.05, height: previewH + 0.05, depth: previewD + 0.05 });
                                Mummu.TranslateVertexDataInPlace(boxData, previewOffset);
                                let eraseMat = new BABYLON.StandardMaterial("erase-material");
                                eraseMat.diffuseColor.copyFromFloats(1, 0, 0);
                                eraseMat.emissiveColor.copyFromFloats(0.5, 0.5, 0.5);
                                eraseMat.specularColor.copyFromFloats(0, 0, 0);
                                eraseMat.alpha = 0.5;
                                previewMesh.material = eraseMat;
                                boxData.applyToMesh(previewMesh);
                            }
                            else {
                                previewMesh = Mummu.CreateLineBox("preview", { width: previewW, height: previewH, depth: previewD, color: new BABYLON.Color4(0, 1, 0, 1), offset: previewOffset, grid: player.game.terrain.blockSizeIJ_m });
                            }
                        }
                        if (!previewGrid) {
                            previewGrid = new BABYLON.Mesh("grid");
                            previewGrid.alphaIndex = 0;
                            let gridMat = new ChunckGridMaterial("grid-mat", player._scene);
                            previewGrid.material = gridMat;
                        }
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * player.game.terrain.blockSizeIJ_m, (chunckIJK.ijk.k + 0.5) * player.game.terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * player.game.terrain.blockSizeIJ_m);
                        previewMesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, dir * Math.PI / 2);
                        previewMesh.parent = chunckIJK.chunck.mesh;
                        if (chunckIJK.chunck != targetChunck || chunckIJK.ijk.i != targetIJK.i || chunckIJK.ijk.j != targetIJK.j || chunckIJK.ijk.k != targetIJK.k) {
                            targetChunck = chunckIJK.chunck;
                            targetIJK.i = chunckIJK.ijk.i;
                            targetIJK.j = chunckIJK.ijk.j;
                            targetIJK.k = chunckIJK.ijk.k;
                            let data = player.game.terrain.chunckBuilder.BuildGridMesh(chunckIJK.chunck, chunckIJK.ijk, 7, new BABYLON.Color3(0, 1, 1));
                            if (data) {
                                data.applyToMesh(previewGrid);
                            }
                        }
                        previewGrid.parent = chunckIJK.chunck.mesh;
                        return;
                    }
                }
            }
            targetChunck = undefined;
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            if (previewGrid) {
                previewGrid.dispose();
                previewGrid = undefined;
            }
        };
        action.onPointerDown = () => {
            if (player.controler.playMode === PlayMode.Playing) {
                if (targetChunck) {
                    if (blockType === Kulla.BlockType.None) {
                        shape.draw(targetChunck, targetIJK, dir, Kulla.BlockType.None, Kulla.TerrainEditionMode.Erase, true);
                    }
                    else {
                        shape.draw(targetChunck, targetIJK, dir, blockType, Kulla.TerrainEditionMode.AddIfEmpty, true);
                    }
                    if (previewGrid) {
                        previewGrid.dispose();
                        previewGrid = undefined;
                    }
                }
            }
        };
        let rotateBrick = () => {
            dir = (dir + 1) % 4;
            let quat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, dir * Math.PI / 2);
            if (previewMesh) {
                previewMesh.rotationQuaternion = quat;
            }
        };
        let nextShape = () => {
            if (shapeName === "pole") {
                shapeName = "bar";
            }
            else if (shapeName === "bar") {
                shapeName = "tile";
            }
            else if (shapeName === "tile") {
                shapeName = "wall";
            }
            else if (shapeName === "wall") {
                shapeName = "sphere";
            }
            else if (shapeName === "sphere") {
                shapeName = "pole";
            }
            onShapeUpdate();
        };
        let onShapeUpdate = () => {
            let terrain = player.game.terrain;
            let l = (size / 2 - 0.5) * player.game.terrain.blockSizeIJ_m;
            if (shapeName === "pole") {
                previewW = terrain.blockSizeIJ_m;
                previewH = size * terrain.blockSizeK_m;
                previewD = terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(0, l, 0);
                shape = new Kulla.Box(player.game.terrain, { width: 1, height: size, length: 1 });
            }
            else if (shapeName === "bar") {
                previewW = terrain.blockSizeIJ_m;
                previewH = terrain.blockSizeK_m;
                previewD = size * terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(0, 0, l);
                shape = new Kulla.Box(player.game.terrain, { width: 1, height: 1, length: size });
            }
            else if (shapeName === "tile") {
                previewW = size * terrain.blockSizeIJ_m;
                previewH = 1 * terrain.blockSizeK_m;
                previewD = size * terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(l, 0, l);
                shape = new Kulla.Box(player.game.terrain, { width: size, height: 1, length: size });
            }
            else if (shapeName === "wall") {
                previewW = 1 * terrain.blockSizeIJ_m;
                previewH = size * terrain.blockSizeK_m;
                previewD = size * terrain.blockSizeIJ_m;
                previewOffset.copyFromFloats(0, l, l);
                shape = new Kulla.Box(player.game.terrain, { width: 1, height: size, length: size });
            }
            else if (shapeName === "sphere") {
                previewW = size * terrain.blockSizeIJ_m;
                previewH = size * terrain.blockSizeK_m;
                previewD = size * terrain.blockSizeIJ_m;
                let o = size % 2 === 0 ? 0.5 * player.game.terrain.blockSizeIJ_m : 0;
                previewOffset.copyFromFloats(0 - o, -o, 0 - o);
                shape = new Kulla.Sphere(player.game.terrain, { diameter: size });
            }
            action.iconUrl = "/datas/icons/shapes/" + shapeName + "_" + size.toFixed(0) + ".png";
            action.name = "block_" + Kulla.BlockTypeNames[blockType] + "_" + shapeName + "_" + size;
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            player.playerActionManager.saveToLocalStorage();
        };
        action.onEquip = () => {
            onShapeUpdate();
            dir = 0;
            player.game.inputManager.addMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
            player.game.inputManager.addMappedKeyDownListener(KeyInput.NEXT_SHAPE, nextShape);
        };
        action.onUnequip = () => {
            if (previewMesh) {
                previewMesh.dispose();
                previewMesh = undefined;
            }
            if (previewGrid) {
                previewGrid.dispose();
                previewGrid = undefined;
            }
            targetChunck = undefined;
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.ROTATE_SELECTED, rotateBrick);
            player.game.inputManager.removeMappedKeyDownListener(KeyInput.NEXT_SHAPE, nextShape);
        };
        action.onWheel = (e) => {
            if (e.deltaY > 0) {
                size = Nabu.MinMax(size - 1, 1, 10);
                onShapeUpdate();
            }
            else if (e.deltaY < 0) {
                size = Nabu.MinMax(size + 1, 1, 10);
                onShapeUpdate();
            }
        };
        return action;
    }
}
class PlayerActionDefault {
    static IsAimable(mesh) {
        if (mesh instanceof BrickMesh) {
            return true;
        }
        if (mesh instanceof Voxelizer) {
            return true;
        }
        return false;
    }
    static Create(player) {
        let brickAction = new PlayerAction("default-action", player);
        brickAction.backgroundColor = "#FF00FF";
        brickAction.iconUrl = "";
        let aimedObject;
        let setAimedObject = (b) => {
            if (b != aimedObject) {
                if (aimedObject) {
                    aimedObject.unlight();
                }
                aimedObject = b;
                if (aimedObject) {
                    aimedObject.highlight();
                }
            }
        };
        brickAction.onUpdate = () => {
            if (player.controler.playMode === PlayMode.Playing) {
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
                    return PlayerActionDefault.IsAimable(mesh);
                });
                if (hit.hit && hit.pickedPoint) {
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let brickRoot = hit.pickedMesh.brick.root;
                        if (brickRoot) {
                            let brick = brickRoot.getBrickForFaceId(hit.faceId);
                            if (brick) {
                                setAimedObject(brick);
                            }
                            return;
                        }
                    }
                    else if (hit.pickedMesh instanceof Voxelizer) {
                        setAimedObject(hit.pickedMesh);
                        return;
                    }
                }
            }
            setAimedObject(undefined);
        };
        brickAction.onPointerUp = (duration, distance) => {
            if (distance > 4) {
                return;
            }
            if (duration > 0.3) {
                if (aimedObject instanceof Brick) {
                    player.game.brickMenuView.setBrick(aimedObject);
                    if (player.game.inputManager.isPointerLocked) {
                        document.exitPointerLock();
                        player.game.brickMenuView.onNextHide = () => {
                            player.game.canvas.requestPointerLock();
                        };
                    }
                    player.game.brickMenuView.show(0.1);
                }
            }
            else {
                if (player.controler.playMode === PlayMode.Playing) {
                    if ((aimedObject instanceof Brick) && !aimedObject.root.anchored) {
                        player.currentAction = PlayerActionMoveBrick.Create(player, aimedObject.root);
                    }
                    else if ((aimedObject instanceof Voxelizer)) {
                        player.game.voxelizerMenuView.setVoxelizer(aimedObject);
                        if (player.game.inputManager.isPointerLocked) {
                            document.exitPointerLock();
                            player.game.inputManager.temporaryNoPointerLock = true;
                            player.game.voxelizerMenuView.onNextHide = () => {
                                player.game.inputManager.temporaryNoPointerLock = false;
                                player.game.canvas.requestPointerLock();
                            };
                        }
                        player.game.voxelizerMenuView.show(0.1);
                    }
                }
            }
        };
        brickAction.onRightPointerUp = (duration, distance) => {
            if (distance > 4) {
                return;
            }
            if (aimedObject instanceof Brick) {
                let prevParent = aimedObject.parent;
                if (prevParent instanceof Brick) {
                    aimedObject.setParent(undefined);
                    aimedObject.updateMesh();
                    prevParent.updateMesh();
                }
            }
        };
        brickAction.onUnequip = () => {
            setAimedObject(undefined);
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
            if (player.controler.playMode === PlayMode.Playing) {
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
            if (player.controler.playMode === PlayMode.Playing) {
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
                            brick.chunck = undefined;
                            brick.brickManager.saveToLocalStorage();
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
                            brick.chunck = root.chunck;
                            brick.brickManager.saveToLocalStorage();
                        }
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            brick.root.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                            brick.root.chunck = chunckIJK.chunck;
                            brick.brickManager.saveToLocalStorage();
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
        brickAction.onWheel = (e) => {
            if (brick.isRoot && brick.getChildTransformNodes().length === 0) {
                if (e.deltaY > 0) {
                    brick.index = (brick.index + BRICK_LIST.length - 1) % BRICK_LIST.length;
                    brick.updateMesh();
                }
                else if (e.deltaY < 0) {
                    brick.index = (brick.index + 1) % BRICK_LIST.length;
                    brick.updateMesh();
                }
            }
        };
        return brickAction;
    }
}
var ACTIVE_DEBUG_PLAYER_ACTION = true;
var ADD_BRICK_ANIMATION_DURATION = 1000;
class PlayerActionTemplate {
    static CreateMushroomAction(player) {
        let action = new PlayerAction("mushroom", player);
        action.backgroundColor = "#00FFFF";
        let previewMesh;
        let previewBox;
        action.iconUrl = undefined;
        let lastSize;
        let lastI;
        let lastJ;
        let lastK;
        let size = 1;
        action.onUpdate = () => {
            let terrain = player.game.terrain;
            if (player.controler.playMode === PlayMode.Playing) {
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
                    let n = hit.getNormal(true).scaleInPlace(0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, size % 2 === 0);
                    if (chunckIJK) {
                        // Redraw block preview
                        if (!previewMesh) {
                            previewMesh = Mummu.CreateLineBox("preview", { width: size * terrain.blockSizeIJ_m, height: size * terrain.blockSizeK_m, depth: size * terrain.blockSizeIJ_m, color: new BABYLON.Color4(0, 1, 0, 1) });
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
                        let offset = (size % 2) * 0.5;
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i + offset) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k + offset) * terrain.blockSizeK_m, (chunckIJK.ijk.j + offset) * terrain.blockSizeIJ_m);
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
            if (player.controler.playMode === PlayMode.Playing) {
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
                    let n = hit.getNormal(true).scaleInPlace(0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, size % 2 === 0);
                    if (chunckIJK) {
                        let mushroom = new Tree2(player.game);
                        mushroom.chunck = chunckIJK.chunck;
                        mushroom.ijk = chunckIJK.ijk;
                        mushroom.instantiate();
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
    /*
    public static CreateBlockAction(player: Player, blockType: Kulla.BlockType): PlayerAction {
        let action = new PlayerAction("block_" + Kulla.BlockTypeNames[blockType], player);
        action.backgroundColor = Kulla.BlockTypeColors[blockType].toHexString();
        let previewMesh: BABYLON.Mesh;
        let previewBox: BABYLON.Mesh;
        action.iconUrl = undefined;

        let lastSize: number;
        let lastI: number;
        let lastJ: number;
        let lastK: number;

        let size = 1;

        action.onUpdate = () => {
            let terrain = player.game.terrain;
            if (player.controler.playMode === PlayMode.Playing) {
                let x: number;
                let y: number;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(
                    x,
                    y,
                    (mesh) => {
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? - 0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, size % 2 === 0);
                    if (chunckIJK) {
                        // Redraw block preview
                        if (!previewMesh) {
                            if (blockType === Kulla.BlockType.None) {
                                previewMesh = Mummu.CreateLineBox("preview", { width: size * terrain.blockSizeIJ_m, height: size * terrain.blockSizeK_m, depth: size * terrain.blockSizeIJ_m, color: new BABYLON.Color4(1, 0, 0, 1) });
                            }
                            else {
                                previewMesh = Mummu.CreateLineBox("preview", { width: size * terrain.blockSizeIJ_m, height: size * terrain.blockSizeK_m, depth: size * terrain.blockSizeIJ_m, color: new BABYLON.Color4(0, 1, 0, 1) });
                            }
                        }
                        
                        let needRedrawMesh: boolean = false;
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
                        
                        let offset = (size % 2) * 0.5;
                        previewMesh.position.copyFromFloats((chunckIJK.ijk.i + offset) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k + offset) * terrain.blockSizeK_m, (chunckIJK.ijk.j + offset) * terrain.blockSizeIJ_m);
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
        }

        action.onPointerDown = () => {
            if (player.controler.playMode === PlayMode.Playing) {
                let x: number;
                let y: number;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(
                    x,
                    y,
                    (mesh) => {
                        return player.currentChuncks.find(chunck => { return chunck && chunck.mesh === mesh; }) != undefined;
                    }
                )
                if (hit && hit.pickedPoint) {
                    let n =  hit.getNormal(true).scaleInPlace(blockType === Kulla.BlockType.None ? - 0.2 : 0.2);
                    let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0, size % 2 === 0);
                    if (chunckIJK) {
                        player.game.terrainEditor.doAction(chunckIJK.chunck, chunckIJK.ijk, {
                            brushSize: size,
                            brushBlock: blockType,
                            saveToLocalStorage: true
                        });
                    }
                }
            }
        }

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
        }
        
        return action;
    }
    */
    static CreateBrickAction(player, brickId, colorIndex) {
        let brickIndex = Brick.BrickIdToIndex(brickId);
        let brickAction = new PlayerAction(Brick.BrickIdToName(brickId), player);
        brickAction.backgroundColor = "#000000";
        let previewMesh;
        brickAction.iconUrl = "/datas/icons/bricks/" + Brick.BrickIdToName(brickId) + ".png";
        let rotationQuaternion = BABYLON.Quaternion.Identity();
        brickAction.onUpdate = () => {
            let terrain = player.game.terrain;
            if (player.controler.playMode === PlayMode.Playing) {
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
            if (player.controler.playMode === PlayMode.Playing) {
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
                        let brick = new Brick(player.game.brickManager, brickIndex, isFinite(colorIndex) ? colorIndex : player.controler.lastUsedPaintIndex);
                        brick.position.copyFrom(dp).addInPlace(rootPosition);
                        brick.rotationQuaternion = rotationQuaternion.clone();
                        brick.computeWorldMatrix(true);
                        brick.setParent(aimedBrick);
                        brick.updateMesh();
                        brick.brickManager.saveToLocalStorage();
                    }
                    else {
                        let chunckIJK = player.game.terrain.getChunckAndIJKAtPos(hit.pickedPoint.add(n), 0);
                        if (chunckIJK) {
                            let brick = new Brick(player.game.brickManager, brickIndex, isFinite(colorIndex) ? colorIndex : player.controler.lastUsedPaintIndex);
                            brick.position.copyFromFloats((chunckIJK.ijk.i + 0.5) * terrain.blockSizeIJ_m, (chunckIJK.ijk.k) * terrain.blockSizeK_m, (chunckIJK.ijk.j + 0.5) * terrain.blockSizeIJ_m).addInPlace(chunckIJK.chunck.position);
                            brick.rotationQuaternion = rotationQuaternion.clone();
                            brick.updateMesh();
                            brick.chunck = chunckIJK.chunck;
                            brick.brickManager.saveToLocalStorage();
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
            brickIndex = Brick.BrickIdToIndex(brickId);
            if (!previewMesh || previewMesh.isDisposed()) {
                previewMesh = new BABYLON.Mesh("brick-preview-mesh");
            }
            let previewMat = new BABYLON.StandardMaterial("brick-preview-material");
            previewMat.alpha = 0.5;
            previewMat.specularColor.copyFromFloats(1, 1, 1);
            previewMesh.material = previewMat;
            previewMesh.rotationQuaternion = rotationQuaternion;
            BrickTemplateManager.Instance.getTemplate(brickIndex).then(template => {
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
        brickAction.onWheel = (e) => {
            if (e.deltaY > 0) {
                brickIndex = (brickIndex + BRICK_LIST.length - 1) % BRICK_LIST.length;
                BrickTemplateManager.Instance.getTemplate(brickIndex).then(template => {
                    if (previewMesh && !previewMesh.isDisposed()) {
                        template.vertexData.applyToMesh(previewMesh);
                    }
                });
            }
            else if (e.deltaY < 0) {
                brickIndex = (brickIndex + 1) % BRICK_LIST.length;
                BrickTemplateManager.Instance.getTemplate(brickIndex).then(template => {
                    if (previewMesh && !previewMesh.isDisposed()) {
                        template.vertexData.applyToMesh(previewMesh);
                    }
                });
            }
        };
        return brickAction;
    }
    static CreatePaintAction(player, paintIndex) {
        let paintAction = new PlayerAction("paint_" + BRICK_COLORS[paintIndex].name, player);
        paintAction.backgroundColor = BRICK_COLORS[paintIndex].hex;
        paintAction.iconUrl = "/datas/icons/paintbrush.svg";
        let brush;
        let tip;
        paintAction.onUpdate = () => {
        };
        paintAction.onPointerDown = () => {
            if (player.controler.playMode === PlayMode.Playing) {
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
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let root = hit.pickedMesh.brick.root;
                        let aimedBrick = root.getBrickForFaceId(hit.faceId);
                        aimedBrick.colorIndex = paintIndex;
                        player.controler.lastUsedPaintIndex = paintIndex;
                        aimedBrick.updateMesh();
                        aimedBrick.brickManager.saveToLocalStorage();
                    }
                }
            }
        };
        paintAction.onEquip = async () => {
            brush = new BABYLON.Mesh("brush");
            brush.parent = player;
            brush.position.z = 0.8;
            brush.position.x = 0.1;
            brush.position.y = -0.2;
            tip = new BABYLON.Mesh("tip");
            tip.parent = brush;
            let tipMaterial = new BABYLON.StandardMaterial("tip-material");
            tipMaterial.diffuseColor = BABYLON.Color3.FromHexString(BRICK_COLORS[paintIndex].hex);
            tip.material = tipMaterial;
            let vDatas = await player.game.vertexDataLoader.get("./datas/meshes/paintbrush.babylon");
            if (brush && !brush.isDisposed()) {
                vDatas[0].applyToMesh(brush);
                vDatas[1].applyToMesh(tip);
            }
        };
        paintAction.onUnequip = () => {
            if (brush) {
                brush.dispose();
            }
        };
        paintAction.onWheel = (e) => {
            if (e.deltaY > 0) {
                paintIndex = (paintIndex + BRICK_COLORS.length - 1) % BRICK_COLORS.length;
                if (tip && !tip.isDisposed() && tip.material instanceof BABYLON.StandardMaterial) {
                    tip.material.diffuseColor = BABYLON.Color3.FromHexString(BRICK_COLORS[paintIndex].hex);
                }
            }
            else if (e.deltaY < 0) {
                paintIndex = (paintIndex + 1) % BRICK_COLORS.length;
                if (tip && !tip.isDisposed() && tip.material instanceof BABYLON.StandardMaterial) {
                    tip.material.diffuseColor = BABYLON.Color3.FromHexString(BRICK_COLORS[paintIndex].hex);
                }
            }
        };
        return paintAction;
    }
}
class PlayerActionVoxelizer {
    static Create(player) {
        let action = new PlayerAction("voxelizer", player);
        action.backgroundColor = "#FF00FF";
        let previewMesh;
        let previewBox;
        action.iconUrl = undefined;
        action.onUpdate = () => {
            if (player.controler.playMode === PlayMode.Playing) {
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
                    if (!previewMesh) {
                        previewMesh = Mummu.CreateLineBox("preview", { width: 0.5, height: 0.5, depth: 0.5, color: new BABYLON.Color4(0, 1, 0, 1) });
                    }
                    previewMesh.position.copyFrom(hit.pickedPoint);
                    return;
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
        action.onPointerUp = () => {
            if (player.controler.playMode === PlayMode.Playing) {
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
                    let voxelizer = new Voxelizer("", player.game);
                    voxelizer.position.copyFrom(hit.pickedPoint);
                    player.currentAction = undefined;
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
        };
        return action;
    }
}
class Voxelizer extends BABYLON.Mesh {
    constructor(url, game) {
        super("voxelizer");
        this.url = url;
        this.game = game;
        this.blocktype = Kulla.BlockType.Rock;
        let voxelizerMaterial = new ToonMaterial("voxelizer-material", game.scene);
        voxelizerMaterial.setSpecularIntensity(1);
        voxelizerMaterial.setSpecularCount(4);
        voxelizerMaterial.setSpecularPower(32);
        voxelizerMaterial.setUseVertexColor(true);
        this.material = voxelizerMaterial;
        game.vertexDataLoader.get("./datas/meshes/voxelizer.babylon").then(datas => {
            if (datas && datas[0]) {
                datas[0].applyToMesh(this);
            }
        });
        this.meshInner = new BABYLON.Mesh("voxelizer-inner");
        this.meshInner.scaling.copyFromFloats(10, 10, 10);
        this.meshInner.parent = this;
        this.meshOuter = new BABYLON.Mesh("voxelizer-shell");
        this.meshOuter.parent = this.meshInner;
        let material = new BABYLON.StandardMaterial("voxelizer-material");
        material.specularColor.copyFromFloats(0, 0, 0);
        this.meshInner.material = material;
        this.meshOuter.material = material;
    }
    highlight() {
        this.renderOutline = true;
        this.outlineColor = new BABYLON.Color3(0, 1, 1);
        this.outlineWidth = 0.01;
    }
    unlight() {
        this.renderOutline = false;
    }
    async initialize() {
        let datas = await this.game.vertexDataLoader.get(this.url);
        if (datas) {
            let data = datas[0];
            if (data) {
                let innerData = Mummu.CloneVertexData(data);
                Mummu.TriFlipVertexDataInPlace(innerData);
                innerData.applyToMesh(this.meshInner);
                let outerData = Mummu.CloneVertexData(data);
                Mummu.ShrinkVertexDataInPlace(outerData, 0.001);
                outerData.applyToMesh(this.meshOuter);
            }
        }
        this.meshInner.position.copyFromFloats(0, 0, 0);
        this.meshInner.rotation.copyFromFloats(0, 0, 0);
        this.meshOuter.position.copyFromFloats(0, 0, 0);
        this.meshOuter.rotation.copyFromFloats(0, 0, 0);
    }
    async plouf() {
        this.meshInner.isVisible = false;
        this.meshOuter.isVisible = false;
        this.meshOuter.computeWorldMatrix(true);
        this.meshOuter.refreshBoundingInfo();
        let min = this.meshOuter.getBoundingInfo().boundingBox.minimumWorld;
        let max = this.meshOuter.getBoundingInfo().boundingBox.maximumWorld;
        let center = min.add(max).scale(0.5);
        let DI = (max.x - min.x) / this.game.terrain.blockSizeIJ_m;
        let DJ = (max.z - min.z) / this.game.terrain.blockSizeIJ_m;
        let DK = (max.y - min.y) / this.game.terrain.blockSizeK_m;
        /*
        if (Math.abs(DI) * Math.abs(DJ) * Math.abs(DK) > 30 * 30 * 30) {
            return this.ploufRasterize();
        }
        */
        let k0 = 0;
        let k1 = 0;
        let affectedChuncks = new Nabu.UniqueList();
        let rebuildAffectedChuncks = () => {
            for (let i = 0; i < affectedChuncks.length; i++) {
                let chunck = affectedChuncks.get(i);
                for (let k = k0; k <= k1; k++) {
                    chunck.updateIsEmptyIsFull(k);
                }
                chunck.redrawMesh(true);
                chunck.saveToLocalStorage();
            }
            affectedChuncks = new Nabu.UniqueList();
        };
        let localIJK = this.game.terrain.getChunckAndIJKAtPos(min, 0);
        if (localIJK) {
            let ijk = localIJK.ijk;
            let chunck = localIJK.chunck;
            if (chunck) {
                k0 = ijk.k;
                k1 = ijk.k + DK;
                min = chunck.getPosAtIJK(ijk);
                let p = BABYLON.Vector3.Zero();
                let dir = BABYLON.Vector3.Zero();
                let breaks = 0;
                let doStep = (i, k) => {
                    for (let j = 0; j < DJ; j++) {
                        p.copyFromFloats(min.x + i * this.game.terrain.blockSizeIJ_m, min.y + k * this.game.terrain.blockSizeK_m, min.z + j * this.game.terrain.blockSizeIJ_m);
                        dir.copyFrom(p).subtractInPlace(center).normalize();
                        let ray = new BABYLON.Ray(p, dir);
                        let intersection = this.game.scene.pickWithRay(ray, (mesh) => {
                            return mesh === this.meshInner || mesh === this.meshOuter;
                        });
                        if (intersection && intersection.pickedMesh === this.meshInner) {
                            let chuncks = chunck.setData(this.blocktype, ijk.i + i, ijk.j + j, ijk.k + k);
                            chuncks.forEach((chunck) => {
                                affectedChuncks.push(chunck);
                            });
                        }
                    }
                };
                let t0 = performance.now();
                for (let k = 0; k < DK; k++) {
                    for (let i = 0; i < DI; i++) {
                        let t1 = performance.now();
                        if (t1 - t0 < 5) {
                            doStep(i, k);
                        }
                        else {
                            breaks++;
                            await Nabu.NextFrame();
                            t0 = performance.now();
                            doStep(i, k);
                            if (breaks > 60) {
                                breaks = 0;
                                rebuildAffectedChuncks();
                            }
                        }
                    }
                }
                rebuildAffectedChuncks();
            }
        }
        this.meshInner.dispose();
        this.meshOuter.dispose();
        this.dispose();
    }
    async ploufEdges() {
        this.meshInner.isVisible = false;
        this.meshOuter.isVisible = false;
        this.meshOuter.computeWorldMatrix(true);
        this.meshInner.bakeTransformIntoVertices(this.meshInner.getWorldMatrix());
        this.meshOuter.computeWorldMatrix(true);
        await Nabu.NextFrame();
        let k0 = 0;
        let k1 = 0;
        let affectedChuncks = new Nabu.UniqueList();
        let rebuildAffectedChuncks = () => {
            for (let i = 0; i < affectedChuncks.length; i++) {
                let chunck = affectedChuncks.get(i);
                for (let k = k0; k <= k1; k++) {
                    chunck.updateIsEmptyIsFull(k);
                }
                chunck.redrawMesh(true);
                chunck.saveToLocalStorage();
            }
            affectedChuncks = new Nabu.UniqueList();
        };
        let line = new Kulla.Line(this.game.terrain);
        let data = BABYLON.VertexData.ExtractFromMesh(this.meshInner);
        let positions = data.positions;
        let indices = data.indices;
        this.meshInner.dispose();
        this.meshOuter.dispose();
        let t0 = performance.now();
        let pos = BABYLON.Vector3.Zero();
        let breaks = 0;
        let doStep = (triIndex) => {
            let v1Index = indices[3 * triIndex];
            let v2Index = indices[3 * triIndex + 1];
            let v3Index = indices[3 * triIndex + 2];
            let x1 = positions[3 * v1Index];
            let y1 = positions[3 * v1Index + 1];
            let z1 = positions[3 * v1Index + 2];
            pos.copyFromFloats(x1, y1, z1);
            let localIJK1 = this.game.terrain.getChunckAndIJKAtPos(pos, 0);
            if (localIJK1 && localIJK1.chunck) {
                let x2 = positions[3 * v2Index];
                let y2 = positions[3 * v2Index + 1];
                let z2 = positions[3 * v2Index + 2];
                let IJK1ANext = {
                    i: localIJK1.ijk.i + Math.round((x2 - x1) / 0.4),
                    j: localIJK1.ijk.j + Math.round((z2 - z1) / 0.4),
                    k: localIJK1.ijk.k + Math.round((y2 - y1) / 0.4),
                };
                pos.copyFromFloats(x2, y2, z2);
                let localIJK2 = this.game.terrain.getChunckAndIJKAtPos(pos, 0);
                if (localIJK2 && localIJK2.chunck) {
                    let x3 = positions[3 * v3Index];
                    let y3 = positions[3 * v3Index + 1];
                    let z3 = positions[3 * v3Index + 2];
                    let IJK1BNext = {
                        i: localIJK1.ijk.i + Math.round((x3 - x1) / 0.4),
                        j: localIJK1.ijk.j + Math.round((z3 - z1) / 0.4),
                        k: localIJK1.ijk.k + Math.round((y3 - y1) / 0.4),
                    };
                    let IJK2Next = {
                        i: localIJK2.ijk.i + Math.round((x3 - x2) / 0.4),
                        j: localIJK2.ijk.j + Math.round((z3 - z2) / 0.4),
                        k: localIJK2.ijk.k + Math.round((y3 - y2) / 0.4),
                    };
                    let chuncks = line.draw(localIJK1.chunck, localIJK1.ijk, IJK1ANext, this.blocktype, Kulla.TerrainEditionMode.Add, false, true);
                    chuncks.forEach(chunck => {
                        affectedChuncks.push(chunck);
                    });
                    chuncks = line.draw(localIJK1.chunck, localIJK1.ijk, IJK1BNext, this.blocktype, Kulla.TerrainEditionMode.Add, false, true);
                    chuncks.forEach(chunck => {
                        affectedChuncks.push(chunck);
                    });
                    chuncks = line.draw(localIJK2.chunck, localIJK2.ijk, IJK2Next, this.blocktype, Kulla.TerrainEditionMode.Add, false, true);
                    chuncks.forEach(chunck => {
                        affectedChuncks.push(chunck);
                    });
                }
            }
        };
        for (let triIndex = 0; triIndex < indices.length / 3; triIndex++) {
            let t1 = performance.now();
            if (t1 - t0 < 5) {
                doStep(triIndex);
            }
            else {
                breaks++;
                await Nabu.NextFrame();
                t0 = performance.now();
                doStep(triIndex);
                if (breaks > 60) {
                    breaks = 0;
                    rebuildAffectedChuncks();
                }
            }
        }
        rebuildAffectedChuncks();
        this.dispose();
    }
    async ploufRasterize() {
        this.meshInner.isVisible = false;
        this.meshOuter.isVisible = false;
        this.meshOuter.computeWorldMatrix(true);
        this.meshInner.bakeTransformIntoVertices(this.meshInner.getWorldMatrix());
        this.meshOuter.computeWorldMatrix(true);
        await Nabu.NextFrame();
        let k0 = 0;
        let k1 = 0;
        let affectedChuncks = new Nabu.UniqueList();
        let rebuildAffectedChuncks = async () => {
            for (let i = 0; i < affectedChuncks.length; i++) {
                let chunck = affectedChuncks.get(i);
                for (let k = k0; k <= k1; k++) {
                    chunck.updateIsEmptyIsFull(k);
                }
                chunck.redrawMesh(true);
                await Nabu.NextFrame();
                chunck.saveToLocalStorage();
            }
            affectedChuncks = new Nabu.UniqueList();
        };
        let triangle = new Kulla.Triangle(this.game.terrain);
        let data = BABYLON.VertexData.ExtractFromMesh(this.meshInner);
        let positions = data.positions;
        let indices = data.indices;
        // sort indices
        let triangleIndices = [];
        for (let i = 0; i < indices.length / 3; i++) {
            triangleIndices[i] = [indices[3 * i], indices[3 * i + 1], indices[3 * i + 2]];
        }
        triangleIndices = triangleIndices.sort((tri1, tri2) => {
            let v11 = tri1[0];
            let v12 = tri1[1];
            let v13 = tri1[2];
            let v21 = tri2[0];
            let v22 = tri2[1];
            let v23 = tri2[2];
            let y1 = positions[3 * v11 + 1] + positions[3 * v12 + 1] + positions[3 * v13 + 1];
            let y2 = positions[3 * v21 + 1] + positions[3 * v22 + 1] + positions[3 * v23 + 1];
            return y1 - y2;
        });
        indices = [];
        for (let i = 0; i < triangleIndices.length; i++) {
            indices.push(...triangleIndices[i]);
        }
        this.meshInner.dispose();
        this.meshOuter.dispose();
        let t0 = performance.now();
        let pos = BABYLON.Vector3.Zero();
        let breaks = 0;
        let doStep = (triIndex) => {
            let v1Index = indices[3 * triIndex];
            let v2Index = indices[3 * triIndex + 1];
            let v3Index = indices[3 * triIndex + 2];
            let x1 = positions[3 * v1Index];
            let y1 = positions[3 * v1Index + 1];
            let z1 = positions[3 * v1Index + 2];
            let x2 = positions[3 * v2Index];
            let y2 = positions[3 * v2Index + 1];
            let z2 = positions[3 * v2Index + 2];
            let x3 = positions[3 * v3Index];
            let y3 = positions[3 * v3Index + 1];
            let z3 = positions[3 * v3Index + 2];
            /*
            let n = BABYLON.Vector3.Cross(
                new BABYLON.Vector3(x3 - x1, y3 - y1, z3 - z1),
                new BABYLON.Vector3(x2 - x1, y2 - y1, z2 - z1)
            ).normalize();

            let correction = BABYLON.Vector3.Zero();
            if (Math.abs(n.x) >= Math.abs(n.y) && Math.abs(n.x) >= Math.abs(n.z)) {
                correction.x = Math.sign(n.x);
            }
            else if (Math.abs(n.y) >= Math.abs(n.z)) {
                correction.y = Math.sign(n.y);
            }
            else {
                correction.z = Math.sign(n.z);
            }
            */
            pos.copyFromFloats(x1, y1, z1);
            let localIJK1 = this.game.terrain.getChunckAndIJKAtPos(pos, 0, true);
            /*
            let roundedPos1 = localIJK1.chunck.getPosAtIJK(localIJK1.ijk);
            if (BABYLON.Vector3.Dot(roundedPos1.subtract(pos), n) > 0) {
                localIJK1.ijk.i += correction.x;
                localIJK1.ijk.j += correction.z;
                localIJK1.ijk.k += correction.y;
            }
                
            pos.copyFromFloats(x2, y2, z2);
            let localIJK2 = this.game.terrain.getChunckAndIJKAtPos(pos, 0, true);
            let roundedPos2 = localIJK2.chunck.getPosAtIJK(localIJK2.ijk);
            if (BABYLON.Vector3.Dot(roundedPos2.subtract(pos), n) > 0) {
                x2 += correction.x * 0.4;
                y2 += correction.y * 0.4;
                z2 += correction.z * 0.4;
            }
                
            pos.copyFromFloats(x3, y3, z3);
            let localIJK3 = this.game.terrain.getChunckAndIJKAtPos(pos, 0, true);
            let roundedPos3 = localIJK3.chunck.getPosAtIJK(localIJK3.ijk);
            if (BABYLON.Vector3.Dot(roundedPos3.subtract(pos), n) > 0) {
                x3 += correction.x * 0.4;
                y3 += correction.y * 0.4;
                z3 += correction.z * 0.4;
            }
            */
            if (localIJK1 && localIJK1.chunck) {
                let IJK1ANext = {
                    i: localIJK1.ijk.i + Math.round((x2 - x1) / 0.4),
                    j: localIJK1.ijk.j + Math.round((z2 - z1) / 0.4),
                    k: localIJK1.ijk.k + Math.round((y2 - y1) / 0.4),
                };
                let IJK1BNext = {
                    i: localIJK1.ijk.i + Math.round((x3 - x1) / 0.4),
                    j: localIJK1.ijk.j + Math.round((z3 - z1) / 0.4),
                    k: localIJK1.ijk.k + Math.round((y3 - y1) / 0.4),
                };
                let chuncks = triangle.draw(localIJK1.chunck, localIJK1.ijk, IJK1ANext, IJK1BNext, this.blocktype, Kulla.TerrainEditionMode.Add, false, true);
                chuncks.forEach(chunck => {
                    affectedChuncks.push(chunck);
                });
            }
        };
        for (let triIndex = 0; triIndex < indices.length / 3; triIndex++) {
            let t1 = performance.now();
            if (t1 - t0 < 5) {
                doStep(triIndex);
            }
            else {
                breaks++;
                await Nabu.NextFrame();
                t0 = performance.now();
                doStep(triIndex);
                if (breaks > 30) {
                    breaks = 0;
                    await rebuildAffectedChuncks();
                }
            }
        }
        await rebuildAffectedChuncks();
        this.dispose();
    }
    async ploufBetter() {
        this.meshInner.isVisible = false;
        this.meshOuter.isVisible = false;
        this.meshOuter.computeWorldMatrix(true);
        this.meshOuter.refreshBoundingInfo();
        let min = this.meshOuter.getBoundingInfo().boundingBox.minimumWorld;
        let max = this.meshOuter.getBoundingInfo().boundingBox.maximumWorld;
        let center = min.add(max).scale(0.5);
        let DI = (max.x - min.x) / this.game.terrain.blockSizeIJ_m;
        let DJ = (max.z - min.z) / this.game.terrain.blockSizeIJ_m;
        let DK = (max.y - min.y) / this.game.terrain.blockSizeK_m;
        /*
        if (Math.abs(DI) * Math.abs(DJ) * Math.abs(DK) > 30 * 30 * 30) {
            return this.ploufRasterize();
        }
        */
        let k0 = 0;
        let k1 = 0;
        let affectedChuncks = new Nabu.UniqueList();
        let rebuildAffectedChuncks = () => {
            for (let i = 0; i < affectedChuncks.length; i++) {
                let chunck = affectedChuncks.get(i);
                for (let k = k0; k <= k1; k++) {
                    chunck.updateIsEmptyIsFull(k);
                }
                chunck.redrawMesh(true);
                chunck.saveToLocalStorage();
            }
            affectedChuncks = new Nabu.UniqueList();
        };
        let localIJK = this.game.terrain.getChunckAndIJKAtPos(min, 0);
        if (localIJK) {
            let ijk = localIJK.ijk;
            let chunck = localIJK.chunck;
            if (chunck) {
                k0 = ijk.k;
                k1 = ijk.k + DK;
                min = chunck.getPosAtIJK(ijk);
                let p = BABYLON.Vector3.Zero();
                let dir = BABYLON.Vector3.Zero();
                let breaks = 0;
                let doStep = (i, k) => {
                    for (let j = 0; j < DJ; j++) {
                        p.copyFromFloats(min.x + i * this.game.terrain.blockSizeIJ_m, min.y + k * this.game.terrain.blockSizeK_m, min.z + j * this.game.terrain.blockSizeIJ_m);
                        dir.copyFrom(p).subtractInPlace(center).normalize();
                        let ray = new BABYLON.Ray(p, dir);
                        let intersection = this.game.scene.pickWithRay(ray, (mesh) => {
                            return mesh === this.meshInner || mesh === this.meshOuter;
                        });
                        if (intersection && intersection.pickedMesh === this.meshInner) {
                            let chuncks = chunck.setData(this.blocktype, ijk.i + i, ijk.j + j, ijk.k + k);
                            chuncks.forEach((chunck) => {
                                affectedChuncks.push(chunck);
                            });
                        }
                    }
                };
                let t0 = performance.now();
                for (let k = 0; k < DK; k++) {
                    for (let i = 0; i < DI; i++) {
                        let t1 = performance.now();
                        if (t1 - t0 < 5) {
                            doStep(i, k);
                        }
                        else {
                            breaks++;
                            await Nabu.NextFrame();
                            t0 = performance.now();
                            doStep(i, k);
                            if (breaks > 60) {
                                breaks = 0;
                                rebuildAffectedChuncks();
                            }
                        }
                    }
                }
                rebuildAffectedChuncks();
            }
        }
        this.meshInner.dispose();
        this.meshOuter.dispose();
        this.dispose();
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
        else if (page.startsWith("#miniatures")) {
            this.hideAll();
            //this.game.generateBrickMiniatures();
            this.game.generateBlockShapeMiniatures();
        }
        else if (page.startsWith("#options")) {
            this.show(this.optionPage);
        }
        else if (page.startsWith("#home") || true) {
            this.show(this.homePage);
        }
    }
}
