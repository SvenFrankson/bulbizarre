class PropShapeMesh extends BABYLON.Mesh {

    public childMesh: BABYLON.Mesh;

    public pointAMesh: BABYLON.Mesh;
    public pointBMesh: BABYLON.Mesh;

    constructor(public propEditor: PropEditor, public shape: Kulla.RawShape, color?: BABYLON.Color4) {
        super("prop-shape-mesh");
        if (this.shape instanceof Kulla.RawShapeBox) {
            this.childMesh = Mummu.CreateBeveledBox("box", {
                width: this.shape.w + 0.1,
                height: this.shape.h + 0.1,
                depth: this.shape.d + 0.1,
                flat: true,
                color: color
            });
            this.childMesh.position.copyFromFloats(this.shape.w * 0.5, this.shape.h * 0.5, this.shape.d * 0.5);
            this.childMesh.material = this.propEditor.propShapeMaterial;
            this.childMesh.parent = this;
        }
        else if (this.shape instanceof Kulla.RawShapeSphere) {
            this.childMesh = Mummu.CreateBeveledBox("box", {
                width: this.shape.rX * 2 + 1 + 0.1,
                height: this.shape.rY * 2 + 1 + 0.1,
                depth: this.shape.rZ * 2 + 1 + 0.1,
                flat: true,
                color: color
            });
            this.childMesh.position.copyFromFloats(0.5, 0.5, 0.5);
            this.childMesh.material = this.propEditor.propShapeMaterial;
            this.childMesh.parent = this;
        }
        else if (this.shape instanceof Kulla.RawShapeLine) {
            let pA = new BABYLON.Vector3(this.shape.Ai, this.shape.Ak, this.shape.Aj);
            let pB = new BABYLON.Vector3(this.shape.Bi, this.shape.Bk, this.shape.Bj);
            let dir = pB.subtract(pA);
            let l = dir.length();
            dir.scaleInPlace(1 / l);
            this.childMesh = Mummu.CreateBeveledBox("box", {
                width: 1 + 0.1,
                height: l + 0.1,
                depth: 1 + 0.1,
                flat: true,
                color: color
            });
            if (Math.abs(BABYLON.Vector3.Dot(dir, BABYLON.Axis.Z)) < 0.9) {
                this.childMesh.rotationQuaternion = Mummu.QuaternionFromYZAxis(dir, BABYLON.Axis.Z);
            }
            else {
                this.childMesh.rotationQuaternion = Mummu.QuaternionFromYZAxis(dir, BABYLON.Axis.X);
            }
            this.childMesh.position.copyFrom(pA).addInPlace(pB).scaleInPlace(0.5);
            this.childMesh.material = this.propEditor.propShapeMaterial;
            this.childMesh.parent = this;
            
            this.pointAMesh = Mummu.CreateBeveledBox("pointA", {
                width: 1.2,
                height: 1.2,
                depth: 1.2,
                flat: true,
                color: color
            });
            this.pointAMesh.position.copyFrom(pA).addInPlaceFromFloats(0.5, 0.5, 0.5);
            this.pointAMesh.material = this.propEditor.propShapeMaterial;
            this.pointAMesh.parent = this;
            this.pointAMesh.isVisible = false;
            
            this.pointBMesh = Mummu.CreateBeveledBox("pointB", {
                width: 1.2,
                height: 1.2,
                depth: 1.2,
                flat: true,
                color: color
            });
            this.pointBMesh.position.copyFrom(pB).addInPlaceFromFloats(0.5, 0.5, 0.5);
            this.pointBMesh.material = this.propEditor.propShapeMaterial;
            this.pointBMesh.parent = this;
            this.pointBMesh.isVisible = false;
        }

        this.updatePosition();
        this.updateVisibility();
    }

    public select(): void {
        if (this.shape instanceof Kulla.RawShapeLine) {
            this.pointAMesh.isVisible = true;
            this.pointBMesh.isVisible = true;
        }
        else if (this.childMesh) {
            this.childMesh.material = this.propEditor.propShapeMaterialSelected;
        }
    }

    public unselect(): void {
        if (this.shape instanceof Kulla.RawShapeLine) {
            this.pointAMesh.isVisible = false;
            this.pointBMesh.isVisible = false;
        }
        else if (this.childMesh) {
            this.childMesh.material = this.propEditor.propShapeMaterial;
        }
    }

    public updatePosition(): void {
        if (this.childMesh) {
            this.position.x = this.shape.pi;
            this.position.z = this.shape.pj;
            this.position.y = this.shape.pk + this.propEditor.alt;
            this.computeWorldMatrix(true);
            this.childMesh.computeWorldMatrix(true);
            if (this.shape instanceof Kulla.RawShapeLine) {
                let pA = new BABYLON.Vector3(this.shape.Ai, this.shape.Ak, this.shape.Aj);
                let pB = new BABYLON.Vector3(this.shape.Bi, this.shape.Bk, this.shape.Bj);
                let dir = pB.subtract(pA);
                let l = dir.length();
                dir.scaleInPlace(1 / l);
                let data = Mummu.CreateBeveledBoxVertexData({
                    width: 1 + 0.1,
                    height: l - 0.5 + 0.1,
                    depth: 1 + 0.1,
                    flat: true
                });
                data.applyToMesh(this.childMesh);
                if (Math.abs(BABYLON.Vector3.Dot(dir, BABYLON.Axis.Z)) < 0.9) {
                    Mummu.QuaternionFromYZAxisToRef(dir, BABYLON.Axis.Z, this.childMesh.rotationQuaternion);
                }
                else {
                    Mummu.QuaternionFromYZAxisToRef(dir, BABYLON.Axis.X, this.childMesh.rotationQuaternion);
                }
                this.childMesh.position.copyFrom(pA).addInPlace(pB).scaleInPlace(0.5).addInPlaceFromFloats(0.5, 0.5, 0.5);
                this.pointAMesh.position.copyFrom(pA).addInPlaceFromFloats(0.5, 0.5, 0.5);
                this.pointBMesh.position.copyFrom(pB).addInPlaceFromFloats(0.5, 0.5, 0.5);
            }
        }
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
        else if (this.shape instanceof Kulla.RawShapeSphere) {
            let data = Mummu.CreateBeveledBoxVertexData({
                width: this.shape.rX * 2 + 1 + 0.1,
                height: this.shape.rY * 2 + 1 + 0.1,
                depth: this.shape.rZ * 2 + 1 + 0.1,
                flat: true
            });
            data.applyToMesh(this.childMesh);
            this.childMesh.position.copyFromFloats(0.5, 0.5, 0.5);
        }
    }

    public updateVisibility(): void {
        if (this.childMesh) {
            this.childMesh.isVisible = this.propEditor.showSelectors;
        }
    }
}

