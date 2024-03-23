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

    private _parent: Brick;
    public setParent(b: Brick): void {
        this._parent = b;
        if (!b.children) {
            b.children = [];
        }
        b.children.push(this);
    }
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
        if (this._parent) {
            return this._parent.root;
        }
        return this;
    }

    constructor(public templateIndex: number, public colorIndex: number, parent?: Brick) {
        if (parent) {
            this._parent = parent;
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
            if (this.mesh) {
                this.mesh.dispose();
                this.mesh = undefined;
            }
            this.root.updateMesh();
            return;
        }
        let data = this.generateMeshVertexData();
        if (!this.mesh) {
            this.mesh = new BrickMesh(this);
            this.mesh.position = this.position;
        }
        data.applyToMesh(this.mesh);
    }

    
    public highlight(): void {
        if (this.mesh) {
            this.mesh.renderOutline = true;
            this.mesh.outlineColor = new BABYLON.Color3(0, 1, 1);
            this.mesh.outlineWidth = 0.05;
        }
    }

    public unlight(): void {
        if (this.mesh) {
            this.mesh.renderOutline = false;
        }
    }

    private generateMeshVertexData(vDatas?: BABYLON.VertexData[], parentGlobalPosition?: BABYLON.Vector3): BABYLON.VertexData {
        if (!vDatas) {
            vDatas = [];
        }
        let template = BrickTemplateManager.Instance.getTemplate(this.templateIndex);
        let vData = Mummu.CloneVertexData(template.vertexData);
        let globalPosition = parentGlobalPosition ? parentGlobalPosition.clone() : BABYLON.Vector3.Zero();
        if (this != this.root) {
            globalPosition.addInPlace(this.position);
            Mummu.TranslateVertexDataInPlace(vData, globalPosition);
        }
        vDatas.push(vData);

        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].generateMeshVertexData(vDatas, globalPosition);
            }
        }

        return Mummu.MergeVertexDatas(...vDatas);
    }
}