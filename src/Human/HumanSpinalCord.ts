enum HandMode {
    None,
    Show,
    Look
}

class HumanSpinalCord extends BABYLON.Mesh {
    
    public currentSpeed: number = 0;
    public currentRotSpeed: number = 0;
    public handMode: HandMode = HandMode.None;

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

    //public m16: BABYLON.Mesh;

    public targetPosition: BABYLON.Vector3;
    public targetLook: BABYLON.Vector3;

    public get game(): Game {
        return this.human.game;
    }
    public get engine(): BABYLON.Engine {
        return this.game.engine;
    }
    public get humanBody(): HumanBody {
        return this.human.body;
    }

    constructor(public human: Human) {
        super("human");

        BABYLON.CreateBoxVertexData({ width: 0.01, height: 3, depth: 0.01 }).applyToMesh(this);
    }

    protected _instantiated = false;
    public async instantiate(): Promise<void> {

        this.root = new BABYLON.Mesh("root");
        this.root = BABYLON.CreateBox("root", { width: 1, height: 0.02, depth: 0.02 });
        this.root.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.torso = new BABYLON.Mesh("torso");
        this.torso.rotationQuaternion = BABYLON.Quaternion.Identity();
        //this.torso.material = Main.TestRedMaterial;
        this.head = new BABYLON.Mesh("head");
        this.head.rotationQuaternion = BABYLON.Quaternion.Identity();
        
        this.shoulderL = Mummu.DrawDebugPoint(BABYLON.Vector3.Zero(), Infinity, BABYLON.Color3.Red(), 0.4);
        this.shoulderL.parent = this.torso;
        this.shoulderL.position = this.humanBody.shoulderPos.multiplyByFloats(-1, 1, 1);
        this.elbowL = new BABYLON.Mesh("elbowL");
        this.handL = BABYLON.MeshBuilder.CreateBox("handL", { size: 0.01 });

        this.shoulderR = Mummu.DrawDebugPoint(BABYLON.Vector3.Zero(), Infinity, BABYLON.Color3.Green(), 0.4);
        this.shoulderR.parent = this.torso;
        this.shoulderR.position = this.humanBody.shoulderPos.multiplyByFloats(1, 1, 1);
        this.elbowR = new BABYLON.Mesh("elbowR");
        this.handR = BABYLON.MeshBuilder.CreateBox("handR", { size: 0.01 });
        
        this.hipL = new BABYLON.Mesh("hipL");
        this.hipL.parent = this.root;
        this.hipL.position = this.humanBody.hipPos.multiplyByFloats(-1, 1, 1);
        this.kneeL = BABYLON.MeshBuilder.CreateBox("kneeL", { width: 0.01, height: 0.01, depth: 0.01 });
        this.footL = BABYLON.MeshBuilder.CreateBox("footL", { width: 0.01, height: 0.01, depth: 0.01 });

        this.hipR = new BABYLON.Mesh("hipR");
        this.hipR.parent = this.root;
        this.hipR.position = this.humanBody.hipPos.multiplyByFloats(1, 1, 1);
        this.kneeR = BABYLON.MeshBuilder.CreateBox("kneeR", { width: 0.01, height: 0.01, depth: 0.01 });
        this.footR = BABYLON.MeshBuilder.CreateBox("footR", { width: 0.01, height: 0.01, depth: 0.01 });
        
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

        this._scene.onBeforeRenderObservable.add(this._update);
        this._scene.onBeforeRenderObservable.add(this.walkingUpdate);
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

    public stepHandToP(hand: BABYLON.Mesh, shoulder: BABYLON.Mesh, p: BABYLON.Vector3): void {
        let dt = this.engine.getDeltaTime() / 1000;

        Mummu.StepToRef(hand.position, p, 2 * dt, hand.position);
        let pouet = shoulder.absolutePosition.subtract(shoulder.forward.scale(0.3));
        if (BABYLON.Vector3.Distance(hand.position, pouet) < 0.6) {
            Mummu.ForceDistanceFromOriginInPlace(hand.position, pouet, 0.6);
        }
    }

    public stepHandToP3(hand: BABYLON.Mesh, shoulder: BABYLON.Mesh, p: BABYLON.Vector3): void {
        let dt = this.engine.getDeltaTime() / 1000;

        let exterior = shoulder.right.clone();
        if (hand === this.handL) {
            exterior.scaleInPlace(-1);
        }

        let currentHandP = hand.position.subtract(shoulder.absolutePosition);
        let targetHandP = p.subtract(shoulder.absolutePosition);
        let currentHandDist = currentHandP.length();
        if (currentHandDist > (this.humanBody.totalArmLength)) {
            currentHandDist = this.humanBody.totalArmLength;
        }
        let targetHandDist = targetHandP.length();

        let axis = exterior;
        let angle = Mummu.Angle(currentHandP, targetHandP);
        if (angle > 0 && angle < Math.PI) {
            axis = BABYLON.Vector3.Cross(currentHandP, targetHandP);
            if (BABYLON.Vector3.Dot(axis, exterior) < 0) {
                axis.scaleInPlace(-1);
            }
            angle = Mummu.AngleFromToAround(currentHandP, targetHandP, axis);
        }
        angle = Nabu.Step(0, angle, Math.PI * dt);

        hand.position.copyFrom(currentHandP);
        hand.position.normalize().scaleInPlace(Nabu.Step(currentHandDist, targetHandDist, 1 * dt));
        Mummu.RotateInPlace(hand.position, axis, angle);
        hand.position.addInPlace(shoulder.absolutePosition);
    }

    public stepHandToP2(hand: BABYLON.Mesh, shoulder: BABYLON.Mesh, p: BABYLON.Vector3): void {
        let dt = this.engine.getDeltaTime() / 1000;

        let currentHandP = hand.position.subtract(shoulder.absolutePosition);
        let currentHandDist = currentHandP.length();
        if (currentHandDist > (this.humanBody.totalArmLength)) {
            currentHandDist = this.humanBody.totalArmLength;
        }
        let currentHandAlpha = Mummu.AngleFromToAround(shoulder.forward, currentHandP, shoulder.right);
        let currentHandBeta = Mummu.AngleFromToAround(shoulder.forward, Mummu.Rotate(currentHandP, shoulder.right, -currentHandAlpha), shoulder.up);
        if (currentHandBeta < - Math.PI * 0.5) {
            currentHandBeta += Math.PI;
        }
        if (currentHandBeta > Math.PI * 0.5) {
            currentHandBeta -= Math.PI;
        }

        Mummu.DrawDebugPoint(p, 1, BABYLON.Color3.Blue(), 0.3);

        let targetHandP = p.subtract(shoulder.absolutePosition);
        let targetHandDist = targetHandP.length();
        let targetHandAlpha = Mummu.AngleFromToAround(shoulder.forward, targetHandP, shoulder.right);
        let targetHandBeta = Mummu.AngleFromToAround(shoulder.forward, Mummu.Rotate(targetHandP, shoulder.right, -currentHandAlpha), shoulder.up);
        if (targetHandBeta < - Math.PI * 0.5) {
            targetHandBeta += Math.PI;
        }
        if (targetHandBeta > Math.PI * 0.5) {
            targetHandBeta -= Math.PI;
        }

        targetHandDist = Nabu.Step(currentHandDist, targetHandDist, 1 * dt);
        targetHandAlpha = Nabu.Step(currentHandAlpha, targetHandAlpha, Math.PI * dt);
        targetHandBeta = Nabu.Step(currentHandBeta, targetHandBeta, Math.PI * dt);

        hand.position.copyFrom(shoulder.forward).scaleInPlace(targetHandDist);
        Mummu.RotateInPlace(hand.position, shoulder.up, targetHandBeta);
        Mummu.RotateInPlace(hand.position, shoulder.right, targetHandAlpha);
        hand.position.addInPlace(shoulder.absolutePosition);
    }

    private _steping: boolean = false;
    public walkingUpdate = () => {
        let dt = this.engine.getDeltaTime() / 1000;

        let deltaFootR = BABYLON.Vector3.Dot(this.footR.position.subtract(this.root.position), this.forward);
        let deltaFootL = BABYLON.Vector3.Dot(this.footL.position.subtract(this.root.position), this.forward);
        if (this.handMode === HandMode.None) {
            let p = this.up.scale(-1).add(this.right.scale(0.2));
            p.normalize().scaleInPlace(this.humanBody.totalArmLength);
            Mummu.RotateInPlace(p, this.right, deltaFootR * Math.PI / 2.7);
            p.addInPlace(this.shoulderR.absolutePosition);
            
            this.stepHandToP(this.handR, this.shoulderR, p);

            Mummu.QuaternionFromYZAxisToRef(this.right, this.handR.position.subtract(this.elbowR.position), this.handR.rotationQuaternion);
        }
        else if (this.handMode === HandMode.Look) {
            let p = this.head.absolutePosition.add(this.head.forward.scale(0.2)).add(this.head.up.scale(0.27));

            this.stepHandToP(this.handR, this.shoulderR, p);

            Mummu.QuaternionFromYZAxisToRef(this.head.up.add(this.right.scale(0.2)), this.handR.position.subtract(this.elbowR.position), this.handR.rotationQuaternion);
        }

        let p = this.up.scale(-1).add(this.right.scale(-0.2));
        p.normalize().scaleInPlace(this.humanBody.totalArmLength);
        Mummu.RotateInPlace(p, this.right, deltaFootL * Math.PI / 2.7);
        p.addInPlace(this.shoulderL.absolutePosition);
        
        this.stepHandToP(this.handL, this.shoulderL, p);

        Mummu.QuaternionFromYZAxisToRef(this.right.scale(-1), this.handL.position.subtract(this.elbowL.position), this.handL.rotationQuaternion);
        
        if (this.targetPosition) {
            let dirToTarget = this.targetPosition.subtract(this.position).normalize();
            let angleToTargetPosition = Mummu.AngleFromToAround(this.forward, dirToTarget, BABYLON.Axis.Y);
            if (angleToTargetPosition > Math.PI / 32) {
                this.currentRotSpeed = 0.5 * this.currentRotSpeed + 0.5 * Math.PI;
                this.rotation.y += dt * this.currentRotSpeed;
    
            }
            else if (angleToTargetPosition < - Math.PI / 32) {
                this.currentRotSpeed = 0.5 * this.currentRotSpeed - 0.5 * Math.PI;
                this.rotation.y += dt * this.currentRotSpeed;
            }
            else {
                this.currentRotSpeed = 0.5 * this.currentRotSpeed;
            }

            let targetSpeed = 1.1 * (1 - Math.abs(angleToTargetPosition / Math.PI));
            if (BABYLON.Vector3.Distance(this.targetPosition, this.position) > 0) {
                this.currentSpeed = 0.95 * this.currentSpeed + 0.05 * targetSpeed;
                this.position.addInPlace(this.forward.scale(this.currentSpeed * dt));
                BABYLON.Vector3.LerpToRef(this.targetGravityAdvance, this.forward.scale(0.2), 0.1, this.targetGravityAdvance);
            }
        }
        else {
            this.currentRotSpeed = 0.5 * this.currentRotSpeed;
            this.currentSpeed = 0.95 * this.currentSpeed;
            BABYLON.Vector3.LerpToRef(this.targetGravityAdvance, BABYLON.Vector3.Zero(), 0.1, this.targetGravityAdvance);
        }

        if (!this._steping) {
            let footTargetR = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0.06 + 0.05 * Math.abs(this.currentRotSpeed), 0, 0), this.getWorldMatrix());
            let rayR = new BABYLON.Ray(footTargetR.add(new BABYLON.Vector3(0, 2, 0)), new BABYLON.Vector3(0, - 1, 0));
            let hitR = this._scene.pickWithRay(rayR, (mesh) => {
                return mesh.name === "ground" || mesh.name.startsWith("chunck");
            });
            if (hitR.hit) {
                footTargetR = hitR.pickedPoint;
            }
            let footTargetL = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-0.06 - 0.05 * Math.abs(this.currentRotSpeed), 0, 0), this.getWorldMatrix());
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
                    Mummu.DrawDebugPoint(footTargetL, 60, BABYLON.Color3.Red(), 0.5);
                    this.step(this.footL, footTargetL, 1, () => {
                        this._steping = false;
                        this.groundedFeet.push(this.footL);
                    });
                }
            }
            else {
                if (dR > 0.01) {
                    this._steping = true;
                    this.groundedFeet.remove(this.footR);
                    Mummu.DrawDebugPoint(footTargetL, 60, BABYLON.Color3.Red(), 0.5);
                    this.step(this.footR, footTargetR, 1, () => {
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
            let dy = Math.abs(destination.y - origin.y);
            dy = Math.min(dy, 0.15);
            let d = BABYLON.Vector3.Distance(origin, destination);
            let h = Math.min(d, 0.1) + dy;
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

    private _timer: number = 0;
    private _update = () => {
        let dt = this.engine.getDeltaTime() / 1000;
        this._timer += dt;

        let q = BABYLON.Quaternion.Identity();

        let footCenter = this.footL.position.add(this.footR.position).scaleInPlace(0.5);
        let torsoDir = this.up.add(this.head.up).add(this.forward.scale(this.currentSpeed * 0.1)).subtract(this.forward.scale(0.2));
        torsoDir.normalize();

        let targetRoot = footCenter.clone();
        //targetRoot.addInPlace(this.forward.scale(this.currentSpeed * 0.2))
        targetRoot.y += this.humanBody.rootAlt;

        while (targetRoot.y > this.footR.position.y && BABYLON.Vector3.Distance(this.footR.position, targetRoot) > this.humanBody.rootAlt * 1) {
            targetRoot.y -= 0.01;
        }
        while (targetRoot.y > this.footL.position.y && BABYLON.Vector3.Distance(this.footL.position, targetRoot) > this.humanBody.rootAlt * 1) {
            targetRoot.y -= 0.01;
        }

        let f = Nabu.Easing.smooth025Sec(1 / dt);
        this.root.position.y = this.root.position.y * f + targetRoot.y * (1 - f);
        f = 0;
        this.root.position.x = this.root.position.x * f + targetRoot.x * (1 - f);
        this.root.position.z = this.root.position.z * f + targetRoot.z * (1 - f);

        let torsoHeight = this.humanBody.rootLength + 0.005 * Math.cos(this._timer / 3 * 2 * Math.PI);

        // Shake that ass
        let footDir = this.footR.position.subtract(this.footL.position).normalize();
        footDir.addInPlace(this.right.scale(4)).normalize();
        //footDir = this.right;
        Mummu.QuaternionFromXYAxisToRef(footDir, torsoDir.add(BABYLON.Vector3.Up()), this.root.rotationQuaternion);

        // Alpha shouldering
        let handDir = this.handR.position.subtract(this.handL.position).normalize();
        handDir.addInPlace(this.right.scale(4)).normalize();
        Mummu.QuaternionFromXYAxisToRef(handDir, torsoDir, this.torso.rotationQuaternion);

        let shoulderForward = BABYLON.Vector3.Cross(this.head.absolutePosition.subtract(this.torso.absolutePosition), handDir).normalize();
        let footForward = BABYLON.Vector3.Cross(this.torso.absolutePosition.subtract(this.root.absolutePosition), footDir).normalize();

        this.torso.position = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, torsoHeight, 0), this.root.getWorldMatrix());
        this.head.position = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, this.humanBody.torsoLength, 0), this.torso.getWorldMatrix());
        if (this.targetLook) {
            let dir = this.targetLook.subtract(this.head.position);
            let alpha = Mummu.Angle(this.forward, dir);
            if (alpha > Math.PI * 0.4) {
                BABYLON.Vector3.SlerpToRef(this.forward, dir, Math.PI * 0.4 / alpha, dir);
            }
            Mummu.QuaternionFromZYAxisToRef(dir, BABYLON.Axis.Y, q);
        }
        else {
            Mummu.QuaternionFromZYAxisToRef(this.forward, BABYLON.Axis.Y, q);
        }
        let fHead = Nabu.Easing.smooth05Sec(1 / dt);
        BABYLON.Quaternion.SlerpToRef(this.head.rotationQuaternion, q, 1 - fHead, this.head.rotationQuaternion);

        // Arm Left

        let wristLPosition = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, - this.humanBody.handLength), this.handL.getWorldMatrix());
        this.elbowL.position.copyFrom(wristLPosition).subtractInPlace(this.forward.scale(this.humanBody.lowerArmLength)).subtractInPlace(this.right.scale(this.humanBody.lowerArmLength)).subtractInPlace(this.up.scale(this.humanBody.lowerArmLength));

        let upperArmLZ = BABYLON.Vector3.Zero();
        let lowerArmLZ = BABYLON.Vector3.Zero();
        for (let i = 0; i < 3; i++) {
            lowerArmLZ.copyFrom(wristLPosition).subtractInPlace(this.elbowL.position).normalize().scaleInPlace(this.humanBody.lowerArmLength);
            this.elbowL.position.copyFrom(wristLPosition).subtractInPlace(lowerArmLZ);

            upperArmLZ.copyFrom(this.elbowL.position).subtractInPlace(this.shoulderL.absolutePosition).normalize().scaleInPlace(this.humanBody.upperArmLength);
            this.elbowL.position.copyFrom(this.shoulderL.absolutePosition).addInPlace(upperArmLZ);
        }
        Mummu.ForceDistanceFromOriginInPlace(this.elbowL.position, this.shoulderL.absolutePosition, this.humanBody.upperArmLength);
        Mummu.ForceDistanceFromOriginInPlace(wristLPosition, this.elbowL.absolutePosition, this.humanBody.lowerArmLength);
        
        // Arm Right

        let wristRPosition = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, - this.humanBody.handLength), this.handR.getWorldMatrix());
        this.elbowR.position.copyFrom(wristRPosition).addInPlace(this.shoulderR.absolutePosition).scaleInPlace(0.5);
        this.elbowR.position.addInPlace(this.right.scale(this.humanBody.lowerArmLength * 0.3));
        this.elbowR.position.subtractInPlace(this.up.scale(this.humanBody.lowerArmLength * 0.3));

        let upperArmRZ = BABYLON.Vector3.Zero();
        let lowerArmRZ = BABYLON.Vector3.Zero();
        for (let i = 0; i < 3; i++) {
            lowerArmRZ.copyFrom(wristRPosition).subtractInPlace(this.elbowR.position).normalize().scaleInPlace(this.humanBody.lowerArmLength);
            this.elbowR.position.copyFrom(wristRPosition).subtractInPlace(lowerArmRZ);

            upperArmRZ.copyFrom(this.elbowR.position).subtractInPlace(this.shoulderR.absolutePosition).normalize().scaleInPlace(this.humanBody.upperArmLength);
            this.elbowR.position.copyFrom(this.shoulderR.absolutePosition).addInPlace(upperArmRZ);
        }
        Mummu.ForceDistanceFromOriginInPlace(this.elbowR.position, this.shoulderR.absolutePosition, this.humanBody.upperArmLength);
        Mummu.ForceDistanceFromOriginInPlace(wristRPosition, this.elbowR.absolutePosition, this.humanBody.lowerArmLength);

        // Leg Left

        this.kneeL.position.copyFrom(this.hipL.absolutePosition).addInPlace(this.footL.position).scaleInPlace(0.5);
        this.kneeL.position.addInPlace(this.forward.scale(0.1)).addInPlace(this.right.scale(0));

        let upperLegLZ = BABYLON.Vector3.Zero();
        let lowerLegLZ = BABYLON.Vector3.Zero();
        for (let i = 0; i < 5; i++) {
            lowerLegLZ.copyFrom(this.footL.position).subtractInPlace(this.kneeL.position).normalize().scaleInPlace(this.humanBody.lowerLegLength);
            this.kneeL.position.copyFrom(this.footL.position).subtractInPlace(lowerLegLZ);

            upperLegLZ.copyFrom(this.kneeL.position).subtractInPlace(this.hipL.absolutePosition).normalize().scaleInPlace(this.humanBody.upperLegLength);
            this.kneeL.position.copyFrom(this.hipL.absolutePosition).addInPlace(upperLegLZ);
        }
        
        // Leg Right

        this.kneeR.position.copyFrom(this.hipR.absolutePosition).addInPlace(this.footR.position).scaleInPlace(0.5);
        this.kneeR.position.addInPlace(this.forward.scale(0.1)).addInPlace(this.right.scale(0));

        let upperLegRZ = BABYLON.Vector3.Zero();
        let lowerLegRZ = BABYLON.Vector3.Zero();
        for (let i = 0; i < 5; i++) {
            lowerLegRZ.copyFrom(this.footR.position).subtractInPlace(this.kneeR.position).normalize().scaleInPlace(this.humanBody.lowerLegLength);
            this.kneeR.position.copyFrom(this.footR.position).subtractInPlace(lowerLegRZ);

            upperLegRZ.copyFrom(this.kneeR.position).subtractInPlace(this.hipR.absolutePosition).normalize().scaleInPlace(this.humanBody.upperLegLength);
            this.kneeR.position.copyFrom(this.hipR.absolutePosition).addInPlace(upperLegRZ);
        }

        this.humanBody.root.setPosition(this.root.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(this.torso.absolutePosition.subtract(this.root.absolutePosition).scale(-1), footForward, q);
        this.humanBody.root.setRotationQuaternion(q.normalize());

        this.humanBody.torso.setPosition(this.torso.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(this.head.absolutePosition.subtract(this.torso.absolutePosition).scale(-1), shoulderForward, q);
        this.humanBody.torso.setRotationQuaternion(q.normalize());

        this.humanBody.head.setPosition(this.head.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(this.head.up.scale(-1), this.head.forward.scale(-1), q);
        this.humanBody.head.setRotationQuaternion(q.normalize());

        this.humanBody.upperLegR.setPosition(this.hipR.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(this.kneeR.position.subtract(this.hipR.absolutePosition).scale(-1), this.forward.add(this.up), q);
        this.humanBody.upperLegR.setRotationQuaternion(q.normalize());

        this.humanBody.lowerLegR.setPosition(this.kneeR.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(this.footR.position.subtract(this.kneeR.absolutePosition).scale(-1), this.forward, q);
        this.humanBody.lowerLegR.setRotationQuaternion(q.normalize());

        this.humanBody.upperLegL.setPosition(this.hipL.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(this.kneeL.position.subtract(this.hipL.absolutePosition).scale(-1), this.forward.add(this.up), q);
        this.humanBody.upperLegL.setRotationQuaternion(q.normalize());

        this.humanBody.lowerLegL.setPosition(this.kneeL.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(this.footL.position.subtract(this.kneeL.absolutePosition).scale(-1), this.forward, q);
        this.humanBody.lowerLegL.setRotationQuaternion(q.normalize());

        let elbowRUp = BABYLON.Vector3.Cross(this.shoulderR.absolutePosition.subtract(this.elbowR.absolutePosition), wristRPosition.subtract(this.elbowR.absolutePosition)).normalize();
        let upperArmRUpF = 1 - Mummu.Angle(this.shoulderR.absolutePosition.subtract(this.elbowR.absolutePosition), wristRPosition.subtract(this.elbowR.absolutePosition)) / Math.PI;
        this.humanBody.upperArmR.setPosition(this.shoulderR.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(
            this.elbowR.position.subtract(this.shoulderR.absolutePosition).scale(-1),
            this.up.scale(1 - upperArmRUpF).add(elbowRUp.scale(upperArmRUpF)),
            q
        );
        this.humanBody.upperArmR.setRotationQuaternion(q.normalize());

        this.humanBody.lowerArmR.setPosition(this.elbowR.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(
            wristRPosition.subtract(this.elbowR.absolutePosition).scale(-1),
            this.handR.up.scale(0.5).add(elbowRUp.scale(0.5)),
            q
        );
        this.humanBody.lowerArmR.setRotationQuaternion(q.normalize());

        this.humanBody.handR.setPosition(wristRPosition.clone());
        this.humanBody.handR.setRotationQuaternion(this.handR.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(- Math.PI * 0.5, 0, 0)).normalize());

        this.humanBody.upperArmL.setPosition(this.shoulderL.absolutePosition);
        Mummu.QuaternionFromYZAxisToRef(this.elbowL.position.subtract(this.shoulderL.absolutePosition).scale(-1), this.up, q);
        this.humanBody.upperArmL.setRotationQuaternion(q.normalize());

        this.humanBody.lowerArmL.setPosition(this.elbowL.absolutePosition.clone());
        Mummu.QuaternionFromYZAxisToRef(wristLPosition.subtract(this.elbowL.absolutePosition).scale(-1), this.handL.up, q);
        this.humanBody.lowerArmL.setRotationQuaternion(q.normalize());

        this.humanBody.handL.setPosition(wristLPosition.clone());
        this.humanBody.handL.setRotationQuaternion(this.handL.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(- Math.PI * 0.5, 0, 0)).normalize());

        let dy = this.position.y;
        this.position.y = this.position.y * 0.9 + this.root.position.y * 0.1;
        dy = this.position.y - dy;
        
        let maxDist = 1.2;
        if (BABYLON.Vector3.DistanceSquared(this.position, this.root.position) > maxDist * maxDist) {
            Mummu.ForceDistanceFromOriginInPlace(this.position, this.root.position, maxDist);
        }
    }
}