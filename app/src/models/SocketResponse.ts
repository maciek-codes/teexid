/** Generic socket response  */
export interface SocketResponse<Payload> {
    type: string;
    payload: Payload;
};
