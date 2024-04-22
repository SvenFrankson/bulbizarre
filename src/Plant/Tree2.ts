class TreeNode {
    public children: TreeNode[] = [];
    public depth: number = 0;
    public dir: BABYLON.Vector3 = BABYLON.Vector3.Up();

    constructor(public position: BABYLON.Vector3, public parent?: TreeNode) {
        if (parent) {
            this.depth = parent.depth + 1;
            this.dir.copyFrom(this.position).subtractInPlace(parent.position).normalize();
        }
    }

    public isConnected(other: TreeNode): boolean { 
        return this.parent === other || other.parent === this;
    }

    public getAllChildren(): TreeNode[] {
        let children = [];
        this.addWithChildren(children);
        return children;
    }

    public addWithChildren(children: TreeNode[]): void {
        children.push(this);
        this.children.forEach(child => {
            child.addWithChildren(children);
        })
    }

    public draw(): void {
        if (this.parent) {
            Mummu.DrawDebugLine(this.position, this.parent.position, Infinity, this.depth % 2 === 0 ? BABYLON.Color3.Red() : BABYLON.Color3.Blue());
        }
    }

    public generateChildren(): void {
        if (this.depth < 10) {
            let childCount = 1;
            if (this.depth === 4 || this.depth === 6 || this.depth === 8) {
                childCount = 2;
            }
            childCount = Nabu.MinMax(childCount, 1, 2);
            let dir = this.dir.clone();
            dir.addInPlaceFromFloats((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
            dir.y += 0.2;
            dir.normalize();
            if (childCount === 1) {
                let child = new TreeNode(this.position.add(dir), this);
                this.children.push(child);
                child.generateChildren();
            }
            else if (childCount === 2) {
                let a = Math.PI * 0.4 + Math.random() * Math.PI * 0.4;
                let axis = new BABYLON.Vector3(- 0.5 + Math.random(), - 0.5 + Math.random(), - 0.5 + Math.random());
                axis = BABYLON.Vector3.Cross(dir, axis).normalize();

                let dir1 = Mummu.Rotate(dir, axis, a * 0.5);
                let child1 = new TreeNode(this.position.add(dir1), this);
                this.children.push(child1);
                child1.generateChildren();

                let dir2 = Mummu.Rotate(dir, axis, - a * 0.5);
                let child2 = new TreeNode(this.position.add(dir2), this);
                this.children.push(child2);
                child2.generateChildren();
            }
        }
    }
}

class Tree2 {

    public ijk: Nabu.IJK;
    public chunck: Kulla.Chunck;

    public height: number = 10;
    public radius: number = 5;

    constructor(public game: Game) {
    }

    private _debugStepInterval: number;

    public instantiate(): void {
        let pos = this.chunck.getPosAtIJK(this.ijk);
        let root = new TreeNode(pos);
        root.generateChildren();

        let line = new Kulla.FatLine(this.game.terrain);
        let children = root.getAllChildren();
        children.forEach(child => {
            if (child.parent) {
                let f = child.parent.depth / 10;
                line.size = 2 * (1 - f) + 0.5 * f;
                
                line.p0 = child.position;
                line.p1 = child.parent.position;

                line.draw(Kulla.BlockType.Wood);
            }
        });
    }
}