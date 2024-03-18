class Player extends BABYLON.Mesh {

    public mass: number = 2;
    public height: number = 2;
    public velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public frozen: boolean = true;
    public speed: number = 3;

    public inputZ: number = 0;
    public inputX: number = 0;

    public currentChunck: Kulla.Chunck;
    public currentChuncks: Kulla.Chunck[] = [];

    constructor(public game: Game) {
        super("player");
        let body = Mummu.CreateBeveledBox("body", { width: 1, height: this.height - 0.2, depth: 1 });
        body.position.y = - this.height * 0.5 - 0.1;
        body.parent = this;

        window.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "KeyW") {
                this.inputZ += 1;
                this.inputZ = Nabu.MinMax(this.inputZ, 0, 1);
            }
            else if (event.code === "KeyS") {
                this.inputZ -= 1;
                this.inputZ = Nabu.MinMax(this.inputZ, - 1, 0);
            }
            else if (event.code === "KeyA") {
                this.inputX -= 1;
                this.inputX = Nabu.MinMax(this.inputX, - 1, 0);
            }
            else if (event.code === "KeyD") {
                this.inputX += 1;
                this.inputX = Nabu.MinMax(this.inputX, 0, 1);
            }
        })
        window.addEventListener("keyup", (event: KeyboardEvent) => {
            if (event.code === "KeyW") {
                this.inputZ -= 1;
                this.inputZ = Nabu.MinMax(this.inputZ, - 1, 0);
            }
            else if (event.code === "KeyS") {
                this.inputZ += 1;
                this.inputZ = Nabu.MinMax(this.inputZ, 0, 1);
            }
            else if (event.code === "KeyA") {
                this.inputX += 1;
                this.inputX = Nabu.MinMax(this.inputX, 0, 1);
            }
            else if (event.code === "KeyD") {
                this.inputX -= 1;
                this.inputX = Nabu.MinMax(this.inputX, - 1, 0);
            }
        })
    }

    public update(dt: number): void {
        let currentChunck = this.game.terrain.getChunckAtPos(this.position, 0);
        if (currentChunck != this.currentChunck) {
            this.currentChunck = currentChunck;
            this.updateCurrentChuncks();
        }

        let ray = new BABYLON.Ray(this.position, new BABYLON.Vector3(0, - 1, 0));
        let bestPick: BABYLON.PickingInfo;
        for (let i = 0; i < this.currentChuncks.length; i++) {
            let chunck = this.currentChuncks[i];
            if (chunck && chunck.mesh) {
                let pick = ray.intersectsMesh(chunck.mesh);
                if (pick.hit) {
                    bestPick = pick;
                    break;
                }
            }
        }

        this.velocity.x = 0;
        this.velocity.z = 0;
        let inputL = Math.sqrt(this.inputX * this.inputX + this.inputZ * this.inputZ);
        if (inputL > this.speed) {
            this.inputX /= inputL * this.speed;
            this.inputZ /= inputL * this.speed;
        }
        this.velocity.addInPlace(this.getDirection(BABYLON.Axis.X).scale(this.inputX).scale(this.speed));
        this.velocity.addInPlace(this.getDirection(BABYLON.Axis.Z).scale(this.inputZ).scale(this.speed));
        
        if (bestPick && bestPick.hit) {
            if (bestPick.distance <= this.height) {
                this.velocity.y = 0;
                this.position.copyFrom(bestPick.pickedPoint).addInPlaceFromFloats(0, this.height, 0);
            }
            else {
                this.velocity.y -= this.mass * 9.2 * dt * 0.1;
            }
    
            this.position.addInPlace(this.velocity.scale(dt));
        }
    }

    public updateCurrentChuncks(): void {
        this.currentChuncks = [];
        if (this.currentChunck) {
            for (let i = 0; i <= 2; i++) {
                for (let j = 0; j <= 2; j++) {
                    this.currentChuncks[i + 3 * j] = this.game.terrain.getChunck(0, this.currentChunck.iPos - 1 + i, this.currentChunck.jPos - 1 + j);
                }
            }
        }
    }
}