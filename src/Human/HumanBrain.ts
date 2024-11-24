enum BrainMode {
    Idle,
    Travel
}

abstract class BrainTask {

    constructor(public brain: HumanBrain) {

    }

    public abstract run(): Promise<void>;
}

class LookAtTask extends BrainTask {

    constructor(brain: HumanBrain, public target: BABYLON.Vector3) {
        super(brain);
    }

    public async run(): Promise<void> {
        return new Promise<void>(resolve => {
            this.brain.human.spinalCord.targetPosition = undefined;
            this.brain.human.spinalCord.targetLook = this.target;
            this.brain.human.spinalCord.handMode = HandMode.Look;
            setTimeout(() => {
                resolve();
            }, 3000)
        });
    }
}

class TravelToTask extends BrainTask {

    constructor(brain: HumanBrain, public target: BABYLON.Vector3) {
        super(brain);
    }

    public async run(): Promise<void> {
        return new Promise<void>(resolve => {
            this.brain.human.spinalCord.targetPosition = this.target;
            this.brain.human.spinalCord.targetLook = this.target.add(new BABYLON.Vector3(0, 1, 0));
            this.brain.human.spinalCord.handMode = HandMode.None;
            
            let step = () => {
                let dx = this.brain.human.spinalCord.position.x - this.brain.human.spinalCord.targetPosition.x;
                let dz = this.brain.human.spinalCord.position.z - this.brain.human.spinalCord.targetPosition.z;
                if (Math.sqrt(dx * dx + dz * dz) < 0.1) {
                    resolve();
                }
                else {
                    requestAnimationFrame(step);
                }
            }
            step();
        });
    }
}

class HumanBrain {

    public mode: BrainMode = BrainMode.Idle;
    public working: boolean = false;

    constructor(public human: Human) {
        
    }

    public update(): void {
        if (this.working) {
            return;
        }
        else {
            let task: BrainTask;
            if (Math.random() < 0.2) {
                let rayOrigin = this.human.spinalCord.position.clone();
                rayOrigin.y += 10;
                rayOrigin.x += -15 + 30 * Math.random();
                rayOrigin.z += -15 + 30 * Math.random();

                let ray = new BABYLON.Ray(rayOrigin, new BABYLON.Vector3(0, -1, 0));
                let hit = this.human.game.scene.pickWithRay(ray, (mesh) => {
                    return mesh.name === "ground" || mesh.name.startsWith("chunck");
                });
                if (hit.hit) {
                    task = new TravelToTask(this, hit.pickedPoint);
                    console.log("TravelToTask");
                }
            }
            else {
                let targetLook = this.human.spinalCord.position.clone();
                targetLook.addInPlace(this.human.spinalCord.forward.scale(20));
                targetLook.addInPlaceFromFloats(
                    -10 + 20 * Math.random(),
                    -10 + 20 * Math.random(),
                    -10 + 20 * Math.random()
                )
                task = new LookAtTask(this, targetLook);
                console.log("LookAtTask");
            }
            if (task) {
                this.working = true;
                task.run().then(() => { this.working = false; });
            }
        }
    }
}