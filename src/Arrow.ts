class Arrow extends BABYLON.Mesh {

    public get size(): number {
        return this.scaling.x / this.baseSize;
    }

    public set size(v: number) {
        let s = v * this.baseSize
        this.scaling.copyFromFloats(s, s, s);
    }

    constructor(public propEditor: PropEditor, name: string, public game: Game, public readonly baseSize: number = 0.1, public dir?: BABYLON.Vector3) {
        super(name);
        let matCursor = new BABYLON.StandardMaterial("arrow-material");
        matCursor.diffuseColor.copyFromFloats(0, 1, 1);
        matCursor.specularColor.copyFromFloats(0, 0, 0);
        matCursor.alpha = 0.2;
        matCursor.freeze();
        this.material = matCursor;
        this.scaling.copyFromFloats(this.baseSize, this.baseSize, this.baseSize);
        if (this.dir) {
            this.rotationQuaternion = BABYLON.Quaternion.Identity();
        }
    }

    public async instantiate(): Promise<void> {
        Mummu.CreateBeveledBoxVertexData({ size: 1 }).applyToMesh(this);

        //this.game.scene.onBeforeRenderObservable.add(this._update);
    }

    public highlight(): void {
        this.renderOutline = true;
        this.outlineColor = BABYLON.Color3.White();
        this.outlineWidth = 0.05 * this.size;
    }
    
    public unlit(): void {
        this.renderOutline = false;
    }

    public dispose(): void {
        super.dispose();
        //this.game.scene.onBeforeRenderObservable.removeCallback(this._update);
    }

    private _update = () => {
        
    }

    public initPos: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public onPointerDown = () => {
        let axis = this.game.arcCamera.getDirection(BABYLON.Axis.Z);
        Mummu.GetClosestAxisToRef(axis, axis);
        axis.scaleInPlace(-1);
        Mummu.QuaternionFromZYAxisToRef(this.dir, axis, this.propEditor.gridMesh.rotationQuaternion);
        this.propEditor.gridMesh.position.copyFrom(this.absolutePosition);
        this.propEditor.gridMesh.computeWorldMatrix(true);
        this.game.arcCamera.detachControl();

        this.initPos.copyFrom(this.position);
    }

    public onPointerMove = () => {
        let pick = this.game.scene.pick(
            this.game.scene.pointerX,
            this.game.scene.pointerY,
            (mesh) => {
                return mesh === this.propEditor.gridMesh;
            }
        );
        if (pick.hit) {
            this.onMove(pick.pickedPoint.subtract(this.initPos), pick.pickedPoint);
        }
    }

    public onMove = (delta: BABYLON.Vector3, pos: BABYLON.Vector3) => {};

    public onPointerUp = () => {
        let pick = this.game.scene.pick(
            this.game.scene.pointerX,
            this.game.scene.pointerY,
            (mesh) => {
                return mesh === this.propEditor.gridMesh;
            }
        );
        if (pick.hit) {
            this.onEndMove(pick.pickedPoint.subtract(this.initPos));
        }
    }

    public onEndMove = (delta: BABYLON.Vector3) => {};
}