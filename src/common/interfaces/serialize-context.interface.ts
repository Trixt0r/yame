/**
 * A context representing meta data when data is being serialized or deserialized.
 */
export interface ISerializeContext {

  /**
   * The uri of the resource holding the file data.
   */
  uri: string;

  /**
   * The source type.
   */
  source: string;

  /**
   * The protocol being used.
   */
  protocol: string;

  /**
   * Whether serialization is being done to a new uri.
   */
  as?: boolean;

  [key: string]: unknown;
}