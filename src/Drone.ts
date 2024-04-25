class DroneController {

    public destination: BABYLON.Vector3;
    public timer: number = Infinity;
    public stop: boolean = false;

    public debug: BABYLON.Mesh;

    constructor(public drone: Drone) {
        this.debug = new BABYLON.Mesh("debug");
        //BABYLON.CreateSphereVertexData({ diameter: 0.1 }).applyToMesh(this.debug);
    }

    public updateExplorerDestination(): boolean {
        this.destination = this.drone.game.player.absolutePosition;
        this.debug.position.copyFrom(this.destination);
        
        return true;
    }

    public update(): void {
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
            this.drone.rotationSpeed = - 0.25;
        }
        else if (alphaDestination < - Math.PI / 64) {
            this.drone.rotationSpeed = 0.25;
        }
    }
}

class Drone extends Sumuqan.Polypode {

    public controller: DroneController;
    public destination: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    public static async CreateDrone(game: Game): Promise<Drone> {
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
        drone.povOffset = new BABYLON.Vector3(0, 0, - 0.1);
        drone.povAlpha = 2 * Math.PI
        drone.rightLegs[0].kneeMode = Sumuqan.KneeMode.Walker;
        drone.leftLegs[0].kneeMode = Sumuqan.KneeMode.Walker;
        drone.showPOVDebug = true;
        return drone;
    }

    constructor(public game: Game, props: Sumuqan.IPolypodeProps) {
        super("drone", props);

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
        }, 1000);

        this.controller = new DroneController(this);

        this.debugColliderMaterial = colliderMaterial;
        this.debugColliderHitMaterial = colliderHitMaterial;

        let headCollider = new Mummu.SphereCollider(new BABYLON.Vector3(0, 0, 0.1), 0.15, this.head);
        let assCollider = new Mummu.SphereCollider(new BABYLON.Vector3(0, 0, - 0.2), 0.4, this.body);
        this.bodyColliders.push(headCollider, assCollider);

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
        })

        datas[3].applyToMesh(this.body);
        datas[4].applyToMesh(this.head);

        this.body.material = droneMaterial;
        this.head.material = droneMaterial;
    }

    private _updateDrone = () => {
        this.controller.update();
    }
}