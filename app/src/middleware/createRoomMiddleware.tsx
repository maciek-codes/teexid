import { AnyAction } from "redux"
import { RoomState } from "../reducers/roomReducer"
import { ThunkAction } from "redux-thunk"

export const thunkCreateRoom = 
    (): ThunkAction<void, RoomState, unknown, AnyAction> =>
    async dispatch => {
        dispatch({type: 'room/create'})
        try {
            const response = await (await fetch('http://localhost:8080/rooms', {method: "POST"})).json();
            dispatch({type: 'room/enter', payload: response});
        } catch (err) {
            dispatch({type: 'room/createFailed'})
        }
    };
