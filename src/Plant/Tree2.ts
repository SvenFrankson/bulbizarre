class TreeNode {
    public children: TreeNode[] = [];
    public depth: number = 0;
    public dir: BABYLON.Vector3 = BABYLON.Vector3.Up();

    constructor(public tree: Tree2, public position: BABYLON.Vector3, public parent?: TreeNode) {
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
        if (this.depth < this.tree.length) {
            let f = this.depth / this.tree.length;
            let childCount = 1;
            if (this.tree.splits.indexOf(this.depth) > - 1) {
                childCount = 2;
            }
            childCount = Nabu.MinMax(childCount, 1, 2);
            let l = this.tree.nodeDistBottom * (1 - f) + this.tree.nodeDistTop * f;
            l *= 0.9 + 0.2 * Math.random();
            let dir = this.dir.clone();
            dir.addInPlaceFromFloats((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
            dir.y += 0.2 * l;
            dir.normalize().scaleInPlace(l);
            if (childCount === 1) {
                let child = new TreeNode(this.tree, this.position.add(dir), this);
                this.children.push(child);
                child.generateChildren();
            }
            else if (childCount === 2) {
                let a = Math.PI * 0.4 + Math.random() * Math.PI * 0.4;
                let axis = new BABYLON.Vector3(- 0.5 + Math.random(), - 0.5 + Math.random(), - 0.5 + Math.random());
                axis = BABYLON.Vector3.Cross(dir, axis).normalize();

                let dir1 = Mummu.Rotate(dir, axis, a * 0.5);
                let child1 = new TreeNode(this.tree, this.position.add(dir1), this);
                this.children.push(child1);
                child1.generateChildren();

                let dir2 = Mummu.Rotate(dir, axis, - a * 0.5);
                let child2 = new TreeNode(this.tree, this.position.add(dir2), this);
                this.children.push(child2);
                child2.generateChildren();
            }
        }
    }
}

class Tree2 {

    public root: TreeNode;
    public ijk: Nabu.IJK;
    public chunck: Kulla.Chunck;

    public nodeDistBottom: number = 1.2;
    public nodeDistTop: number = 1.2;
    public sizeBottom: number = 3;
    public sizeTop: number = 0.5;
    public length: number = 15;
    public age: number = 0;
    public splits: number[] = [6, 8, 10, 12]

    constructor(public game: Game) {
    }

    private _debugStepInterval: number;

    public instantiate(): void {
        let pos = this.chunck.getPosAtIJK(this.ijk);
        this.root = new TreeNode(this, pos);
        this.root.generateChildren();

        this.doStepInterval = setInterval(this.doStep, 1500);
    }

    public doStepInterval: number;
    public doStep = () => {
        
        this.age++;
        if (this.age > this.length) {
            clearInterval(this.doStepInterval);
            return;
        }

        let affectedChuncks = new Nabu.UniqueList<Kulla.Chunck>();
        let line = new Kulla.FatLine(this.game.terrain);
        let children = this.root.getAllChildren();
        children.forEach(child => {
            if (child.parent) {
                if (child.parent.depth <= this.age) {
                    let fAge = this.age / this.length * 0.8 + 0.2;
                    let f = child.parent.depth / this.age;
                    line.size = fAge * this.sizeBottom * (1 - f) + this.sizeTop * f;
                    
                    line.p0 = child.position;
                    line.p1 = child.parent.position;
    
                    let chuncks = line.draw(Kulla.BlockType.Wood, false, true);
                    chuncks.forEach((chunck) => {
                        affectedChuncks.push(chunck);
                    });

                    if (child.parent.depth > this.length * 0.6) {
                        let up = BABYLON.Vector3.Up();
                        let forward = child.parent.position.subtract(child.position);
                        let right = BABYLON.Vector3.Cross(up, forward);
                        up = BABYLON.Vector3.Cross(forward, right).normalize();
                        up.y += 1;
                        up.normalize().scaleInPlace(2 * fAge);
                        line.p0 = child.position.add(up);
                        line.p1 = child.parent.position.add(up);
                        line.size = 3 * fAge;
                        chuncks = line.draw(Kulla.BlockType.Leaf, false, true);
                        chuncks.forEach((chunck) => {
                            affectedChuncks.push(chunck);
                        });
                    }
                }
            }
        });

        for (let i = 0; i < affectedChuncks.length; i++) {
            let chunck = affectedChuncks.get(i);
            for (let k = 0; k < chunck.dataSizeK; k++) {
                chunck.updateIsEmptyIsFull(k);
            }
            chunck.redrawMesh(true);
            chunck.saveToLocalStorage();
        }
    }
}