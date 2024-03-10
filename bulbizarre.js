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
            new Nabu.ConfigurationElement("god mode", Nabu.ConfigurationElementType.Boolean, 5, {
                displayName: "God Mode"
            })
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
        this.configuration = new GameConfiguration("my-test-configuration", this);
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
        this.camera = new BABYLON.FreeCamera("camera", BABYLON.Vector3.Zero());
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
                this.camera.position = position;
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
                    squareSize: 2
                },
                maxDisplayedLevel: 0,
                blockSizeIJ_m: 1,
                blockSizeK_m: 1,
                chunckLengthIJ: 32,
                chunckLengthK: 128,
                chunckCountIJ: 8,
                useAnalytics: true
            });
            let mat = new TerrainMaterial("terrain", this.scene);
            this.terrain.materials = [mat];
            this.terrain.initialize();
            this.terrainEditor = new Kulla.TerrainEditor(this.terrain);
            let masterSeed = MasterSeed.GetFor("Paulita");
            let seededMap = SeededMap.CreateFromMasterSeed(masterSeed, 4, 512);
            let terrainMap = new TerrainMap(seededMap, 2000);
            terrainMap.downloadAsPNG(0, 0, 4);
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
        });
    }
    animate() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.update();
            this.camera.rotation.y += 0.2 * Math.PI * 0.015;
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
class MasterSeed {
    static GetFor(name) {
        let masterSeed = new Uint8ClampedArray(MasterSeed.BaseSeed);
        for (let i = 0; i < masterSeed.length; i++) {
            masterSeed[i] = masterSeed[i] ^ name.charCodeAt(i % name.length);
        }
        return masterSeed;
    }
}
MasterSeed.BaseSeed = new Uint8ClampedArray([161, 230, 19, 231, 240, 195, 189, 19, 206, 120, 135, 15, 5, 43, 129, 94, 184, 97, 143, 120, 3, 147, 12, 42, 53, 108, 200, 121, 36, 175, 175, 36, 131, 119, 196, 9, 35, 226, 215, 169, 210, 224, 198, 104, 19, 224, 186, 209, 223, 96, 94, 247, 36, 203, 87, 7, 229, 242, 118, 209, 75, 181, 82, 140, 50, 213, 202, 165, 204, 72, 159, 57, 159, 142, 228, 187, 103, 187, 68, 219, 102, 108, 149, 162, 57, 124, 214, 51, 18, 236, 184, 139, 79, 153, 42, 36, 162, 110, 90, 231, 68, 0, 202, 80, 243, 85, 157, 63, 55, 42, 169, 234, 238, 250, 203, 118, 41, 15, 198, 46, 250, 147, 195, 174, 15, 150, 162, 86, 205, 107, 185, 60, 57, 28, 144, 217, 216, 7, 74, 252, 245, 79, 31, 10, 40, 70, 113, 35, 43, 206, 116, 52, 179, 173, 220, 36, 143, 135, 114, 203, 118, 173, 107, 245, 76, 183, 242, 220, 158, 133, 157, 215, 57, 147, 70, 148, 138, 234, 47, 195, 90, 30, 29, 106, 13, 68, 123, 161, 179, 162, 46, 159, 84, 129, 168, 254, 210, 18, 74, 223, 97, 240, 234, 46, 49, 46, 164, 217, 27, 152, 157]);
class SeedMap {
    constructor(name, size) {
        this.name = name;
        this.size = size;
        this._data = new Uint8ClampedArray(this.size * this.size);
    }
    getData(i, j) {
        i = i % this.size;
        j = j % this.size;
        return this._data[i + j * this.size];
    }
    setData(i, j, v) {
        this._data[i + j * this.size] = v;
    }
    randomFill() {
        for (let i = 0; i < this._data.length; i++) {
            this._data[i] = Math.floor(Math.random() * 128 + 64);
        }
    }
    fillFromBaseSeedMap(baseSeedMap, n, IMap, JMap) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                let I = i + this.size * IMap;
                let J = j + this.size * JMap;
                this._data[i + j * this.size] = baseSeedMap[I + J * n];
            }
        }
    }
    fillFromPNG(url) {
        return new Promise(resolve => {
            let image = document.createElement("img");
            image.src = url;
            image.onload = () => {
                let canvas = document.createElement("canvas");
                this.size = Math.min(image.width, image.height);
                this._data = new Uint8ClampedArray(this.size * this.size);
                canvas.height = this.size;
                let ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0);
                let imgData = ctx.getImageData(0, 0, this.size, this.size).data;
                for (let i = 0; i < this._data.length; i++) {
                    this._data[i] = imgData[4 * i];
                }
                resolve();
            };
        });
    }
    downloadAsPNG() {
        let canvas = document.createElement("canvas");
        canvas.width = this.size;
        canvas.height = this.size;
        let context = canvas.getContext("2d");
        let pixels = new Uint8ClampedArray(this._data.length * 4);
        for (let i = 0; i < this._data.length; i++) {
            pixels[4 * i] = this._data[i];
            pixels[4 * i + 1] = this._data[i];
            pixels[4 * i + 2] = this._data[i];
            pixels[4 * i + 3] = 255;
        }
        context.putImageData(new ImageData(pixels, this.size, this.size), 0, 0);
        var a = document.createElement('a');
        a.setAttribute('href', canvas.toDataURL());
        a.setAttribute('download', this.name + ".png");
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
class SeededMap {
    constructor(N, size) {
        this.N = N;
        this.size = size;
        this.seedMaps = [];
        this.primes = [1, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    }
    static CreateFromMasterSeed(masterSeed, N, size) {
        let seededMap = new SeededMap(N, size);
        let l = (N * size);
        let L = l * l;
        let baseSeedMap = new Uint8ClampedArray(L);
        let index = 0;
        let masterSeedLength = masterSeed.length;
        let start = 0;
        while (index < L) {
            for (let i = 0; i < masterSeedLength; i++) {
                if (index < L) {
                    baseSeedMap[index] = masterSeed[(i + start) % masterSeedLength];
                }
                index++;
            }
            start++;
        }
        for (let xors = 0; xors < 4; xors++) {
            let clonedBaseSeedMap = new Uint8ClampedArray(baseSeedMap);
            for (let i = 0; i < l; i++) {
                for (let j = 0; j < l; j++) {
                    let i2 = (i + 1) % l;
                    if (i % 2 === 1) {
                        i2 = (i - 1 + l) % l;
                    }
                    baseSeedMap[i + j * l] = clonedBaseSeedMap[i2 + j * l];
                }
            }
            clonedBaseSeedMap = new Uint8ClampedArray(baseSeedMap);
            for (let i = 0; i < l; i++) {
                for (let j = 0; j < l; j++) {
                    let j2 = (j + 1) % l;
                    if (j % 2 === 1) {
                        j2 = (j - 1 + l) % l;
                    }
                    baseSeedMap[i + j * l] = clonedBaseSeedMap[i + j2 * l];
                }
            }
            for (let i = 1; i < L; i++) {
                baseSeedMap[i] = baseSeedMap[i] ^ baseSeedMap[i - 1];
            }
        }
        seededMap.seedMaps = [];
        for (let i = 0; i < seededMap.N; i++) {
            seededMap.seedMaps[i] = [];
            for (let j = 0; j < seededMap.N; j++) {
                seededMap.seedMaps[i][j] = new SeedMap("seedmap-" + i + "-" + j, seededMap.size);
                seededMap.seedMaps[i][j].fillFromBaseSeedMap(baseSeedMap, (N * size), i, j);
            }
        }
        seededMap.debugBaseSeedMap = baseSeedMap;
        /*
        let sorted = baseSeedMap.sort((a, b) => { return a - b; });
        console.log("#0 " + sorted[0]);
        for (let d = 10; d < 100; d += 10) {
            console.log("#" + d.toFixed(0) + " " + (sorted[Math.floor(d / 100 * L)] / 255 * 100).toFixed(2));
        }
        console.log("#100 " + sorted[L - 1]);
        */
        return seededMap;
    }
    static CreateWithRandomFill(N, size) {
        let seededMap = new SeededMap(N, size);
        seededMap.seedMaps = [];
        for (let i = 0; i < seededMap.N; i++) {
            seededMap.seedMaps[i] = [];
            for (let j = 0; j < seededMap.N; j++) {
                seededMap.seedMaps[i][j] = new SeedMap("seedmap-" + i + "-" + j, seededMap.size);
                seededMap.seedMaps[i][j].randomFill();
            }
        }
        return seededMap;
    }
    getValue(i, j, d) {
        i = Math.max(i, 0);
        j = Math.max(j, 0);
        let di = this.primes[(Math.floor(i / (this.size * this.N)) + d) % this.primes.length];
        let dj = this.primes[(Math.floor(j / (this.size * this.N)) + d) % this.primes.length];
        if (!isFinite(di)) {
            di = 1;
        }
        if (!isFinite(dj)) {
            dj = 1;
        }
        let IMap = (i + Math.floor(i / this.size)) % this.N;
        let JMap = (j + Math.floor(j / this.size)) % this.N;
        return this.seedMaps[IMap][JMap].getData(i * di, j * dj);
    }
    downloadAsPNG(size, d = 0) {
        let canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        let data = new Uint8ClampedArray(size * size);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                data[i + j * size] = this.getValue(i, j, d);
            }
        }
        let context = canvas.getContext("2d");
        let pixels = new Uint8ClampedArray(data.length * 4);
        for (let i = 0; i < data.length; i++) {
            let v = Math.floor(data[i] / 32) * 32;
            pixels[4 * i] = v;
            pixels[4 * i + 1] = v;
            pixels[4 * i + 2] = v;
            pixels[4 * i + 3] = 255;
        }
        context.putImageData(new ImageData(pixels, size, size), 0, 0);
        var a = document.createElement('a');
        a.setAttribute('href', canvas.toDataURL());
        a.setAttribute('download', "genMap.png");
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    downloadDebugBaseSeedAsPNG() {
        let size = (this.N * this.size);
        let canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        let context = canvas.getContext("2d");
        let pixels = new Uint8ClampedArray(this.debugBaseSeedMap.length * 4);
        for (let i = 0; i < this.debugBaseSeedMap.length; i++) {
            let v = Math.floor(this.debugBaseSeedMap[i] / 32) * 32;
            pixels[4 * i] = v;
            pixels[4 * i + 1] = v;
            pixels[4 * i + 2] = v;
            pixels[4 * i + 3] = 255;
        }
        context.putImageData(new ImageData(pixels, size, size), 0, 0);
        var a = document.createElement('a');
        a.setAttribute('href', canvas.toDataURL());
        a.setAttribute('download', "genMap.png");
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
class TerrainMap {
    constructor(seededMap, period) {
        this.seededMap = seededMap;
        this.period = period;
        let floor = Nabu.Pow2(Nabu.FloorPow2Exponent(this.period));
        let ceil = Nabu.Pow2(Nabu.CeilPow2Exponent(this.period));
        if (Math.abs(floor - this.period) <= Math.abs(ceil - this.period)) {
            this.period = floor;
        }
        else {
            this.period = ceil;
        }
        this.detailedMaps = new Map();
    }
    async getMap(IMap, JMap) {
        let line = this.detailedMaps.get(IMap);
        if (!line) {
            line = new Map();
            this.detailedMaps.set(IMap, line);
        }
        let map = line.get(JMap);
        if (!map) {
            map = await this.generateMap(IMap, JMap);
            line.set(JMap, map);
        }
        return map;
    }
    async generateMap(IMap, JMap) {
        return new Promise(async (resolve) => {
            let map = new Uint8ClampedArray(TerrainMap.MAP_SIZE * TerrainMap.MAP_SIZE);
            map.fill(0);
            // Bicubic version
            let supperpoCount = 7;
            let f = 0.5;
            let l = this.period;
            for (let c = 0; c < supperpoCount; c++) {
                if (l > TerrainMap.MAP_SIZE) {
                    let count = l / TerrainMap.MAP_SIZE;
                    let I0 = Math.floor(IMap / count);
                    let J0 = Math.floor(JMap / count);
                    let v00 = this.seededMap.getValue(I0 - 1, J0 - 1, c);
                    let v10 = this.seededMap.getValue(I0 + 0, J0 - 1, c);
                    let v20 = this.seededMap.getValue(I0 + 1, J0 - 1, c);
                    let v30 = this.seededMap.getValue(I0 + 2, J0 - 1, c);
                    let v01 = this.seededMap.getValue(I0 - 1, J0 + 0, c);
                    let v11 = this.seededMap.getValue(I0 + 0, J0 + 0, c);
                    let v21 = this.seededMap.getValue(I0 + 1, J0 + 0, c);
                    let v31 = this.seededMap.getValue(I0 + 2, J0 + 0, c);
                    let v02 = this.seededMap.getValue(I0 - 1, J0 + 1, c);
                    let v12 = this.seededMap.getValue(I0 + 0, J0 + 1, c);
                    let v22 = this.seededMap.getValue(I0 + 1, J0 + 1, c);
                    let v32 = this.seededMap.getValue(I0 + 2, J0 + 1, c);
                    let v03 = this.seededMap.getValue(I0 - 1, J0 + 2, c);
                    let v13 = this.seededMap.getValue(I0 + 0, J0 + 2, c);
                    let v23 = this.seededMap.getValue(I0 + 1, J0 + 2, c);
                    let v33 = this.seededMap.getValue(I0 + 2, J0 + 2, c);
                    let diMin = (IMap % count) / count;
                    let diMax = diMin + 1 / count;
                    let djMin = (JMap % count) / count;
                    let djMax = djMin + 1 / count;
                    let doStep = (jj) => {
                        for (let ii = 0; ii < TerrainMap.MAP_SIZE; ii++) {
                            let di = ii / TerrainMap.MAP_SIZE;
                            di = diMin * (1 - di) + diMax * di;
                            let dj = jj / TerrainMap.MAP_SIZE;
                            dj = djMin * (1 - dj) + djMax * dj;
                            map[ii + jj * TerrainMap.MAP_SIZE] += Nabu.BicubicInterpolate(di, dj, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) * f;
                        }
                    };
                    let t0 = performance.now();
                    for (let jj = 0; jj < TerrainMap.MAP_SIZE; jj++) {
                        let t1 = performance.now();
                        if (t1 - t0 < TerrainMap.MAX_FRAME_TIME_MS) {
                            doStep(jj);
                        }
                        else {
                            //console.log("break 1 at " + (t1 - t0).toFixed(3) + " ms");
                            await Nabu.NextFrame();
                            t0 = performance.now();
                            doStep(jj);
                        }
                    }
                }
                else {
                    let n = TerrainMap.MAP_SIZE / l;
                    let iOffset = IMap * n;
                    let jOffset = JMap * n;
                    let doStep = (j) => {
                        let v00 = this.seededMap.getValue(iOffset - 1, jOffset + j - 1, c);
                        let v10 = this.seededMap.getValue(iOffset + 0, jOffset + j - 1, c);
                        let v20 = this.seededMap.getValue(iOffset + 1, jOffset + j - 1, c);
                        let v30 = this.seededMap.getValue(iOffset + 2, jOffset + j - 1, c);
                        let v01 = this.seededMap.getValue(iOffset - 1, jOffset + j + 0, c);
                        let v11 = this.seededMap.getValue(iOffset + 0, jOffset + j + 0, c);
                        let v21 = this.seededMap.getValue(iOffset + 1, jOffset + j + 0, c);
                        let v31 = this.seededMap.getValue(iOffset + 2, jOffset + j + 0, c);
                        let v02 = this.seededMap.getValue(iOffset - 1, jOffset + j + 1, c);
                        let v12 = this.seededMap.getValue(iOffset + 0, jOffset + j + 1, c);
                        let v22 = this.seededMap.getValue(iOffset + 1, jOffset + j + 1, c);
                        let v32 = this.seededMap.getValue(iOffset + 2, jOffset + j + 1, c);
                        let v03 = this.seededMap.getValue(iOffset - 1, jOffset + j + 2, c);
                        let v13 = this.seededMap.getValue(iOffset + 0, jOffset + j + 2, c);
                        let v23 = this.seededMap.getValue(iOffset + 1, jOffset + j + 2, c);
                        let v33 = this.seededMap.getValue(iOffset + 2, jOffset + j + 2, c);
                        for (let i = 0; i < n; i++) {
                            for (let ii = 0; ii < l; ii++) {
                                for (let jj = 0; jj < l; jj++) {
                                    let di = ii / l;
                                    let dj = jj / l;
                                    map[i * l + ii + (j * l + jj) * TerrainMap.MAP_SIZE] += Nabu.BicubicInterpolate(di, dj, v00, v10, v20, v30, v01, v11, v21, v31, v02, v12, v22, v32, v03, v13, v23, v33) * f;
                                }
                            }
                            if (i < n - 1) {
                                v00 = v10;
                                v10 = v20;
                                v20 = v30;
                                v30 = this.seededMap.getValue(iOffset + i + 1 + 2, jOffset + j - 1, c);
                                v01 = v11;
                                v11 = v21;
                                v21 = v31;
                                v31 = this.seededMap.getValue(iOffset + i + 1 + 2, jOffset + j + 0, c);
                                v02 = v12;
                                v12 = v22;
                                v22 = v32;
                                v32 = this.seededMap.getValue(iOffset + i + 1 + 2, jOffset + j + 1, c);
                                v03 = v13;
                                v13 = v23;
                                v23 = v33;
                                v33 = this.seededMap.getValue(iOffset + i + 1 + 2, jOffset + j + 2, c);
                            }
                        }
                    };
                    let t0 = performance.now();
                    for (let j = 0; j < n; j++) {
                        let t1 = performance.now();
                        if (t1 - t0 < TerrainMap.MAX_FRAME_TIME_MS) {
                            doStep(j);
                        }
                        else {
                            //console.log("break 2 at " + (t1 - t0).toFixed(3) + " ms");
                            await Nabu.NextFrame();
                            t0 = performance.now();
                            doStep(j);
                        }
                    }
                }
                l = l / 2;
                f = f / 2;
                await Nabu.NextFrame();
            }
            resolve(map);
        });
    }
    async downloadAsPNG(IMap, JMap, size = 1) {
        let canvas = document.createElement("canvas");
        canvas.width = TerrainMap.MAP_SIZE * size;
        canvas.height = TerrainMap.MAP_SIZE * size;
        let context = canvas.getContext("2d");
        for (let J = 0; J < size; J++) {
            for (let I = 0; I < size; I++) {
                let data = await this.getMap(IMap + I, JMap + J);
                let pixels = new Uint8ClampedArray(data.length * 4);
                for (let i = 0; i < data.length; i++) {
                    let v = data[i];
                    pixels[4 * i] = v;
                    pixels[4 * i + 1] = v;
                    pixels[4 * i + 2] = v;
                    pixels[4 * i + 3] = 255;
                }
                context.putImageData(new ImageData(pixels, TerrainMap.MAP_SIZE, TerrainMap.MAP_SIZE), I * TerrainMap.MAP_SIZE, J * TerrainMap.MAP_SIZE);
            }
        }
        var a = document.createElement("a");
        a.setAttribute("href", canvas.toDataURL());
        a.setAttribute("download", "terrainMap_" + IMap + "_" + JMap + ".png");
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
TerrainMap.MAX_FRAME_TIME_MS = 15;
TerrainMap.MAP_SIZE = 1024;
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
