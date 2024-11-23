class HumanTest extends BABYLON.Mesh {
    
    public human: Human;
    public currentSpeed: number = 0;

    public root: BABYLON.Mesh;
    public torso: BABYLON.Mesh;
    public head: BABYLON.Mesh;

    public shoulderL: BABYLON.Mesh;
    public elbowL: BABYLON.Mesh;
    public handL: BABYLON.Mesh;

    public shoulderR: BABYLON.Mesh;
    public elbowR: BABYLON.Mesh;
    public handR: BABYLON.Mesh;
    
    public hipL: BABYLON.Mesh;
    public kneeL: BABYLON.Mesh;
    public footL: BABYLON.Mesh;

    public hipR: BABYLON.Mesh;
    public kneeR: BABYLON.Mesh;
    public footR: BABYLON.Mesh;

    public rootAlt: number = 0.84;
    public legLength: number = 0.42;
    public lowerLegLength: number = 0.42;
    public armLength: number = 0.3;
    public lowerArmLength: number = 0.3;
    public handLength: number = 0.1;

    //public m16: BABYLON.Mesh;

    public targetPosition: BABYLON.Vector3;
    public targetLook: BABYLON.Vector3;

    public get engine(): BABYLON.Engine {
        return this._scene.getEngine();
    }

    constructor(public game: Game) {
        super("human");

        this.human = new Human(game);
    }

    protected _instantiated = false;
    public async instantiate(): Promise<void> {
        await this.human.instantiate();

        this.armLength = BABYLON.Vector3.Distance(this.human.armR.getAbsolutePosition(), this.human.lowerArmR.getAbsolutePosition());
        this.lowerArmLength = BABYLON.Vector3.Distance(this.human.lowerArmR.getAbsolutePosition(), this.human.handR.getAbsolutePosition());

        this.root = new BABYLON.Mesh("root");
        this.root = BABYLON.CreateBox("root", { width: 1, height: 0.05, depth: 0.05 });
        this.root.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.torso = new BABYLON.Mesh("torso");
        this.torso.rotationQuaternion = BABYLON.Quaternion.Identity();
        //this.torso.material = Main.TestRedMaterial;
        this.head = new BABYLON.Mesh("head");
        
        this.shoulderL = new BABYLON.Mesh("shoulderL");
        this.shoulderL.parent = this.torso;
        this.shoulderL.position = new BABYLON.Vector3(- 0.16, 0.24, 0);
        this.elbowL = new BABYLON.Mesh("elbowL");
        this.handL = BABYLON.MeshBuilder.CreateBox("handL", { size: 0.01 });

        this.shoulderR = new BABYLON.Mesh("shoulderR");
        this.shoulderR.parent = this.torso;
        this.shoulderR.position = new BABYLON.Vector3(0.16, 0.24, 0);
        this.elbowR = new BABYLON.Mesh("elbowR");
        this.handR = BABYLON.MeshBuilder.CreateBox("handR", { size: 0.01 });
        
        this.hipL = new BABYLON.Mesh("hipL");
        this.hipL.parent = this.root;
        this.hipL.position = new BABYLON.Vector3(- 0.13, 0, 0);
        this.kneeL = BABYLON.MeshBuilder.CreateBox("kneeL", { width: 0.4, height: 0.01, depth: 0.01 });
        this.footL = BABYLON.MeshBuilder.CreateBox("footL", { width: 0.4, height: 0.01, depth: 0.01 });

        this.hipR = new BABYLON.Mesh("hipR");
        this.hipR.parent = this.root;
        this.hipR.position = new BABYLON.Vector3(0.13, 0, 0);
        this.kneeR = BABYLON.MeshBuilder.CreateBox("kneeR", { width: 0.4, height: 0.01, depth: 0.01 });
        this.footR = BABYLON.MeshBuilder.CreateBox("footR", { width: 0.4, height: 0.01, depth: 0.01 });
        
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

        this.pointerPlane = BABYLON.MeshBuilder.CreateGround("pointer-plane", { width: 10, height: 10 });
        this.pointerPlane.visibility = 0.1;
        this.pointerPlane.rotationQuaternion = BABYLON.Quaternion.Identity();

        this._scene.onBeforeRenderObservable.add(this._update);
        this._scene.onBeforeRenderObservable.add(this._simpleWalk);

        this._scene.onPointerObservable.add(this.onPointerEvent);
    }

    public groundedFeet: Nabu.UniqueList<BABYLON.Mesh> = new Nabu.UniqueList<BABYLON.Mesh>();
    public getContactPoint(): BABYLON.Vector3 {
        let contactPoint = BABYLON.Vector3.Zero();
        let count = 0;
        this.groundedFeet.forEach(f => {
            contactPoint.addInPlace(f.position);
            count++;
        })
        if (count > 0) {
            contactPoint.scaleInPlace(1 / count);
        }
        else {
            contactPoint.copyFrom(this.root.position);
        }
        return contactPoint;
    }

    public getGravityCenter(): BABYLON.Vector3 {
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

    public targetGravityAdvance: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    private _steping: boolean = false;
    public _simpleWalk = () => {
        let dt = this.engine.getDeltaTime() / 1000;
        if (this.targetLook && BABYLON.Vector3.Distance(this.targetLook, this.position) > 4) {
            this.currentSpeed = 0.95 * this.currentSpeed + 0.05 * 0.5;
            this.position.addInPlace(this.forward.scale(this.currentSpeed * dt));
            BABYLON.Vector3.LerpToRef(this.targetGravityAdvance, this.forward.scale(0.2), 0.1, this.targetGravityAdvance);
        }
        else {
            this.currentSpeed = 0.95 * this.currentSpeed + 0.05 * 0;
            BABYLON.Vector3.LerpToRef(this.targetGravityAdvance, BABYLON.Vector3.Zero(), 0.1, this.targetGravityAdvance);
        }

        //this.m16.position = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0.05, 0.25, 0.3), this.torso.getWorldMatrix());
        /*
        this.m16.position = this.shoulderR.absolutePosition.add(this.forward.scale(0.05));
        let q = BABYLON.Quaternion.Identity();
        if (this.targetLook) {
            Mummu.QuaternionFromZYAxisToRef(this.targetLook.subtract(this.m16.position), BABYLON.Axis.Y, q);
        }
        else {
            Mummu.QuaternionFromZYAxisToRef(this.forward, BABYLON.Axis.Y, q);
        }
        this.m16.rotationQuaternion = BABYLON.Quaternion.Slerp(this.m16.rotationQuaternion, q, 0.05);
        */

        let deltaFootR = BABYLON.Vector3.Dot(this.footR.position.subtract(this.root.position), this.forward);
        this.handR.position = this.up.scale(-0.6).add(this.right.scale(0.15));
        Mummu.RotateInPlace(this.handR.position, this.right, deltaFootR * Math.PI / 3.5);
        this.handR.position.addInPlace(this.shoulderR.absolutePosition);

        let deltaFootL = BABYLON.Vector3.Dot(this.footL.position.subtract(this.root.position), this.forward);
        this.handL.position = this.up.scale(-0.6).add(this.right.scale(-0.15));
        Mummu.RotateInPlace(this.handL.position, this.right, deltaFootL * Math.PI / 3.5);
        this.handL.position.addInPlace(this.shoulderL.absolutePosition);

        Mummu.QuaternionFromYZAxisToRef(this.right, this.handR.position.subtract(this.elbowR.position), this.handR.rotationQuaternion);
        Mummu.QuaternionFromYZAxisToRef(this.right.scale(-1), this.handL.position.subtract(this.elbowL.position), this.handL.rotationQuaternion);
        //this.handR.position = this.footL.position.multiplyByFloats(1, 0, 1).add(new BABYLON.Vector3(0, 0.8, 0)).add(this.right.scale(0.4));
        //this.handL.position = this.footR.position.multiplyByFloats(1, 0, 1).add(new BABYLON.Vector3(0, 0.8, 0)).subtract(this.right.scale(0.4));
        
        if (this.targetPosition && BABYLON.Vector3.Distance(this.position, this.targetPosition) > 3) {
            let dir = this.targetPosition.subtract(this.position).normalize();
            this.position.addInPlace(dir.scale(dt * 0.8));
        }

        if (this.targetLook) {
            let dirToTarget = this.targetLook.subtract(this.position).normalize();
            let angle = Mummu.AngleFromToAround(this.forward, dirToTarget, BABYLON.Axis.Y);
            if (angle > Math.PI / 32) {
                this.rotation.y += dt * Math.PI * 0.3;
    
            }
            else if (angle < - Math.PI / 32) {
                this.rotation.y -= dt * Math.PI * 0.3;
            }
        }
        if (!this._steping) {
            let footTargetR = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0.06, 0, 0), this.getWorldMatrix());
            let rayR = new BABYLON.Ray(footTargetR.add(new BABYLON.Vector3(0, 2, 0)), new BABYLON.Vector3(0, - 1, 0));
            let hitR = this._scene.pickWithRay(rayR, (mesh) => {
                return mesh.name === "ground" || mesh.name.startsWith("chunck");
            });
            if (hitR.hit) {
                footTargetR = hitR.pickedPoint;
            }
            let footTargetL = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-0.06, 0, 0), this.getWorldMatrix());
            let rayL = new BABYLON.Ray(footTargetL.add(new BABYLON.Vector3(0, 2, 0)), new BABYLON.Vector3(0, - 1, 0));
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
                    this.step(this.footL, footTargetL, 0.98, () => {
                        this._steping = false;
                        this.groundedFeet.push(this.footL);
                    });
                }
            }
            else {
                if (dR > 0.01) {
                    this._steping = true;
                    this.groundedFeet.remove(this.footR);
                    this.step(this.footR, footTargetR, 0.98, () => {
                        this._steping = false;
                        this.groundedFeet.push(this.footR);
                    });
                }
            }
        }
    }

    private async step(foot: BABYLON.Mesh, target: BABYLON.Vector3, nearEndCallbackF: number = 0.9, nearEndCallback?: () => void): Promise<void> {
        return new Promise<void>(resolve => {
            let origin = foot.position.clone();
            let destination = target.clone();
            let dy = destination.y - origin.y;
            dy = Nabu.MinMax(dy, 0, 0.1);
            let d = BABYLON.Vector3.Distance(origin, destination);
            let h = Math.min(d, 0.2) + dy;
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
            }
            this._scene.onBeforeRenderObservable.add(animationCB);
        })
    }

    public start(): void {
        this._scene.onBeforeRenderObservable.add(this._update);
    }

    public pointerPlane: BABYLON.Mesh;
    public target: BABYLON.Mesh;

    public onPointerEvent = (eventData: BABYLON.PointerInfo, eventState: BABYLON.EventState) => {
        if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            let pick = this._scene.pick(
                this._scene.pointerX,
                this._scene.pointerY,
                (mesh) => {
                    return mesh === this.handL || mesh === this.handR || mesh === this.footL || mesh === this.footR;
                }
            )

            let pickedMesh = pick.pickedMesh;
            if (pickedMesh === this.handL) {
                this.target = this.handL;
            }
            else if (pickedMesh === this.handR) {
                this.target = this.handR;
            }
            else if (pickedMesh === this.footL) {
                this.target = this.footL;
            }
            else if (pickedMesh === this.footR) {
                this.target = this.footR;
            }

            if (this.target) {
                let d = this._scene.activeCamera.globalPosition.subtract(this.target.position);
                Mummu.QuaternionFromYZAxisToRef(pick.getNormal(), d, this.pointerPlane.rotationQuaternion);

                this.pointerPlane.position.copyFrom(this.target.position);
                this._scene.activeCamera.detachControl();
            }

            console.log("pointer down " + this.target);
        }
        else if (eventData.type === BABYLON.PointerEventTypes.POINTERMOVE) {
            if (this.target) {
                console.log(".");
                let pick = this._scene.pick(
                    this._scene.pointerX,
                    this._scene.pointerY,
                    (mesh) => {
                        return mesh === this.pointerPlane;
                    }
                )
        
                if (pick && pick.hit) {
                    this.target.position.copyFrom(pick.pickedPoint);
                }
            }
        }
        else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
            this.target = undefined;
            this._scene.activeCamera.attachControl();
        }
    }

    public onPointerMove = () => {
        
    }

    public torsoHeight: number = 0.33;
    private _timer: number = 0;
    private _update = () => {
        let dt = this.engine.getDeltaTime() / 1000;
        this._timer += dt;

        let q = BABYLON.Quaternion.Identity();

        let footCenter = this.footL.position.add(this.footR.position).scaleInPlace(0.5);
        let handCenter = this.handL.position.add(this.handR.position).scaleInPlace(0.5);
        let torsoDir = BABYLON.Vector3.Up().add(this.forward.scale(this.currentSpeed * 0.3));
        torsoDir.normalize();

        let targetRoot = footCenter.clone();
        //targetRoot.addInPlace(this.forward.scale(this.currentSpeed * 0.2))
        targetRoot.y += this.rootAlt;

        while (targetRoot.y > this.footR.position.y && BABYLON.Vector3.Distance(this.footR.position, targetRoot) > this.rootAlt * 1.05) {
            targetRoot.y -= 0.01;
        }
        while (targetRoot.y > this.footL.position.y && BABYLON.Vector3.Distance(this.footL.position, targetRoot) > this.rootAlt * 1.05) {
            targetRoot.y -= 0.01;
        }

        let f = Nabu.Easing.smooth025Sec(1 / dt);
        this.root.position.y = this.root.position.y * f + targetRoot.y * (1 - f);
        f = 0;
        this.root.position.x = this.root.position.x * f + targetRoot.x * (1 - f);
        this.root.position.z = this.root.position.z * f + targetRoot.z * (1 - f);

        this.torsoHeight = 0.25 + 0.005 * Math.cos(this._timer / 3 * 2 * Math.PI);

        // Shake that ass
        let footDir = this.footR.position.subtract(this.footL.position).normalize();
        footDir.addInPlace(this.right.scale(8)).normalize();
        //footDir = this.right;
        Mummu.QuaternionFromXYAxisToRef(footDir, torsoDir, this.root.rotationQuaternion);

        // Alpha shouldering
        let handDir = this.handR.position.subtract(this.handL.position).normalize();
        handDir.addInPlace(this.right.scale(4)).normalize();
        Mummu.QuaternionFromXYAxisToRef(handDir, torsoDir, this.torso.rotationQuaternion);

        let shoulderForward = BABYLON.Vector3.Cross(this.head.absolutePosition.subtract(this.torso.absolutePosition), handDir).normalize();
        let footForward = BABYLON.Vector3.Cross(this.torso.absolutePosition.subtract(this.root.absolutePosition), footDir).normalize();

        this.torso.position = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, this.torsoHeight, 0), this.root.getWorldMatrix());
        this.head.position = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0.33, -0.05), this.torso.getWorldMatrix());
        if (this.targetLook) {
            Mummu.QuaternionFromZYAxisToRef(this.targetLook.subtract(this.head.position), BABYLON.Axis.Y, q);
        }
        else {
            Mummu.QuaternionFromZYAxisToRef(this.forward, BABYLON.Axis.Y, q);
        }
        this.head.rotationQuaternion = q.clone().normalize();

        // Arm Left

        let wristLPosition = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, - this.handLength), this.handL.getWorldMatrix());
        this.elbowL.position.copyFrom(wristLPosition).subtractInPlace(this.forward.scale(this.lowerArmLength)).subtractInPlace(this.right.scale(this.lowerArmLength)).subtractInPlace(this.up.scale(this.lowerArmLength));

        let upperArmLZ = BABYLON.Vector3.Zero();
        let lowerArmLZ = BABYLON.Vector3.Zero();
        for (let i = 0; i < 3; i++) {
            lowerArmLZ.copyFrom(wristLPosition).subtractInPlace(this.elbowL.position).normalize().scaleInPlace(this.lowerArmLength);
            this.elbowL.position.copyFrom(wristLPosition).subtractInPlace(lowerArmLZ);

            upperArmLZ.copyFrom(this.elbowL.position).subtractInPlace(this.shoulderL.absolutePosition).normalize().scaleInPlace(this.armLength);
            this.elbowL.position.copyFrom(this.shoulderL.absolutePosition).addInPlace(upperArmLZ);
        }
        
        // Arm Right

        let wristRPosition = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, - this.handLength), this.handR.getWorldMatrix());
        this.elbowR.position.copyFrom(wristRPosition).subtractInPlace(this.forward.scale(this.lowerArmLength)).addInPlace(this.right.scale(this.lowerArmLength)).subtractInPlace(this.up.scale(this.lowerArmLength));

        let upperArmRZ = BABYLON.Vector3.Zero();
        let lowerArmRZ = BABYLON.Vector3.Zero();
        for (let i = 0; i < 3; i++) {
            lowerArmRZ.copyFrom(wristRPosition).subtractInPlace(this.elbowR.position).normalize().scaleInPlace(this.lowerArmLength);
            this.elbowR.position.copyFrom(wristRPosition).subtractInPlace(lowerArmRZ);

            upperArmRZ.copyFrom(this.elbowR.position).subtractInPlace(this.shoulderR.absolutePosition).normalize().scaleInPlace(this.armLength);
            this.elbowR.position.copyFrom(this.shoulderR.absolutePosition).addInPlace(upperArmRZ);
        }

        // Leg Left

        this.kneeL.position.copyFrom(this.hipL.absolutePosition).addInPlace(this.footL.position).scaleInPlace(0.5);
        this.kneeL.position.addInPlace(this.forward.scale(0.1)).addInPlace(this.right.scale(0));

        let upperLegLZ = BABYLON.Vector3.Zero();
        let lowerLegLZ = BABYLON.Vector3.Zero();
        for (let i = 0; i < 5; i++) {
            lowerLegLZ.copyFrom(this.footL.position).subtractInPlace(this.kneeL.position).normalize().scaleInPlace(this.lowerLegLength);
            this.kneeL.position.copyFrom(this.footL.position).subtractInPlace(lowerLegLZ);

            upperLegLZ.copyFrom(this.kneeL.position).subtractInPlace(this.hipL.absolutePosition).normalize().scaleInPlace(this.legLength);
            this.kneeL.position.copyFrom(this.hipL.absolutePosition).addInPlace(upperLegLZ);
        }
        
        // Leg Right

        this.kneeR.position.copyFrom(this.hipR.absolutePosition).addInPlace(this.footR.position).scaleInPlace(0.5);
        this.kneeR.position.addInPlace(this.forward.scale(0.1)).addInPlace(this.right.scale(0));

        let upperLegRZ = BABYLON.Vector3.Zero();
        let lowerLegRZ = BABYLON.Vector3.Zero();
        for (let i = 0; i < 5; i++) {
            lowerLegRZ.copyFrom(this.footR.position).subtractInPlace(this.kneeR.position).normalize().scaleInPlace(this.lowerLegLength);
            this.kneeR.position.copyFrom(this.footR.position).subtractInPlace(lowerLegRZ);

            upperLegRZ.copyFrom(this.kneeR.position).subtractInPlace(this.hipR.absolutePosition).normalize().scaleInPlace(this.legLength);
            this.kneeR.position.copyFrom(this.hipR.absolutePosition).addInPlace(upperLegRZ);
        }

        this.human.root.setPosition(this.root.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(this.torso.absolutePosition.subtract(this.root.absolutePosition).scale(-1), footForward, q);
        this.human.root.setRotationQuaternion(q.normalize());

        this.human.torso.setPosition(this.torso.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(this.head.absolutePosition.subtract(this.torso.absolutePosition).scale(-1), shoulderForward, q);
        this.human.torso.setRotationQuaternion(q.normalize());

        this.human.head.setPosition(this.head.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(this.head.up.scale(-1), this.head.forward.scale(-1), q);
        this.human.head.setRotationQuaternion(q.normalize());

        this.human.upperLegR.setPosition(this.hipR.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(this.kneeR.position.subtract(this.hipR.absolutePosition).scale(-1), this.forward.add(this.up), q);
        this.human.upperLegR.setRotationQuaternion(q.normalize());

        this.human.legR.setPosition(this.kneeR.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(this.footR.position.subtract(this.kneeR.absolutePosition).scale(-1), this.forward, q);
        this.human.legR.setRotationQuaternion(q.normalize());

        this.human.upperLegL.setPosition(this.hipL.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(this.kneeL.position.subtract(this.hipL.absolutePosition).scale(-1), this.forward.add(this.up), q);
        this.human.upperLegL.setRotationQuaternion(q.normalize());

        this.human.legL.setPosition(this.kneeL.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(this.footL.position.subtract(this.kneeL.absolutePosition).scale(-1), this.forward, q);
        this.human.legL.setRotationQuaternion(q.normalize());

        this.human.armR.setPosition(this.shoulderR.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(this.elbowR.position.subtract(this.shoulderR.absolutePosition).scale(-1), this.right, q);
        this.human.armR.setRotationQuaternion(q.normalize());

        this.human.lowerArmR.setPosition(this.elbowR.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(wristRPosition.subtract(this.elbowR.absolutePosition).scale(-1), this.handR.up, q);
        this.human.lowerArmR.setRotationQuaternion(q.normalize());

        this.human.handR.setPosition(wristRPosition.clone());
        this.human.handR.setRotationQuaternion(this.handR.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(- Math.PI * 0.5, 0, 0)).normalize());

        this.human.armL.setPosition(this.shoulderL.absolutePosition);
        let armLUp = this.right.scale(-1);
        Mummu.QuaternionFromYZAxisToRef(this.elbowL.position.subtract(this.shoulderL.absolutePosition).scale(-1), armLUp.add(this.handL.up), q);
        this.human.armL.setRotationQuaternion(q.normalize());

        this.human.lowerArmL.setPosition(this.elbowL.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(wristLPosition.subtract(this.elbowL.absolutePosition).scale(-1), this.handL.up, q);
        this.human.lowerArmL.setRotationQuaternion(q.normalize());

        this.human.handL.setPosition(wristLPosition.clone());
        this.human.handL.setRotationQuaternion(this.handL.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(- Math.PI * 0.5, 0, 0)).normalize());
    }
}