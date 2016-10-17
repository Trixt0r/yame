/**
 * Dropable payload interface.
 */
export interface Payload {
    /**
     * @type {string} The type of this payload.
     */
    type: string;

    /**
     * @type {any} The content of the payload.
     */
    content: any;
}

export default Payload;