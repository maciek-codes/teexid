import { createSlice } from '@reduxjs/toolkit'

export const roomSlice = createSlice({
    name: "room",
    initialState: {},
    reducers: {
        beginJoin: state => {
            
        },
        onJoined: state => {

        },
        onJoinError: state => {
            
        },
        beginCreate : state => {

        },
        onCreated: state => {
            
        },
        onCreateError: state => {

        }
    }
});


export const { beginJoin, onJoined, onJoinError, beginCreate, onCreated, onCreateError } = roomSlice.actions

export default roomSlice.reducer
