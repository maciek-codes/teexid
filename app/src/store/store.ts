import { configureStore } from "@reduxjs/toolkit";
import roomReducer from "../features/rooms/roomSlice"

const store = configureStore({
    reducer: {
        room: roomReducer
    }
});

export default store;