enum CursorMode {
    Select,
    Box,
    Sphere,
    Dot,
    Line
}

class PropEditor {

    public boxButton: HTMLButtonElement;
    public sphereButton: HTMLButtonElement;
    public lineButton: HTMLButtonElement;
    public dotButton: HTMLButtonElement;
    public blockTypeButtons: HTMLButtonElement[];
    public saveButton: HTMLButtonElement;
    public loadButton: HTMLInputElement;

    public showSelectors: boolean = true;
    public propShapeMaterial: BABYLON.Material;
    public propShapeMaterialSelected: BABYLON.Material;
    public propShapeMeshes: PropShapeMesh[] = [];

    private _shiftDown: boolean = false;
    public wLeftArrow: Arrow;
    public wRightArrow: Arrow;
    public hBottomArrow: Arrow;
    public hTopArrow: Arrow;
    public dBackwardArrow: Arrow;
    public dForwardArrow: Arrow;
    public arrows: Arrow[];

    public gridMesh: BABYLON.Mesh;
    public currentBlockType: Kulla.BlockType = Kulla.BlockType.Grass;
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
    private _draggedPoint: number = 0;
    private setDraggedPropShape(s: PropShapeMesh | Arrow, point: number = 0) {
        if (this._draggedPropShape != s || this._draggedPoint != point) {
            this._draggedPropShape = s;
            this._draggedPoint = point;
            if (this._draggedPropShape instanceof PropShapeMesh) {
                let axis = this.game.arcCamera.getDirection(BABYLON.Axis.Z);
                Mummu.GetClosestAxisToRef(axis, axis);
                axis.scaleInPlace(-1);
                Mummu.QuaternionFromYZAxisToRef(axis, BABYLON.Vector3.One(), this.gridMesh.rotationQuaternion);
                if (this._draggedPoint === 0) {
                    this.gridMesh.position.copyFrom(this._draggedPropShape.childMesh.absolutePosition);
                }
                else if (this._draggedPoint === 1) {
                    this.gridMesh.position.copyFrom(this._draggedPropShape.pointAMesh.absolutePosition);
                }
                else if (this._draggedPoint === 2) {
                    this.gridMesh.position.copyFrom(this._draggedPropShape.pointBMesh.absolutePosition);
                }
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
        mat.alpha = 0.2;
        this.propShapeMaterial = mat;

        let matSelected = new BABYLON.StandardMaterial("prop-shape-material");
        matSelected.diffuseColor.copyFromFloats(1, 1, 0);
        matSelected.specularColor.copyFromFloats(0, 0, 0);
        matSelected.alpha = 0.3;
        this.propShapeMaterialSelected = matSelected;

        let matCursor = new BABYLON.StandardMaterial("prop-shape-material");
        matCursor.diffuseColor.copyFromFloats(0, 1, 1);
        matCursor.specularColor.copyFromFloats(0, 0, 0);
        matCursor.alpha = 0.2;

        this._cursorMesh = Mummu.CreateBeveledBox("cursor", { size: 1 });
        this._cursorMesh.material = matCursor;

        this.gridMesh = Mummu.CreateQuad("grid-mesh", {
            p1: new BABYLON.Vector3(- 100, 0, - 100),
            p2: new BABYLON.Vector3(100, 0, - 100),
            p3: new BABYLON.Vector3(100, 0, 100),
            p4: new BABYLON.Vector3(- 100, 0, 100),
            sideOrientation: 2
        })
        this.gridMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.gridMesh.isVisible = false;

        this.setCursorMode(CursorMode.Select);
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
        this.lineButton = document.getElementById("prop-editor-line") as HTMLButtonElement;
        this.lineButton.onclick = () => {
            if (this._cursorMode === CursorMode.Line) {
                this.setCursorMode(CursorMode.Select);
            }
            else {
                this.setCursorMode(CursorMode.Line);
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

        let toggleShowSelector = document.getElementById("show-selector-toggle") as Nabu.NabuCheckBox;
        toggleShowSelector.setValue(true);
        toggleShowSelector.onChange = () => {
            this.showSelectors = toggleShowSelector.valueBool;
            this.propShapeMeshes.forEach(propShapeMesh => {
                propShapeMesh.updateVisibility();
            })
        }

        this.blockTypeButtons = [...document.querySelectorAll(".prop-blocktype-button")] as HTMLButtonElement[];
        this.blockTypeButtons.forEach((button, index) => {
            let blocktype = index;
            let name = Kulla.BlockTypeNames[index];
            let color = Kulla.BlockTypeColors[index];
            if (name && color) {
                button.style.backgroundColor = color.toHexString();
            }
            button.onclick = () => {
                this.currentBlockType = blocktype;
                if (this._selectedPropShape) {
                    let shapeIndex = this.propShapeMeshes.indexOf(this._selectedPropShape);
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                        this.game.terrain.chunckDataGenerator.prop.blocks[shapeIndex] = this.currentBlockType;
                    }
                    this.redraw();
                }
            }
        })

        this.wLeftArrow = new Arrow(this, "wLeftArrow", this.game, 0.5, BABYLON.Vector3.Left());
        this.wLeftArrow.onMove = (delta: BABYLON.Vector3) => {
            let dW = - Math.round(delta.x);
            if (dW != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.w += dW;
                    this.wLeftArrow.initPos.x -= Math.sign(dW);
                    this.onMove(- dW, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rX += dW;
                    this.wLeftArrow.initPos.x -= Math.sign(dW);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        }

        this.wRightArrow = new Arrow(this, "wRightArrow", this.game, 0.5, BABYLON.Vector3.Right());
        this.wRightArrow.onMove = (delta: BABYLON.Vector3) => {
            let dW = Math.round(delta.x);
            if (dW != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.w += dW;
                    this.wRightArrow.initPos.x += Math.sign(dW);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rX += dW;
                    this.wRightArrow.initPos.x += Math.sign(dW);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        }

        this.hBottomArrow = new Arrow(this, "hBottomArrow", this.game, 0.5, BABYLON.Vector3.Down());
        this.hBottomArrow.onMove = (delta: BABYLON.Vector3) => {
            let dH = - Math.round(delta.y);
            if (dH != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.h += dH;
                    this.hBottomArrow.initPos.y -= Math.sign(dH);
                    this.onMove(0, 0, - dH);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rY += dH;
                    this.hBottomArrow.initPos.y -= Math.sign(dH);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        }

        this.hTopArrow = new Arrow(this, "hTopArrow", this.game, 0.5, BABYLON.Vector3.Up());
        this.hTopArrow.onMove = (delta: BABYLON.Vector3, pos: BABYLON.Vector3) => {
            let dH = Math.round(delta.y);
            if (dH != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.h += dH;
                    this.hTopArrow.initPos.y += Math.sign(dH);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rY += dH;
                    this.hTopArrow.initPos.y += Math.sign(dH);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        }
        this.dBackwardArrow = new Arrow(this, "dBackwardArrow", this.game, 0.5, BABYLON.Vector3.Backward());
        this.dBackwardArrow.onMove = (delta: BABYLON.Vector3) => {
            let dD = - Math.round(delta.z);
            if (dD != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.d += dD;
                    this.dBackwardArrow.initPos.z -= Math.sign(dD);
                    this.onMove(0, - dD, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rZ += dD;
                    this.dBackwardArrow.initPos.z -= Math.sign(dD);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
            }
        }

        this.dForwardArrow = new Arrow(this, "dForwardArrow", this.game, 0.5, BABYLON.Vector3.Forward());
        this.dForwardArrow.onMove = (delta: BABYLON.Vector3) => {
            let dD = Math.round(delta.z);
            if (dD != 0 && this._selectedPropShape) {
                if (this._selectedPropShape.shape instanceof Kulla.RawShapeBox) {
                    this._selectedPropShape.shape.d += dD;
                    this.dForwardArrow.initPos.z += Math.sign(dD);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
                else if (this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
                    this._selectedPropShape.shape.rZ += dD;
                    this.dForwardArrow.initPos.z += Math.sign(dD);
                    this.onMove(0, 0, 0);
                    this._selectedPropShape.updateShape();
                    this._selectedPropShape.updatePosition();
                    this.updateArrows();
                }
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

        this.saveButton = document.querySelector("#prop-editor-save");
        this.saveButton.addEventListener("click", () => {
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                let data = this.game.terrain.chunckDataGenerator.prop.serialize();
                Nabu.download("new_prop.json", JSON.stringify(data));
            }
        })

        this.loadButton = document.querySelector("#prop-editor-load");
        this.loadButton.addEventListener("change", (event: Event) => {
            let files = (event.target as HTMLInputElement).files;
            let file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.addEventListener('load', (event) => {
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                        let data = JSON.parse(event.target.result as string);
                        this.game.terrain.chunckDataGenerator.prop.deserialize(data);
                        this.redraw();
                        this.regeneratePropMeshes();
                    }
                });
                reader.readAsText(file);
            }
        })

        this.game.canvas.addEventListener("keyup", this.onKeyDown);
        this.game.canvas.addEventListener("pointerdown", this.onPointerDown);
        this.game.canvas.addEventListener("pointermove", this.onPointerMove);
        this.game.canvas.addEventListener("pointerup", this.onPointerUp);

        if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
            let dataString = window.localStorage.getItem("current-prop");
            if (dataString) {
                let data = JSON.parse(dataString);
                this.game.terrain.chunckDataGenerator.prop.deserialize(data);
                this.redraw();
            }
        }

        this.regeneratePropMeshes();

        this.updateArrows();
    }

    public regeneratePropMeshes(): void {
        while (this.propShapeMeshes.length > 0) {
            this.propShapeMeshes.pop().dispose();
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
        else if (this._selectedPropShape && this._selectedPropShape.shape instanceof Kulla.RawShapeSphere) {
            this.arrows.forEach(arrow => {
                arrow.isVisible = true;
            });

            this.wRightArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.wRightArrow.position.x += 1 + this._selectedPropShape.shape.rX;
            
            this.wLeftArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.wLeftArrow.position.x -= 1 + this._selectedPropShape.shape.rX;

            this.hTopArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.hTopArrow.position.y += 1 + this._selectedPropShape.shape.rY;
            
            this.hBottomArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.hBottomArrow.position.y -= 1 + this._selectedPropShape.shape.rY;

            this.dForwardArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.dForwardArrow.position.z += 1 + this._selectedPropShape.shape.rZ;
            
            this.dBackwardArrow.position.copyFrom(this._selectedPropShape.childMesh.absolutePosition);
            this.dBackwardArrow.position.z -= 1 + this._selectedPropShape.shape.rZ;
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
            if (chunck) {
                chunck.reset();
                chunck.redrawMesh(true);
            }
        })

        if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
            let data = this.game.terrain.chunckDataGenerator.prop.serialize();
            window.localStorage.setItem("current-prop", JSON.stringify(data));
        }
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
                    return mesh instanceof Arrow;
                }
            );
            if (!pick.hit) {
                pick = this.game.scene.pick(
                    this.game.scene.pointerX,
                    this.game.scene.pointerY,
                    (mesh) => {
                        return mesh && mesh.parent instanceof PropShapeMesh;
                    }
                );
            }

            if (pick.hit && pick.pickedMesh instanceof Arrow) {
                this.setDraggedPropShape(pick.pickedMesh);
                this._draggedOffset.copyFromFloats(0, 0, 0);
            }
            else if (pick.hit && pick.pickedMesh.parent === this._selectedPropShape) {
                let point = 0;
                let p = new BABYLON.Vector3(
                    this._selectedPropShape.shape.pi,
                    this._selectedPropShape.shape.pk + this.alt,
                    this._selectedPropShape.shape.pj
                ).addInPlaceFromFloats(0.5, 0.5, 0.5);
                if (pick.pickedMesh.name === "pointA") {
                    if (this._selectedPropShape.shape instanceof Kulla.RawShapeLine) {
                        p = new BABYLON.Vector3(
                            this._selectedPropShape.shape.Ai,
                            this._selectedPropShape.shape.Ak,
                            this._selectedPropShape.shape.Aj
                        ).addInPlaceFromFloats(0.5, 0.5, 0.5);
                    }
                    point = 1;
                }
                else if (pick.pickedMesh.name === "pointB") {
                    if (this._selectedPropShape.shape instanceof Kulla.RawShapeLine) {
                        p = new BABYLON.Vector3(
                            this._selectedPropShape.shape.Bi,
                            this._selectedPropShape.shape.Bk,
                            this._selectedPropShape.shape.Bj
                        ).addInPlaceFromFloats(0.5, 0.5, 0.5);
                    }
                    point = 2;
                }
                this.setDraggedPropShape(this._selectedPropShape, point);
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
    
                    if (this._draggedPoint === 0) {
                        let di = i - this._draggedPropShape.shape.pi;
                        let dj = j - this._draggedPropShape.shape.pj;
                        let dk = k - this._draggedPropShape.shape.pk;
                        this.onMove(di, dj, dk);
                    }
                    else if (this._draggedPoint === 1) {
                        if (this._draggedPropShape.shape instanceof Kulla.RawShapeLine) {
                            let k = Math.floor(p.y);
                            let di = i - this._draggedPropShape.shape.Ai;
                            let dj = j - this._draggedPropShape.shape.Aj;
                            let dk = k - this._draggedPropShape.shape.Ak;
                            this._draggedPropShape.shape.Ai += di;
                            this._draggedPropShape.shape.Aj += dj;
                            this._draggedPropShape.shape.Ak += dk;
                            this.onMove(0, 0, 0);
                        }
                    }
                    else if (this._draggedPoint === 2) {
                        if (this._draggedPropShape.shape instanceof Kulla.RawShapeLine) {
                            let k = Math.floor(p.y);
                            let di = i - this._draggedPropShape.shape.Bi;
                            let dj = j - this._draggedPropShape.shape.Bj;
                            let dk = k - this._draggedPropShape.shape.Bk;
                            this._draggedPropShape.shape.Bi += di;
                            this._draggedPropShape.shape.Bj += dj;
                            this._draggedPropShape.shape.Bk += dk;
                            this.onMove(0, 0, 0);
                        }
                    }
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
                        this.game.terrain.chunckDataGenerator.prop.blocks.push(this.currentBlockType);
                    }
                    let propShapeMesh = new PropShapeMesh(this, newShape);
                    this.propShapeMeshes.push(propShapeMesh);
                    this.redraw();
                    if (!this._shiftDown) {
                        this.setCursorMode(CursorMode.Select);
                    }
                }
                else if (this._cursorMode === CursorMode.Sphere) {
                    newShape = new Kulla.RawShapeSphere(1, 1, 1, i, j, k);
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                        this.game.terrain.chunckDataGenerator.prop.shapes.push(newShape);
                        this.game.terrain.chunckDataGenerator.prop.blocks.push(this.currentBlockType);
                    }
                    let propShapeMesh = new PropShapeMesh(this, newShape);
                    this.propShapeMeshes.push(propShapeMesh);
                    this.redraw();
                    if (!this._shiftDown) {
                        this.setCursorMode(CursorMode.Select);
                    }
                }
                else if (this._cursorMode === CursorMode.Line) {
                    let n = pick.getNormal();
                    n.x = Math.round(n.x);
                    n.y = Math.round(n.y);
                    n.z = Math.round(n.z);
                    newShape = new Kulla.RawShapeLine(i, j, k, i + n.x, j + n.z, k + n.y);
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                        this.game.terrain.chunckDataGenerator.prop.shapes.push(newShape);
                        this.game.terrain.chunckDataGenerator.prop.blocks.push(this.currentBlockType);
                    }
                    let propShapeMesh = new PropShapeMesh(this, newShape);
                    this.propShapeMeshes.push(propShapeMesh);
                    this.redraw();
                    if (!this._shiftDown) {
                        this.setCursorMode(CursorMode.Select);
                    }
                }
                else if (this._cursorMode === CursorMode.Dot) {

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
        else if (ev.code === "ShiftLeft") {
            this._shiftDown = true;
        }
    }

    public onKeyUp = (ev: KeyboardEvent) => {
        if (ev.code === "ShiftLeft") {
            this._shiftDown = false;
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
        if (this._selectedPropShape && this.propShapeMeshes.length > 1) {
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