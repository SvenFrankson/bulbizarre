class PropShapeMesh extends BABYLON.Mesh {

    public childMesh: BABYLON.Mesh;

    constructor(public propEditor: PropEditor, public shape: Kulla.RawShape, color?: BABYLON.Color4) {
        super("prop-shape-mesh");
        if (shape instanceof Kulla.RawShapeBox) {
            this.childMesh = Mummu.CreateBeveledBox("box", {
                width: shape.w + 0.1,
                height: shape.h + 0.1,
                depth: shape.d + 0.1,
                flat: true,
                color: color
            });
            this.childMesh.position.copyFromFloats(shape.w * 0.5, shape.h * 0.5, shape.d * 0.5);
            this.childMesh.material = this.propEditor.propShapeMaterial;
            this.childMesh.parent = this;
        }

        this.updatePosition();
    }

    public select(): void {
        this.childMesh.material = this.propEditor.propShapeMaterialSelected;
    }

    public unselect(): void {
        this.childMesh.material = this.propEditor.propShapeMaterial;
    }

    public updatePosition(): void {
        this.position.x = this.shape.pi;
        this.position.z = this.shape.pj;
        this.position.y = this.shape.pk + this.propEditor.alt;
        this.computeWorldMatrix(true);
        this.childMesh.computeWorldMatrix(true);
    }

    public updateShape(): void {
        if (this.shape instanceof Kulla.RawShapeBox) {
            let data = Mummu.CreateBeveledBoxVertexData({
                width: this.shape.w + 0.1,
                height: this.shape.h + 0.1,
                depth: this.shape.d + 0.1,
                flat: true
            });
            data.applyToMesh(this.childMesh);
            this.childMesh.position.copyFromFloats(this.shape.w * 0.5, this.shape.h * 0.5, this.shape.d * 0.5);
        }
    }
}

enum CursorMode {
    Select,
    Box,
    Sphere,
    Dot
}

class PropEditor {

    public boxButton: HTMLButtonElement;
    public sphereButton: HTMLButtonElement;
    public dotButton: HTMLButtonElement;

    public propShapeMaterial: BABYLON.Material;
    public propShapeMaterialSelected: BABYLON.Material;
    public propShapeMeshes: PropShapeMesh[] = [];

    public wLeftArrow: Arrow;
    public wRightArrow: Arrow;
    public hBottomArrow: Arrow;
    public hTopArrow: Arrow;
    public dBackwardArrow: Arrow;
    public dForwardArrow: Arrow;
    public arrows: Arrow[];

    public gridMesh: BABYLON.Mesh;
    private _cursorMesh: BABYLON.Mesh;
    private _cursorMode: CursorMode = CursorMode.Select;
    private setCursorMode(mode: CursorMode): void {
        this._cursorMode = mode;
        if (this._cursorMode === CursorMode.Select) {
            this._cursorMesh.isVisible = false;
        }
        else {
            this._cursorMesh.isVisible = true;
        }
    }

    private _selectedPropShape: PropShapeMesh;
    private setSelectedPropShape(s: PropShapeMesh) {
        if (this._selectedPropShape != s) {
            if (this._selectedPropShape) {
                this._selectedPropShape.unselect();
            }
            this._selectedPropShape = s;
            if (this._selectedPropShape) {
                this._selectedPropShape.select();
            }
            this.updateArrows();
        }
    }

    private _draggedOffset: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _draggedPropShape: PropShapeMesh | Arrow;
    private setDraggedPropShape(s: PropShapeMesh | Arrow) {
        if (this._draggedPropShape != s) {
            this._draggedPropShape = s;
            if (this._draggedPropShape instanceof PropShapeMesh) {
                let axis = this.game.arcCamera.getDirection(BABYLON.Axis.Z);
                Mummu.GetClosestAxisToRef(axis, axis);
                axis.scaleInPlace(-1);
                Mummu.QuaternionFromYZAxisToRef(axis, BABYLON.Vector3.One(), this.gridMesh.rotationQuaternion);
                this.gridMesh.position.copyFrom(this._draggedPropShape.childMesh.absolutePosition);
                this.gridMesh.computeWorldMatrix(true);
                this.game.arcCamera.detachControl();
            }
            else if (this._draggedPropShape instanceof Arrow) {
                this._draggedPropShape.onPointerDown();
            }
            else {
                this.game.arcCamera.attachControl();
            }
        }
    }

    public alt: number;

