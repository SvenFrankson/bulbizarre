class HumanBody extends BABYLON.Mesh {
    
    public root: BABYLON.Bone;
    public head: BABYLON.Bone;
    public torso: BABYLON.Bone;

    public upperLegL: BABYLON.Bone;
    public lowerLegL: BABYLON.Bone;
    public footL: BABYLON.Bone;
    public upperLegR: BABYLON.Bone;
    public lowerLegR: BABYLON.Bone;
    public footR: BABYLON.Bone;

    public upperArmL: BABYLON.Bone;
    public lowerArmL: BABYLON.Bone;
    public handL: BABYLON.Bone;
    public thumbL: BABYLON.Bone;
    public upperArmR: BABYLON.Bone;
    public lowerArmR: BABYLON.Bone;
    public handR: BABYLON.Bone;
    public thumbR: BABYLON.Bone;

    public mesh: BABYLON.Mesh;

    public rootAlt: number = 0.8;
    public rootLength: number = 0.4;
    public torsoLength: number = 0.4;
    public hipPos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public upperLegLength: number = 0.4;
    public lowerLegLength: number = 0.4;
    public shoulderPos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public upperArmLength: number = 0.4;
    public lowerArmLength: number = 0.4;
    public handLength: number = 0.15;
    public totalArmLength: number = 0.95;

    public get game(): Game {
        return this.human.game;
    }
    
    public get engine(): BABYLON.Engine {
        return this._scene.getEngine();
    }

    constructor(public human: Human) {
        super("human");
    }

    protected _instantiated = false;
    public async instantiate(): Promise<void> {
        return new Promise<void>(resolve => {
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
                    })
                    console.log(this.root);
                });

                this._instantiated = true;
                resolve();
            });
        });
    }

    private _update = () => {
        
    }
}