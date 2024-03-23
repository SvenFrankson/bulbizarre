class PlayerActionDefault {

    public static Create(player: Player): PlayerAction {
        let brickAction = new PlayerAction("default-action", player);
        brickAction.backgroundColor = "#FF00FF";
        brickAction.iconUrl = "";

        let aimedBrick: Brick;
        let setAimedBrick = (b: Brick) => {
            if (b != aimedBrick) {
                if (aimedBrick) {
                    aimedBrick.unlight();
                }
                aimedBrick = b;
                if (aimedBrick) {
                    aimedBrick.highlight();
                }
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
                        let root = hit.pickedMesh.brick.root;
                        if (root) {
                            setAimedBrick(root);
                            return;
                        }
                    }
                }
            }
            setAimedBrick(undefined);
        }

        brickAction.onClick = () => {
            if (aimedBrick) {
                player.currentAction = PlayerActionMoveBrick.Create(player, aimedBrick);
            }
        }

        brickAction.onUnequip = () => {
            setAimedBrick(undefined);
        }
        
        return brickAction;
    }
}