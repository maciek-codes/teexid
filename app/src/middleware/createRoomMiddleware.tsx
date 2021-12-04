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

export const joinRoom = (roomId: string): ThunkAction<void, RoomState, unknown, AnyAction> =>
    async (dispatch) => {
        dispatch({type: 'room/join'})
        try {
            const ws = new WebSocket('ws://localhost:8080/rooms/' + roomId);
            ws.onopen = (ev: Event) => {
                console.log("Connected to the room.")   
            };

            ws.onmessage = (ev: MessageEvent) => {
                console.log("Message: " + ev.data);
                const msg = JSON.parse(ev.data);
                switch (msg.type) {
                    case 'onjoined': {
                        const room = {id: msg.payload.roomId};
                        dispatch({type: 'room/enter', payload: room});
                        break;
                    } 
                    default:
                        break;
                }
            }

            ws.onerror = (ev: Event) => {
                dispatch({type: 'room/createFailed'}); 
            }

            ws.onclose = (ev: Event) => {
                console.log("Closing");
            }
            
        } catch (err) {
            dispatch({type: 'room/createFailed'})
        }
    };