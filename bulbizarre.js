class GameConfiguration extends Nabu.Configuration {
    _buildElementsArray() {
        this.configurationElements = [
            new Nabu.ConfigurationElement("quality", Nabu.ConfigurationElementType.Enum, 0),
            new Nabu.ConfigurationElement("renderDist", Nabu.ConfigurationElementType.Number, 5)
        ];
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
        this.configuration = new GameConfiguration("my-test-configuration");
        this.configuration.initialize();
        this.configuration.saveToLocalStorage();
        this.screenRatio = this.engine.getRenderWidth() / this.engine.getRenderHeight();
        this.vertexDataLoader = new Mummu.VertexDataLoader(this.scene);
        if (this.DEBUG_MODE) {
            this.scene.clearColor = BABYLON.Color4.FromHexString("#00ff0000");
        }
        else {
            this.scene.clearColor = BABYLON.Color4.FromHexString("#272B2EFF");
        }
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
        this.router = new GameRouter(this);
        this.router.initialize();
        this.router.optionPage.setConfiguration(this.configuration);
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
class GameRouter extends Nabu.Router {
    constructor(game) {
        super();
        this.game = game;
    }
    onFindAllPages() {
        this.homePage = document.getElementById("home-page");
        this.optionPage = document.getElementById("option-page");
    }
    onUpdate() {
    }
    async onHRefChange(page) {
        if (page.startsWith("#options")) {
            this.show(this.optionPage);
        }
        else if (page.startsWith("#home") || true) {
            this.show(this.homePage);
        }
    }
}
