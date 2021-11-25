import { createStore } from "redux";
import { roomReducer } from "../reducers/roomReducer";


export const store = createStore(roomReducer);

export default store;