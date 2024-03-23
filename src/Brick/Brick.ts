interface BrickProp {
    pos?: Nabu.IVector3XYZValue;
    dir?: number;

}

class BrickMesh extends BABYLON.Mesh {

    constructor(public brick: Brick) {
        super("brick");
    }
}

class Brick {

    public position: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public direction: number;

    public parent: Brick;
    public children: Brick[];
    public get childrenCount(): number {
        if (this.children) {
            return this.children.length;
        }
        return 0;
    }

    public mesh: BrickMesh;
    private _rotationQuaternion: BABYLON.Quaternion;
    public get root(): Brick {
        if (this.parent) {
            return this.parent.root;
        }
        return this;
    }

    constructor(public templateIndex: number, public colorIndex: number, parent?: Brick) {
        if (parent) {
            this.parent = parent;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(this);
        }
        else {
            this._rotationQuaternion = BABYLON.Quaternion.Identity();
        }
    }

    public updateMesh(): void {
        if (this != this.root) {
            this.root.updateMesh();
            return;
        }
        let data = this.generateMeshVertexData();
        if (!this.mesh) {
            this.mesh = new BrickMesh(this);
            this.mesh.position.copyFrom(this.position);
            console.log(this.mesh.position);
        }
        data.applyToMesh(this.mesh);
    }

    private generateMeshVertexData(vDatas?: BABYLON.VertexData[]): BABYLON.VertexData {
        if (!vDatas) {
            vDatas = [];
        }
        let template = BrickTemplateManager.Instance.getTemplate(this.templateIndex);
        let vData = Mummu.CloneVertexData(template.vertexData);
        if (this != this.root) {
            Mummu.TranslateVertexDataInPlace(vData, this.position);
        }
        vDatas.push(vData);

        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].generateMeshVertexData(vDatas);
            }
        }

        return Mummu.MergeVertexDatas(...vDatas);
    }
}