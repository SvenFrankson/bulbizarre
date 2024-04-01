class PlayerActionDefault {

    public static Create(player: Player): PlayerAction {
        let brickAction = new PlayerAction("default-action", player);
        brickAction.backgroundColor = "#FF00FF";
        brickAction.iconUrl = "";

        let aimedBrickRoot: Brick;
        let setAimedBrickRoot = (b: Brick) => {
            if (b != aimedBrickRoot) {
                if (aimedBrickRoot) {
                    aimedBrickRoot.unlight();
                }
                aimedBrickRoot = b;
                if (aimedBrickRoot) {
                    aimedBrickRoot.highlight();
                }
            }
        }
        
        let aimedBrick: Brick;
        let setAimedBrick = (b: Brick) => {
            if (b != aimedBrick) {
                aimedBrick = b;
            }
        }

        brickAction.onUpdate = () => {
            if (player.controler.playMode === PlayMode.Playing) {
                let x: number;
                let y: number;
                if (player.controler.gamepadInControl || player.game.inputManager.isPointerLocked) {
                    x = player.game.canvas.clientWidth * 0.5;
                    y = player.game.canvas.clientHeight * 0.5;
                }
                else {
                    x = player._scene.pointerX;
                    y = player._scene.pointerY;
                }
                let hit = player.game.scene.pick(
                    x,
                    y,
                    (mesh) => {
                        return mesh instanceof BrickMesh;
                    }
                )

                if (hit.hit && hit.pickedPoint) {
                    if (hit.pickedMesh instanceof BrickMesh) {
                        let brickRoot = hit.pickedMesh.brick.root;
                        if (brickRoot) {
                            setAimedBrickRoot(brickRoot);
                            let brick = brickRoot.getBrickForFaceId(hit.faceId);
                            if (brick) {
                                setAimedBrick(brick);
                            }
                            return;
                        }
                    }
                }
            }
            setAimedBrickRoot(undefined);
            setAimedBrick(undefined);
        }

        brickAction.onPointerUp = (duration, distance) => {
            if (distance > 4) {
                return;
            }
            if (duration > 0.3) {
                if (aimedBrick) {
                    player.game.brickMenuView.setBrick(aimedBrick);
                    if (player.game.inputManager.isPointerLocked) {
                        document.exitPointerLock();
                        player.game.brickMenuView.onNextHide = () => {
                            player.game.canvas.requestPointerLock();
                        }
                    }
                    player.game.brickMenuView.show(0.1);
                }
            }
            else {
                if (player.controler.playMode === PlayMode.Playing) {
                    if (aimedBrickRoot && !aimedBrickRoot.anchored) {
                        player.currentAction = PlayerActionMoveBrick.Create(player, aimedBrickRoot);
                    }
                }
            }
        }

        brickAction.onRightPointerUp = (duration, distance) => {
            if (distance > 4) {
                return;
            }
            if (aimedBrick) {
                let prevParent = aimedBrick.parent;
                if (prevParent instanceof Brick) {
                    aimedBrick.setParent(undefined);
                    aimedBrick.updateMesh();
                    prevParent.updateMesh();
                }
            }
        }

        brickAction.onUnequip = () => {
            setAimedBrickRoot(undefined);
        }
        
        return brickAction;
    }
}