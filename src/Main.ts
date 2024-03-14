/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/nabu/nabu.d.ts"/>
/// <reference path="../lib/mummu/mummu.d.ts"/>
/// <reference path="../lib/kulla-grid/kulla-grid.d.ts"/>

import Kulla = KullaGrid;

function addLine(text: string): void {
    let e = document.createElement("div");
    e.classList.add("debug-log");
    e.innerText = text;
    document.body.appendChild(e);
}

class Game {
    
    public static Instance: Game;
    public DEBUG_MODE: boolean = true;

    public configuration: GameConfiguration;
	public canvas: HTMLCanvasElement;
	public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
    public getScene(): BABYLON.Scene {
        return this.scene;
    }
    public screenRatio: number = 1;

    //public camera: BABYLON.FreeCamera;
    public freeCamera: BABYLON.FreeCamera;
    public arcCamera: BABYLON.ArcRotateCamera;
    
    public light: BABYLON.HemisphericLight;
    public vertexDataLoader: Mummu.VertexDataLoader;

    public skybox: BABYLON.Mesh;

    public terrain: Kulla.Terrain;
    public terrainEditor: Kulla.TerrainEditor;
    public propEditor: PropEditor;

    public router: GameRouter;

    constructor(canvasElement: string) {
        Game.Instance = this;
        
		this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.msRequestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
		this.engine = new BABYLON.Engine(this.canvas, true);
		BABYLON.Engine.ShadersRepository = "./shaders/";
	}

    public async createScene(): Promise<void> {
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

        this.light = new BABYLON.HemisphericLight("light", (new BABYLON.Vector3(2, 3, - 2.5)).normalize(), this.scene);

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

        this.scene.activeCamera = this.freeCamera;
        
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

            window.addEventListener("keydown", (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    var a = document.createElement("a");
                    a.setAttribute("href", "#home");
                    a.style.display = "none";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
                if (event.code === "KeyE") {
                    let ijk = this.terrain.getChunckAndIJKAtPos(this.freeCamera.position, 0);
                    ijk.ijk.i = 0;
                    ijk.ijk.j = 0;
                    ijk.ijk.k--;
                    this.terrainEditor.doAction(ijk.chunck, ijk.ijk, {
                        brushSize: 1,
                        brushBlock: Kulla.BlockType.Rock,
                        mode: Kulla.TerrainEditionMode.Add
                    })
                }
            })
        });
	}

	public animate(): void {
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
                })
            })
		};
	}

    public async initialize(): Promise<void> {
        
    }

    public update(): void {
        let dt = this.scene.deltaTime / 1000;

        if (this.DEBUG_MODE) {
            let camPos = this.freeCamera.position;
            let camRot = this.freeCamera.rotation;
            window.localStorage.setItem("camera-position", JSON.stringify({ x: camPos.x, y: camPos.y, z: camPos.z }));
            window.localStorage.setItem("camera-rotation", JSON.stringify({ x: camRot.x, y: camRot.y, z: camRot.z }));
        }
    }

    public generateTerrainLarge(): void {
        if (this.terrain) {
            this.terrain.dispose();
        }

        this.arcCamera.detachControl();
        this.scene.activeCamera = this.freeCamera;
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

    public generateTerrainSmall(): void {
        if (this.terrain) {
            this.terrain.dispose();
        }
            
        this.freeCamera.detachControl();
        this.scene.activeCamera = this.arcCamera;
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
        prop.shapes = [new KullaGrid.RawShapeBox(3, 3, 3, - 1, - 1, 2), new KullaGrid.RawShapeBox(1, 5, 1, 0, 0, 5)];
        prop.blocks = [Kulla.BlockType.Basalt, Kulla.BlockType.Basalt];
        if (this.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
            this.terrain.chunckDataGenerator.prop = prop;
        }

        this.configuration.getElement("renderDist").forceInit();
        this.configuration.getElement("showRenderDistDebug").forceInit();

        this.terrainEditor = new Kulla.TerrainEditor(this.terrain);

        window.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "KeyQ") {
                prop.shapes.push(new KullaGrid.RawShapeBox(3, 3, 3, - 1, - 1, 10));
                prop.blocks.push(Kulla.BlockType.Regolith);

                let chuncks = [
                    this.terrain.getChunck(0, 0, 0),
                    this.terrain.getChunck(0, 1, 0),
                    this.terrain.getChunck(0, 1, 1),
                    this.terrain.getChunck(0, 0, 1)
                ]
                chuncks.forEach(chunck => {
                    chunck.reset();
                    chunck.redrawMesh(true);
                }) 
            }
        })
    }
}

window.addEventListener("DOMContentLoaded", () => {
    //addLine("Kulla Test Scene");

    let main: Game = new Game("render-canvas");
    main.createScene();
    main.initialize().then(() => {
        main.animate();
    });
});