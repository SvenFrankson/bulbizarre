/// <reference path="../lib/babylon.d.ts"/>
/// <reference path="../lib/nabu/nabu.d.ts"/>
/// <reference path="../lib/mummu/mummu.d.ts"/>
/// <reference path="../lib/sumuqan/sumuqan.d.ts"/>
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
    public inputManager: Nabu.InputManager;

    //public camera: BABYLON.FreeCamera;
    public freeCamera: BABYLON.FreeCamera;
    public arcCamera: BABYLON.ArcRotateCamera;
    public orthoCamera: BABYLON.ArcRotateCamera;
    public uiCamera: BABYLON.FreeCamera;
    /*
    public shadowCamera: BABYLON.ArcRotateCamera;
    public shadowTexture: BABYLON.RenderTargetTexture;
    */
    
    public light: BABYLON.HemisphericLight;
    public vertexDataLoader: Mummu.VertexDataLoader;

    public skybox: BABYLON.Mesh;

    public terrain: Kulla.Terrain;
    public terrainEditor: Kulla.TerrainEditor;
    public brickManager: BrickManager;
    public propEditor: PropEditor;
    public player: Player;
    public playerActionView: PlayerActionView;
    public playerInventoryView: PlayerInventoryView;
    public brickMenuView: BrickMenuView;
    public voxelizerMenuView: VoxelizerMenuView;

    public router: GameRouter;

    constructor(canvasElement: string) {
        Game.Instance = this;
        
		this.canvas = document.getElementById(canvasElement) as unknown as HTMLCanvasElement;
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.msRequestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
		this.engine = new BABYLON.Engine(this.canvas, true);
		BABYLON.Engine.ShadersRepository = "./shaders/";
	}

    public async createScene(): Promise<void> {
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

        this.light = new BABYLON.HemisphericLight("light", (new BABYLON.Vector3(1, 3, - 2)).normalize(), this.scene);

        this.skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1500 }, this.scene);
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
        this.playerInventoryView = document.getElementsByTagName("inventory-page")[0] as PlayerInventoryView;
        this.brickMenuView = document.getElementsByTagName("brick-menu")[0] as BrickMenuView;
        this.voxelizerMenuView = document.getElementsByTagName("voxelizer-menu")[0] as VoxelizerMenuView;

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
            
            window.addEventListener("keydown", (event: KeyboardEvent) => {
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

    public generateTerrainLarge(): void {
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

    public generateTerrainBrick(): void {

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
                }
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
        this.terrain.customChunckMaterialSet = (chunck: Kulla.Chunck) => {
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
            })
        }

        this.configuration.getElement("renderDist").forceInit();
        this.configuration.getElement("showRenderDistDebug").forceInit();

    }

    public generateTerrainSmall(): void {
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
        prop.shapes = [new KullaGrid.RawShapeBox(3, 3, 3, - 1, - 1, 2), new KullaGrid.RawShapeBox(1, 5, 1, 0, 0, 5)];
        prop.blocks = [Kulla.BlockType.Basalt, Kulla.BlockType.Basalt];
        if (this.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
            this.terrain.chunckDataGenerator.prop = prop;
        }

        this.configuration.getElement("renderDist").forceInit();
        this.configuration.getElement("showRenderDistDebug").forceInit();

        this.terrainEditor = new Kulla.TerrainEditor(this.terrain);
    }

    public generateBrickMiniatures(): void {
        if (this.terrain) {
            this.terrain.dispose();
        }
    
        this.light.direction = (new BABYLON.Vector3(3, 1, - 2)).normalize();

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
            ]
            bricks = BRICK_LIST;
            let ground = Mummu.CreateQuad("ground", {
                p1: new BABYLON.Vector3(- 100 * BRICK_S, 0, - 100 * BRICK_S),
                p2: new BABYLON.Vector3(100 * BRICK_S, 0, - 100 * BRICK_S),
                p3: new BABYLON.Vector3(100 * BRICK_S, 0, 100 * BRICK_S),
                p4: new BABYLON.Vector3(- 100 * BRICK_S, 0, 100 * BRICK_S),
                uvInWorldSpace: true,
                uvSize: 4 * BRICK_S
            })
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
            }
            doMinis();
        })
    }
    
    public async makeScreenshot(brickName: string, debugNoDelete: boolean = false): Promise<void> {
        this.scene.clearColor = BABYLON.Color4.FromHexString("#272B2EFF");
        
        return new Promise<void>(resolve => {
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
                this.orthoCamera.alpha = - Math.PI / 6;
                this.orthoCamera.beta = Math.PI / 3;

                let hAngle = Math.PI * 0.5 + this.orthoCamera.alpha;
                let vAngle = Math.PI * 0.5 - this.orthoCamera.beta;
                let halfCamMinW = d * 0.5 * Math.sin(hAngle) + w * 0.5 * Math.cos(hAngle);
                let halfCamMinH = h * 0.5 * Math.cos(vAngle) + d * 0.5 * Math.cos(hAngle) * Math.sin(vAngle) + w * 0.5 * Math.sin(hAngle) * Math.sin(vAngle);

                let f = 1.1;
                if (halfCamMinW >= halfCamMinH) {
                    this.orthoCamera.orthoTop = halfCamMinW * f;
                    this.orthoCamera.orthoBottom = - halfCamMinW * f;
                    this.orthoCamera.orthoLeft = - halfCamMinW * f;
                    this.orthoCamera.orthoRight = halfCamMinW * f;
                }
                else {
                    this.orthoCamera.orthoTop = halfCamMinH * f;
                    this.orthoCamera.orthoBottom = - halfCamMinH * f;
                    this.orthoCamera.orthoLeft = - halfCamMinH * f;
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

    public generateBlockShapeMiniatures(): void {
        if (this.terrain) {
            this.terrain.dispose();
        }
    
        this.light.direction = (new BABYLON.Vector3(3, 1, - 2)).normalize();

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
        })
    }

    public async makeShapeScreenshot(shapeName: string, size: number, debugNoDelete: boolean = false): Promise<void> {
        this.scene.clearColor.copyFromFloats(0, 0, 0, 0);
        
        return new Promise<void>(resolve => {
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
                let bboxMin = new BABYLON.Vector3(- 0.5, - 0.5, - 0.5);

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
                this.orthoCamera.alpha = - Math.PI / 6;
                this.orthoCamera.beta = Math.PI / 3;

                let hAngle = Math.PI * 0.5 + this.orthoCamera.alpha;
                let vAngle = Math.PI * 0.5 - this.orthoCamera.beta;
                let halfCamMinW = d * 0.5 * Math.sin(hAngle) + w * 0.5 * Math.cos(hAngle);
                let halfCamMinH = h * 0.5 * Math.cos(vAngle) + d * 0.5 * Math.cos(hAngle) * Math.sin(vAngle) + w * 0.5 * Math.sin(hAngle) * Math.sin(vAngle);

                let f = 1.1;
                if (halfCamMinW >= halfCamMinH) {
                    this.orthoCamera.orthoTop = halfCamMinW * f;
                    this.orthoCamera.orthoBottom = - halfCamMinW * f;
                    this.orthoCamera.orthoLeft = - halfCamMinW * f;
                    this.orthoCamera.orthoRight = halfCamMinW * f;
                }
                else {
                    this.orthoCamera.orthoTop = halfCamMinH * f;
                    this.orthoCamera.orthoBottom = - halfCamMinH * f;
                    this.orthoCamera.orthoLeft = - halfCamMinH * f;
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

    let main: Game = new Game("render-canvas");
    main.createScene();
    main.initialize().then(() => {
        main.animate();
    });
});