class HumanBody extends BABYLON.Mesh {
    
    public root: BABYLON.Bone;
    public head: BABYLON.Bone;
    public torso: BABYLON.Bone;

    public upperLegL: BABYLON.Bone;
    public legL: BABYLON.Bone;
    public upperLegR: BABYLON.Bone;
    public legR: BABYLON.Bone;

    public armL: BABYLON.Bone;
    public lowerArmL: BABYLON.Bone;
    public handL: BABYLON.Bone;
    public thumbL: BABYLON.Bone;
    public armR: BABYLON.Bone;
    public lowerArmR: BABYLON.Bone;
    public handR: BABYLON.Bone;
    public thumbR: BABYLON.Bone;

    public rootAlt: number = 0.3;
    public hipLPosition: BABYLON.Vector3;
    public footTargetL: BABYLON.Mesh;
    public footTargetR: BABYLON.Mesh;
    public kneeL: BABYLON.Mesh;
    public kneeR: BABYLON.Mesh;
    public handTargetL: BABYLON.Mesh;
    public handTargetR: BABYLON.Mesh;

    public mesh: BABYLON.Mesh;

    public get game(): Game {
        return this.human.game;
    }
    
    public get engine(): BABYLON.Engine {
        return this._scene.getEngine();
    }

    constructor(public human: Human) {
        super("human");
        this.footTargetL = new BABYLON.Mesh("footTargetL");
        BABYLON.CreateBoxVertexData({ size: 0.2 }).applyToMesh(this.footTargetL);
        this.footTargetR = new BABYLON.Mesh("footTargetR");

        this.kneeL = new BABYLON.Mesh("kneeL");
        BABYLON.CreateBoxVertexData({ size: 0.2 }).applyToMesh(this.kneeL);
        this.kneeR = new BABYLON.Mesh("kneeR");

        this.handTargetL = new BABYLON.Mesh("handTargetL");
        this.handTargetR = new BABYLON.Mesh("handTargetR");
    }

    protected _instantiated = false;
    public async instantiate(): Promise<void> {
        return new Promise<void>(resolve => {
            BABYLON.SceneLoader.ImportMesh("", "datas/meshes/riflewoman.babylon", "", this._scene, (meshes, particlesSystems, skeletons) => {
                meshes.forEach(mesh => {
                    if (mesh instanceof BABYLON.Mesh) {
                        this.mesh = mesh;
                        this.mesh.alwaysSelectAsActiveMesh = true;
                        
                        let material = mesh.material;
                        if (material instanceof BABYLON.MultiMaterial) {
                            for (let i = 0; i < material.subMaterials.length; i++) {
                                let subMat = material.subMaterials[i];
                                if (subMat instanceof BABYLON.PBRMaterial) {
                                    /*
                                    let toonMat = new ToonMaterial(subMat.name + "-3-toon", this.scene);
                                    toonMat.setDiffuseColor(subMat.albedoColor);
                                    material.subMaterials[i] = toonMat;
                                    */
                                }
                            }
                        }
                        else if (material instanceof BABYLON.PBRMaterial) {
                            /*
                            let toonMat = new ToonMaterial(material.name + "-3-toon", this.scene);
                            toonMat.setDiffuseColor(material.albedoColor);
                            mesh.material = toonMat;
                            */
                        }
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
                    
                    this.legL = skeleton.bones.find(bone => { return bone.name === "leg-left"; });
                    this.legR = skeleton.bones.find(bone => { return bone.name === "leg-right"; });
                    
                    this.armL = skeleton.bones.find(bone => { return bone.name === "upper-arm-left"; });
                    this.armR = skeleton.bones.find(bone => { return bone.name === "upper-arm-right"; });
                    
                    this.lowerArmL = skeleton.bones.find(bone => { return bone.name === "lower-arm-left"; });
                    this.lowerArmR = skeleton.bones.find(bone => { return bone.name === "lower-arm-right"; });
                    
                    this.handL = skeleton.bones.find(bone => { return bone.name === "hand-left"; });
                    this.handR = skeleton.bones.find(bone => { return bone.name === "hand-right"; });
                    
                    this.thumbL = skeleton.bones.find(bone => { return bone.name === "thumb-left"; });
                    this.thumbR = skeleton.bones.find(bone => { return bone.name === "thumb-right"; });

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