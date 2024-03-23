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
            if (player.game.router.inPlayMode) {
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

        brickAction.onClick = () => {
            if (aimedBrickRoot) {
                player.currentAction = PlayerActionMoveBrick.Create(player, aimedBrickRoot);
            }
        }

        brickAction.onRightClick = () => {
            if (aimedBrick) {
                let prevParent = aimedBrick.parent;
                let p = aimedBrick.getPositionFromRoot();
                aimedBrick.setParent(undefined);
                aimedBrick.position.copyFrom(p).addInPlace(prevParent.root.position);
                prevParent.updateMesh();
                aimedBrick.updateMesh();
            }
        }

        brickAction.onUnequip = () => {
            setAimedBrickRoot(undefined);
        }
        
        return brickAction;
    }
}