    constructor(public game: Game) {
        let mat = new BABYLON.StandardMaterial("prop-shape-material");
        mat.specularColor.copyFromFloats(0, 0, 0);
        mat.alpha = 0.1;
        this.propShapeMaterial = mat;

        let matSelected = new BABYLON.StandardMaterial("prop-shape-material");
        matSelected.diffuseColor.copyFromFloats(1, 1, 0);
        matSelected.specularColor.copyFromFloats(0, 0, 0);
        matSelected.alpha = 0.2;
        this.propShapeMaterialSelected = matSelected;

        let matCursor = new BABYLON.StandardMaterial("prop-shape-material");
        matCursor.diffuseColor.copyFromFloats(0, 1, 1);
        matCursor.specularColor.copyFromFloats(0, 0, 0);
        matCursor.alpha = 0.2;

        this._cursorMesh = Mummu.CreateBeveledBox("cursor", { size: 1 });
        this._cursorMesh.material = matCursor;

        this.gridMesh = BABYLON.MeshBuilder.CreateGround("grid", { width: 100, height: 100 });
        this.gridMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.gridMesh.isVisible = false;
    }

    public initialize(): void {

        if (this.game.terrain) {
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                this.alt = this.game.terrain.chunckDataGenerator.altitude;
            }
        }

        this.boxButton = document.getElementById("prop-editor-box") as HTMLButtonElement;
        this.boxButton.onclick = () => {
            if (this._cursorMode === CursorMode.Box) {
                this.setCursorMode(CursorMode.Select);
            }
            else {
                this.setCursorMode(CursorMode.Box);
            }
        }
        this.sphereButton = document.getElementById("prop-editor-sphere") as HTMLButtonElement;
        this.sphereButton.onclick = () => {
            if (this._cursorMode === CursorMode.Sphere) {
                this.setCursorMode(CursorMode.Select);
            }
            else {
                this.setCursorMode(CursorMode.Sphere);
            }
        }
        this.dotButton = document.getElementById("prop-editor-dot") as HTMLButtonElement;
        this.dotButton.onclick = () => {
            if (this._cursorMode === CursorMode.Dot) {
                this.setCursorMode(CursorMode.Select);
            }
            else {
                this.setCursorMode(CursorMode.Dot);
            }
        }

