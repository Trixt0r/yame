import { Tool } from '../tool';

/**
 * A tool component draws it's current assigned tool
 *
 * @abstract
 * @class ToolComponent
 */
export abstract class ToolComponent {
  /** @type {Tool} The tool for this component. */
  tool: Tool;
}
