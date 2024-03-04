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
        this.cameraOrtho = false;
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
        this.screenRatio = this.engine.getRenderWidth() / this.engine.getRenderHeight();
        this.vertexDataLoader = new Mummu.VertexDataLoader(this.scene);
        if (this.DEBUG_MODE) {
            this.scene.clearColor = BABYLON.Color4.FromHexString("#00ff0000");
        }
        else {
            this.scene.clearColor = BABYLON.Color4.FromHexString("#272B2EFF");
        }
        let router = new Router();
        router.initialize();
        this.light = new BABYLON.HemisphericLight("light", (new BABYLON.Vector3(2, 3, -2.5)).normalize(), this.scene);
        this.skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 / Math.sqrt(3) }, this.scene);
        let skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        let skyTexture = new BABYLON.CubeTexture("./datas/skyboxes/skybox", this.scene, ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"]);
        skyboxMaterial.reflectionTexture = skyTexture;
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
        this.skybox.rotation.y = 0.16 * Math.PI;
        this.camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 4, 10, BABYLON.Vector3.Zero());
        this.camera.wheelPrecision *= 100;
        this.camera.minZ = 0.1;
        if (this.DEBUG_MODE) {
            if (window.localStorage.getItem("camera-target")) {
                let target = JSON.parse(window.localStorage.getItem("camera-target"));
                this.camera.target.x = target.x;
                this.camera.target.y = target.y;
                this.camera.target.z = target.z;
            }
            if (window.localStorage.getItem("camera-position")) {
                let positionItem = JSON.parse(window.localStorage.getItem("camera-position"));
                let position = new BABYLON.Vector3(positionItem.x, positionItem.y, positionItem.z);
                this.camera.setPosition(position);
            }
        }
        this.camera.attachControl();
        let clothMaterial = new BABYLON.StandardMaterial("cloth");
        clothMaterial.diffuseColor.copyFromFloats(1, 1, 1);
        clothMaterial.diffuseTexture = new BABYLON.Texture("./datas/textures/test_hand_cloth.png");
        clothMaterial.diffuseTexture.hasAlpha = true;
        clothMaterial.transparencyMode = 1;
        clothMaterial.useAlphaFromDiffuseTexture = true;
        clothMaterial.specularColor.copyFromFloats(0, 0, 0);
        let meshes = await BABYLON.SceneLoader.ImportMeshAsync("", "./datas/meshes/arm_4.babylon");
        let root = new BABYLON.Mesh("hand-root");
        meshes.meshes.forEach(mesh => {
            mesh.parent = root;
            if (mesh instanceof BABYLON.Mesh) {
                if (mesh.material instanceof BABYLON.MultiMaterial) {
                    mesh.material.subMaterials[1] = clothMaterial;
                }
                mesh.instances.forEach(instance => {
                    instance.parent = root;
                });
            }
        });
        root.position.y = 0;
        Kulla.ChunckVertexData.InitializeData("./datas/meshes/chunck-parts.babylon").then(async () => {
            this.terrain = new Kulla.Terrain({
                scene: this.scene,
                /*generatorProps: {
                    type: Kulla.GeneratorType.Flat,
                    altitude: 0,
                    blockType: Kulla.BlockType.Grass
                },*/
                generatorProps: {
                    type: Kulla.GeneratorType.PNG,
                    url: "./datas/textures/test_terrain.png",
                    squareSize: 1
                },
                maxDisplayedLevel: 0,
                blockSizeIJ_m: 1,
                blockSizeK_m: 1,
                chunckLengthIJ: 32,
                chunckLengthK: 128,
                chunckCountIJ: 4,
                useAnalytics: true
            });
            let mat = new TerrainMaterial("terrain", this.scene);
            this.terrain.materials = [mat];
            this.terrain.initialize();
            this.terrainEditor = new Kulla.TerrainEditor(this.terrain);
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
        });
    }
    animate() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.update();
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
            let camPos = this.camera.position;
            let camTarget = this.camera.target;
            window.localStorage.setItem("camera-position", JSON.stringify({ x: camPos.x, y: camPos.y, z: camPos.z }));
            window.localStorage.setItem("camera-target", JSON.stringify({ x: camTarget.x, y: camTarget.y, z: camTarget.z }));
        }
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
class PanelElement extends HTMLElement {
    constructor() {
        super(...arguments);
        this.x = 0;
        this.y = 0;
        this.w = 1;
        this.h = 1;
        this.computedTop = 0;
        this.computedLeft = 0;
    }
    get top() {
        return parseFloat(this.style.top);
    }
    set top(v) {
        if (this) {
            this.style.top = v.toFixed(1) + "px";
        }
    }
    get left() {
        return parseFloat(this.style.left);
    }
    set left(v) {
        if (this) {
            this.style.left = v.toFixed(1) + "px";
        }
    }
}
customElements.define("panel-element", PanelElement);
class PanelPage extends HTMLElement {
    constructor() {
        super(...arguments);
        this._loaded = false;
        this._shown = false;
        this.panels = [];
        this.xCount = 1;
        this.yCount = 1;
        this.animLineHeight = 1;
        this.animLineDir = 1;
    }
    static get observedAttributes() {
        return [
            "file",
            "anim-line-height",
            "anim-line-dir"
        ];
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
    connectedCallback() {
        let file = this.getAttribute("file");
        if (file) {
            this.attributeChangedCallback("file", "", file);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
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
                };
                xhttp.open("GET", newValue);
                xhttp.send();
            }
        }
        else if (name === "anim-line-height") {
            let v = parseInt(newValue);
            if (v > 0) {
                this.animLineHeight = v;
            }
        }
        else if (name === "anim-line-dir") {
            let v = parseInt(newValue);
            if (v === -1 || v === 1) {
                this.animLineDir = v;
                console.log("anim line dir " + this.animLineDir);
            }
        }
    }
    async show(duration = 1) {
        return new Promise(resolve => {
            if (!this._shown) {
                clearInterval(this._animateShowInterval);
                this._shown = true;
                let outOfScreenLeft = 1.0 * window.innerWidth;
                for (let i = 0; i < this.panels.length; i++) {
                    let panel = this.panels[i];
                    let targetLeft = outOfScreenLeft * this.animLineDir;
                    if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                        targetLeft = -outOfScreenLeft * this.animLineDir;
                    }
                    panel.left = targetLeft + panel.computedLeft;
                    panel.style.display = "block";
                    panel.style.opacity = "0";
                }
                let t0 = performance.now() / 1000;
                this._animateShowInterval = setInterval(() => {
                    let t = performance.now() / 1000 - t0;
                    if (t >= duration) {
                        clearInterval(this._animateShowInterval);
                        for (let i = 0; i < this.panels.length; i++) {
                            let panel = this.panels[i];
                            panel.left = panel.computedLeft;
                            panel.style.opacity = "1";
                        }
                        resolve();
                    }
                    else {
                        let f = t / duration;
                        for (let i = 0; i < this.panels.length; i++) {
                            let panel = this.panels[i];
                            let targetLeft = outOfScreenLeft * this.animLineDir;
                            if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                                targetLeft = -outOfScreenLeft * this.animLineDir;
                            }
                            panel.left = (1 - f) * targetLeft + panel.computedLeft;
                            panel.style.opacity = f.toFixed(3);
                        }
                    }
                }, 15);
            }
        });
    }
    async hide(duration = 1) {
        if (duration === 0) {
            this._shown = false;
            let outOfScreenLeft = 1.0 * window.innerWidth;
            for (let i = 0; i < this.panels.length; i++) {
                let panel = this.panels[i];
                panel.left = outOfScreenLeft + panel.computedLeft;
                panel.style.display = "none";
                panel.style.opacity = "0";
            }
        }
        else {
            return new Promise(resolve => {
                if (this._shown) {
                    clearInterval(this._animateShowInterval);
                    this._shown = false;
                    let outOfScreenLeft = 1.0 * window.innerWidth;
                    for (let i = 0; i < this.panels.length; i++) {
                        let panel = this.panels[i];
                        let targetLeft = outOfScreenLeft * this.animLineDir;
                        if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                            targetLeft = -outOfScreenLeft * this.animLineDir;
                        }
                        panel.left = targetLeft + panel.computedLeft;
                        panel.style.display = "block";
                        panel.style.opacity = "1";
                    }
                    let t0 = performance.now() / 1000;
                    this._animateShowInterval = setInterval(() => {
                        let t = performance.now() / 1000 - t0;
                        if (t >= duration) {
                            clearInterval(this._animateShowInterval);
                            for (let i = 0; i < this.panels.length; i++) {
                                let panel = this.panels[i];
                                let targetLeft = outOfScreenLeft * this.animLineDir;
                                if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                                    targetLeft = -outOfScreenLeft * this.animLineDir;
                                }
                                panel.left = targetLeft + panel.computedLeft;
                                panel.style.display = "none";
                                panel.style.opacity = "0";
                            }
                            resolve();
                        }
                        else {
                            let f = t / duration;
                            for (let i = 0; i < this.panels.length; i++) {
                                let panel = this.panels[i];
                                let targetLeft = outOfScreenLeft * this.animLineDir;
                                if (Math.floor(panel.y / this.animLineHeight) % 2 != Math.floor(this.yCount / this.animLineHeight) % 2) {
                                    targetLeft = -outOfScreenLeft * this.animLineDir;
                                }
                                panel.left = f * targetLeft + panel.computedLeft;
                                panel.style.opacity = (1 - f).toFixed(3);
                            }
                        }
                    }, 15);
                }
            });
        }
    }
    resize() {
        let requestedTileCount = 0;
        let requestedFullLines = 0;
        this.panels = [];
        let elements = this.querySelectorAll("panel-element");
        for (let i = 0; i < elements.length; i++) {
            let panel = elements[i];
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
            let bestValue = 0;
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
            let grid = [];
            for (let y = 0; y <= this.yCount; y++) {
                grid[y] = [];
                for (let x = 0; x <= this.xCount; x++) {
                    grid[y][x] = (x < this.xCount && y < this.yCount);
                }
            }
            for (let n = 0; n < this.panels.length; n++) {
                let panel = this.panels[n];
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
            let label = panel.querySelector(".label");
            if (label) {
                label.style.fontSize = (tileW / 4).toFixed(0) + "px";
            }
            let label2 = panel.querySelector(".label-2");
            if (label2) {
                label2.style.fontSize = (tileW / 7).toFixed(0) + "px";
            }
        }
    }
}
customElements.define("panel-page", PanelPage);
class Router {
    constructor() {
        this.pages = [];
        this._update = () => {
            let href = window.location.href;
            if (href != this._currentHRef) {
                this._currentHRef = href;
                this._onHRefChange();
            }
        };
        this._onHRefChange = async () => {
            let split = this._currentHRef.split("/");
            let page = split[split.length - 1];
            if (page.endsWith("#challenge")) {
                this.show(this.challengePage);
            }
            else if (page.endsWith("#home") || true) {
                this.show(this.homePage);
            }
        };
    }
    async wait(duration) {
        return new Promise(resolve => {
            setTimeout(resolve, duration * 1000);
        });
    }
    findAllPages() {
        this.pages = [];
        let mainMenus = document.querySelectorAll("panel-page");
        mainMenus.forEach(mainMenu => {
            if (mainMenu instanceof PanelPage) {
                this.pages.push(mainMenu);
            }
        });
    }
    initialize() {
        this.findAllPages();
        // Set all pages here
        this.homePage = document.getElementById("home-page");
        this.challengePage = document.getElementById("challenge-page");
        setInterval(this._update, 30);
    }
    async show(page, dontCloseOthers) {
        this.findAllPages();
        if (!dontCloseOthers) {
            for (let i = 0; i < this.pages.length; i++) {
                this.pages[i].hide(1);
            }
        }
        await page.show(1);
    }
}
