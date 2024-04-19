class PhasmController {

    public destination: BABYLON.Vector3;
    public timer: number = Infinity;
    public stop: boolean = false;

    public debug: BABYLON.Mesh;

    constructor(public phasm: Phasm) {
        this.debug = new BABYLON.Mesh("debug");
        //BABYLON.CreateSphereVertexData({ diameter: 0.1 }).applyToMesh(this.debug);
    }

    public updateExplorerDestination(): boolean {
        this.destination = this.phasm.game.player.absolutePosition;
        this.debug.position.copyFrom(this.destination);
        
        return true;
    }

    public update(): void {
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
            this.phasm.rotationSpeed = - 0.25;
        }
        else if (alphaDestination < - Math.PI / 64) {
            this.phasm.rotationSpeed = 0.25;
        }
    }
}

class Phasm extends Sumuqan.Polypode {

    public controller: PhasmController;
    public destination: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    constructor(public game: Game) {
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
            bodyWorldOffset: new BABYLON.Vector3(0, - 0.05, 0),
            antennaAnchor: new BABYLON.Vector3(0.045, 0.041, 0.065),
            antennaLength: 0.5,
            scorpionTailProps: {
                length: 7,
                dist: 0.11,
                distGeometricFactor: 0.9,
                anchor: new BABYLON.Vector3(0, 0.035, - 0.28)
            }
        });
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
                })
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
                    })
                }
            }
            console.log(this.terrain.length);
        }, 1000);

        this.controller = new PhasmController(this);

        this.debugColliderMaterial = colliderMaterial;
        this.debugColliderHitMaterial = colliderHitMaterial;

        let headCollider = new Mummu.SphereCollider(new BABYLON.Vector3(0, 0, 0.1), 0.15, this.head);
        let assCollider = new Mummu.SphereCollider(new BABYLON.Vector3(0, 0, - 0.2), 0.2, this.body);
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

    public async initialize(): Promise<void> {
        await super.initialize();
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.getScene().onBeforeRenderObservable.add(this._updateDrone);
    }

    public async instantiate(): Promise<void> {
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
        })

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

    private _updateDrone = () => {
        this.controller.update();
    }
}