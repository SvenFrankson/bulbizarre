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

    public mode: CursorMode = CursorMode.Select;

    private _selectedPropShape: PropShapeMesh;
    public setSelectedPropShape(s: PropShapeMesh) {
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
    }

    public initialize(): void {

        if (this.game.terrain) {
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                this.alt = this.game.terrain.chunckDataGenerator.altitude;
            }
        }

        this.boxButton = document.getElementById("prop-editor-box") as HTMLButtonElement;
        this.boxButton.onclick = () => {
            if (this.mode === CursorMode.Box) {
                this.mode = CursorMode.Select;
            }
            else {
                this.mode = CursorMode.Box;
            }
        }
        this.sphereButton = document.getElementById("prop-editor-sphere") as HTMLButtonElement;
        this.sphereButton.onclick = () => {
            if (this.mode === CursorMode.Sphere) {
                this.mode = CursorMode.Select;
            }
            else {
                this.mode = CursorMode.Sphere;
            }
        }
        this.dotButton = document.getElementById("prop-editor-dot") as HTMLButtonElement;
        this.dotButton.onclick = () => {
            if (this.mode === CursorMode.Dot) {
                this.mode = CursorMode.Select;
            }
            else {
                this.mode = CursorMode.Dot;
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

    public onPointerUp = () => {
        if (this.mode === CursorMode.Select) {
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
                if (this.mode === CursorMode.Box) {
                    newShape = new Kulla.RawShapeBox(1, 1, 1, i, j, k);
                    if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                        this.game.terrain.chunckDataGenerator.prop.shapes.push(newShape);
                        this.game.terrain.chunckDataGenerator.prop.blocks.push(Kulla.BlockType.Ice);
                    }
                    let propShapeMesh = new PropShapeMesh(this, newShape);
                    this.propShapeMeshes.push(propShapeMesh);
                    this.redraw();
                    this.mode = CursorMode.Select;
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