class PropShapeMesh extends BABYLON.Mesh {

    constructor(shape: Kulla.RawShape) {
        super("prop-shape-mesh");
        if (shape instanceof Kulla.RawShapeBox) {
            let box = BABYLON.MeshBuilder.CreateBox("box", {
                width: shape.w,
                height: shape.h,
                depth: shape.d
            });
            box.position.copyFromFloats(shape.w * 0.5, shape.h * 0.5, shape.d * 0.5);
            box.parent = this;
            this.position.x += shape.pi;
            this.position.z += shape.pj;
            this.position.y += shape.pk;
        }
    }
}

class PropEditor {

    public boxButton: HTMLButtonElement;
    public sphereButton: HTMLButtonElement;
    public dotButton: HTMLButtonElement;

    public propShapeMeshes: PropShapeMesh[] = [];

    constructor(public game: Game) {

    }

    public initialize(): void {
        this.boxButton = document.getElementById("prop-editor-box") as HTMLButtonElement;
        this.sphereButton = document.getElementById("prop-editor-sphere") as HTMLButtonElement;
        this.dotButton = document.getElementById("prop-editor-dot") as HTMLButtonElement;

        this.propShapeMeshes = [];
        if (this.game.terrain) {
            if (this.game.terrain.chunckDataGenerator instanceof Kulla.ChunckDataGeneratorFlat) {
                let alt = this.game.terrain.chunckDataGenerator.altitude;
                this.game.terrain.chunckDataGenerator.prop.shapes.forEach(shape => {
                    let propShapeMesh = new PropShapeMesh(shape);
                    propShapeMesh.position.y += alt;
                    this.propShapeMeshes.push(propShapeMesh);
                });
            }
        }
    }

    public dispose(): void {
        while (this.propShapeMeshes.length > 0) {
            this.propShapeMeshes.pop().dispose();
        }
    }
}