        this.propShapeMeshes = [];
        if (this.game.terrain) {
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                this.game.terrain.chunckDataGenerator.prop.shapes.forEach(shape => {
                    let propShapeMesh = new PropShapeMesh(this, shape);
                    this.propShapeMeshes.push(propShapeMesh);
                });
            }
        }

        this.wLeftArrow = new Arrow(this, "wLeftArrow", this.game, 0.5, BABYLON.Vector3.Left());
        this.wLeftArrow.onMove = (delta: BABYLON.Vector3) => {
            let dW = - Math.round(delta.x);
            if (dW != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.w += dW;
                this.wLeftArrow.initPos.x -= Math.sign(dW);
                this.onMove(- dW, 0, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        }

        this.wRightArrow = new Arrow(this, "wRightArrow", this.game, 0.4, BABYLON.Vector3.Right());
        this.wRightArrow.onMove = (delta: BABYLON.Vector3) => {
            let dW = Math.round(delta.x);
            if (dW != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.w += dW;
                this.wRightArrow.initPos.x += Math.sign(dW);
                this.onMove(0, 0, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        }

        this.hBottomArrow = new Arrow(this, "hBottomArrow", this.game, 0.4, BABYLON.Vector3.Down());
        this.hBottomArrow.onMove = (delta: BABYLON.Vector3) => {
            let dH = - Math.round(delta.y);
            if (dH != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.h += dH;
                this.hBottomArrow.initPos.y -= Math.sign(dH);
                this.onMove(0, 0, - dH);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        }

        this.hTopArrow = new Arrow(this, "hTopArrow", this.game, 0.4, BABYLON.Vector3.Up());
        this.hTopArrow.onMove = (delta: BABYLON.Vector3, pos: BABYLON.Vector3) => {
            let dH = Math.round(delta.y);
            if (dH != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.h += dH;
                this.hTopArrow.initPos.y += Math.sign(dH);
                this.onMove(0, 0, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        }
        this.dBackwardArrow = new Arrow(this, "dBackwardArrow", this.game, 0.4, BABYLON.Vector3.Backward());
        this.dBackwardArrow.onMove = (delta: BABYLON.Vector3) => {
            let dD = - Math.round(delta.z);
            if (dD != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.d += dD;
                this.dBackwardArrow.initPos.z -= Math.sign(dD);
                this.onMove(0, - dD, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        }

        this.dForwardArrow = new Arrow(this, "dForwardArrow", this.game, 0.4, BABYLON.Vector3.Forward());
        this.dForwardArrow.onMove = (delta: BABYLON.Vector3) => {
            let dD = Math.round(delta.z);
            if (dD != 0 && this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                this._selectedPropShape.shape.d += dD;
                this.dForwardArrow.initPos.z += Math.sign(dD);
                this.onMove(0, 0, 0);
                this._selectedPropShape.updateShape();
                this._selectedPropShape.updatePosition();
                this.updateArrows();
            }
        }

        this.arrows = [
            this.wLeftArrow,
            this.wRightArrow,
            this.hBottomArrow,
            this.hTopArrow,
            this.dBackwardArrow,
            this.dForwardArrow
        ];
        this.arrows.forEach(arrow => {
            arrow.instantiate();
        })

        this.game.canvas.addEventListener("keyup", this.onKeyDown);
        this.game.canvas.addEventListener("pointerdown", this.onPointerDown);
        this.game.canvas.addEventListener("pointermove", this.onPointerMove);
        this.game.canvas.addEventListener("pointerup", this.onPointerUp);
    }

    public dispose(): void {
        while (this.propShapeMeshes.length > 0) {
            this.propShapeMeshes.pop().dispose();
        }

        this.game.canvas.removeEventListener("keydown", this.onKeyDown);
        this.game.canvas.removeEventListener("pointerup", this.onPointerUp);
    }

    public updateArrows(): void {
        this.arrows.forEach(arrow => {
            arrow.isVisible = false;
        })

        if (this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
            this.arrows.forEach(arrow => {
                arrow.isVisible = true;
            });

            this.wRightArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.wRightArrow.position.x += 0.5 + this._selectedPropShape.shape.w * 0.5;
            
            this.wLeftArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.wLeftArrow.position.x -= 0.5 + this._selectedPropShape.shape.w * 0.5;

            this.hTopArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.hTopArrow.position.y += 0.5 + this._selectedPropShape.shape.h * 0.5;
            
            this.hBottomArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.hBottomArrow.position.y -= 0.5 + this._selectedPropShape.shape.h * 0.5;

            this.dForwardArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.dForwardArrow.position.z += 0.5 + this._selectedPropShape.shape.d * 0.5;
            
            this.dBackwardArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.dBackwardArrow.position.z -= 0.5 + this._selectedPropShape.shape.d * 0.5;
        }
    }

    public redraw(): void {
        let chuncks = [
            this.game.terrain.getChunck(0, 0, 0),
            this.game.terrain.getChunck(0, 1, 0),
            this.game.terrain.getChunck(0, 1, 1),
            this.game.terrain.getChunck(0, 0, 1)
        ]
        chuncks.forEach(chunck => {
            chunck.reset();
            chunck.redrawMesh(true);
        }) 
    }

    private _pointerDownX: number = 0;
    private _pointerDownY: number = 0;
    public onPointerDown = () => {
        this._pointerDownX = this.game.scene.pointerX;
        this._pointerDownY = this.game.scene.pointerY;
        if (this._cursorMode === CursorMode.Select) {
            let pick = this.game.scene.pick(
                this.game.scene.pointerX,
                this.game.scene.pointerY,
                (mesh) => {
                    if (mesh instanceof Arrow) {
                        return true;
                    }
                    return mesh && mesh.parent instanceof PropShapeMesh;
                }
            );

            if (pick.hit && pick.pickedMesh.parent === this._selectedPropShape) {
                this.setDraggedPropShape(this._selectedPropShape);
                let p = new BABYLON.Vector3(
                    this._selectedPropShape.shape.pi,
                    this._selectedPropShape.shape.pk + this.alt,
                    this._selectedPropShape.shape.pj
                ).addInPlaceFromFloats(0.5, 0.5, 0.5);
                let gridPick = this.game.scene.pick(
                    this.game.scene.pointerX,
                    this.game.scene.pointerY,
                    (mesh) => {
                        return mesh === this.gridMesh;
                    }
                );
                if (gridPick.hit) {
                    this._draggedOffset.copyFrom(gridPick.pickedPoint).subtractInPlace(p);
                }
                else {
                    this._draggedOffset.copyFromFloats(0, 0, 0);
                }
            }
            else if (pick.hit && pick.pickedMesh instanceof Arrow) {
                this.setDraggedPropShape(pick.pickedMesh);
                this._draggedOffset.copyFromFloats(0, 0, 0);
            }
            else {
                this.setDraggedPropShape(undefined);
            }
        }
    }

    public onPointerMove = () => {
        if (this._cursorMode === CursorMode.Select) {
            if (this._draggedPropShape instanceof PropShapeMesh) {
                let pick = this.game.scene.pick(
                    this.game.scene.pointerX,
                    this.game.scene.pointerY,
                    (mesh) => {
                        return mesh === this.gridMesh;
                    }
                );
                if (pick.hit) {
                    let p = pick.pickedPoint.subtract(this._draggedOffset);
                    let i = Math.floor(p.x);
                    let j = Math.floor(p.z);
                    let k = Math.floor(p.y - this.alt);
    
                    let di = i - this._draggedPropShape.shape.pi;
                    let dj = j - this._draggedPropShape.shape.pj;
                    let dk = k - this._draggedPropShape.shape.pk;
                    
                    this.onMove(di, dj, dk);
                }
            }
            else if (this._draggedPropShape instanceof Arrow) {
                this._draggedPropShape.onPointerMove();
            }
        }
        else {
            let pick = this.game.scene.pick(
                this.game.scene.pointerX,
                this.game.scene.pointerY,
                (mesh) => {
                    return mesh && mesh.parent instanceof PropShapeMesh;
                }
            );
            if (pick.hit) {
                let p = pick.pickedPoint.add(pick.getNormal(true).scale(0.5));
                let i = Math.floor(p.x);
                let j = Math.floor(p.z);
                let k = Math.floor(p.y - this.alt);

                this._cursorMesh.position.copyFromFloats(i, k + this.alt, j).addInPlaceFromFloats(0.5, 0.5, 0.5);
            }
        }
    }

    public onPointerUp = () => {
        if (this._draggedPropShape instanceof Arrow) {
            this._draggedPropShape.onPointerUp();
            this.setDraggedPropShape(undefined);
            return;
        }
        let dX = this._pointerDownX - this.game.scene.pointerX;
        let dY = this._pointerDownY - this.game.scene.pointerY;
        let d = Math.sqrt(dX * dX + dY * dY);
        this.setDraggedPropShape(undefined);
        if (this._cursorMode === CursorMode.Select && d < 5) {
            let pick = this.game.scene.pick(
                this.game.scene.pointerX,
                this.game.scene.pointerY,
                (mesh) => {
                    if (mesh instanceof Arrow) {
                        return true;
                    }
                    return mesh && mesh.parent instanceof PropShapeMesh;
                }
            );
            if (pick.hit && pick.pickedMesh.parent instanceof PropShapeMesh) {
                this.setSelectedPropShape(pick.pickedMesh.parent);
            }
            else {
                this.setSelectedPropShape(undefined);
            }
        }
        else {
            let pick = this.game.scene.pick(
                this.game.scene.pointerX,
                this.game.scene.pointerY,
                (mesh) => {
                    return mesh && mesh.parent instanceof PropShapeMesh;
                }
            );
            if (pick.hit) {
                let p = pick.pickedPoint.add(pick.getNormal(true).scale(0.5));
                let i = Math.floor(p.x);
                let j = Math.floor(p.z);
                let k = Math.floor(p.y - this.alt);

                let newShape: Kulla.RawShape;
                if (this._cursorMode === CursorMode.Box) {
                    newShape = new Kulla.RawShapeBox(1, 1, 1, i, j, k);
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                        this.game.terrain.chunckDataGenerator.prop.shapes.push(newShape);
                        this.game.terrain.chunckDataGenerator.prop.blocks.push(Kulla.BlockType.Ice);
                    }
                    let propShapeMesh = new PropShapeMesh(this, newShape);
                    this.propShapeMeshes.push(propShapeMesh);
                    this.redraw();
                    this.setCursorMode(CursorMode.Select);
                }
            }
        }
    }

    public onKeyDown = (ev: KeyboardEvent) => {
        if (ev.code === "KeyW") {
            this.onMove(0, 0, 1);
        }
        else if (ev.code === "KeyA") {
            this.onMove(- 1, 0, 0);
        }
        else if (ev.code === "KeyS") {
            this.onMove(0, 0, - 1);
        }
        else if (ev.code === "KeyD") {
            this.onMove(1, 0, 0);
        }
        else if (ev.code === "KeyQ") {
            this.onMove(0, - 1, 0);
        }
        else if (ev.code === "KeyE") {
            this.onMove(0, 1, 0);
        }
        else if (ev.code === "KeyX") {
            this.onDelete();
        } 
    }

    public onMove(di: number = 0, dj: number = 0, dk: number = 0): void {
        if (this._selectedPropShape) {
            this._selectedPropShape.shape.pi += di;
            this._selectedPropShape.shape.pj += dj;
            this._selectedPropShape.shape.pk += dk;
            this._selectedPropShape.updatePosition();
            this.redraw();
            this.updateArrows();
        }
    }

    public onDelete(): void {
        if (this._selectedPropShape && this.propShapeMeshes.length > 0) {
            let mesh = this._selectedPropShape;
            let index = this.propShapeMeshes.indexOf(this._selectedPropShape);
            this.setSelectedPropShape(undefined);
            mesh.dispose();
            this.propShapeMeshes.splice(index, 1);
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                this.game.terrain.chunckDataGenerator.prop.shapes.splice(index, 1);
                this.game.terrain.chunckDataGenerator.prop.blocks.splice(index, 1);
            }
        }
        this.redraw();
    }
}