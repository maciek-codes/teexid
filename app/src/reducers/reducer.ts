interface GameAction {
    type: string;
    payload: any
};

export default function rootReducer(state = {}, action: GameAction) {
    switch (action.type) {
        default:
            return state;
    }
}
