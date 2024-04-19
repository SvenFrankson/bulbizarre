class TreeBranch {

    public currentPos: Nabu.IJK;
    public dir: BABYLON.Vector3;
    public leaves: Kulla.Sphere;
    public sequence: number[];

    constructor(terrain: Kulla.Terrain, public pos: Nabu.IJK) {
        this.currentPos = { i: pos.i, j: pos.j, k: pos.k };
        let a = Math.random() * Math.PI * 2;
        this.dir = new BABYLON.Vector3(Math.cos(a), 3 * (Math.random() - 0.5), Math.sin(a));
        this.dir.normalize();

        let stepCount: number = 10;
        let tests: BABYLON.Vector3[] = []
        this.sequence = [0, 0, 0];
        if (this.dir.x != 0) {
            tests.push(new BABYLON.Vector3(Math.sign(this.dir.x), 0, 0));
            this.sequence[0] = tests[0].x;
        }
        if (this.dir.y != 0) {
            tests.push(new BABYLON.Vector3(0, Math.sign(this.dir.y), 0));
            this.sequence[1] = tests[1].y;
        }
        if (this.dir.z != 0) {
            tests.push(new BABYLON.Vector3(0, 0, Math.sign(this.dir.z)));
            this.sequence[2] = tests[2].z;
        }
        let tmpV = BABYLON.Vector3.Zero();
        for (let n = 1; n < stepCount; n++) {
            let bestAngle = Infinity;
            for (let t = 0; t < tests.length; t++) {
                tmpV.x = this.sequence[3 * (n - 1)];
                tmpV.y = this.sequence[3 * (n - 1) + 1];
                tmpV.z = this.sequence[3 * (n - 1) + 2];
                tmpV.addInPlace(tests[t]);

                let a = Mummu.Angle(this.dir, tmpV);
                if (a < bestAngle) {
                    this.sequence[3 * n] = tmpV.x;
                    this.sequence[3 * n + 1] = tmpV.y;
                    this.sequence[3 * n + 2] = tmpV.z;
                    bestAngle = a;
                }
            }
        }

        console.log(this.sequence);

        this.leaves = new Kulla.Sphere(terrain, { diameter: 3 });
    }

    public age: number = 0;
    public incAge(): void {
        if (this.age < this.sequence.length / 3) {
            this.currentPos.i = this.pos.i + this.sequence[3 * this.age];
            this.currentPos.j = this.pos.j + this.sequence[3 * this.age + 2];
            this.currentPos.k = this.pos.k + this.sequence[3 * this.age + 1];
        }
        this.age++;
    }
}

class Tree {

    public ijk: Nabu.IJK;
    public chunck: Kulla.Chunck;

    public height: number = 10;
    public radius: number = 5;

    public age: number = 0;
    public maxAge: number = 15;

    public currentHeadPos: Nabu.IJK;
    public headCone: Kulla.Cone;

    public branches: TreeBranch[] = [];

    constructor(public game: Game) {
    }

    private _debugStepInterval: number;

    public instantiate(): void {
        this._debugStepInterval = setInterval(this.doStep, 2000);
    }

    public doStep = () => {
        if (this.ijk && this.chunck) {
            if (!this.currentHeadPos) {
                this.currentHeadPos = { i: this.ijk.i, j: this.ijk.j, k: this.ijk.k - 1 };
            }
            if (!this.headCone) {
                this.headCone = new Kulla.Cone(this.chunck.terrain, { });
            }
            if (this.age < this.maxAge) {
                if (this.age > 0) {
                    this.headCone.draw(this.chunck, this.currentHeadPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.Erase);
                    this.branches.forEach(branch => {
                        branch.leaves.draw(this.chunck, branch.currentPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.Erase);
                    })
                }

                this.age++;
                this.branches.forEach(branch => {
                    branch.incAge();
                })
                this.currentHeadPos.k++;
                this.headCone.props.rFunc = (f: number) => { 
                    return 1 + Math.cos(Math.PI * 0.5 * f - Math.PI * 0.15) * (1 + Math.floor(this.age / 2));
                }
                this.headCone.props.length = 2 + Math.floor(this.age / 4);
    
                if (Math.random() < 0.3) {
                    if (Math.random() < 0.5) {
                        this.currentHeadPos.i++;
                    }
                    else {
                        this.currentHeadPos.i--;
                    }
                }
                else if (Math.random() < 0.2) {
                    if (Math.random() < 0.5) {
                        this.currentHeadPos.j++;
                    }
                    else {
                        this.currentHeadPos.j--;
                    }
                }

                if (Math.random() < 0.3) {
                    let branch = new TreeBranch(this.game.terrain, { i: this.currentHeadPos.i, j: this.currentHeadPos.j, k: this.currentHeadPos.k });
                    this.branches.push(branch);
                }

                this.headCone.draw(this.chunck, this.currentHeadPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.AddIfEmpty, true);
                this.game.terrainEditor.doAction(this.chunck, this.currentHeadPos, { brushBlock: Kulla.BlockType.Wood, brushSize: 2, mode: Kulla.TerrainEditionMode.Add, saveToLocalStorage: true });

                this.branches.forEach(branch => {
                    branch.leaves.draw(this.chunck, branch.currentPos, 0, Kulla.BlockType.Leaf, Kulla.TerrainEditionMode.AddIfEmpty, true);
                    this.game.terrainEditor.doAction(this.chunck, branch.currentPos, { brushBlock: Kulla.BlockType.Wood, brushSize: 1, mode: Kulla.TerrainEditionMode.Add, saveToLocalStorage: true });
                })
            }
            else {
                clearInterval(this._debugStepInterval);
            }
        }
    }

}