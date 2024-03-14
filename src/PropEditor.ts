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

    private _gridMesh: BABYLON.Mesh;
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
        }
    }

    private _draggedOffset: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _draggedPropShape: PropShapeMesh;
    private setDraggedPropShape(s: PropShapeMesh) {
        if (this._draggedPropShape != s) {
            this._draggedPropShape = s;
            if (this._draggedPropShape) {
                this._gridMesh.isVisible = true;
                let axis = this.game.arcCamera.getDirection(BABYLON.Axis.Z);
                Mummu.GetClosestAxisToRef(axis, axis);
                axis.scaleInPlace(-1);
                Mummu.QuaternionFromYZAxisToRef(axis, BABYLON.Vector3.One(), this._gridMesh.rotationQuaternion);
                this._gridMesh.position.copyFrom(this._draggedPropShape.childMesh.absolutePosition);
                this._gridMesh.computeWorldMatrix(true);
                this.game.arcCamera.detachControl();
            }
            else {
                this._gridMesh.isVisible = false;
                this.game.arcCamera.attachControl();
            }
        }
    }

    public alt: number;

    constructor(public game: Game) {
        let mat = new BABYLON.StandardMaterial("prop-shape-material");
        mat.specularColor.copyFromFloats(0, 0, 0);
        mat.alpha = 0.2;
        this.propShapeMaterial = mat;

        let matSelected = new BABYLON.StandardMaterial("prop-shape-material");
        matSelected.diffuseColor.copyFromFloats(1, 1, 0);
        matSelected.specularColor.copyFromFloats(0, 0, 0);
        matSelected.alpha = 0.2;
        this.propShapeMaterialSelected = matSelected;

        this._cursorMesh = Mummu.CreateBeveledBox("cursor", { size: 1 });

        this._gridMesh = BABYLON.MeshBuilder.CreateGround("grid", { width: 30, height: 30 });
        this._gridMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        this._gridMesh.material = mat;
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

    public onPointerDown = () => {
        if (this._cursorMode === CursorMode.Select) {
            let pick = this.game.scene.pick(
                this.game.scene.pointerX,
                this.game.scene.pointerY,
                (mesh) => {
                    return mesh && mesh.parent instanceof PropShapeMesh;
                }
            );

            if (pick.hit && pick.pickedMesh.parent === this._selectedPropShape) {
                this.setDraggedPropShape(this._selectedPropShape);
                let p = new BABYLON.Vector3(
                    this._draggedPropShape.shape.pi,
                    this._draggedPropShape.shape.pk + this.alt,
                    this._draggedPropShape.shape.pj
                ).addInPlaceFromFloats(0.5, 0.5, 0.5);
                let gridPick = this.game.scene.pick(
                    this.game.scene.pointerX,
                    this.game.scene.pointerY,
                    (mesh) => {
                        return mesh === this._gridMesh;
                    }
                );
                if (gridPick.hit) {
                    this._draggedOffset.copyFrom(gridPick.pickedPoint).subtractInPlace(p);
                }
                else {
                    this._draggedOffset.copyFromFloats(0, 0, 0);
                }
            }
            else {
                this.setDraggedPropShape(undefined);
            }
        }
    }

    public onPointerMove = () => {
        if (this._cursorMode === CursorMode.Select) {
            if (this._draggedPropShape) {
                let pick = this.game.scene.pick(
                    this.game.scene.pointerX,
                    this.game.scene.pointerY,
                    (mesh) => {
                        return mesh === this._gridMesh;
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
        this.setDraggedPropShape(undefined);
        if (this._cursorMode === CursorMode.Select) {
            let pick = this.game.scene.pick(
                this.game.scene.pointerX,
                this.game.scene.pointerY,
                (mesh) => {
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
    }

    public onMove(di: number = 0, dj: number = 0, dk: number = 0): void {
        if (this._selectedPropShape) {
            this._selectedPropShape.shape.pi += di;
            this._selectedPropShape.shape.pj += dj;
            this._selectedPropShape.shape.pk += dk;
            this._selectedPropShape.updatePosition();
            this.redraw();
        }
    }
}